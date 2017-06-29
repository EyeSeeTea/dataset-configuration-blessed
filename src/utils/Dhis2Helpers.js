function redirectToLogin(baseUrl) {
    const loginUrl = `${baseUrl}/dhis-web-commons/security/login.action`;
    window.location.assign(loginUrl);
}

export {redirectToLogin};