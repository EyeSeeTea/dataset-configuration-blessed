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

export {redirectToLogin, getCategoryCombos, collectionToArray};