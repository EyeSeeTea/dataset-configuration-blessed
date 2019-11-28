// When the app is built for development, DHIS_CONFIG is replaced with the config read from $DHIS2_HOME/config.js[on]
// When the app is built for production, process.env.NODE_ENV is replaced with the string 'production', and
// DHIS_CONFIG is replaced with an empty object
import React from "react";
import { render } from "react-dom";
import { init, config, getUserSettings, getManifest } from "d2/lib/d2";
import log from "loglevel";
import LoadingMask from "d2-ui/lib/loading-mask/LoadingMask.component";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import moment from "moment";

// The react-tap-event-plugin is required by material-ui to make touch screens work properly with onClick events
//import "react-tap-event-plugin";
//import injectTapEventPlugin from "react-tap-event-plugin";

import routes from "./router";
import appTheme from "./App/app.theme";
import "./App/App.scss";
import { redirectToLogin } from "./utils/Dhis2Helpers";
import Settings from "./models/Settings";

const dhisDevConfig = DHIS_CONFIG; // eslint-disable-line

// This code will only be included in non-production builds of the app
// It sets up the Authorization header to be used during CORS requests
// This way we can develop using webpack without having to install the application into DHIS2.
if (process.env.NODE_ENV !== "production") {
    jQuery.ajaxSetup({ headers: { Authorization: dhisDevConfig.authorization } }); // eslint-disable-line
}
//injectTapEventPlugin();

// Render the a LoadingMask to show the user the app is in loading
// The consecutive render after we did our setup will replace this loading mask
// with the rendered version of the application.
render(
    <MuiThemeProvider muiTheme={appTheme}>
        <LoadingMask />
    </MuiThemeProvider>,
    document.getElementById("app")
);

function safeGetUserSettings() {
    const redirect = err => {
        redirectToLogin(config.siteUrl);
        return Promise.reject(err || "Cannot connect to server");
    };

    return getUserSettings()
        .then(settings => (typeof settings === "object" ? settings : Promise.reject()))
        .catch(redirect);
}

function configI18n(userSettings) {
    const uiLocale = userSettings.keyUiLocale;
    const browserLocale = window.navigator.userLanguage || window.navigator.language;
    moment.locale(browserLocale);

    if (uiLocale && uiLocale !== "en") {
        // Add the language sources for the preferred locale
        config.i18n.sources.add(`./i18n/i18n_module_${uiLocale}.properties`);
    }

    // Add english as locale for all cases (either as primary or fallback)
    config.i18n.sources.add("./i18n/i18n_module_en.properties");

    ["cancel", "name"].forEach(key => config.i18n.strings.add(key));
}

/**
 * Renders the application into the page.
 *
 * @param d2 Instance of the d2 library that is returned by the `init` function.
 */
function startApp(d2) {
    window.d2 = d2;
    render(routes, document.getElementById("app"));
}

function initSettings(d2) {
    const settings = new Settings(d2);
    return settings.init().then(() => d2);
}

// Load the application manifest to be able to determine the location of the Api
// After we have the location of the api, we can set it onto the d2.config object
// and initialise the library. We use the initialised library to pass it into the app
// to make it known on the context of the app, so the sub-components (primarily the d2-ui components)
// can use it to access the api, translations etc.
getManifest("./manifest.webapp")
    .then(manifest => {
        const baseUrl =
            process.env.NODE_ENV === "production" ? manifest.getBaseUrl() : dhisDevConfig.baseUrl;
        config.siteUrl = baseUrl;
        config.baseUrl = `${baseUrl}/api/26`;
        log.info(`Loading: ${manifest.name} v${manifest.version}`);
        log.info(`Built ${manifest.manifest_generated_at}`);
    })
    .then(safeGetUserSettings)
    .then(configI18n)
    .then(init)
    .then(initSettings)
    .then(startApp)
    .catch(log.error.bind(log));
