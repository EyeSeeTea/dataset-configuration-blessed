import { generateUid } from 'd2/lib/uid';
import { getOwnedPropertyJSON } from 'd2/lib/model/helpers/json';
import _ from './lodash-mixins';

function update(obj1, obj2) {
    const obj1c = obj1;
    _(obj2).each((value, key) => { obj1c[key] = value; });
    return obj1c;
}

function mapPromise(items, mapper) {
  const reducer = (promise, item) =>
    promise.then(mappedItems => mapper(item).then(res => mappedItems.concat([res])));
  return items.reduce(reducer, Promise.resolve([]));
}

function redirectToLogin(baseUrl) {
    const loginUrl = `${baseUrl}/dhis-web-commons/security/login.action`;
    window.location.assign(loginUrl);
}

function getCategoryCombos(d2) {
    return d2.models.categoryCombos.list({
        fields: [
            'id,name,displayName,dataDimensionType,isDefault',
            'categories[id,displayName,categoryOptions[id,displayName]]',
            'categoryOptionCombos[id,displayName,categoryOptions[id,displayName]]',
        ].join(','),
        filter: "dataDimensionType:eq:DISAGGREGATION",
        paging: false,
    });
}

function getCountryCode(orgUnit) {
    return orgUnit && orgUnit.code ? orgUnit.code.split("_")[0] : null;
}

function getOrgUnitsForLevel(d2, levelId) {
    return d2.models.organisationUnitLevels.get(levelId, {fields: "id,level"}).then(ouLevel => {
        return d2.models.organisationUnits
            .list({
                fields: 'id,displayName,code,level,children::isNotEmpty',
                filter: "level:eq:" + ouLevel.level,
                order: 'displayName:asc',
                paging: false,
            })
            .then(collection => collection.toArray().filter(ou => ou.children));
    });
}

function collectionToArray(collectionOrArray) {
    return collectionOrArray && collectionOrArray.toArray ?
        collectionOrArray.toArray() : (collectionOrArray || []);
}

// Keep track of the created categoryCombos so objects are reused
let cachedCategoryCombos = {};

function getDisaggregationCategoryCombo(d2, dataElement, categoryCombos, categoryCombo) {
    const getCategoryIds = categories => _(collectionToArray(categories)).map("id").uniqBy().value();
    const combinedCategoriesIds = getCategoryIds(_.concat(
        dataElement.categoryCombo.categories,
        collectionToArray(categoryCombo.categories),
    ));
    const existingCategoryCombo = categoryCombos.find(cc =>
        _(getCategoryIds(cc.categories)).sortBy().isEqual(_.sortBy(combinedCategoriesIds)));
    const cacheKey = combinedCategoriesIds.join(".");
    const cachedCategoryCombo = cachedCategoryCombos[cacheKey];

    if (existingCategoryCombo) {
        return _.merge(existingCategoryCombo, {source: categoryCombo});
    } else if (cachedCategoryCombo) {
        return cachedCategoryCombo;
    } else {
        const newCategoryComboId = generateUid();
        const allCategoriesById = _(categoryCombos)
            .flatMap(cc => cc.categories.toArray()).uniqBy("id").keyBy("id").value();
        const categories = _.at(allCategoriesById, combinedCategoriesIds);
        const categoryOptions = categories.map(c => c.categoryOptions.toArray());
        const categoryOptionCombos = _.cartesianProduct(...categoryOptions).map(cos => ({
            id: generateUid(),
            name: cos.map(co => co.displayName).join(", "),
            displayName: cos.map(co => co.displayName).join(", "),
            categoryCombo: {id: newCategoryComboId},
            categoryOptions: cos,
        }));
        const ccName = [dataElement.categoryCombo, categoryCombo].map(cc => cc.displayName).join("/");
        const newCategoryCombo = d2.models.categoryCombo.create({
            id: newCategoryComboId,
            dataDimensionType: "DISAGGREGATION",
            name: ccName,
            displayName: ccName,
            categories: categories,
            categoryOptionCombos: categoryOptionCombos,
        });
        newCategoryCombo.dirty = true; // mark dirty so we know it must be saved
        newCategoryCombo.source = categoryCombo; // keep a reference of the original catcombo used
        cachedCategoryCombos[cacheKey] = newCategoryCombo;
        return newCategoryCombo;
    }
}

function getAsyncUniqueValidator(model, field, uid = null) {
    return (value) => {
        if (!value || !value.trim()) {
            return Promise.resolve(true);
        } else {
            const baseFilteredModel = model.filter().on(field).equals(value);
            const filteredModel = !uid ? baseFilteredModel :
                baseFilteredModel.filter().on('id').notEqual(uid);

            return filteredModel.list().then(collection => {
                if (collection.size > 0) {
                    return Promise.reject('value_not_unique');
                } else {
                    return Promise.resolve(true);
                }
            });
        }
    };
};

function getExistingUserRoleByName(d2, name) {
    return d2.models.userRoles
        .filter().on("name").equals(name)
        .list({fields: "*"})
        .then(collection => collection.toArray()[0]);
}

function getUserGroups(d2, names) {
    return d2.models.userGroups.list({
        filter: "name:in:[" + names.join(",") + "]",
        paging: false,
    });
}

function getSharing(d2, object) {
    const api = d2.Api.getApi();
    return api.get(`sharing?type=${object.modelDefinition.name}&id=${object.id}`);
}

function buildSharingFromUserGroupNames(baseSharing, userGroups, userGroupSharingByName) {
    const userGroupsByName = _(userGroups).keyBy("name").value();
    const userGroupAccesses = _(userGroupSharingByName)
        .map((sharing, name) =>
            _(userGroupsByName).has(name) ? _.imerge(sharing, {id: userGroupsByName[name].id}) : null)
        .compact()
        .value();
    return buildSharing(deepMerge(baseSharing, {object: {userGroupAccesses}}));
}

function buildSharing(sharing) {
    const base = {
        meta: {
            allowPublicAccess: true,
            allowExternalAccess: false,
        },
        object: {
            userGroupAccesses: [],
            publicAccess: "r-------",
            externalAccess: false,
        },
    };
    return deepMerge(base, sharing);
}

function setSharings(d2, objects, userGroupAccessByName) {
    const api = d2.Api.getApi();
    let userGroupAccesses$;

    if (_.isEmpty(userGroupAccessByName)) {
        userGroupAccesses$ = Promise.resolve([]);
    } else {
        const [userGroupNames, userGroupAccesses] = _.zip(...userGroupAccessByName);
        userGroupAccesses$ = getUserGroups(d2, userGroupNames).then(userGroupsCollection =>
            _(userGroupsCollection.toArray())
                .keyBy(userGroup => userGroup.name)
                .at(userGroupNames)
                .zip(userGroupAccesses)
                .map(([userGroup, access]) =>
                    userGroup ? {id: userGroup.id, access} : null)
                .compact()
                .value()
        );
    }

    return userGroupAccesses$.then(userGroupAccesses =>
        mapPromise(objects, object =>
            api.post(`sharing?type=${object.modelDefinition.name}&id=${object.id}&mergeMode=MERGE`, {
                meta: {
                    allowPublicAccess: true,
                    allowExternalAccess: false,
                },
                object: {
                    userGroupAccesses: userGroupAccesses,
                    publicAccess: "r-------",
                    externalAccess: false,
                },
            })
        )
    );
}

function sendMessage(d2, subject, text, recipients) {
    const api = d2.Api.getApi();
    const recipientsByModel = _(recipients)
        .groupBy(recipient => recipient.modelDefinition.name)
        .mapValues(models => models.map(model => ({id: model.id})))
        .value();
    const message = {
        subject: subject,
        text: text,
        users: recipientsByModel.user,
        userGroups: recipientsByModel.userGroup,
        organisationUnits: recipientsByModel.organisationUnit,
    };

    if (_.isEmpty(recipients)) {
        return Promise.resolve();
    } else {
        return api.post("/messageConversations", message);
    }
}

const validStrategies = new Set(["create_and_update", "create", "update", "delete"]);

function deepMerge(obj1, obj2) {
    const isModel = obj => obj && obj.modelDefinition;
    const cloneCustomizer = (value) => isModel(value) ? value : undefined;
    const mergeCustomizer = (objValue, srcValue, key, object, source, stack) => {
      if (isModel(srcValue)) {
        return srcValue;
      } else if (_(objValue).isArray()) {
        return objValue.concat(srcValue);
      } else {
        return undefined;
      }
    };
    const clonedObj1 = _.cloneDeepWith(obj1, cloneCustomizer);

    return _.mergeWith(clonedObj1, obj2, mergeCustomizer);
}

function postMetadata(d2, metadata) {
    const api = d2.Api.getApi();

    const sendRequest = (payloadsWithStrategy) => {
        const {strategy, payload} = payloadsWithStrategy;
        // Payload values may be d2 models or plain objects, get JSON only for models.
        const jsonPayload = _(payload)
            .mapValues(objs => objs.map(obj => obj.modelDefinition ? getOwnedPropertyJSON(obj) : obj))
            .value();
        const path = `metadata?mergeMode=MERGE&importStrategy=${strategy.toUpperCase()}`;
        return api.post(path, jsonPayload).then(response => {
            if (response.status !== 'OK') {
                const msg = [
                    `POST ${api.baseUrl}/${path}`,
                    "Request: " + JSON.stringify(jsonPayload, null, 4),
                    "Response: " + JSON.stringify(response, null, 4),
                ].join("\n\n");
                throw new Error(msg);
            } else {
                return response;
            }
        });
    };

    // When saving simultaneously a new dataset and its sections, the server responds with a
    // <500 ERROR at index 0> whenever greyedFields are sent. However, perfoming this same call
    // to sections *after* the dataset has been created raises no error, so it seems a dhis2
    // bug. We have no option but to make the calls for sections in another, separate call.
    const payloadsWithStrategy = _(metadata).flatMap((payload, strategy) => {
        if (!validStrategies.has(strategy)) {
            console.error("Invalid strategy: " + strategy);
            return [];
        } else if (_(payload).isEmpty()) {
            return [];
        } else {
            return _(payload)
                .toPairs()
                .partition(([modelName, objs]) => modelName !== "sections")
                .map(pairs => ({strategy, payload: _.fromPairs(pairs)}))
                .value();
        }
    }).value();

    return mapPromise(payloadsWithStrategy, sendRequest);
}

function getUids(d2, length) {
    if (length <= 0) {
        return Promise.resolve([]);
    } else {
        const api = d2.Api.getApi();
        return api.get('system/uid', {limit: length}).then(res => res.codes);
    }
}

function collectionString(d2, objects, field, maxShown) {
    const array = collectionToArray(objects);
    const base = _(array).take(maxShown).map(field).join(", ");

    if (array.length <= maxShown) {
        return base;
    } else {
        return d2.i18n.getTranslation("this_and_n_others", {this: base, n: array.length - maxShown});
    }
}


export {
    redirectToLogin,
    getCategoryCombos,
    collectionToArray,
    getExistingUserRoleByName,
    getDisaggregationCategoryCombo,
    getAsyncUniqueValidator,
    setSharings,
    sendMessage,
    getUserGroups,
    mapPromise,
    getCountryCode,
    getOrgUnitsForLevel,
    getSharing,
    buildSharingFromUserGroupNames,
    postMetadata,
    buildSharing,
    getUids,
    deepMerge,
    update,
    collectionString,
};
