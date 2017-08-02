import { generateUid } from 'd2/lib/uid';
import _ from 'lodash';
import {cartesianProduct} from './lodash-mixins';

function redirectToLogin(baseUrl) {
    const loginUrl = `${baseUrl}/dhis-web-commons/security/login.action`;
    window.location.assign(loginUrl);
}

function getCategoryCombos(d2) {
    return d2.models.categoryCombos.list({
        fields: [
            'id,displayName',
            'categories[id,displayName,categoryOptions[id,displayName]]',
            'categoryOptionCombos[id,displayName,categoryOptions[id,displayName]]',
        ].join(','),
        filter: "dataDimensionType:eq:DISAGGREGATION",
        paging: false,
    });
}

function collectionToArray(collectionOrArray) {
    return collectionOrArray.toArray ? collectionOrArray.toArray() : collectionOrArray;
}

function getCustomCategoryCombo(d2, dataElement, categoryCombos, categoryCombo) {
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
    } else {
        const allCategoriesById = _(categoryCombos)
            .flatMap(cc => cc.categories.toArray()).uniqBy("id").keyBy("id").value();
        const categories = _.at(allCategoriesById, combinedCategories.map(cat => cat.id));
        const categoryOptions = categories.map(c => c.categoryOptions.toArray());
        const categoryOptionCombos = cartesianProduct(...categoryOptions).map(cos =>
            ({
                id: generateUid(),
                displayName: name,
                categoryOptions: cos,
            })
        );

        const name = [dataElement.categoryCombo, categoryCombo].map(cc => cc.displayName).join("/");
        const customCategoryCombo = d2.models.categoryCombo.create({
            id: "new-" + generateUid(),
            dataDimensionType: "DISAGGREGATION",
            name: name,
            displayName: name,
            categories: categories,
            categoryOptionCombos: categoryOptionCombos,
        });
        return _.merge(customCategoryCombo, {source: categoryCombo});
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

export {redirectToLogin, getCategoryCombos, collectionToArray, getCustomCategoryCombo,
        getAsyncUniqueValidator, getExistingUserRoleByName};