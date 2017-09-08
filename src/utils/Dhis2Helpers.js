import { generateUid } from 'd2/lib/uid';
import _ from './lodash-mixins';

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
            'id,displayName,isDefault',
            'categories[id,displayName,categoryOptions[id,displayName]]',
            'categoryOptionCombos[id,displayName,categoryOptions[id,displayName]]',
        ].join(','),
        filter: "dataDimensionType:eq:DISAGGREGATION",
        paging: false,
    });
}

function getCountryCode(orgUnit) {
    return orgUnit ? orgUnit.code.split("_")[0] : null;
}

function getOrgUnitsForLevel(d2, levelId) {
    return d2.models.organisationUnitLevels.get(levelId, {fields: "id,level"}).then(ouLevel => {
        return d2.models.organisationUnits.list({
                fields: 'id,displayName,code,level',
                filter: "level:eq:" + ouLevel.level,
                order: 'displayName:asc',
                paging: false,
            })
            .then(collection => collection.toArray());
    })
}

function collectionToArray(collectionOrArray) {
    return collectionOrArray && collectionOrArray.toArray ?
        collectionOrArray.toArray() : (collectionOrArray || []);
}

// Keep track of the created categoryCombos so objects are reused
let customCategoryCombos = {};

function getCustomCategoryCombo(d2, dataElement, categoryCombos, categoryCombo) {
    const newCategoryComboId = "new-" + dataElement.categoryCombo.id + "." + categoryCombo.id;
    const selectedCategories = collectionToArray(categoryCombo.categories);
    const combinedCategories = _(dataElement.categoryCombo.categories)
        .concat(selectedCategories).uniqBy("id").value();
    const existingCategoryCombo = _(categoryCombos).find(cc =>
        _(cc.categories.toArray())
            .orderBy("id")
            .map(c => c.id)
            .isEqual(_(combinedCategories).orderBy("id").map(c => c.id))
    );

    if (existingCategoryCombo) {
        return _.merge(existingCategoryCombo, {source: categoryCombo});
    } else if (customCategoryCombos[newCategoryComboId]) {
        return customCategoryCombos[newCategoryComboId];
    } else {
        const allCategoriesById = _(categoryCombos)
            .flatMap(cc => cc.categories.toArray()).uniqBy("id").keyBy("id").value();
        const categories = _.at(allCategoriesById, combinedCategories.map(cat => cat.id));
        const categoryOptions = categories.map(c => c.categoryOptions.toArray());
        const categoryOptionCombos = _.cartesianProduct(...categoryOptions).map(cos =>
            ({
                id: generateUid(),
                displayName: name,
                categoryOptions: cos,
            })
        );

        const name = [dataElement.categoryCombo, categoryCombo].map(cc => cc.displayName).join("/");
        const customCategoryCombo = d2.models.categoryCombo.create({
            id: newCategoryComboId,
            dataDimensionType: "DISAGGREGATION",
            name: name,
            displayName: name,
            categories: categories,
            categoryOptionCombos: categoryOptionCombos,
        });
        customCategoryCombo.source = categoryCombo;
        customCategoryCombos[customCategoryCombo.id] = customCategoryCombo;
        return customCategoryCombo;
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

export {
    redirectToLogin,
    getCategoryCombos,
    collectionToArray,
    getExistingUserRoleByName,
    getCustomCategoryCombo,
    getAsyncUniqueValidator,
    setSharings,
    sendMessage,
    getUserGroups,
    mapPromise,
    getCountryCode,
    getOrgUnitsForLevel,
    getSharing,
};
