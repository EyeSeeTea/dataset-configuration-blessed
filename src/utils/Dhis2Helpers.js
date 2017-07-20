function redirectToLogin(baseUrl) {
    const loginUrl = `${baseUrl}/dhis-web-commons/security/login.action`;
    window.location.assign(loginUrl);
}

function getCategoryCombos(d2) {
    return d2.models.categoryCombos.list({
        fields: "id,displayName,categories[id,name]",
        filter: "dataDimensionType:eq:DISAGGREGATION",
        paging: false,
    });
}

function collectionToArray(collectionOrArray) {
    return collectionOrArray.toArray ? collectionOrArray.toArray() : collectionOrArray;
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

export {redirectToLogin, getCategoryCombos, collectionToArray, getAsyncUniqueValidator};