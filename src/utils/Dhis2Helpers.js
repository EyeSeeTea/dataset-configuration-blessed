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
            'categories[id,displayName,categoryOptions[id,name,displayName]]',
            'categoryOptionCombos[id,displayName,categoryOptions[id,name,displayName]]',
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

function getDisaggregationForCategories(d2, dataElement, categoryCombos, categories) {
    const categoriesById = _(categoryCombos)
        .flatMap(cc => cc.categories.toArray()).uniqBy("id").keyBy("id").value();
    const getCategoryIds = categories => _(collectionToArray(categories)).map("id").uniqBy().value();
    const deCategories = _.at(categoriesById, collectionToArray(dataElement.categoryCombo.categories).map(c => c.id));
    const allCategories = _(deCategories)
        .concat(collectionToArray(categories))
        .uniqBy("id")
        .value();

    // Special category <default> should be used only when no other category is present, remove otherwise
    const allValidCategories = allCategories.length > 1 ?
        allCategories.filter(category => categoriesById[category.id].displayName !== "default") :
        allCategories;
    const combinedCategoriesIds = getCategoryIds(allValidCategories);
    const existingCategoryCombo = categoryCombos.find(cc =>
        _(getCategoryIds(cc.categories)).sortBy().isEqual(_.sortBy(combinedCategoriesIds)));
    const cacheKey = combinedCategoriesIds.join(".");
    const cachedCategoryCombo = cachedCategoryCombos[cacheKey];

    if (existingCategoryCombo) {
        return existingCategoryCombo;
    } else if (cachedCategoryCombo) {
        return cachedCategoryCombo;
    } else {
        const newCategoryComboId = generateUid();
        const categories = _.at(categoriesById, combinedCategoriesIds);
        const categoryOptions = categories.map(c => c.categoryOptions.toArray());
        const categoryOptionCombos = _.cartesianProduct(...categoryOptions).map(cos => ({
            id: generateUid(),
            name: cos.map(co => co.displayName).join(", "),
            displayName: cos.map(co => co.displayName).join(", "),
            categoryCombo: {id: newCategoryComboId},
            categoryOptions: cos,
        }));
        const ccName = allValidCategories.map(cc => cc.displayName).join("/");
        const newCategoryCombo = d2.models.categoryCombo.create({
            id: newCategoryComboId,
            dataDimensionType: "DISAGGREGATION",
            name: ccName,
            displayName: ccName,
            categories: categories,
            categoryOptionCombos: categoryOptionCombos,
        });
        newCategoryCombo.dirty = true; // mark dirty so we know it must be saved
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

function sendMessageToGroups(d2, userGroupNames, title, body) {
    return getUserGroups(d2, userGroupNames)
        .then(userGroups => sendMessage(d2, title, body, userGroups.toArray()))
        .catch(err => { alert("Could not send DHIS2 message"); });
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

function currentUserHasAdminRole(d2) {
    const authorities = d2.currentUser.authorities;
    return authorities.has("M_dhis-web-maintenance-appmanager") || authorities.has("ALL");
}

const requiredAuthorities = ["F_SECTION_DELETE", "F_SECTION_ADD"];

function hasRequiredAuthorities(d2) {
    return requiredAuthorities.every(authority => d2.currentUser.authorities.has(authority))
}

function canManage(d2, datasets) {
    return datasets.every(dataset => dataset.access.manage);
}

function canCreate(d2) {
    return d2.currentUser.canCreatePrivate(d2.models.dataSets) && hasRequiredAuthorities(d2);
}

function canDelete(d2, datasets) {
    return d2.currentUser.canDelete(d2.models.dataSets) &&
        _(datasets).every(dataset => dataset.access.delete) &&
        hasRequiredAuthorities(d2);
}

function canUpdate(d2, datasets) {
    const publicDatasetsSelected = _(datasets).some(dataset => dataset.publicAccess.match(/^r/));
    const privateDatasetsSelected = _(datasets).some(dataset => dataset.publicAccess.match(/^-/));
    const datasetsUpdatable = _(datasets).every(dataset => dataset.access.update);
    const privateCondition = !privateDatasetsSelected || d2.currentUser.canCreatePrivate(d2.models.dataSets);
    const publicCondition = !publicDatasetsSelected || d2.currentUser.canCreatePublic(d2.models.dataSets);

    return hasRequiredAuthorities(d2) && privateCondition && publicCondition && datasetsUpdatable;
}

async function getFilteredDatasets(d2, config, page, sorting, filters) {
    const { searchValue, showOnlyCreatedByApp } = filters;
    const allDataSets = d2.models.dataSets;
    const attributeByAppId = config.createdByDataSetConfigurationAttributeId;
    const filterByAppId = attributeByAppId && showOnlyCreatedByApp;
    const filteredByNameDataSets = searchValue ?
        allDataSets.filter().on('displayName').ilike(searchValue) :
        allDataSets;
    const filteredDataSets = filterByAppId ?
        filteredByNameDataSets.filter().on('attributeValues.attribute.id').equals(attributeByAppId) :
        filteredByNameDataSets;
    const order = sorting ? sorting.join(":") : "";
    const fields = "id,name,displayName,shortName,created,lastUpdated,externalAccess," +
        "publicAccess,userAccesses,userGroupAccesses,user,access,attributeValues";

    if (filterByAppId) {
        // The API does not allow to simultaneously filter by attributeValue.attribute.id AND attributeValue.value,
        // so we need to make a double request: first get non-paginated datasets, filter manually by the attribute,
        // and finally make a query on paginated datasets filtering by those datasets.
        const attributeFields = "id,attributeValues[value,attribute[id]]"
        const dataSetsCollectionNoPaging = await filteredDataSets.list({fields: attributeFields, paging: false});
        const datasetsByApp = dataSetsCollectionNoPaging.toArray().filter(dataset =>
            _(dataset.attributeValues).some(av => av.attribute.id === attributeByAppId && av.value.toString() === "true"));
        const maxUids = (8192 - 1000) / (11 + 3); // To avoid 413 URL too large
        const filter = `id:in:[${_(datasetsByApp).take(maxUids).map("id").join(",")}]`;
        return allDataSets.list({order, fields, filter, page});
    } else {
        return filteredDataSets.list({order, fields, page});
    }
}


export {
    redirectToLogin,
    getCategoryCombos,
    collectionToArray,
    getExistingUserRoleByName,
    getDisaggregationForCategories,
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
    sendMessageToGroups,
    collectionString,
    currentUserHasAdminRole,
    canManage,
    canCreate,
    canDelete,
    canUpdate,
    getFilteredDatasets,
};
