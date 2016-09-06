'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _dhis = require('./dhis2');

var _dhis2 = _interopRequireDefault(_dhis);

var _loglevel = require('loglevel');

var _loglevel2 = _interopRequireDefault(_loglevel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*eslint-disable */
(function (translate, undefined) {
    var translationCache = {
        get: function get(key) {
            if (this.hasOwnProperty(key)) return this[key];
            return key;
        }
    },
        getBaseUrl = function () {
        var href;

        //Add window.location.origin for IE8
        if (!window.location.origin) {
            window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
        }

        href = window.location.origin;

        return function () {
            var urlParts = href.split("/"),
                baseUrl;

            if (_dhis2.default.settings === undefined || _dhis2.default.settings.baseUrl === undefined) {
                return "..";
            }

            if (typeof _dhis2.default.settings.baseUrl !== "string") {
                throw new TypeError("Dhis2 settings: baseUrl should be a string");
            }

            if (urlParts[urlParts.length - 1] !== "") {
                if (/^https?\:\/\//.test(_dhis2.default.settings.baseUrl)) {
                    return _dhis2.default.settings.baseUrl;
                }
                baseUrl = href + '/' + _dhis2.default.settings.baseUrl;
            } else {
                urlParts.pop();
                urlParts.push(_dhis2.default.settings.baseUrl);
                baseUrl = urlParts.join('/');
            }
            return baseUrl;
        };
    }();

    /**
     * Adds translations to the translation cache (overrides already existing ones)
     *
     * @param translations {Object}
     */
    function addToCache(translations) {
        var translationIndex;
        for (translationIndex in translations) {
            if (typeof translationIndex === 'string' && translationIndex !== 'get') {
                translationCache[translationIndex] = translations[translationIndex];
            }
        }
    }

    /**
     * Asks the server for the translations of the given {translatekeys} and calls {callback}
     * when a successful response is received.
     *
     * @param translateKeys {Array}
     * @param callback {function}
     */
    function getTranslationsFromServer(translateKeys, callback) {
        jQuery.ajax({
            url: getBaseUrl() + "/api/i18n",
            method: 'POST',
            data: JSON.stringify(translateKeys),
            headers: {
                "Content-type": "application/json; charset=utf-8"
            }
        }).success(function (data) {
            addToCache(JSON.parse(data));
            callback(translationCache);
        }).error(function () {
            _loglevel2.default.error('Failed to load translations');
        });
    }

    /**
     * Translates the given keys in the {translate} array and calls callback when request is successful
     * callback currently gets passed an object with all translations that are in the local cache
     *
     * @param translate {Array}
     * @param callback {function}
     */
    translate.get = function (translate, callback) {
        var translateKeys = [];

        //Only ask for the translations that we do not already have
        translate.forEach(function (text, index, translate) {
            if (!(text in translationCache)) {
                translateKeys.push(text);
            }
        });

        if (translateKeys.length > 0) {
            //Ask for translations of the app names
            getTranslationsFromServer(translateKeys, callback);
        } else {
            //Call backback right away when we have everything in cache
            callback(translationCache);
        }
    };
})(_dhis2.default.translate);

exports.default = {};