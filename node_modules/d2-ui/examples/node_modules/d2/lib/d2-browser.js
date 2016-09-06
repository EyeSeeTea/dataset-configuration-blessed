var d2 = (function () {var d2 =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ((function(modules) {
	// Check all modules for deduplicated modules
	for(var i in modules) {
		if(Object.prototype.hasOwnProperty.call(modules, i)) {
			switch(typeof modules[i]) {
			case "function": break;
			case "object":
				// Module can be created from a template
				modules[i] = (function(_m) {
					var args = _m.slice(1), fn = modules[_m[0]];
					return function (a,b,c) {
						fn.apply(this, [a,b,c].concat(args));
					};
				}(modules[i]));
				break;
			default:
				// Module is a copy of another module
				modules[i] = modules[modules[i]];
				break;
			}
		}
	}
	return modules;
}([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	exports.getManifest = getManifest;
	exports.getUserSettings = getUserSettings;
	exports.init = init;
	exports.getInstance = getInstance;
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }
	
	var _libUtils = __webpack_require__(1);
	
	var _loggerLogger = __webpack_require__(2);
	
	var _loggerLogger2 = _interopRequireDefault(_loggerLogger);
	
	var _modelModels = __webpack_require__(4);
	
	var _modelModels2 = _interopRequireDefault(_modelModels);
	
	var _apiApi = __webpack_require__(7);
	
	var _apiApi2 = _interopRequireDefault(_apiApi);
	
	var _systemSystem = __webpack_require__(9);
	
	var _systemSystem2 = _interopRequireDefault(_systemSystem);
	
	var _i18nI18n = __webpack_require__(29);
	
	var _i18nI18n2 = _interopRequireDefault(_i18nI18n);
	
	var _config = __webpack_require__(30);
	
	var _config2 = _interopRequireDefault(_config);
	
	var _currentUserCurrentUser = __webpack_require__(32);
	
	var _currentUserCurrentUser2 = _interopRequireDefault(_currentUserCurrentUser);
	
	var _externalJquery = __webpack_require__(8);
	
	var _externalJquery2 = _interopRequireDefault(_externalJquery);
	
	var firstRun = true;
	var deferredD2Init = _libUtils.Deferred.create();
	
	var preInitConfig = _config2['default'].create();
	
	function getManifest(url) {
	    var api = new _apiApi2['default'](_externalJquery2['default']);
	    api.setBaseUrl('');
	
	    var manifestUtilities = {
	        getBaseUrl: function getBaseUrl() {
	            return this.activities.dhis.href;
	        }
	    };
	
	    return api.get('' + url).then(function (manifest) {
	        return Object.assign({}, manifest, manifestUtilities);
	    });
	}
	
	/**
	 * @function getUserSettings
	 *
	 * @returns {Promise} A promise to the current user settings
	 *
	 * @description
	 * The object that is the result of the promise will have the following properties
	 * ```js
	 * {
	 *   "uiLocale": "en" // The users locale, that can be used for translations)
	 * }
	 * ```
	 */
	
	function getUserSettings() {
	    var api = _apiApi2['default'].getApi();
	
	    if (preInitConfig.baseUrl && firstRun) {
	        api.setBaseUrl(preInitConfig.baseUrl);
	    }
	
	    return api.get('userSettings');
	}
	
	function getModelRequests(api) {
	    var schemaNames = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];
	
	    var fieldsForSchemas = 'apiEndpoint,name,authorities,plural,shareable,metadata,klass,identifiableObject,properties[href,writable,referenceType,collection,collectionName,name,propertyType,persisted,required,min,max,ordered,unique,constants,owner,itemPropertyType]';
	    var modelRequests = [];
	    var loadSchemaForName = function loadSchemaForName(schemaName) {
	        return api.get('schemas/' + schemaName, { fields: fieldsForSchemas });
	    };
	
	    if (schemaNames.length > 0) {
	        var individualSchemaRequests = schemaNames.map(loadSchemaForName);
	
	        var schemasPromise = Promise.all(individualSchemaRequests).then(function (schemas) {
	            return { schemas: schemas };
	        });
	
	        modelRequests.push(schemasPromise);
	    } else {
	        // Used as a source to generate the models.
	        modelRequests.push(api.get('schemas', { fields: fieldsForSchemas }));
	    }
	
	    // Used to add the dynamic attributes to the models that should have them.
	    modelRequests.push(api.get('attributes', { fields: ':all,optionSet[:all,options[:all]]', paging: false }));
	
	    return modelRequests;
	}
	
	/**
	 * @function init
	 *
	 * @param {Object} initConfig Configuration object that will be used to configure to define D2 Setting.
	 * See the description for more information on the available settings.
	 * @returns {Promise} A promise that resolves with the intialized d2 object. Which is an object that exposes `model`, `models` and `Api`
	 *
	 * @description
	 * Init function that used to initialise D2. This will load the schemas from the DHIS2 api and configure your D2 instance.
	 *
	 * The `config` object that can be passed into D2 can have the following properties:
	 *
	 * baseUrl: Set this when the url is something different then `/api`. If you are running your dhis instance in a subdirectory of the actual domain
	 * for example http://localhost/dhis/ you should set the base url to `/dhis/api`
	 *
	 * ```js
	 * import init from 'd2';
	 *
	 * init({baseUrl: '/dhis/api'})
	 *   .then((d2) => {
	 *     console.log(d2.model.dataElement.list());
	 *   });
	 * ```
	 */
	
	function init(initConfig) {
	    var api = _apiApi2['default'].getApi();
	    var logger = _loggerLogger2['default'].getLogger();
	
	    var config = _config2['default'].create(preInitConfig, initConfig);
	
	    var d2 = {
	        models: undefined,
	        model: _modelModels2['default'],
	        Api: _apiApi2['default'],
	        system: _systemSystem2['default'].getSystem(),
	        i18n: _i18nI18n2['default'].getI18n()
	    };
	
	    // Process the config in a the config class to keep all config calls together.
	    _config2['default'].processConfigForD2(config, d2);
	
	    // Because when importing the getInstance method in dependencies the getInstance could run before
	    // init we have to resolve the current promise on first run and for consecutive ones replace the
	    // old one with a fresh promise.
	    if (firstRun) {
	        firstRun = false;
	    } else {
	        deferredD2Init = _libUtils.Deferred.create();
	    }
	
	    var modelRequests = getModelRequests(api, config.schemas);
	
	    var userRequests = [api.get('me', { fields: ':all,organisationUnits[id],userGroups[id],userCredentials[:all,!user,userRoles[id]' }), api.get('me/authorization'), getUserSettings()];
	
	    var systemRequests = [api.get('system/info'), api.get('apps')];
	
	    return Promise.all([].concat(_toConsumableArray(modelRequests), userRequests, systemRequests, [d2.i18n.load()])).then(function (res) {
	        var responses = {
	            schemas: (0, _libUtils.pick)('schemas')(res[0]),
	            attributes: (0, _libUtils.pick)('attributes')(res[1]),
	            currentUser: res[2],
	            authorities: res[3],
	            userSettings: res[4],
	            systemInfo: res[5],
	            apps: res[6]
	        };
	
	        responses.schemas
	        // TODO: Remove this when the schemas endpoint is versioned or shows the correct urls for the requested version
	        // The schemas endpoint is not versioned which will result into the modelDefinitions always using the
	        // "default" endpoint, we therefore modify the endpoint url based on the given baseUrl.
	        .map(function (schema) {
	            schema.apiEndpoint = (0, _libUtils.updateAPIUrlWithBaseUrlVersionNumber)(schema.apiEndpoint, config.baseUrl); // eslint-disable-line no-param-reassign
	
	            return schema;
	        }).forEach(function (schema) {
	            // Attributes that do not have values do not by default get returned with the data,
	            // therefore we need to grab the attributes that are attached to this particular schema to be able to know about them
	            var schemaAttributes = responses.attributes.filter(function (attributeDescriptor) {
	                var attributeNameFilter = [schema.name, 'Attribute'].join('');
	                return attributeDescriptor[attributeNameFilter] === true;
	            });
	
	            if (!Object.prototype.hasOwnProperty.call(d2.models, schema.name)) {
	                d2.models.add(_modelModels2['default'].ModelDefinition.createFromSchema(schema, schemaAttributes));
	            }
	        });
	
	        d2.currentUser = _currentUserCurrentUser2['default'].create(responses.currentUser, responses.authorities, d2.models, responses.userSettings);
	        d2.system.setSystemInfo(responses.systemInfo);
	        d2.system.setInstalledApps(responses.apps);
	
	        deferredD2Init.resolve(d2);
	        return deferredD2Init.promise;
	    })['catch'](function (error) {
	        logger.error('Unable to get schemas from the api', JSON.stringify(error), error);
	
	        deferredD2Init.reject('Unable to get schemas from the DHIS2 API');
	        return deferredD2Init.promise;
	    });
	}
	
	/**
	 * @function getInstance
	 *
	 * @returns {Promise} A promise to an initialized d2 instance.
	 *
	 * @description
	 * This function can be used to retrieve the `singleton` instance of d2. The instance is being created by calling
	 * the `init` method.
	 *
	 * ```js
	 * import {init, getInstance} from 'd2';
	 *
	 * init({baseUrl: '/dhis2/api/'});
	 * getInstance()
	 *   .then(d2 => {
	 *      d2.models.dataElement.list();
	 *      // and all your other d2 magic.
	 *   });
	 * ```
	 */
	
	function getInstance() {
	    return deferredD2Init.promise;
	}
	
	// Alias preInitConfig to be able to `import {config} from 'd2';`
	/**
	 * @property config
	 *
	 * @description
	 * Can be used to set config options before initialisation of d2.
	 *
	 * ```js
	 * import {config, init} from 'd2';
	 *
	 * config.baseUrl = '/demo/api';
	 * config.i18n.sources.add('i18n/systemsettingstranslations.properties');
	 *
	 * init()
	 *   .then(d2 => {
	 *     d2.system.settings.all()
	 *       .then(systemSettings => Object.keys())
	 *       .then(systemSettingsKey => {
	 *         d2.i18n.getTranslation(systemSettingsKey);
	 *       });
	 *   });
	 *
	 * ```
	 */
	var config = preInitConfig;
	
	exports.config = config;
	exports['default'] = {
	    init: init,
	    config: config,
	    getInstance: getInstance,
	    getUserSettings: getUserSettings,
	    getManifest: getManifest
	};

/***/ },
/* 1 */
/***/ function(module, exports) {

	// TODO: Most of these functions should be moved out to d2-utilizr
	
	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	exports.throwError = throwError;
	exports.curry = curry;
	exports.addLockedProperty = addLockedProperty;
	exports.copyOwnProperties = copyOwnProperties;
	exports.pick = pick;
	exports.updateAPIUrlWithBaseUrlVersionNumber = updateAPIUrlWithBaseUrlVersionNumber;
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function throwError(message) {
	    throw new Error(message);
	}
	
	// TODO: Throw an error when `toCurry` is not a function
	
	function curry(toCurry, parameter) {
	    return function curried() {
	        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	            args[_key] = arguments[_key];
	        }
	
	        return toCurry.apply(this, [parameter].concat(args));
	    };
	}
	
	function addLockedProperty(object, name, value) {
	    var propertyDescriptor = {
	        enumerable: true,
	        configurable: false,
	        writable: false,
	        value: value
	    };
	    Object.defineProperty(object, name, propertyDescriptor);
	}
	
	function copyOwnProperties(to, from) {
	    var key = undefined;
	
	    for (key in from) {
	        if (from.hasOwnProperty(key)) {
	            to[key] = from[key]; // eslint-disable-line no-param-reassign
	        }
	    }
	
	    return to;
	}
	
	function pick(property) {
	    return function (item) {
	        if (item) {
	            return item[property];
	        }
	        return undefined;
	    };
	}
	
	var Deferred = (function () {
	    function Deferred() {
	        var _this = this;
	
	        _classCallCheck(this, Deferred);
	
	        this.promise = new Promise(function (resolve, reject) {
	            _this.resolve = resolve;
	            _this.reject = reject;
	        });
	    }
	
	    _createClass(Deferred, null, [{
	        key: "create",
	        value: function create() {
	            return new Deferred();
	        }
	    }]);
	
	    return Deferred;
	})();
	
	exports.Deferred = Deferred;
	
	function updateAPIUrlWithBaseUrlVersionNumber(apiUrl, baseUrl) {
	    if (!baseUrl || !apiUrl) {
	        return apiUrl;
	    }
	
	    var apiUrlWithVersionRexExp = /api\/(2[3-9])/;
	    var apiVersionMatch = baseUrl.match(apiUrlWithVersionRexExp);
	
	    var baseUrlHasVersion = apiVersionMatch && apiVersionMatch[1];
	    var apiUrlHasVersion = apiUrl && !apiUrlWithVersionRexExp.test(apiUrl);
	
	    if (baseUrlHasVersion && apiUrlHasVersion) {
	        var version = apiVersionMatch[1];
	
	        // Inject the current api version number into the endPoint urls
	        return apiUrl.replace(/api/, "api/" + version);
	    }
	
	    return apiUrl;
	}

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	var _libCheck = __webpack_require__(3);
	
	var Logger = (function () {
	    function Logger(logging) {
	        _classCallCheck(this, Logger);
	
	        (0, _libCheck.checkType)(logging, 'object', 'console');
	        this.logger = logging;
	    }
	
	    _createClass(Logger, [{
	        key: 'canLog',
	        value: function canLog(type) {
	            return !!(type && console && (0, _libCheck.isType)(this.logger[type], 'function'));
	        }
	    }, {
	        key: 'debug',
	        value: function debug() {
	            if (this.canLog('debug')) {
	                for (var _len = arguments.length, rest = Array(_len), _key = 0; _key < _len; _key++) {
	                    rest[_key] = arguments[_key];
	                }
	
	                this.logger.debug.apply(console, rest);
	                return true;
	            }
	            return false;
	        }
	    }, {
	        key: 'error',
	        value: function error() {
	            if (this.canLog('error')) {
	                for (var _len2 = arguments.length, rest = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	                    rest[_key2] = arguments[_key2];
	                }
	
	                this.logger.error.apply(console, rest);
	                return true;
	            }
	            return false;
	        }
	    }, {
	        key: 'log',
	        value: function log() {
	            if (this.canLog('log')) {
	                for (var _len3 = arguments.length, rest = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
	                    rest[_key3] = arguments[_key3];
	                }
	
	                this.logger.log.apply(console, rest);
	                return true;
	            }
	            return false;
	        }
	    }, {
	        key: 'warn',
	        value: function warn() {
	            if (this.canLog('warn')) {
	                for (var _len4 = arguments.length, rest = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
	                    rest[_key4] = arguments[_key4];
	                }
	
	                this.logger.warn.apply(console, rest);
	                return true;
	            }
	            return false;
	        }
	    }], [{
	        key: 'getLogger',
	        value: function getLogger() {
	            var logger = undefined;
	
	            // TODO: This is not very clean try to figure out a better way to do this.
	            try {
	                // Node version
	                logger = global.console;
	            } catch (e) {
	                // Browser version fallback
	                /* istanbul ignore next */
	                logger = window.console;
	            }
	
	            if (this.logger) {
	                return this.logger;
	            }
	            return this.logger = new Logger(logger);
	        }
	    }]);
	
	    return Logger;
	})();
	
	exports['default'] = Logger;
	module.exports = exports['default'];
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	exports.checkDefined = checkDefined;
	exports.checkType = checkType;
	exports.isType = isType;
	exports.isString = isString;
	exports.isArray = isArray;
	exports.isObject = isObject;
	exports.isDefined = isDefined;
	exports.isInteger = isInteger;
	exports.isNumeric = isNumeric;
	exports.contains = contains;
	exports.isValidUid = isValidUid;
	
	function checkDefined(value, name) {
	    if (value !== undefined) {
	        return true;
	    }
	    throw new Error([name || 'Value', 'should be provided'].join(' '));
	}
	
	// TODO: Decide if checkType([], 'object') is a 'false' positive
	
	function checkType(value, type, name) {
	    checkDefined(value, name);
	    checkDefined(type, 'Type');
	
	    if (typeof type === 'function' && value instanceof type || typeof type === 'string' && typeof value === type) {
	        return true;
	    }
	    throw new Error(['Expected', name || value, 'to have type', type].join(' '));
	}
	
	// TODO: Log type error?
	
	function isType(value, type) {
	    function noop() {}
	
	    try {
	        checkType(value, type);
	        return true;
	    } catch (e) {
	        noop();
	    }
	
	    return false;
	}
	
	function isString(value) {
	    return isType(value, 'string');
	}
	
	function isArray(value) {
	    return Array.isArray(value);
	}
	
	function isObject(value) {
	    return isType(value, Object);
	}
	
	function isDefined(value) {
	    return value !== undefined;
	}
	
	function isInteger(nVal) {
	    return typeof nVal === 'number' && isFinite(nVal) && nVal > -9007199254740992 && nVal < 9007199254740992 && Math.floor(nVal) === nVal;
	}
	
	// Polyfill for the isInteger function that will be added in ES6
	// http://wiki.ecmascript.org/doku.php?id=harmony:number.isinteger
	/* istanbul ignore if  */
	if (!Number.isInteger) {
	    Number.isInteger = isInteger;
	}
	
	function isNumeric(nVal) {
	    return typeof nVal === 'number' && isFinite(nVal) && nVal - parseFloat(nVal) + 1 >= 0;
	}
	
	function contains(item, list) {
	    var listToCheck = isArray(list) && list || [];
	
	    return listToCheck.indexOf(item) >= 0;
	}
	
	function isValidUid(value) {
	    return value && value.length === 11;
	}
	
	exports['default'] = {
	    checkType: checkType,
	    checkDefined: checkDefined,
	    isArray: isArray,
	    isDefined: isDefined,
	    isInteger: isInteger,
	    isNumeric: isNumeric,
	    isString: isString,
	    isType: isType,
	    contains: contains,
	    isValidUid: isValidUid
	};

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	var _ModelBase = __webpack_require__(5);
	
	var _ModelBase2 = _interopRequireDefault(_ModelBase);
	
	var _Model = __webpack_require__(13);
	
	var _Model2 = _interopRequireDefault(_Model);
	
	var _ModelDefinition = __webpack_require__(14);
	
	var _ModelDefinition2 = _interopRequireDefault(_ModelDefinition);
	
	var _ModelDefinitions = __webpack_require__(15);
	
	var _ModelDefinitions2 = _interopRequireDefault(_ModelDefinitions);
	
	var _ModelValidation = __webpack_require__(6);
	
	var _ModelValidation2 = _interopRequireDefault(_ModelValidation);
	
	exports['default'] = {
	    ModelBase: _ModelBase2['default'],
	    Model: _Model2['default'],
	    ModelDefinition: _ModelDefinition2['default'],
	    ModelDefinitions: _ModelDefinitions2['default'],
	    ModelValidation: _ModelValidation2['default']
	};
	module.exports = exports['default'];

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	var _ModelValidation = __webpack_require__(6);
	
	var _ModelValidation2 = _interopRequireDefault(_ModelValidation);
	
	var _libCheck = __webpack_require__(3);
	
	var _helpersJson = __webpack_require__(12);
	
	var modelValidator = _ModelValidation2['default'].getModelValidation();
	
	var DIRTY_PROPERTY_LIST = Symbol('List to keep track of dirty properties');
	
	exports.DIRTY_PROPERTY_LIST = DIRTY_PROPERTY_LIST;
	function hasModelValidationForProperty(model, property) {
	    return Boolean(model.modelDefinition && model.modelDefinition.modelValidations && model.modelDefinition.modelValidations[property] && Object.prototype.hasOwnProperty.call(model.modelDefinition.modelValidations, property));
	}
	
	function updateModelFromResponseStatus(result) {
	    if (result && result.httpStatus === 'Created' && result && (0, _libCheck.isValidUid)(result.response.uid)) {
	        this.dataValues.id = result.response.uid;
	        this.dataValues.href = [this.modelDefinition.apiEndpoint, this.dataValues.id].join('/');
	    }
	    this.dirty = false;
	    this.getDirtyChildren().forEach(function (value) {
	        if (value.resetDirtyState) {
	            value.resetDirtyState();
	        } else {
	            value.dirty = false; // eslint-disable-line no-param-reassign
	        }
	    });
	
	    this[DIRTY_PROPERTY_LIST].clear();
	    return result;
	}
	
	/**
	 * @class ModelBase
	 */
	
	var ModelBase = (function () {
	    function ModelBase() {
	        _classCallCheck(this, ModelBase);
	    }
	
	    _createClass(ModelBase, [{
	        key: 'create',
	
	        /**
	         * @method create
	         *
	         * @returns {Promise} Returns a promise that resolves when the model has been saved or rejected with the result from
	         * the `validate()` call.
	         *
	         * @definition
	         * Will save model as a new object to the server using a POST request. This method would generally be used if
	         * you're creating models with pre-specified IDs. Note that this does not check if the model is marked as dirty.
	         */
	        value: function create() {
	            var _this = this;
	
	            return this.validate().then(function (validationState) {
	                if (!validationState.status) {
	                    return Promise.reject(validationState);
	                }
	
	                return _this.modelDefinition.saveNew(_this).then(updateModelFromResponseStatus.bind(_this));
	            });
	        }
	
	        /**
	         * @method save
	         *
	         * @returns {Promise} Returns a promise that resolves when the model has been saved
	         * or rejects with the result from the `validate()` call.
	         *
	         * @description
	         * Checks if the model is dirty. When the model is dirty it will check if the values of the model are valid by calling
	         * `validate`. If this is correct it will attempt to save the [Model](#/model/Model) to the api.
	         *
	         * ```js
	         * myModel.save()
	         *   .then((message) => console.log(message));
	         * ```
	         */
	    }, {
	        key: 'save',
	        value: function save(includeChildren) {
	            var _this2 = this;
	
	            if (!this.isDirty(includeChildren)) {
	                return Promise.reject('No changes to be saved');
	            }
	
	            return this.validate().then(function (validationState) {
	                if (!validationState.status) {
	                    return Promise.reject(validationState);
	                }
	
	                return _this2.modelDefinition.save(_this2).then(updateModelFromResponseStatus.bind(_this2));
	            });
	        }
	
	        /**
	         * @method validate
	         *
	         * @returns {Promise} Promise that resolves with an object with a status property that represents if the model
	         * is valid or not the fields array will return the names of the fields that are invalid.
	         *
	         * @description
	         * This will run the validations on the properties which have validations set. Normally these validations are defined
	         * through the DHIS2 schema. It will check min/max for strings/numbers etc. Additionally it will
	         * run model validations against the schema.
	         *
	         * ```js
	         * myModel.validate()
	         *  .then(myModelStatus => {
	         *    if (myModelStatus.status === false) {
	         *      myModelStatus.fields.forEach((fieldName) => console.log(fieldName));
	         *    }
	         * });
	         * ```
	         */
	    }, {
	        key: 'validate',
	        value: function validate() {
	            var _this3 = this;
	
	            return new Promise(function (resolve, reject) {
	                var validationMessages = [];
	
	                function unique(current, property) {
	                    if (property && current.indexOf(property) === -1) {
	                        current.push(property);
	                    }
	                    return current;
	                }
	
	                function asyncRemoteValidation(model) {
	                    return modelValidator.validateAgainstSchema(model);
	                }
	
	                // Run async validation against the api
	                asyncRemoteValidation(_this3)['catch'](function (remoteMessages) {
	                    // Errors are ok in this case
	                    if (Array.isArray(remoteMessages)) {
	                        return remoteMessages;
	                    }
	                    return Promise.reject(remoteMessages);
	                }).then(function (remoteMessages) {
	                    validationMessages = validationMessages.concat(remoteMessages);
	
	                    var validationState = {
	                        status: remoteMessages.length === 0,
	                        fields: validationMessages.map(function (validationMessage) {
	                            return validationMessage.property;
	                        }).reduce(unique, []),
	                        messages: validationMessages
	                    };
	                    resolve(validationState);
	                })['catch'](function (message) {
	                    return reject(message);
	                });
	            });
	        }
	    }, {
	        key: 'clone',
	        value: function clone() {
	            return this.modelDefinition.create((0, _helpersJson.getJSONForProperties)(this, Object.keys(this.modelDefinition.modelValidations)));
	        }
	    }, {
	        key: 'delete',
	        value: function _delete() {
	            return this.modelDefinition['delete'](this);
	        }
	    }, {
	        key: 'isDirty',
	        value: function isDirty() {
	            var includeChildren = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];
	
	            if (!(this.dirty || includeChildren === true && this.hasDirtyChildren())) {
	                return false;
	            }
	            return true;
	        }
	    }, {
	        key: 'getDirtyPropertyNames',
	        value: function getDirtyPropertyNames() {
	            return Array.from(this[DIRTY_PROPERTY_LIST].values());
	        }
	    }, {
	        key: 'getCollectionChildren',
	        value: function getCollectionChildren() {
	            var _this4 = this;
	
	            // TODO: Can't be sure that this has a `modelDefinition` property
	            return Object.keys(this).filter(function (propertyName) {
	                return _this4[propertyName] && hasModelValidationForProperty(_this4, propertyName) && _this4.modelDefinition.modelValidations[propertyName].owner;
	            }).map(function (propertyName) {
	                return _this4[propertyName];
	            });
	        }
	    }, {
	        key: 'getCollectionChildrenPropertyNames',
	        value: function getCollectionChildrenPropertyNames() {
	            var _this5 = this;
	
	            return Object.keys(this).filter(function (propertyName) {
	                return _this5.modelDefinition && _this5.modelDefinition.modelValidations && _this5.modelDefinition.modelValidations[propertyName] && _this5.modelDefinition.modelValidations[propertyName].type === 'COLLECTION';
	            });
	        }
	    }, {
	        key: 'getDirtyChildren',
	        value: function getDirtyChildren() {
	            return this.getCollectionChildren().filter(function (property) {
	                return property && property.dirty === true;
	            });
	        }
	    }, {
	        key: 'hasDirtyChildren',
	        value: function hasDirtyChildren() {
	            return this.getDirtyChildren().length > 0;
	        }
	    }]);
	
	    return ModelBase;
	})();
	
	exports['default'] = new ModelBase();

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	var _libCheck = __webpack_require__(3);
	
	var _loggerLogger = __webpack_require__(2);
	
	var _loggerLogger2 = _interopRequireDefault(_loggerLogger);
	
	var _apiApi = __webpack_require__(7);
	
	var _apiApi2 = _interopRequireDefault(_apiApi);
	
	var _helpersJson = __webpack_require__(12);
	
	/**
	 * @class ModelValidation
	 */
	
	var ModelValidation = (function () {
	    function ModelValidation(providedLogger) {
	        _classCallCheck(this, ModelValidation);
	
	        (0, _libCheck.checkType)(providedLogger, 'object', 'logger (Logger)');
	        this.logger = providedLogger;
	    }
	
	    /**
	     * @deprecated
	     * @method validate
	     *
	     * @returns {{status: boolean, messages: Array}} Returns {status: true, messages: []}
	     */
	
	    _createClass(ModelValidation, [{
	        key: 'validate',
	        value: function validate() {
	            this.logger.warn('Client side model validation is deprecated');
	            throw new Error('Client side model validation is deprecated');
	        }
	
	        /**
	         * @method validateAgainstSchema
	         *
	         * @param {Model} model The model that should be validated.
	         * @returns {Array} Returns an array with validation messages if there are any.
	         *
	         * @description
	         * Sends a POST request against the `api/schemas` endpoint to check if the model is valid.
	         *
	         * @note {warn} Currently only checks
	         */
	    }, {
	        key: 'validateAgainstSchema',
	        value: function validateAgainstSchema(model) {
	            if (!(model && model.modelDefinition && model.modelDefinition.name)) {
	                return Promise.reject('model.modelDefinition.name can not be found');
	            }
	
	            function extractValidationViolations(webmessage) {
	                // Support both the 2.23+ version using `errorReports` and the 2.22 and lower using `validationViolations`
	                // for errorMessages from the schemas endpoint.
	                // TODO: Remove support for the older `validationViolations` when supporting 2.22 is no longer required
	                if (webmessage.response && (webmessage.response.validationViolations || webmessage.response.errorReports)) {
	                    return webmessage.response.validationViolations || webmessage.response.errorReports;
	                }
	                throw new Error('Response was not a WebMessage with the expected format');
	            }
	
	            var url = 'schemas/' + model.modelDefinition.name;
	
	            // TODO: The function getOwnedPropertyJSON should probably not be exposed, perhaps we could have a getJSONForModel(ownedPropertiesOnly=true) method.
	            return _apiApi2['default'].getApi().post(url, (0, _helpersJson.getOwnedPropertyJSON)(model)).then(function (webMessage) {
	                if (webMessage.status === 'OK') {
	                    return [];
	                }
	                return Promise.reject(webMessage);
	            })['catch'](extractValidationViolations);
	        }
	
	        /**
	         * @method getModelValidation
	         * @static
	         *
	         * @returns {ModelValidation} New or memoized instance of `ModelInstance`
	         *
	         * @description
	         * Returns the `ModelValidation` singleton. Creates a new one if it does not yet exist.
	         * Grabs a logger instance by calling `Logger.getLogger`
	         */
	    }], [{
	        key: 'getModelValidation',
	        value: function getModelValidation() {
	            if (this.modelValidation) {
	                return this.modelValidation;
	            }
	            return this.modelValidation = new ModelValidation(_loggerLogger2['default'].getLogger(console));
	        }
	    }]);
	
	    return ModelValidation;
	})();
	
	exports['default'] = ModelValidation;
	module.exports = exports['default'];

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	var _libCheck = __webpack_require__(3);
	
	var _externalJquery = __webpack_require__(8);
	
	var _externalJquery2 = _interopRequireDefault(_externalJquery);
	
	var _systemSystem = __webpack_require__(9);
	
	var _systemSystem2 = _interopRequireDefault(_systemSystem);
	
	function getMergeStrategyParam() {
	    var mergeType = arguments.length <= 0 || arguments[0] === undefined ? 'REPLACE' : arguments[0];
	
	    var system = _systemSystem2['default'].getSystem();
	
	    if (system.version && Number(system.version.minor) <= 22) {
	        return 'mergeStrategy=' + mergeType;
	    }
	
	    return 'mergeMode=' + mergeType;
	}
	
	function processSuccess(resolve) {
	    return function (data /* , textStatus, jqXHR */) {
	        resolve(data);
	    };
	}
	
	function processFailure(reject) {
	    return function (jqXHR /* , textStatus, errorThrown */) {
	        if (jqXHR.responseJSON) {
	            return reject(jqXHR.responseJSON);
	        }
	
	        delete jqXHR.then; // eslint-disable-line no-param-reassign
	        return reject(jqXHR);
	    };
	}
	
	function getUrl(baseUrl, url) {
	    // If we are dealing with an absolute url use that instead
	    if (new RegExp('^(:?https?:)?//').test(url)) {
	        return url;
	    }
	
	    var urlParts = [];
	
	    if (baseUrl) {
	        urlParts.push(baseUrl);
	    }
	    urlParts.push(url);
	
	    return urlParts.join('/').replace(new RegExp('(.(?:[^:]))\/\/+', 'g'), '$1/').replace(new RegExp('\/$'), '');
	}
	
	var Api = (function () {
	    function Api(jquery) {
	        _classCallCheck(this, Api);
	
	        if (!jquery) {
	            throw new Error('D2 requires jQuery');
	        }
	
	        this.jquery = jquery;
	        this.baseUrl = '/api';
	        this.defaultRequestSettings = {
	            headers: {
	                // FIXME: Remove the 'Cache-Control: no-store' header when we figure out how to solve this xhr/jquery bug
	                // does not process consecutive requests for the same url properly due to the 304 response.
	                // It makes no sense to set a 'Cache-Control: no-store' on a request...
	                'Cache-Control': 'no-store'
	            },
	            data: {},
	            contentType: 'application/json',
	            type: undefined,
	            url: undefined
	        };
	    }
	
	    _createClass(Api, [{
	        key: 'get',
	        value: function get(url, data, options) {
	            return this.request('GET', getUrl(this.baseUrl, url), data, options);
	        }
	    }, {
	        key: 'post',
	        value: function post(url, data, options) {
	            // Pass data through JSON.stringify, unless options.contentType is 'text/plain' or false (meaning don't process)
	            var payload = options && options.contentType !== undefined && (options.contentType === 'text/plain' || options.contentType === false) ? data : JSON.stringify(data);
	            return this.request('POST', getUrl(this.baseUrl, url), payload, options);
	        }
	    }, {
	        key: 'delete',
	        value: function _delete(url, options) {
	            return this.request('DELETE', getUrl(this.baseUrl, url), undefined, options);
	        }
	    }, {
	        key: 'update',
	        value: function update(url, data) {
	            var useMergeStrategy = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];
	
	            // Since we are currently using PUT to save the full state back, we have to use mergeMode=REPLACE
	            // to clear out existing values
	            var urlForUpdate = useMergeStrategy === true ? url + '?' + getMergeStrategyParam() : url;
	
	            return this.request('PUT', getUrl(this.baseUrl, urlForUpdate), JSON.stringify(data));
	        }
	    }, {
	        key: 'request',
	        value: function request(type, url, data) {
	            var options = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];
	
	            (0, _libCheck.checkType)(type, 'string', 'Request type');
	            (0, _libCheck.checkType)(url, 'string', 'Url');
	            var requestUrl = url;
	
	            if (data && data.filter) {
	                var urlQueryParams = data.filter
	                // `${str}${separator}${filter}`
	                .reduce(function (str, filter) {
	                    var separator = str.length ? '&' : '';
	                    var filterQuery = 'filter=' + filter;
	
	                    return '' + str + separator + filterQuery;
	                }, '');
	
	                delete data.filter; // eslint-disable-line no-param-reassign
	                requestUrl += '?' + urlQueryParams;
	            }
	
	            var api = this;
	
	            function getOptions(mergeOptions, requestData) {
	                var payload = requestData;
	                if (payload === undefined) {
	                    payload = {};
	                } else if (payload === true || payload === false) {
	                    payload = payload.toString();
	                }
	
	                var resultOptions = Object.assign({}, api.defaultRequestSettings, mergeOptions);
	
	                resultOptions.type = type;
	                resultOptions.url = requestUrl;
	                resultOptions.data = payload;
	                resultOptions.dataType = options.dataType !== undefined ? options.dataType : 'json';
	                resultOptions.contentType = options.contentType !== undefined ? options.contentType : 'application/json';
	
	                // Only set content type when there is data to send
	                // GET requests and requests without data do not need a Content-Type header
	                // 0 and false are valid requestData values and therefore should have a content type
	                if (type === 'GET' || !requestData && requestData !== 0 && requestData !== false) {
	                    resultOptions.contentType = undefined;
	                }
	
	                return resultOptions;
	            }
	
	            return new Promise(function (resolve, reject) {
	                api.jquery.ajax(getOptions(options, data)).then(processSuccess(resolve), processFailure(reject));
	            });
	        }
	    }, {
	        key: 'setBaseUrl',
	        value: function setBaseUrl(baseUrl) {
	            (0, _libCheck.checkType)(baseUrl, 'string', 'Base url');
	
	            this.baseUrl = baseUrl;
	
	            return this;
	        }
	    }]);
	
	    return Api;
	})();
	
	function getApi() {
	    if (getApi.api) {
	        return getApi.api;
	    }
	    return getApi.api = new Api(_externalJquery2['default']);
	}
	
	Api.getApi = getApi;
	
	exports['default'] = Api;
	module.exports = exports['default'];

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	var _loggerLogger = __webpack_require__(2);
	
	var _loggerLogger2 = _interopRequireDefault(_loggerLogger);
	
	var jquery = undefined;
	
	try {
	    jquery = window.jQuery;
	} catch (e) {
	    _loggerLogger2['default'].getLogger().error('JQuery not found');
	    jquery = {};
	}
	
	exports['default'] = jquery;
	module.exports = exports['default'];

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module System
	 *
	 * @requires d2/system/SystemSettings
	 */
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	var _apiApi = __webpack_require__(7);
	
	var _apiApi2 = _interopRequireDefault(_apiApi);
	
	var _SystemSettings = __webpack_require__(10);
	
	var _SystemSettings2 = _interopRequireDefault(_SystemSettings);
	
	var _SystemConfiguration = __webpack_require__(11);
	
	var _SystemConfiguration2 = _interopRequireDefault(_SystemConfiguration);
	
	/**
	 * @class System
	 *
	 * @description
	 * Represents the system that can be interacted with. There is a single instance of this pre-defined onto the d2
	 * object after initialisation. This can be interacted with using its property objects to among other be used
	 * to get and save systemSettings.
	 */
	
	var System = (function () {
	    function System(settings, configuration) {
	        _classCallCheck(this, System);
	
	        /**
	         * @property {SystemSettings} settings Contains a reference to a `SystemSettings` instance that can be used
	         * to retrieve and save system settings.
	         *
	         * @description
	         * ```js
	         * d2.system.settings.get('keyLastSuccessfulResourceTablesUpdate')
	         *  .then(systemSettingsValue => {
	         *    console.log('Analytics was last updated on: ' + systemSettingsValue);
	         *  });
	         * ```
	         */
	        this.settings = settings;
	
	        /**
	         * @property {SystemConfiguration} configuration
	         *
	         * @description A representation of the system configuration, that can be used to retreive and change system
	         * configuration options.
	         */
	        this.configuration = configuration;
	
	        /**
	         * @property {Object} systemInfo
	         *
	         * @description An object containing system information about the DHIS2 instance
	         */
	        this.systemInfo = undefined;
	
	        /**
	         * @property {Object} version
	         *
	         * @description An object containing version information about the DHIS2 instance
	         */
	        this.version = undefined;
	
	        /**
	         * @property {Array} installedApps
	         *
	         * @description An array of all the webapps that are installed on the current DHIS2 instance
	         */
	        this.installedApps = undefined;
	    }
	
	    /**
	     * Sets the systemInfo and version properties
	     *
	     * @param systemInfo
	     */
	
	    _createClass(System, [{
	        key: 'setSystemInfo',
	        value: function setSystemInfo(systemInfo) {
	            this.version = System.parseVersionString(systemInfo.version);
	            this.systemInfo = systemInfo;
	        }
	
	        /**
	         * Sets the list of currently installed webapps
	         *
	         * @param apps
	         */
	    }, {
	        key: 'setInstalledApps',
	        value: function setInstalledApps(apps) {
	            this.installedApps = apps;
	        }
	
	        /**
	         * Refreshes the list of currently installed webapps
	         *
	         * @returns {Promise} A promise that resolves to the list of installed apps
	         */
	    }, {
	        key: 'loadInstalledApps',
	        value: function loadInstalledApps() {
	            var _this = this;
	
	            var api = _apiApi2['default'].getApi();
	
	            return api.get('apps').then(function (apps) {
	                _this.setInstalledApps(apps);
	
	                return apps;
	            });
	        }
	
	        /**
	         * Upload and install a zip file containing a new webapp
	         *
	         * @param zipFile Zip file data from a file input form field
	         * @param onProgress An optional callback that will be called whenever file upload progress info is available
	         * @returns {Promise}
	         */
	    }, {
	        key: 'uploadApp',
	        value: function uploadApp(zipFile, onProgress) {
	            var api = _apiApi2['default'].getApi();
	            var data = new FormData();
	            var xhr = undefined;
	            data.append('file', zipFile);
	
	            if (onProgress !== undefined) {
	                xhr = new XMLHttpRequest();
	                xhr.upload.onprogress = function (progress) {
	                    if (progress.lengthComputable) {
	                        onProgress(progress.loaded / progress.total);
	                    }
	                };
	            }
	
	            return api.post('apps', data, {
	                contentType: false,
	                processData: false,
	                xhr: xhr !== undefined ? function () {
	                    return xhr;
	                } : undefined
	            });
	        }
	
	        /**
	         * Load the list of apps available in the DHIS 2 app store
	         *
	         * @param compatibleOnly If true, apps that are incompatible with the current system will be filtered out
	         * @returns {Promise}
	         */
	    }, {
	        key: 'loadAppStore',
	        value: function loadAppStore() {
	            var _this2 = this;
	
	            var compatibleOnly = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];
	
	            return new Promise(function (resolve, reject) {
	                var api = _apiApi2['default'].getApi();
	                api.get('appStore').then(function (appStoreData) {
	                    var appStore = Object.assign({}, appStoreData);
	
	                    appStore.apps = appStore.apps.map(function (appData) {
	                        var app = Object.assign({}, appData);
	
	                        if (compatibleOnly) {
	                            app.versions = app.versions.filter(function (versionData) {
	                                return System.isVersionCompatible(_this2.version, versionData);
	                            });
	                        }
	
	                        return app;
	                    }).filter(function (appData) {
	                        return appData.versions.length > 0;
	                    });
	
	                    resolve(appStore);
	                })['catch'](function (err) {
	                    reject(err);
	                });
	            });
	        }
	
	        /**
	         * Install the specified app version from the DHIS 2 app store
	         *
	         * @param uid The uid of the app version to install
	         * @returns {Promise}
	         */
	    }, {
	        key: 'installAppVersion',
	        value: function installAppVersion(uid) {
	            var api = _apiApi2['default'].getApi();
	            return new Promise(function (resolve, reject) {
	                api.post(['appStore', uid].join('/'), '', { dataType: 'text' }).then(function () {
	                    resolve();
	                })['catch'](function (err) {
	                    reject(err);
	                });
	            });
	        }
	
	        /**
	         * Remove the specified app from the system
	         *
	         * @param appKey The key of the app to remove
	         * @returns {Promise}
	         */
	    }, {
	        key: 'uninstallApp',
	        value: function uninstallApp(appKey) {
	            var api = _apiApi2['default'].getApi();
	
	            return api['delete'](['apps', appKey].join('/'))
	            // TODO: Stop jQuery from rejecting successful promises
	            ['catch'](function () {
	                return undefined;
	            });
	        }
	
	        /**
	         * Refresh the list of apps that are installed on the server
	         *
	         * @returns {Promise} A promise that resolves to the updated list of installed apps
	         */
	    }, {
	        key: 'reloadApps',
	        value: function reloadApps() {
	            var _this3 = this;
	
	            var api = _apiApi2['default'].getApi();
	            return api.update('apps').then(function () {
	                return _this3.loadInstalledApps();
	            });
	        }
	
	        // TODO: Document
	        // TODO: Validate string
	        // TODO: Handle valid version objects too
	    }], [{
	        key: 'parseVersionString',
	        value: function parseVersionString(version) {
	            return {
	                major: Number.parseInt(version, 10),
	                minor: Number.parseInt(version.substring(version.indexOf('.') + 1), 10),
	                snapshot: version.indexOf('-SNAPSHOT') >= 0
	            };
	        }
	
	        // TODO: Document
	        // Disable eslint complexity warning
	        /* eslint-disable */
	    }, {
	        key: 'compareVersions',
	        value: function compareVersions(a, b) {
	            var from = typeof a === 'string' || a instanceof String ? System.parseVersionString(a) : a;
	            var to = typeof b === 'string' || b instanceof String ? System.parseVersionString(b) : b;
	
	            if (from.major !== to.major) {
	                return from.major - to.major;
	            } else if (from.minor !== to.minor) {
	                return from.minor - to.minor;
	            }
	
	            return (from.snapshot ? 0 : 1) - (to.snapshot ? 0 : 1);
	        }
	
	        /* eslint-enable */
	
	    }, {
	        key: 'isVersionCompatible',
	        value: function isVersionCompatible(systemVersion, appVersion) {
	            var isNewEnough = appVersion.min_platform_version ? System.compareVersions(systemVersion, appVersion.min_platform_version) >= 0 : true;
	            var isNotTooOld = appVersion.max_platform_version ? System.compareVersions(systemVersion, appVersion.max_platform_version) <= 0 : true;
	
	            return isNewEnough && isNotTooOld;
	        }
	
	        /**
	         * @method getSystem
	         * @static
	         *
	         * @returns {System} Object with the system interaction properties
	         *
	         * @description
	         * Get a new instance of the system object. This will function as a singleton, when a System object has been created
	         * when requesting getSystem again the original version will be returned.
	         */
	    }, {
	        key: 'getSystem',
	        value: function getSystem() {
	            if (!System.getSystem.system) {
	                System.getSystem.system = new System(new _SystemSettings2['default'](), new _SystemConfiguration2['default']());
	            }
	
	            return System.getSystem.system;
	        }
	    }]);
	
	    return System;
	})();
	
	exports['default'] = System;
	module.exports = exports['default'];

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module System
	 *
	 * @requires lib/check
	 * @requires api/Api
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	var _libCheck = __webpack_require__(3);
	
	var _apiApi = __webpack_require__(7);
	
	var _apiApi2 = _interopRequireDefault(_apiApi);
	
	/**
	 * @class SystemSettings
	 *
	 * @description
	 * Handles communication with the systemSettings endpoint. Can be used to get or save systemSettings.
	 */
	// TODO: Return the values from the local cache if we have not updated it? We could
	
	var SystemSettings = (function () {
	    function SystemSettings() {
	        var api = arguments.length <= 0 || arguments[0] === undefined ? _apiApi2['default'].getApi() : arguments[0];
	
	        _classCallCheck(this, SystemSettings);
	
	        this.api = api;
	    }
	
	    /**
	     * @method all
	     *
	     * @returns {Promise} Promise that resolves with the systemsettings object from the api.
	     *
	     * @description
	     * Loads all the system settings in the system and returns them as an object from the promise.
	     * ```js
	     * d2.system.settings.all()
	     *  .then(systemSettings => {
	     *    console.log('Analytics was last updated on: ' + systemSettings.keyLastSuccessfulResourceTablesUpdate);
	     *  });
	     * ```
	     */
	
	    _createClass(SystemSettings, [{
	        key: 'all',
	        value: function all() {
	            return this.api.get('systemSettings');
	        }
	
	        /**
	         * @method get
	         *
	         * @param {String} systemSettingsKey The identifier of the system setting that should be retrieved.
	         * @returns {Promise} A promise that resolves with the value or will fail if the value is not available.
	         *
	         * @description
	         * ```js
	         * d2.system.settings.get('keyLastSuccessfulResourceTablesUpdate')
	         *  .then(systemSettingsValue => {
	         *    console.log('Analytics was last updated on: ' + systemSettingsValue);
	         *  });
	         * ```
	         */
	    }, {
	        key: 'get',
	        value: function get(systemSettingsKey) {
	            var _this = this;
	
	            function processValue(value) {
	                // Attempt to parse the response as JSON. If this fails we return the value as is.
	                try {
	                    return JSON.parse(value);
	                } catch (e) {
	                    return value;
	                }
	            }
	
	            return new Promise(function (resolve, reject) {
	                if (!(0, _libCheck.isString)(systemSettingsKey)) {
	                    throw new TypeError('A "key" parameter should be specified when calling get() on systemSettings');
	                }
	
	                _this.api.get(['systemSettings', systemSettingsKey].join('/'), undefined, { dataType: 'text' }).then(function (response) {
	                    var systemSettingValue = processValue(response);
	                    if (systemSettingValue) {
	                        resolve(processValue(response));
	                    }
	                    reject(new Error('The requested systemSetting has no value or does not exist.'));
	                });
	            });
	        }
	    }, {
	        key: 'set',
	        value: function set(systemSettingsKey, value) {
	            var settingUrl = ['systemSettings', systemSettingsKey].join('/');
	            if (value === null || ('' + value).length === 0) {
	                return this.api['delete'](settingUrl, { dataType: 'text' });
	            }
	            return this.api.post(settingUrl, value, { dataType: 'text', contentType: 'text/plain' });
	        }
	    }]);
	
	    return SystemSettings;
	})();
	
	exports['default'] = SystemSettings;
	module.exports = exports['default'];

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module System
	 *
	 * @requires lib/check
	 * @requires api/Api
	 */
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	var _apiApi = __webpack_require__(7);
	
	var _apiApi2 = _interopRequireDefault(_apiApi);
	
	/**
	 * Handles communication with the configuration endpoint. Can be used to get or set configuration options.
	 */
	
	var SystemConfiguration = (function () {
	    function SystemConfiguration() {
	        var api = arguments.length <= 0 || arguments[0] === undefined ? _apiApi2['default'].getApi() : arguments[0];
	
	        _classCallCheck(this, SystemConfiguration);
	
	        this.api = api;
	
	        this._configuration = undefined;
	        this._configPromise = null;
	    }
	
	    /**
	     * Fetches all system configuration settings from the API and caches them so that future
	     * calls to this function won't call the API again.
	     *
	     * @param {boolean=false} ignoreCache If set to true, calls the API regardless of cache status
	     * @returns {Promise} Promise that resolves with all the individual configuration options from the api.
	     */
	
	    _createClass(SystemConfiguration, [{
	        key: 'all',
	        value: function all(ignoreCache) {
	            var _this = this;
	
	            if (this._configPromise === null || ignoreCache === true) {
	                this._configPromise = this.api.get('configuration').then(function (configuration) {
	                    _this._configuration = configuration;
	                    return _this._configuration;
	                });
	            }
	
	            return this._configPromise;
	        }
	
	        /**
	         * Returns the value of the specified configuration option.
	         *
	         * This is a convenience method that works exactly the same as calling `configuration.all()[name]`.
	         *
	         * @param key {String}
	         * @param {boolean=false} ignoreCache If set to true, calls the API regardless of cache status
	         * @returns {Promise}
	         */
	    }, {
	        key: 'get',
	        value: function get(key, ignoreCache) {
	            return this.all(ignoreCache).then(function (config) {
	                if (config.hasOwnProperty(key)) {
	                    return Promise.resolve(config[key]);
	                }
	
	                return Promise.reject('Unknown config option: ' + key);
	            });
	        }
	
	        /**
	         * Send a query to the API to change the value of a configuration key to the specified value.
	         *
	         * @param key {String}
	         * @param value {String|null}
	         * @returns {Promise}
	         */
	    }, {
	        key: 'set',
	        value: function set(key, value) {
	            var that = this;
	            var req = undefined;
	
	            if (key === 'systemId') {
	                return Promise.reject('The system ID can\'t be changed');
	            } else if ((key === 'feedbackRecipients' || key === 'selfRegistrationOrgUnit' || key === 'selfRegistrationRole') && (value === 'null' || value === null)) {
	                // Only valid UIDs are accepted when POST'ing, so we have to use DELETE in stead of POST'ing a null value.
	                req = this.api['delete'](['configuration', key].join('/'), { dataType: 'text' });
	            } else if (key === 'corsWhitelist') {
	                // The corsWhitelist endpoint expects an array of URL's, while here value is expected to be a string.
	                req = this.api.post(['configuration', key].join('/'), value.trim().split('\n'), { dataType: 'text' });
	            } else {
	                req = this.api.post(['configuration', key].join('/'), value, {
	                    dataType: 'text',
	                    contentType: 'text/plain'
	                });
	            }
	
	            return req.then(function () {
	                // Ideally we'd update the cache here, but doing so requires another trip to the server
	                // For now, just bust the cache to ensure it's not incorrect
	                that._configuration = undefined;
	                return Promise.resolve();
	            })['catch'](function () {
	                return Promise.reject('No configuration found for ' + key);
	            });
	        }
	    }]);
	
	    return SystemConfiguration;
	})();
	
	exports['default'] = SystemConfiguration;
	module.exports = exports['default'];

/***/ },
/* 12 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	exports.getJSONForProperties = getJSONForProperties;
	exports.getOwnedPropertyJSON = getOwnedPropertyJSON;
	function isPlainValue(collection) {
	    return function isPlainValueInCollection(property) {
	        return collection.indexOf(property) === -1;
	    };
	}
	
	function isCollectionProperty(collection) {
	    return function (property) {
	        return !isPlainValue(collection)(property);
	    };
	}
	
	function getJSONForProperties(model, properties) {
	    var objectToSave = {};
	    var collectionProperties = model.getCollectionChildrenPropertyNames()
	    // Even though attributeValues are considered collections, they are handled separately due to their
	    // difference in structure.
	    .filter(function (propertyName) {
	        return propertyName !== 'attributeValues';
	    });
	
	    var propertyNames = Object.keys(model.modelDefinition.modelValidations).filter(function (propertyName) {
	        return properties.indexOf(propertyName) >= 0;
	    }).filter(function (propertyName) {
	        return model.dataValues[propertyName] !== undefined && model.dataValues[propertyName] !== null;
	    });
	
	    // Handle plain values
	    propertyNames.filter(isPlainValue(collectionProperties)).forEach(function (propertyName) {
	        objectToSave[propertyName] = model.dataValues[propertyName];
	    });
	
	    // Handle Collection properties
	    propertyNames.filter(isCollectionProperty(collectionProperties)).forEach(function (propertyName) {
	        // compulsoryDataElementOperands and greyedFields are not arrays of models.
	        // TODO: This is not the proper way to do this. We should check if the array contains Models
	        if (propertyName === 'compulsoryDataElementOperands' || propertyName === 'greyedFields') {
	            objectToSave[propertyName] = Array.from(model.dataValues[propertyName]);
	            return;
	        }
	
	        // Transform an object collection to an array of objects with id properties
	        objectToSave[propertyName] = Array.from(model.dataValues[propertyName].values()).filter(function (value) {
	            return value.id;
	        }).map(function (childModel) {
	            // Legends can be saved as part of the LegendSet object.
	            // To make this work properly we will return all of the properties for the items in the collection
	            // instead of just the `id` fields
	            if (model.modelDefinition && model.modelDefinition.name === 'legendSet') {
	                return getOwnedPropertyJSON.call(childModel.modelDefinition, childModel); // eslint-disable-line no-use-before-define
	            }
	
	            // For any other types we return an object with just an id
	            return { id: childModel.id };
	        });
	    });
	
	    return objectToSave;
	}
	
	function getOwnedPropertyJSON(model) {
	    var ownedProperties = model.modelDefinition.getOwnedPropertyNames();
	
	    return getJSONForProperties(model, ownedProperties);
	}

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module Model
	 *
	 * @requires lib/check
	 * @requires model/ModelBase
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	var _libCheck = __webpack_require__(3);
	
	var _ModelBase = __webpack_require__(5);
	
	var _ModelBase2 = _interopRequireDefault(_ModelBase);
	
	// TODO: Perhaps we can generate model classes dynamically based on the schemas and inherit from this.
	/**
	 * @class Model
	 * @extends ModelBase
	 *
	 * @description
	 * A Model represents an object from the DHIS2 Api. A model is created based of a ModelDefinition. The ModelDefinition
	 * has the properties that the model should have.
	 */
	
	var Model = (function () {
	
	    /**
	     * @constructor
	     *
	     * @param {ModelDefinition} modelDefinition The model definition that corresponds with the model.
	     * This is essential defining what type the model is representing.
	     *
	     * @description
	     * Will create a new model instanced based on the model definition. When creating a new instance the model
	     * definition needs to have both the modelValidations and modelProperties.
	     *
	     * The model properties will depend on the ModelDefinition. A model definition is based on a DHIS2 Schema.
	     */
	
	    function Model(modelDefinition) {
	        var _this = this;
	
	        _classCallCheck(this, Model);
	
	        (0, _libCheck.checkType)(modelDefinition, 'object', 'modelDefinition');
	        (0, _libCheck.checkType)(modelDefinition.modelProperties, 'object', 'modelProperties');
	
	        /**
	         * @property {ModelDefinition} modelDefinition Stores reference to the modelDefinition that was used when
	         * creating the model. This property is not enumerable or writable and will therefore not show up when looping
	         * over the object properties.
	         */
	        Object.defineProperty(this, 'modelDefinition', {
	            enumerable: false,
	            configurable: false,
	            writable: false,
	            value: modelDefinition
	        });
	
	        /**
	         * @property {Boolean} dirty Represents the state of the model. When the model is concidered `dirty`
	         * there are pending changes.
	         * This property is not enumerable or writable and will therefore not show up when looping
	         * over the object properties.
	         */
	        Object.defineProperty(this, 'dirty', {
	            enumerable: false,
	            configurable: false,
	            writable: true,
	            value: false
	        });
	
	        /**
	         * @property {Object} dataValues Values object used to store the actual model values. Normally access to the
	         * Model data will be done through accessor properties that are generated from the modelDefinition.
	         *
	         * @note {warning} This should not be accessed directly.
	         */
	        Object.defineProperty(this, 'dataValues', {
	            enumerable: false,
	            configurable: true,
	            writable: true,
	            value: {}
	        });
	
	        var hasKeys = function hasKeys(object) {
	            return object && !!Object.keys(object).length;
	        };
	        var attributes = {};
	        var attributeProperties = modelDefinition.attributeProperties;
	        if (hasKeys(attributeProperties)) {
	            Object.defineProperty(this, 'attributes', {
	                enumerable: false,
	                value: attributes
	            });
	
	            Object.keys(attributeProperties).forEach(function (attributeName) {
	                Object.defineProperty(attributes, attributeName, {
	                    enumerable: true,
	                    get: function get() {
	                        if (!Array.isArray(_this.attributeValues)) {
	                            return undefined;
	                        }
	
	                        return _this.attributeValues.filter(function (value) {
	                            return value.attribute.name === attributeName;
	                        }).reduce(function (current, value) {
	                            return value.value;
	                        }, undefined);
	                    },
	                    set: function set(value) {
	                        if (!_this.attributeValues) {
	                            _this.attributeValues = [];
	                        }
	
	                        var attributeValue = _this.attributeValues.filter(function (av) {
	                            return av.attribute.name === attributeName;
	                        }).reduce(function (current, av) {
	                            return av;
	                        }, undefined);
	
	                        if (attributeValue) {
	                            // Don't do anything if the value stayed the same
	                            if (attributeValue.value === value) {
	                                return;
	                            }
	
	                            attributeValue.value = value;
	                        } else {
	                            // Add the new attribute value to the attributeValues collection
	                            _this.attributeValues.push({
	                                value: value,
	                                attribute: {
	                                    id: attributeProperties[attributeName].id,
	                                    name: attributeProperties[attributeName].name
	                                }
	                            });
	                        }
	
	                        // Set the model to be dirty
	                        _this.dirty = true;
	                    }
	                });
	            });
	        }
	
	        Object.defineProperties(this, modelDefinition.modelProperties);
	
	        this[_ModelBase.DIRTY_PROPERTY_LIST] = new Set([]);
	    }
	
	    /**
	     * @method create
	     * @static
	     *
	     * @param {ModelDefinition} modelDefinition ModelDefinition from which the model should be created
	     * @returns {Model} Returns an instance of the model.
	     *
	     * @description The static method is a factory method to create Model objects. It calls `new Model()` with the passed `ModelDefinition`.
	     *
	     * ```js
	     * let myModel = Model.create(modelDefinition);
	     * ```
	     */
	
	    _createClass(Model, null, [{
	        key: 'create',
	        value: function create(modelDefinition) {
	            return new Model(modelDefinition);
	        }
	    }]);
	
	    return Model;
	})();
	
	Model.prototype = _ModelBase2['default'];
	
	exports['default'] = Model;
	module.exports = exports['default'];

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _get = function get(_x6, _x7, _x8) { var _again = true; _function: while (_again) { var object = _x6, property = _x7, receiver = _x8; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x6 = parent; _x7 = property; _x8 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	var _libCheck = __webpack_require__(3);
	
	var _libUtils = __webpack_require__(1);
	
	var _ModelDefinitions = __webpack_require__(15);
	
	var _ModelDefinitions2 = _interopRequireDefault(_ModelDefinitions);
	
	var _Model = __webpack_require__(13);
	
	var _Model2 = _interopRequireDefault(_Model);
	
	var _ModelCollection = __webpack_require__(16);
	
	var _ModelCollection2 = _interopRequireDefault(_ModelCollection);
	
	var _ModelCollectionProperty = __webpack_require__(18);
	
	var _ModelCollectionProperty2 = _interopRequireDefault(_ModelCollectionProperty);
	
	var _libSchemaTypes = __webpack_require__(19);
	
	var _libSchemaTypes2 = _interopRequireDefault(_libSchemaTypes);
	
	var _Filters = __webpack_require__(20);
	
	var _Filters2 = _interopRequireDefault(_Filters);
	
	var _ModelBase = __webpack_require__(5);
	
	var _config = __webpack_require__(22);
	
	var _helpersJson = __webpack_require__(12);
	
	function createModelPropertyDescriptor(propertiesObject, schemaProperty) {
	    var propertyName = schemaProperty.collection ? schemaProperty.collectionName : schemaProperty.name;
	    var propertyDetails = {
	        // Actual property descriptor properties
	        configurable: false,
	        enumerable: true,
	        get: function get() {
	            return this.dataValues[propertyName];
	        }
	    };
	
	    // Only add a setter for writable properties
	    if (schemaProperty.writable) {
	        propertyDetails.set = function dynamicPropertySetter(value) {
	            // TODO: Objects and Arrays are considered unequal when their data is the same and therefore trigger a dirty
	            if (!(0, _libCheck.isObject)(value) && value !== this.dataValues[propertyName] || (0, _libCheck.isObject)(value)) {
	                this.dirty = true;
	                this[_ModelBase.DIRTY_PROPERTY_LIST].add(propertyName);
	                this.dataValues[propertyName] = value;
	            }
	        };
	    }
	
	    if (propertyName) {
	        propertiesObject[propertyName] = propertyDetails; // eslint-disable-line no-param-reassign
	    }
	}
	
	function createPropertiesObject(schemaProperties) {
	    var propertiesObject = {};
	    var createModelPropertyDescriptorOn = (0, _libUtils.curry)(createModelPropertyDescriptor, propertiesObject);
	
	    (schemaProperties || []).forEach(createModelPropertyDescriptorOn);
	
	    return propertiesObject;
	}
	
	function createValidationSetting(validationObject, schemaProperty) {
	    var propertyName = schemaProperty.collection ? schemaProperty.collectionName : schemaProperty.name;
	    var validationDetails = {
	        persisted: schemaProperty.persisted,
	        type: _libSchemaTypes2['default'].typeLookup(schemaProperty.propertyType),
	        required: schemaProperty.required,
	        min: schemaProperty.min,
	        max: schemaProperty.max,
	        owner: schemaProperty.owner,
	        unique: schemaProperty.unique,
	        writable: schemaProperty.writable,
	        constants: schemaProperty.constants,
	        ordered: Boolean(schemaProperty.ordered)
	    };
	
	    function getReferenceTypeFrom(property) {
	        if (property.href) {
	            return property.href.split('/').pop();
	        }
	
	        return undefined;
	    }
	
	    // Add a referenceType to be able to get a hold of the reference objects model.
	    if (validationDetails.type === 'REFERENCE' || validationDetails.type === 'COLLECTION' && schemaProperty.itemPropertyType === 'REFERENCE') {
	        validationDetails.referenceType = getReferenceTypeFrom(schemaProperty);
	    }
	
	    if (propertyName) {
	        validationObject[propertyName] = validationDetails; // eslint-disable-line no-param-reassign
	    }
	}
	
	function createValidations(schemaProperties) {
	    var validationsObject = {};
	    var createModelPropertyOn = (0, _libUtils.curry)(createValidationSetting, validationsObject);
	
	    (schemaProperties || []).forEach(createModelPropertyOn);
	
	    return validationsObject;
	}
	
	function shouldBeModelCollectionProperty(model, models) {
	    return function shouldBeModelCollectionPropertyIterator(modelProperty) {
	        return model && models && model.modelDefinition && model.modelDefinition.modelValidations && model.modelDefinition.modelValidations[modelProperty] && model.modelDefinition.modelValidations[modelProperty].type === 'COLLECTION' && models.hasOwnProperty(model.modelDefinition.modelValidations[modelProperty].referenceType);
	    };
	}
	
	function isAnUpdate(modelToCheck) {
	    return Boolean(modelToCheck.id);
	}
	
	/**
	 * @class ModelDefinition
	 *
	 * @description
	 * Definition of a Model. Basically this object contains the meta data related to the Model. Like `name`, `apiEndPoint`, `modelValidation`, etc.
	 * It also has methods to create and load Models that are based on this definition. The Data element `ModelDefinition` would be used to create Data Element `Model`s
	 *
	 * Note: ModelDefinition has a property `api` that is used for the communication with the dhis2 api. The value of this
	 * property is an instance of `Api`.
	 */
	
	var ModelDefinition = (function () {
	    function ModelDefinition(modelName, modelNamePlural, modelOptions, properties, validations, attributes, authorities) {
	        _classCallCheck(this, ModelDefinition);
	
	        (0, _libCheck.checkType)(modelName, 'string');
	        (0, _libCheck.checkType)(modelNamePlural, 'string', 'Plural');
	
	        (0, _libUtils.addLockedProperty)(this, 'name', modelName);
	        (0, _libUtils.addLockedProperty)(this, 'plural', modelNamePlural);
	        (0, _libUtils.addLockedProperty)(this, 'isShareable', modelOptions && modelOptions.shareable || false);
	        (0, _libUtils.addLockedProperty)(this, 'isMetaData', modelOptions && modelOptions.metadata || false);
	        (0, _libUtils.addLockedProperty)(this, 'apiEndpoint', modelOptions && modelOptions.apiEndpoint);
	        (0, _libUtils.addLockedProperty)(this, 'javaClass', modelOptions && modelOptions.klass);
	        (0, _libUtils.addLockedProperty)(this, 'identifiableObject', modelOptions && modelOptions.identifiableObject);
	        (0, _libUtils.addLockedProperty)(this, 'modelProperties', properties);
	        (0, _libUtils.addLockedProperty)(this, 'modelValidations', validations);
	        (0, _libUtils.addLockedProperty)(this, 'attributeProperties', attributes);
	        (0, _libUtils.addLockedProperty)(this, 'authorities', authorities);
	
	        this.filters = _Filters2['default'].getFilters(this);
	    }
	
	    _createClass(ModelDefinition, [{
	        key: 'filter',
	        value: function filter() {
	            return this.clone().filters;
	        }
	
	        /**
	         * @method create
	         *
	         * @param {Object} [data] Datavalues that should be loaded into the model.
	         *
	         * @returns {Model} Returns the newly created model instance.
	         *
	         * @description
	         * Creates a fresh Model instance based on the `ModelDefinition`. If data is passed into the method that
	         * data will be loaded into the matching properties of the model.
	         *
	         * ```js
	         * dataElement.create({name: 'ANC', id: 'd2sf33s3ssf'});
	         * ```
	         */
	    }, {
	        key: 'create',
	        value: function create(data) {
	            var model = _Model2['default'].create(this);
	            var validations = model.modelDefinition.modelValidations;
	            var models = _ModelDefinitions2['default'].getModelDefinitions();
	            var dataValues = Object.assign({}, data);
	
	            if (data) {
	                // Set the data values onto the model directly
	                Object.keys(model).forEach(function (modelProperty) {
	                    var referenceType = validations[modelProperty].hasOwnProperty('referenceType') && validations[modelProperty].referenceType || models.hasOwnProperty(modelProperty) && modelProperty;
	
	                    // For collections of objects, create ModelCollectionProperties rather than plain arrays
	                    if (referenceType && models.hasOwnProperty(referenceType) && Array.isArray(data[modelProperty])) {
	                        // Object properties that are not themselves instances of models need special handling because
	                        // we can't turn them into ModelCollectionProperties
	                        // TODO: Proper generic handling of translations
	                        if (modelProperty === 'translations' || modelProperty === 'greyedFields') {
	                            dataValues[modelProperty] = data[modelProperty];
	                        } else {
	                            dataValues[modelProperty] = _ModelCollectionProperty2['default'].create(model, models[referenceType], data[modelProperty].map(function (d) {
	                                return models[referenceType].create(d);
	                            }));
	                        }
	                    }
	                    model.dataValues[modelProperty] = dataValues[modelProperty];
	                });
	            } else {
	                (function () {
	                    // Create empty ModelCollectionProperties for models without data.
	                    Object.keys(model).filter(shouldBeModelCollectionProperty(model, models)).forEach(function (modelProperty) {
	                        var referenceType = model.modelDefinition.modelValidations[modelProperty].referenceType;
	
	                        model.dataValues[modelProperty] = _ModelCollectionProperty2['default'].create(model, models[referenceType], []);
	                    });
	
	                    // When no initial values are provided we are dealing with a new Model. For some properties there are
	                    // implicit default values that should be set. DHIS2 has some default values for models that would implicitly
	                    // be set when omitting sending a value on POST, we'll set these properties to their default values so they
	                    // are reflected in read operations on the model and to make them more transparent.
	                    var defaultValues = (0, _config.getDefaultValuesForModelType)(model.modelDefinition.name);
	                    var checkForModelProperty = shouldBeModelCollectionProperty(model, models);
	
	                    Object.keys(model).filter(function (modelProperty) {
	                        return !checkForModelProperty(modelProperty);
	                    }).forEach(function (modelProperty) {
	                        model.dataValues[modelProperty] = defaultValues[modelProperty];
	                    });
	                })();
	            }
	
	            return model;
	        }
	    }, {
	        key: 'clone',
	        value: function clone() {
	            var ModelDefinitionPrototype = Object.getPrototypeOf(this);
	            var priorFilters = this.filters.filters;
	            var clonedDefinition = Object.create(ModelDefinitionPrototype);
	
	            clonedDefinition = (0, _libUtils.copyOwnProperties)(clonedDefinition, this);
	            clonedDefinition.filters = _Filters2['default'].getFilters(clonedDefinition);
	            clonedDefinition.filters.filters = priorFilters.map(function (filter) {
	                return filter;
	            });
	
	            return clonedDefinition;
	        }
	
	        /**
	         * @method get
	         *
	         * @param {String} identifier
	         * @param {Object} [queryParams={fields: ':all'}] Query parameters that should be passed to the GET query.
	         * @returns {Promise} Resolves with a `Model` instance or an error message.
	         *
	         * @description
	         * Get a `Model` instance from the api loaded with data that relates to `identifier`.
	         * This will do an API call and return a Promise that resolves with a `Model` or rejects with the api error message.
	         *
	         * ```js
	         * //Do a get request for the dataElement with given id (d2sf33s3ssf) and print it's name
	         * //when that request is complete and the model is loaded.
	         * dataElement.get('d2sf33s3ssf')
	         *   .then(model => console.log(model.name));
	         * ```
	         */
	    }, {
	        key: 'get',
	        value: function get(identifier) {
	            var _this = this;
	
	            var queryParams = arguments.length <= 1 || arguments[1] === undefined ? { fields: ':all,attributeValues[:all,attribute[id,name,displayName]]' } : arguments[1];
	
	            (0, _libCheck.checkDefined)(identifier, 'Identifier');
	
	            if (Array.isArray(identifier)) {
	                return this.list({ filter: ['id:in:[' + identifier.join(',') + ']'] });
	            }
	
	            // TODO: should throw error if API has not been defined
	            return this.api.get([this.apiEndpoint, identifier].join('/'), queryParams).then(function (data) {
	                return _this.create(data);
	            })['catch'](function (response) {
	                if (response.message) {
	                    return Promise.reject(response.message);
	                }
	
	                return Promise.reject(response);
	            });
	        }
	
	        /**
	         * @method list
	         *
	         * @param {Object} [queryParams={fields: ':all'}] Query parameters that should be passed to the GET query.
	         * @returns {Promise} ModelCollection collection of models objects of the `ModelDefinition` type.
	         *
	         * @description
	         * Loads a list of models.
	         *
	         * ```js
	         * // Loads a list of models and prints their name.
	         * dataElement.list()
	         *   .then(modelCollection => {
	         *     modelCollection.forEach(model => console.log(model.name));
	         *   });
	         * ```
	         */
	    }, {
	        key: 'list',
	        value: function list() {
	            var _this2 = this;
	
	            var queryParams = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
	
	            var definedFilters = this.filters.getFilters();
	            // FIXME: Looks like when specific filters are defined the model.filter() filters are not applied (they should probably be merged)
	            if (!(0, _libCheck.isDefined)(queryParams.filter) && definedFilters.length) {
	                queryParams.filter = definedFilters; // eslint-disable-line no-param-reassign
	            }
	
	            return this.api.get(this.apiEndpoint, Object.assign({ fields: ':all' }, queryParams)).then(function (responseData) {
	                return _ModelCollection2['default'].create(_this2, responseData[_this2.plural].map(function (data) {
	                    return _this2.create(data);
	                }), responseData.pager);
	            });
	        }
	
	        /**
	         * @method save
	         *
	         * @param {Model} model The model that should be saved to the server.
	         * @returns {Promise} A promise which resolves when the save was successful
	         * or rejects when it failed. The promise will resolve with the data that is
	         * returned from the server.
	         *
	         * @description
	         * This method is used by the `Model` instances to save the model when calling `model.save()`.
	         *
	         * @note {warning} This should generally not be called directly.
	         */
	        // TODO: check the return status of the save to see if it was actually successful and not ignored
	    }, {
	        key: 'save',
	        value: function save(model) {
	            if (isAnUpdate(model)) {
	                var jsonPayload = _helpersJson.getOwnedPropertyJSON.bind(this)(model);
	                var updateUrl = (0, _libUtils.updateAPIUrlWithBaseUrlVersionNumber)(model.dataValues.href, this.api.baseUrl);
	
	                // Save the existing model
	                return this.api.update(updateUrl, jsonPayload, true);
	            }
	
	            return this.saveNew(model);
	        }
	    }, {
	        key: 'saveNew',
	        value: function saveNew(model) {
	            var jsonPayload = _helpersJson.getOwnedPropertyJSON.bind(this)(model);
	
	            // Its a new object
	            return this.api.post(this.apiEndpoint, jsonPayload);
	        }
	
	        /**
	         * @method getOwnedPropertyNames
	         *
	         * @returns {String[]} Returns an array of property names.
	         *
	         * @description
	         * This method returns a list of property names that that are defined
	         * as "owner" properties on this schema. This means these properties are used
	         * when saving the model to the server.
	         *
	         * ```js
	         * dataElement.getOwnedPropertyNames()
	         * ```
	         */
	    }, {
	        key: 'getOwnedPropertyNames',
	        value: function getOwnedPropertyNames() {
	            var _this3 = this;
	
	            return Object.keys(this.modelValidations).filter(function (propertyName) {
	                return _this3.modelValidations[propertyName].owner;
	            });
	        }
	
	        /**
	         * @method delete
	         *
	         * @returns {Promise} Returns a promise to the deletion operation
	         *
	         * @description
	         * This method is used by the `Model` instances to delete the model when calling `model.delete()`.
	         *
	         * @note {warning} This should generally not be called directly.
	         */
	    }, {
	        key: 'delete',
	        value: function _delete(model) {
	            if (model.dataValues.href) {
	                return this.api['delete'](model.dataValues.href);
	            }
	            return this.api['delete']([model.modelDefinition.apiEndpoint, model.dataValues.id].join('/'));
	        }
	
	        /**
	         * @method createFromSchema
	         * @static
	         *
	         * @param {Object} schema A schema definition received from the web api (/api/schemas)
	         * @param {Object[]} attributes A list of attribute objects that describe custom attributes (/api/attributes)
	         *
	         * @returns {ModelDefinition} Frozen model definition object.
	         *
	         * @description
	         * This method creates a new `ModelDefinition` based on a JSON structure called
	         * a schema. A schema represents the structure of a domain model as it is
	         * required by DHIS. Since these schemas can not be altered on the server from
	         * the modelDefinition is frozen to prevent accidental changes to the definition.
	         *
	         * ```js
	         * ModelDefinition.createFromSchema(schemaDefinition, attributes);
	         * ```
	         *
	         * @note {info} An example of a schema definition can be found on
	         * https://apps.dhis2.org/demo/api/schemas/dataElement
	         */
	    }], [{
	        key: 'createFromSchema',
	        value: function createFromSchema(schema) {
	            var attributes = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];
	
	            var ModelDefinitionClass = undefined;
	            (0, _libCheck.checkType)(schema, Object, 'Schema');
	
	            if (typeof ModelDefinition.specialClasses[schema.name] === 'function') {
	                ModelDefinitionClass = ModelDefinition.specialClasses[schema.name];
	            } else {
	                ModelDefinitionClass = ModelDefinition;
	            }
	
	            return Object.freeze(new ModelDefinitionClass(schema.name, schema.plural, schema, Object.freeze(createPropertiesObject(schema.properties)), Object.freeze(createValidations(schema.properties)), attributes.reduce(function (current, attributeDefinition) {
	                current[attributeDefinition.name] = attributeDefinition; // eslint-disable-line no-param-reassign
	                return current;
	            }, {}), schema.authorities));
	        }
	    }]);
	
	    return ModelDefinition;
	})();
	
	var UserModelDefinition = (function (_ModelDefinition) {
	    _inherits(UserModelDefinition, _ModelDefinition);
	
	    function UserModelDefinition() {
	        _classCallCheck(this, UserModelDefinition);
	
	        _get(Object.getPrototypeOf(UserModelDefinition.prototype), 'constructor', this).apply(this, arguments);
	    }
	
	    _createClass(UserModelDefinition, [{
	        key: 'get',
	
	        // TODO: userCredentials should always be included, no matter what the query params, that is currently not the case
	        value: function get(identifier) {
	            var queryParams = arguments.length <= 1 || arguments[1] === undefined ? { fields: ':all,userCredentials[:owner]' } : arguments[1];
	
	            return _get(Object.getPrototypeOf(UserModelDefinition.prototype), 'get', this).call(this, identifier, queryParams);
	        }
	    }]);
	
	    return UserModelDefinition;
	})(ModelDefinition);
	
	var DataSetModelDefinition = (function (_ModelDefinition2) {
	    _inherits(DataSetModelDefinition, _ModelDefinition2);
	
	    function DataSetModelDefinition() {
	        _classCallCheck(this, DataSetModelDefinition);
	
	        _get(Object.getPrototypeOf(DataSetModelDefinition.prototype), 'constructor', this).apply(this, arguments);
	    }
	
	    _createClass(DataSetModelDefinition, [{
	        key: 'create',
	        value: function create() {
	            var data = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
	
	            var hasData = Boolean(Object.keys(data).length);
	
	            // Filter out the compulsoryDataElementOperands structure from the retrieved data
	            // This structure does not follow the convention of a typical reference. We can not create a proper
	            // ModelCollection for this collection.
	            var dataClone = Object.keys(data).filter(function (key) {
	                return key !== 'compulsoryDataElementOperands';
	            }).reduce(function (obj, key) {
	                obj[key] = data[key]; // eslint-disable-line no-param-reassign
	                return obj;
	            }, {});
	
	            // Create the model using the usual way of creating a model
	            // Only pass data when there is data in the object passed to the constructor. This will guarantee
	            // that the empty ModelCollections are created properly.
	            var model = _get(Object.getPrototypeOf(DataSetModelDefinition.prototype), 'create', this).call(this, hasData ? dataClone : undefined);
	
	            // Set the compulsoryDataElementOperands onto the dataValues so it will be included during the save operations
	            model.dataValues.compulsoryDataElementOperands = data.compulsoryDataElementOperands;
	
	            return model;
	        }
	    }]);
	
	    return DataSetModelDefinition;
	})(ModelDefinition);
	
	ModelDefinition.specialClasses = {
	    user: UserModelDefinition,
	    dataSet: DataSetModelDefinition
	};
	
	exports['default'] = ModelDefinition;
	module.exports = exports['default'];

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	var _libCheck = __webpack_require__(3);
	
	/**
	 * @class ModelDefinitions
	 *
	 * @description
	 * Contains all the `ModelDefinition`s that are available. The definitions are properties on the object.
	 * This would be used as a main entry point to do any interaction.
	 *
	 * After calling the initialise function `d2({baseUrl: 'dhis/api'})` this object is the `models` property
	 * that allows you to access
	 *
	 * ```js
	 * models.dataElement.getList();
	 * ```
	 */
	
	var ModelDefinitions = (function () {
	    function ModelDefinitions() {
	        _classCallCheck(this, ModelDefinitions);
	    }
	
	    // Model definitions singleton!
	
	    _createClass(ModelDefinitions, [{
	        key: 'add',
	
	        // TODO: Elaborate this documentation
	        /**
	         * @method add
	         * @param {ModelDefinition} modelDefinition Add a model definition to the definitions collection
	         *
	         * @description
	         * This will allow you to add your own custom ModelDefinitions.
	         *
	         * The Definition object should have the following properties
	         * `modelName, modelNamePlural, modelOptions, properties, validations`
	         *
	         * ```js
	         * models.add({name: 'MyDefinition', plural: 'MyDefinitions', endPointname: '/myDefinition'});
	         * ```
	         */
	        value: function add(modelDefinition) {
	            try {
	                (0, _libCheck.checkType)(modelDefinition.name, 'string');
	            } catch (e) {
	                throw new Error('Name should be set on the passed ModelDefinition to add one');
	            }
	
	            if (this[modelDefinition.name]) {
	                throw new Error(['Model', modelDefinition.name, 'already exists'].join(' '));
	            }
	            this[modelDefinition.name] = modelDefinition;
	
	            if ((0, _libCheck.isType)(modelDefinition.plural, 'string')) {
	                this[modelDefinition.plural] = modelDefinition;
	            }
	        }
	
	        /**
	         * @method mapThroughDefinitions
	         *
	         * @param {Function} transformer Transformer function that will be run for each `ModelDefinition`
	         * @returns {Array} Array with the `ModelDefinition` objects.
	         *
	         * @description
	         * Map through the modelDefinitions like you would with a simple `Array.map()`
	         *
	         * ```js
	         * models.mapThroughDefinitions(definition => console.log(definition.name);
	         * ```
	         *
	         * @note {info} When mapping through the definition list `transformer` is called with the just the definition
	         * Unlike other map functions, no index or the full object is being passed.
	         *
	         * @note {warn} The resulting array contains references to the actual objects. It does not work like immutable array functions.
	         *
	         */
	    }, {
	        key: 'mapThroughDefinitions',
	        value: function mapThroughDefinitions(transformer) {
	            var result = [];
	            var modelDefinition = undefined;
	
	            (0, _libCheck.checkType)(transformer, 'function', 'transformer');
	
	            for (modelDefinition in this) {
	                if (this.hasOwnProperty(modelDefinition) && !(this[modelDefinition].plural === modelDefinition)) {
	                    result.push(transformer(this[modelDefinition]));
	                }
	            }
	
	            return result;
	        }
	    }]);
	
	    return ModelDefinitions;
	})();
	
	function getModelDefinitions() {
	    if (getModelDefinitions.modelDefinitions) {
	        return getModelDefinitions.modelDefinitions;
	    }
	    return getModelDefinitions.modelDefinitions = new ModelDefinitions();
	}
	
	ModelDefinitions.getModelDefinitions = getModelDefinitions;
	
	exports['default'] = ModelDefinitions;
	module.exports = exports['default'];

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	var _libCheck = __webpack_require__(3);
	
	var _libUtils = __webpack_require__(1);
	
	var _Model = __webpack_require__(13);
	
	var _Model2 = _interopRequireDefault(_Model);
	
	var _ModelDefinition = __webpack_require__(14);
	
	var _ModelDefinition2 = _interopRequireDefault(_ModelDefinition);
	
	var _pagerPager = __webpack_require__(17);
	
	var _pagerPager2 = _interopRequireDefault(_pagerPager);
	
	function _throwIfContainsOtherThanModelObjects(values) {
	    if (values && values[Symbol.iterator]) {
	        var toCheck = [].concat(_toConsumableArray(values));
	        toCheck.forEach(function (value) {
	            if (!(value instanceof _Model2['default'])) {
	                (0, _libUtils.throwError)('Values of a ModelCollection must be instances of Model');
	            }
	        });
	    }
	}
	
	function _throwIfContainsModelWithoutUid(values) {
	    if (values && values[Symbol.iterator]) {
	        var toCheck = [].concat(_toConsumableArray(values));
	        toCheck.forEach(function (value) {
	            if (!(0, _libCheck.isValidUid)(value.id)) {
	                (0, _libUtils.throwError)('Can not add a Model without id to a ModelCollection');
	            }
	        });
	    }
	}
	
	/**
	 * @class ModelCollection
	 *
	 * @description
	 * Collection of `Model` objects that can be interacted upon. Can contain a pager object to easily navigate
	 * pages within the system.
	 */
	
	var ModelCollection = (function () {
	
	    /**
	     * @constructor
	     *
	     * @param {ModelDefinition} modelDefinition The `ModelDefinition` that this collection is for. This defines the type of models that
	     * are allowed to be added to the collection.
	     * @param {Model[]} values Initial values that should be added to the collection.
	     * @param {Object} pagerData Object with pager data. This object contains data that will be put into the `Pager` instance.
	     *
	     * @description
	     *
	     * Creates a new `ModelCollection` object based on the passed `modelDefinition`. Additionally values can be added by passing
	     * `Model` objects in the `values` parameter. The collection also exposes a pager object which can be used to navigate through
	     * the pages in the collection. For more information see the `Pager` class.
	     */
	
	    function ModelCollection(modelDefinition, values, pagerData) {
	        var _this = this;
	
	        _classCallCheck(this, ModelCollection);
	
	        (0, _libCheck.checkType)(modelDefinition, _ModelDefinition2['default']);
	        /**
	         * @property {ModelDefinition} modelDefinition The `ModelDefinition` that this collection is for. This defines the type of models that
	         * are allowed to be added to the collection.
	         */
	        this.modelDefinition = modelDefinition;
	
	        /**
	         * @property {Pager} pager Pager object that is created from the pagerData that was passed when the collection was constructed. If no pager data was present
	         * the pager will have default values.
	         */
	        this.pager = new _pagerPager2['default'](pagerData, modelDefinition);
	
	        // We can not extend the Map object right away in v8 contexts.
	        this.valuesContainerMap = new Map();
	        this[Symbol.iterator] = this.valuesContainerMap[Symbol.iterator].bind(this.valuesContainerMap);
	
	        _throwIfContainsOtherThanModelObjects(values);
	        _throwIfContainsModelWithoutUid(values);
	
	        // Add the values separately as not all Iterators return the same values
	        if ((0, _libCheck.isArray)(values)) {
	            values.forEach(function (value) {
	                return _this.valuesContainerMap.set(value.id, value);
	            });
	        }
	    }
	
	    /**
	     * @property {Number} size The number of Model objects that are in the collection.
	     *
	     * @description
	     * Contains the number of Model objects that are in this collection. If the collection is a collection with a pager. This
	     * does not take into account all the items in the database. Therefore when a pager is present on the collection
	     * the size will return the items on that page. To get the total number of items consult the pager.
	     */
	
	    _createClass(ModelCollection, [{
	        key: 'add',
	
	        /**
	         * @method add
	         *
	         * @param {Model} value Model instance to add to the collection.
	         * @returns {ModelCollection} Returns itself for chaining purposes.
	         *
	         * @throws {Error} When the passed value is not an instance of `Model`
	         * @throws {Error} Throws error when the passed value does not have a valid id.
	         *
	         * @description
	         * Adds a Model instance to the collection. The model is checked if it is a correct instance of `Model` and if it has
	         * a valid id. A valid id is a uid string of 11 alphanumeric characters.
	         */
	        value: function add(value) {
	            _throwIfContainsOtherThanModelObjects([value]);
	            _throwIfContainsModelWithoutUid([value]);
	
	            this.set(value.id, value);
	            return this;
	        }
	
	        /**
	         * @method toArray
	         *
	         * @returns {Array} Returns the values of the collection as an array.
	         *
	         * @description
	         * If working with the Map type object is inconvenient this method can be used to return the values
	         * of the collection as an Array object.
	         */
	    }, {
	        key: 'toArray',
	        value: function toArray() {
	            var resultArray = [];
	
	            this.forEach(function (model) {
	                resultArray.push(model);
	            });
	
	            return resultArray;
	        }
	    }, {
	        key: 'clear',
	
	        /**
	         * @method clear
	         *
	         * @returns {this} Returns itself for chaining purposes;
	         *
	         * @description
	         * Clear the collection and remove all it's values.
	         */
	        // TODO: Reset the pager?
	        value: function clear() {
	            return this.valuesContainerMap.clear.apply(this.valuesContainerMap);
	        }
	    }, {
	        key: 'delete',
	        value: function _delete() {
	            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	                args[_key] = arguments[_key];
	            }
	
	            return this.valuesContainerMap['delete'].apply(this.valuesContainerMap, args);
	        }
	    }, {
	        key: 'entries',
	        value: function entries() {
	            return this.valuesContainerMap.entries.apply(this.valuesContainerMap);
	        }
	
	        // FIXME: This calls the forEach function with the values Map and not with the ModelCollection as the third argument
	    }, {
	        key: 'forEach',
	        value: function forEach() {
	            for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	                args[_key2] = arguments[_key2];
	            }
	
	            return this.valuesContainerMap.forEach.apply(this.valuesContainerMap, args);
	        }
	    }, {
	        key: 'get',
	        value: function get() {
	            for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
	                args[_key3] = arguments[_key3];
	            }
	
	            return this.valuesContainerMap.get.apply(this.valuesContainerMap, args);
	        }
	    }, {
	        key: 'has',
	        value: function has() {
	            for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
	                args[_key4] = arguments[_key4];
	            }
	
	            return this.valuesContainerMap.has.apply(this.valuesContainerMap, args);
	        }
	    }, {
	        key: 'keys',
	        value: function keys() {
	            return this.valuesContainerMap.keys.apply(this.valuesContainerMap);
	        }
	    }, {
	        key: 'set',
	        value: function set() {
	            for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
	                args[_key5] = arguments[_key5];
	            }
	
	            return this.valuesContainerMap.set.apply(this.valuesContainerMap, args);
	        }
	    }, {
	        key: 'values',
	        value: function values() {
	            return this.valuesContainerMap.values.apply(this.valuesContainerMap);
	        }
	    }, {
	        key: 'size',
	        get: function get() {
	            return this.valuesContainerMap.size;
	        }
	    }], [{
	        key: 'create',
	        value: function create(modelDefinition, values, pagerData) {
	            return new ModelCollection(modelDefinition, values, pagerData);
	        }
	    }, {
	        key: 'throwIfContainsOtherThanModelObjects',
	        value: function throwIfContainsOtherThanModelObjects(value) {
	            return _throwIfContainsOtherThanModelObjects(value);
	        }
	    }, {
	        key: 'throwIfContainsModelWithoutUid',
	        value: function throwIfContainsModelWithoutUid(value) {
	            return _throwIfContainsModelWithoutUid(value);
	        }
	    }]);
	
	    return ModelCollection;
	})();
	
	exports['default'] = ModelCollection;
	module.exports = exports['default'];

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	var _libCheck = __webpack_require__(3);
	
	/**
	 * @class Pager
	 *
	 * @description
	 * Pager object that can be used to navigate pages within a `Modelcollection`
	 */
	
	var Pager = (function () {
	
	  /**
	   * @constructor
	   *
	   * @param {Object} [pager={page: 1, pageCount: 1}] Paging information object.
	   * @param {Object} [pagingHandler={list: () => Promise.reject('No handler available')}] Paging handler object. The requirement for this object is that it has a list method.
	   *
	   * @description
	   * Returns a newly created pager object with methods to navigate pages.
	   */
	
	  function Pager() {
	    var pager = arguments.length <= 0 || arguments[0] === undefined ? { page: 1, pageCount: 1 } : arguments[0];
	    var pagingHandler = arguments.length <= 1 || arguments[1] === undefined ? { list: function list() {
	        return Promise.reject('No handler available');
	      } } : arguments[1];
	
	    _classCallCheck(this, Pager);
	
	    /**
	     * @property {number} page Current page number
	     */
	    this.page = pager.page;
	
	    /**
	     * @property {number} pageCount The total number of pages available
	     */
	    this.pageCount = pager.pageCount;
	
	    /**
	     * @property {number} total The total number of items available.
	     *
	     * @description
	     * This represents the total number of items available in the system. Note it is not the number of items
	     * on the current page.
	     */
	    this.total = pager.total;
	
	    /**
	     * @property {string} nextPage The url to the next page.
	     *
	     * @description
	     * If there is no next page then this will be undefined.
	     */
	    this.nextPage = pager.nextPage;
	
	    /**
	     * @property {string} prevPage The url to the previous page
	     *
	     * @description
	     * If there is no previous page then this will be undefined.
	     */
	    this.prevPage = pager.prevPage;
	
	    this.pagingHandler = pagingHandler;
	  }
	
	  /**
	   * @method hasNextPage
	   *
	   * @returns {Boolean} Result is true when there is a next page, false when there is not.
	   *
	   * @description
	   * Check whether there is a next page.
	   */
	
	  _createClass(Pager, [{
	    key: 'hasNextPage',
	    value: function hasNextPage() {
	      return (0, _libCheck.isDefined)(this.nextPage);
	    }
	
	    /**
	     * @method hasPreviousPage
	     *
	     * @returns {Boolean} Result is true when there is a previous page, false when there is not.
	     *
	     * @description
	     * Check whether there is a previous page.
	     */
	  }, {
	    key: 'hasPreviousPage',
	    value: function hasPreviousPage() {
	      return (0, _libCheck.isDefined)(this.prevPage);
	    }
	
	    /**
	     * @method getNextPage
	     *
	     * @returns {Promise} Promise that resolves with a new `ModelCollection` containing the next page's data. Or rejects with
	     * a string when there is no next page for this collection or when the request for the next page failed.
	     */
	  }, {
	    key: 'getNextPage',
	    value: function getNextPage() {
	      if (this.hasNextPage()) {
	        return this.goToPage(this.page + 1);
	      }
	      return Promise.reject('There is no next page for this collection');
	    }
	
	    /**
	     * @method getPreviousPage
	     *
	     * @returns {Promise} Promise that resolves with a new `ModelCollection` containing the previous page's data. Or rejects with
	     * a string when there is no previous page for this collection or when the request for the previous page failed.
	     */
	  }, {
	    key: 'getPreviousPage',
	    value: function getPreviousPage() {
	      if (this.hasPreviousPage()) {
	        return this.goToPage(this.page - 1);
	      }
	      return Promise.reject('There is no previous page for this collection');
	    }
	
	    /**
	     * @method goToPage
	     *
	     * @param {Number} pageNr The number of the page you wish to navigate to.
	     * @returns {Promise} Promise that resolves with a new `ModelCollection` containing the data for the requested page.
	     */
	    // TODO: Throwing the errors here is not really consistent with the rejection of promises for the getNextPage and getPreviousPage
	  }, {
	    key: 'goToPage',
	    value: function goToPage(pageNr) {
	      if (pageNr < 1) {
	        throw new Error('PageNr can not be less than 1');
	      }
	      if (pageNr > this.pageCount) {
	        throw new Error('PageNr can not be larger than the total page count of ' + this.pageCount);
	      }
	
	      return this.pagingHandler.list({ page: pageNr });
	    }
	  }]);
	
	  return Pager;
	})();
	
	exports['default'] = Pager;
	module.exports = exports['default'];

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var _ModelCollection2 = __webpack_require__(16);
	
	var _ModelCollection3 = _interopRequireDefault(_ModelCollection2);
	
	/**
	 * @class ModelCollectionProperty
	 *
	 * @description
	 * A ModelCollectionProperty instance is a ModelCollection that is a property of
	 * a model instance. ModelCollectionProperties can be operated on independently of
	 * the Model that owns them.
	 */
	
	var ModelCollectionProperty = (function (_ModelCollection) {
	    _inherits(ModelCollectionProperty, _ModelCollection);
	
	    /**
	     * @constructor
	     *
	     * @param {Model} parentModel The `Model` of the parent of this `ModelCollectionProperty`
	     * @param {ModelDefinition} modelDefinition The `ModelDefinition` that this `ModelCollection` property is for
	     * @param {Model[]} values Initial values that should be added to the collection property
	     *
	     * @description
	     *
	     * Creates a new `ModelCollectionProperty` object. This is a subclass of `ModelCollection`, which adds logic
	     * for handling adding and removing elements to the collection and saving the changes to the API.
	     */
	
	    function ModelCollectionProperty(parentModel, modelDefinition, values) {
	        _classCallCheck(this, ModelCollectionProperty);
	
	        _get(Object.getPrototypeOf(ModelCollectionProperty.prototype), 'constructor', this).call(this, modelDefinition, values, undefined);
	
	        // Dirty bit
	        this.dirty = false;
	        // Keep track of added and removed elements
	        this.added = new Set();
	        this.removed = new Set();
	
	        // Store the parent model of this collection so we can construct the URI for API calls
	        this.parentModel = parentModel;
	    }
	
	    /**
	     * @method add
	     *
	     * @param {Model} value Model instance to add to the collection.
	     * @returns {ModelCollectionProperty} Returns itself for chaining purposes.
	     *
	     * @description
	     * Calls the `add` method on the parent `ModelCollection` class, and then performs checks to keep track of
	     * what, if any, changes that have been made to the collection.
	     */
	
	    _createClass(ModelCollectionProperty, [{
	        key: 'add',
	        value: function add(value) {
	            // TODO: Allow adding plain ID's that aren't Model instances maybe?
	            if (this.valuesContainerMap.has(value.id)) {
	                return this;
	            }
	
	            _get(Object.getPrototypeOf(ModelCollectionProperty.prototype), 'add', this).call(this, value);
	
	            if (this.removed.has(value.id)) {
	                this.removed['delete'](value.id);
	            } else {
	                this.added.add(value.id);
	            }
	
	            this.updateDirty();
	            return this;
	        }
	
	        /**
	         * @method remove
	         *
	         * @param {Model} value Model instance to remove from the collection.
	         * @returns {ModelCollectionProperty} Returns itself for chaining purposes.
	         *
	         * @description
	         * If the collection contains an object with the same id as the `value` parameter, that object is removed
	         * from the collection. Checks are then performed to keep track of what, if any, changes that have been
	         * made to the collection.
	         */
	    }, {
	        key: 'remove',
	        value: function remove(value) {
	            // TODO: Allow removing plain ID's that aren't Model instances maybe?
	            _ModelCollection3['default'].throwIfContainsOtherThanModelObjects([value]);
	            _ModelCollection3['default'].throwIfContainsModelWithoutUid([value]);
	
	            if (this['delete'](value.id)) {
	                if (this.added.has(value.id)) {
	                    this.added['delete'](value.id);
	                } else {
	                    this.removed.add(value.id);
	                }
	            }
	
	            this.updateDirty();
	            return this;
	        }
	
	        /**
	         * @method updateDirty
	         *
	         * @returns {boolean} True if the collection has changed, false otherwise.
	         *
	         * @description
	         * Checks whether any changes have been made to the collection, and updates the dirty flag accordingly.
	         */
	    }, {
	        key: 'updateDirty',
	        value: function updateDirty() {
	            this.dirty = this.added.size > 0 || this.removed.size > 0;
	            return this.dirty;
	        }
	
	        /**
	         * @method resetDirtyState
	         *
	         * @description
	         * Sets dirty=false and resets the added and removed sets used for dirty state tracking.
	         */
	    }, {
	        key: 'resetDirtyState',
	        value: function resetDirtyState() {
	            this.dirty = false;
	            this.added = new Set();
	            this.removed = new Set();
	        }
	
	        /**
	         * @method save
	         *
	         * @returns {Promise} A `Promise`
	         *
	         * @description
	         * If any changes have been made to the collection, these changes will be submitted to the API. The returned
	         * promise will resolve successfully when the changes have been saved to the API, and will be rejected if
	         * either the changes weren't saved or if there were no changes to save.
	         */
	    }, {
	        key: 'save',
	        value: function save() {
	            var _this = this;
	
	            // TODO: Use Promise constructor and call resolve/reject as appropriate
	            if (!this.dirty) {
	                return Promise.reject('Nothing to save!');
	            }
	
	            var api = this.modelDefinition.api;
	
	            var queries = [];
	
	            if (this.added.size) {
	                Array.from(this.added).forEach(function (id) {
	                    queries.push(api.post([_this.parentModel.href, _this.modelDefinition.plural, id].join('/')));
	                });
	            }
	            if (this.removed.size) {
	                Array.from(this.removed).forEach(function (id) {
	                    queries.push(api['delete']([_this.parentModel.href, _this.modelDefinition.plural, id].join('/')));
	                });
	            }
	
	            return Promise.all(queries).then(function () {
	                _this.added = new Set();
	                _this.removed = new Set();
	                _this.updateDirty();
	                return Promise.resolve();
	            })['catch'](function (err) {
	                return Promise.reject('Failed to alter collection:', err);
	            });
	        }
	
	        /**
	         * @method create
	         *
	         * @param {Model} parentModel
	         * @param {ModelDefinition} modelDefinition
	         * @param {Model[]} values
	         * @returns {ModelCollectionProperty}
	         *
	         * @description
	         * See `ModelCollectionProperty.constructor`.
	         */
	    }], [{
	        key: 'create',
	        value: function create(parentModel, modelDefinition, values) {
	            return new ModelCollectionProperty(parentModel, modelDefinition, values);
	        }
	    }]);
	
	    return ModelCollectionProperty;
	})(_ModelCollection3['default']);
	
	exports['default'] = ModelCollectionProperty;
	module.exports = exports['default'];

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	var _utils = __webpack_require__(1);
	
	var _check = __webpack_require__(3);
	
	var SchemaTypes = (function () {
	    function SchemaTypes() {
	        _classCallCheck(this, SchemaTypes);
	    }
	
	    _createClass(SchemaTypes, [{
	        key: 'getTypes',
	        value: function getTypes() {
	            return ['TEXT', 'NUMBER', 'INTEGER', 'BOOLEAN', 'EMAIL', 'PASSWORD', 'URL', 'PHONENUMBER', 'GEOLOCATION', // TODO: Geo location could be an advanced type of 2 numbers / strings?
	            'COLOR', 'COMPLEX', 'COLLECTION', 'REFERENCE', 'DATE', 'COMPLEX', 'IDENTIFIER', 'CONSTANT'];
	        }
	    }, {
	        key: 'typeLookup',
	        value: function typeLookup(propertyType) {
	            if (this.getTypes().indexOf(propertyType) >= 0 && (0, _check.isString)(propertyType)) {
	                return propertyType;
	            }
	
	            return (0, _utils.throwError)(['Type from schema "', propertyType, '" not found available type list.'].join(''));
	        }
	    }]);
	
	    return SchemaTypes;
	})();
	
	exports['default'] = new SchemaTypes();
	module.exports = exports['default'];

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	var _libCheck = __webpack_require__(3);
	
	var _modelFilter = __webpack_require__(21);
	
	var _modelFilter2 = _interopRequireDefault(_modelFilter);
	
	var Filters = (function () {
	    function Filters(modelDefinition) {
	        _classCallCheck(this, Filters);
	
	        this.filters = [];
	        this.modelDefinition = modelDefinition;
	    }
	
	    _createClass(Filters, [{
	        key: 'on',
	        value: function on(propertyName) {
	            return _modelFilter2['default'].getFilter(this).on(propertyName);
	        }
	    }, {
	        key: 'add',
	        value: function add(filter) {
	            if (!(0, _libCheck.isType)(filter, _modelFilter2['default'])) {
	                throw new TypeError('filter should be an instance of Filter');
	            }
	            this.filters.push(filter);
	        }
	    }, {
	        key: 'list',
	        value: function list() {
	            return this.modelDefinition.list();
	        }
	    }, {
	        key: 'getFilters',
	        value: function getFilters() {
	            return this.filters.map(function (filter) {
	                return filter.getQueryParamFormat();
	            });
	        }
	    }, {
	        key: 'getReturn',
	        value: function getReturn() {
	            return this.modelDefinition;
	        }
	    }], [{
	        key: 'getFilters',
	        value: function getFilters(modelDefinition) {
	            return new Filters(modelDefinition);
	        }
	    }]);
	
	    return Filters;
	})();
	
	exports['default'] = Filters;
	module.exports = exports['default'];

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	var _libCheck = __webpack_require__(3);
	
	var FILTER_COMPARATORS = {
	    /**
	     * @method equals
	     * @returns {Filter} Returns the modified filter for chaining
	     *
	     * @description
	     * This method can be used to add a equals filter value
	     */
	    equals: 'eq',
	    /**
	     * @method like
	     * @returns {Filter} Returns the modified filter for chaining
	     *
	     * @description
	     * This method can be used to add a like filter value
	     */
	    like: 'like',
	    /**
	     * @method ilike
	     * @returns {Filter} Returns the modified filter for chaining
	     *
	     * @description
	     * This method can be used to add a ilike filter value
	     */
	    ilike: 'ilike',
	    notEqual: 'ne'
	};
	
	/**
	 * @class Filter
	 * @description
	 * Filter class that can be used to build api endpoint filters using a semi-natural language style.
	 */
	
	var Filter = (function () {
	    /**
	     * @constructor
	     * @param {Filters} filters Filters list that this filter will be added to when it is completed.
	     */
	
	    function Filter(filters) {
	        _classCallCheck(this, Filter);
	
	        this.filters = filters;
	        this.propertyName = 'name';
	        this.comparator = 'like';
	        this.filterValue = undefined;
	    }
	
	    // Add the filters to the Filter prototype
	    // TODO: Change to for..of. Currently would break e2e tests because of polyfill
	
	    /**
	     * @method on
	     * @param {String} propertyName Property name that the filter should be applied on.
	     * @returns {Filter}
	     */
	
	    _createClass(Filter, [{
	        key: 'on',
	        value: function on(propertyName) {
	            (0, _libCheck.checkDefined)(propertyName, 'Property name to filter on');
	
	            this.propertyName = propertyName;
	            return this;
	        }
	    }, {
	        key: 'getQueryParamFormat',
	        value: function getQueryParamFormat() {
	            return [this.propertyName, this.comparator, this.filterValue].join(':');
	        }
	
	        /**
	         * @method getFilter
	         * @static
	         *
	         * @param {Filters} filters Filters list that this filter will be added to when it is completed.
	         *
	         * @returns A instance of the Filter class that can be used to create
	         * filters.
	         *
	         * @description
	         * Create a filter instance
	         */
	    }], [{
	        key: 'getFilter',
	        value: function getFilter(filters) {
	            return new Filter(filters);
	        }
	    }]);
	
	    return Filter;
	})();
	
	Object.keys(FILTER_COMPARATORS).forEach(function (filter) {
	    Object.defineProperty(Filter.prototype, filter, {
	        value: function filterGetter(filterValue) {
	            (0, _libCheck.checkDefined)(filterValue, 'filterValue');
	
	            this.comparator = FILTER_COMPARATORS[filter];
	            this.filterValue = filterValue;
	
	            this.filters.add(this);
	
	            return this.filters.getReturn();
	        }
	    });
	});
	
	exports['default'] = Filter;
	module.exports = exports['default'];

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	exports.getDefaultValuesForModelType = getDefaultValuesForModelType;
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	var _modelDefaultsOrganisationUnitGroupSet = __webpack_require__(23);
	
	var _modelDefaultsOrganisationUnitGroupSet2 = _interopRequireDefault(_modelDefaultsOrganisationUnitGroupSet);
	
	var _modelDefaultsCategory = __webpack_require__(24);
	
	var _modelDefaultsCategory2 = _interopRequireDefault(_modelDefaultsCategory);
	
	var _modelDefaultsCategoryOptionGroupSet = __webpack_require__(25);
	
	var _modelDefaultsCategoryOptionGroupSet2 = _interopRequireDefault(_modelDefaultsCategoryOptionGroupSet);
	
	var _modelDefaultsDataElement = __webpack_require__(26);
	
	var _modelDefaultsDataElement2 = _interopRequireDefault(_modelDefaultsDataElement);
	
	var _modelDefaultsDataElementGroupSet = __webpack_require__(27);
	
	var _modelDefaultsDataElementGroupSet2 = _interopRequireDefault(_modelDefaultsDataElementGroupSet);
	
	var _modelDefaultsDataSet = __webpack_require__(28);
	
	var _modelDefaultsDataSet2 = _interopRequireDefault(_modelDefaultsDataSet);
	
	var defaultValues = new Map([['organisationUnitGroupSet', _modelDefaultsOrganisationUnitGroupSet2['default']], ['category', _modelDefaultsCategory2['default']], ['categoryOptionGroupSet', _modelDefaultsCategoryOptionGroupSet2['default']], ['dataElement', _modelDefaultsDataElement2['default']], ['dataElementGroupSet', _modelDefaultsDataElementGroupSet2['default']], ['dataSet', _modelDefaultsDataSet2['default']]]);
	
	exports.defaultValues = defaultValues;
	
	function getDefaultValuesForModelType(modelDefinitionName) {
	    if (defaultValues.has(modelDefinitionName)) {
	        return defaultValues.get(modelDefinitionName);
	    }
	    return {};
	}

/***/ },
/* 23 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports["default"] = {
	    dataDimension: true
	};
	module.exports = exports["default"];

/***/ },
/* 24 */
23,
/* 25 */
23,
/* 26 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	exports['default'] = {
	    aggregationType: 'SUM',
	    valueType: 'NUMBER'
	};
	module.exports = exports['default'];

/***/ },
/* 27 */
23,
/* 28 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	exports['default'] = {
	    expiryDays: 0,
	    openFuturePeriods: 0,
	    timelyDays: 15,
	    periodType: 'Monthly'
	};
	module.exports = exports['default'];

/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	var _apiApi = __webpack_require__(7);
	
	var _apiApi2 = _interopRequireDefault(_apiApi);
	
	var I18n = (function () {
	    function I18n() {
	        var sources = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
	        var api = arguments.length <= 1 || arguments[1] === undefined ? _apiApi2['default'].getApi() : arguments[1];
	
	        _classCallCheck(this, I18n);
	
	        this.sources = sources;
	        this.api = api;
	        this.strings = new Set();
	        this.translations = undefined;
	    }
	
	    /**
	     * Adds a .properties file to the list of sources to load translations from
	     *
	     * Files are loaded in the order they're added, and the first translation of each string that's encountered will be
	     * used.
	     *
	     * @param {String} path
	     */
	
	    _createClass(I18n, [{
	        key: 'addSource',
	        value: function addSource(path) {
	            this.sources.push(path);
	        }
	
	        /**
	         * Adds one or more strings to the list of strings to translate
	         *
	         * @param {(String[]|String)} strings
	         */
	    }, {
	        key: 'addStrings',
	        value: function addStrings(strings) {
	            var _this = this;
	
	            if (typeof strings === 'string' && strings.trim().length > 0) {
	                this.strings.add(strings.trim());
	            } else {
	                Array.from(strings).filter(function (string) {
	                    return string && ('' + string).trim().length > 0;
	                }).forEach(function (string) {
	                    return _this.strings.add(string);
	                });
	            }
	        }
	
	        /**
	         * Load translations
	         *
	         * First, all properties files (specified with addSource) are loaded.
	         * Then, if any untranslated strings remain, these are POSTed to the i18n endpoint of the DHIS2 API.
	         *
	         * @returns {Promise}
	         */
	    }, {
	        key: 'load',
	        value: function load() {
	            var _this2 = this;
	
	            var i18n = this;
	            i18n.translations = {};
	
	            function parseProperties(text) {
	                return text.split('\n').reduce(function (props, line) {
	                    var _line$split$map = line.split('=').map(function (out) {
	                        return out.trim();
	                    });
	
	                    var _line$split$map2 = _slicedToArray(_line$split$map, 2);
	
	                    var key = _line$split$map2[0];
	                    var value = _line$split$map2[1];
	
	                    if (key !== undefined && value !== undefined && !props.hasOwnProperty(key)) {
	                        props[key] = value // eslint-disable-line no-param-reassign
	                        .replace(/\\u([0-9a-f]{4})/gi, function (match, grp) {
	                            return String.fromCharCode(parseInt(grp, 16));
	                        });
	                    }
	                    return props;
	                }, {});
	            }
	
	            var propFiles = [];
	
	            this.sources.forEach(function (source) {
	                propFiles.push(i18n.api.request('GET', source, undefined, { dataType: 'text' }).then(function (data) {
	                    return Promise.resolve(parseProperties(data));
	                },
	
	                // Resolve errors to an empty object, so that one missing file doesn't prevent
	                // the rest from being loaded
	                function () {
	                    return Promise.resolve({});
	                }));
	            });
	
	            return Promise.all(propFiles).then(function (propFile) {
	                propFile.forEach(function (props) {
	                    Object.keys(props).forEach(function (str) {
	                        if (!i18n.translations.hasOwnProperty(str)) {
	                            i18n.translations[str] = props[str];
	                        }
	                        _this2.strings['delete'](str);
	                    });
	                });
	
	                if (_this2.strings.size > 0) {
	                    return i18n.api.post('i18n', Array.from(i18n.strings)).then(function (res) {
	                        Object.keys(res).filter(function (str) {
	                            return str !== res[str];
	                        }).forEach(function (str) {
	                            i18n.translations[str] = res[str];
	                            i18n.strings['delete'](str);
	                        });
	
	                        return Promise.resolve(i18n.translations);
	                    });
	                }
	
	                return Promise.resolve(i18n.translations);
	            });
	        }
	
	        /**
	         * Gets the translated version of the specified string
	         *
	         * If no translation exists for the specified string, the string is returned as is with two asterisks on each side,
	         * in order to easily identify missing translations in the UI
	         *
	         * @param string
	         * @returns {String}
	         */
	    }, {
	        key: 'getTranslation',
	        value: function getTranslation(string) {
	            var variables = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
	
	            if (this.translations === undefined) {
	                throw new Error('Tried to translate before loading translations!');
	            }
	            var translatedString = this.translations.hasOwnProperty(string) ? this.translations[string] : '** ' + string + ' **';
	
	            if (Object.keys(variables).length) {
	                return translatedString.replace(/\$\$(.+?)\$\$/gi, function (match, partial) {
	                    return variables[partial] || '';
	                });
	            }
	
	            return translatedString;
	        }
	
	        /**
	         * Check if a translation exists for the specified string
	         *
	         * @param string
	         * @returns {boolean} True if a translation exists, false otherwise
	         */
	    }, {
	        key: 'isTranslated',
	        value: function isTranslated(string) {
	            if (this.translations === undefined) {
	                throw new Error('Tried to translate before loading translations!');
	            }
	            return this.translations.hasOwnProperty(string);
	        }
	
	        /**
	         * Get the list of strings that don't have translations
	         *
	         * If no translations have been loaded yet, `undefined` is returned in stead.
	         *
	         * @returns {Array|undefined} Array of untranslated strings, or undefined if translations haven't been loaded
	         */
	    }, {
	        key: 'getUntranslatedStrings',
	        value: function getUntranslatedStrings() {
	            return this.translations ? Array.from(this.strings) : undefined;
	        }
	
	        /**
	         * Return a new instance of this class
	         *
	         * @returns {I18n}
	         */
	    }], [{
	        key: 'getI18n',
	        value: function getI18n() {
	            return new I18n();
	        }
	    }]);
	
	    return I18n;
	})();
	
	exports['default'] = I18n;
	module.exports = exports['default'];

/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	var _defaultConfig = __webpack_require__(31);
	
	var _defaultConfig2 = _interopRequireDefault(_defaultConfig);
	
	var _libCheck = __webpack_require__(3);
	
	var DEFAULT_API_VERSION = 24;
	
	var Config = (function () {
	    function Config() {
	        _classCallCheck(this, Config);
	    }
	
	    _createClass(Config, null, [{
	        key: 'create',
	        value: function create() {
	            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	                args[_key] = arguments[_key];
	            }
	
	            var configObjects = args.filter(function (arg) {
	                return arg;
	            });
	
	            if (!configObjects.every(function (configObject) {
	                return (0, _libCheck.isType)(configObject, 'object');
	            })) {
	                throw new Error('Expected Config parameter to have type object');
	            }
	
	            return Object.assign.apply(Object, [{}, _defaultConfig2['default']].concat(args));
	        }
	    }, {
	        key: 'processConfigForD2',
	        value: function processConfigForD2(config, d2) {
	            var api = d2.Api.getApi();
	            d2.model.ModelDefinition.prototype.api = api; // eslint-disable-line no-param-reassign
	            d2.models = d2.model.ModelDefinitions.getModelDefinitions(); // eslint-disable-line no-param-reassign
	
	            if ((0, _libCheck.isString)(config.baseUrl)) {
	                api.setBaseUrl(config.baseUrl);
	            } else {
	                api.setBaseUrl('/api/' + DEFAULT_API_VERSION);
	            }
	
	            if (config.i18n && config.i18n.sources) {
	                Array.from(config.i18n.sources).forEach(function (source) {
	                    return d2.i18n.addSource(source);
	                });
	            }
	
	            if (config.i18n && config.i18n.strings) {
	                d2.i18n.addStrings(Array.from(config.i18n.strings));
	            }
	        }
	    }]);
	
	    return Config;
	})();
	
	exports['default'] = Config;
	module.exports = exports['default'];

/***/ },
/* 31 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	var noCreateAllowedFor = new Set(['categoryOptionCombo']);
	
	exports.noCreateAllowedFor = noCreateAllowedFor;
	exports['default'] = {
	    baseUrl: '/api',
	    i18n: {
	        sources: new Set(),
	        strings: new Set()
	    }
	};

/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	var _UserAuthorities = __webpack_require__(33);
	
	var _UserAuthorities2 = _interopRequireDefault(_UserAuthorities);
	
	var _UserSettings = __webpack_require__(34);
	
	var _UserSettings2 = _interopRequireDefault(_UserSettings);
	
	var _defaultConfig = __webpack_require__(31);
	
	var models = Symbol('models');
	var propertiesToIgnore = new Set(['userCredentials', 'userGroups', 'userRoles', 'organisationUnits', 'dataViewOrganisationUnits']);
	
	var authTypes = {
	    READ: ['READ'],
	    CREATE: ['CREATE', 'CREATE_PUBLIC', 'CREATE_PRIVATE'],
	    CREATE_PUBLIC: ['CREATE_PUBLIC'],
	    CREATE_PRIVATE: ['CREATE_PRIVATE'],
	    DELETE: ['DELETE'],
	    UPDATE: ['UPDATE'],
	    EXTERNALIZE: ['EXTERNALIZE']
	};
	
	var propertySymbols = Array.from(propertiesToIgnore).reduce(function (result, property) {
	    result[property] = Symbol(property); // eslint-disable-line no-param-reassign
	    return result;
	}, {});
	
	function getUserPropertiesToCopy(currentUserObject) {
	    var properties = undefined;
	    // The user credentials object is confusing so we set the properties straight onto the current user
	    if (currentUserObject.userCredentials) {
	        properties = Object.assign({}, currentUserObject.userCredentials, currentUserObject);
	    } else {
	        properties = Object.assign({}, currentUserObject);
	    }
	
	    return Object.keys(properties).reduce(function (result, property) {
	        if (propertiesToIgnore.has(property)) {
	            if (properties[property].map) {
	                result[propertySymbols[property]] = properties[property] // eslint-disable-line no-param-reassign
	                .map(function (value) {
	                    return value.id;
	                });
	            }
	        } else {
	            result[property] = properties[property]; // eslint-disable-line no-param-reassign
	        }
	        return result;
	    }, {});
	}
	
	function isInNoCreateAllowedForList(modelDefinition) {
	    return modelDefinition && _defaultConfig.noCreateAllowedFor.has(modelDefinition.name);
	}
	
	var CurrentUser = (function () {
	    function CurrentUser(userData, userAuthorities, modelDefinitions, settings) {
	        _classCallCheck(this, CurrentUser);
	
	        Object.assign(this, getUserPropertiesToCopy(userData));
	
	        this.authorities = userAuthorities;
	        this[models] = modelDefinitions;
	
	        /**
	         * @property {UserSettings} settings Contains a reference to a `UserSettings` instance that can be used
	         * to retrieve and save system settings.
	         *
	         * @description
	         * ```js
	         * d2.currentUser.userSettings.get('keyUiLocale')
	         *  .then(userSettingsValue => {
	         *    console.log('UI Locale: ' + userSettingsValue);
	         *  });
	         * ```
	         */
	        this.userSettings = settings;
	    }
	
	    _createClass(CurrentUser, [{
	        key: 'getUserGroups',
	        value: function getUserGroups() {
	            var userGroupIds = this[propertySymbols.userGroups];
	
	            return this[models].userGroup.get({ filter: ['id:in:[' + userGroupIds.join(',') + ']'] });
	        }
	    }, {
	        key: 'getUserRoles',
	        value: function getUserRoles() {
	            var userRoleIds = this[propertySymbols.userRoles];
	
	            return this[models].userRole.get({ filter: ['id:in:[' + userRoleIds.join(',') + ']'] });
	        }
	    }, {
	        key: 'getOrganisationUnits',
	        value: function getOrganisationUnits() {
	            var listOptions = arguments.length <= 0 || arguments[0] === undefined ? { fields: ':all,displayName,children[id,displayName,path,children::isNotEmpty]' } : arguments[0];
	
	            var organisationUnitsIds = this[propertySymbols.organisationUnits];
	
	            return this[models].organisationUnit.list(Object.assign({}, listOptions, { filter: ['id:in:[' + organisationUnitsIds.join(',') + ']'] }));
	        }
	    }, {
	        key: 'getDataViewOrganisationUnits',
	        value: function getDataViewOrganisationUnits() {
	            var listOptions = arguments.length <= 0 || arguments[0] === undefined ? { fields: ':all,displayName,children[id,displayName,path,children::isNotEmpty]' } : arguments[0];
	
	            var organisationUnitsIds = this[propertySymbols.dataViewOrganisationUnits];
	
	            return this[models].organisationUnit.list(Object.assign({}, listOptions, { filter: ['id:in:[' + organisationUnitsIds.join(',') + ']'] }));
	        }
	    }, {
	        key: 'checkAuthorityForType',
	        value: function checkAuthorityForType(authorityType, modelType) {
	            var _this = this;
	
	            if (!modelType || !Array.isArray(modelType.authorities)) {
	                return false;
	            }
	
	            return modelType.authorities
	            // Filter the correct authority to check for from the model
	            .filter(function (authority) {
	                return authorityType.some(function (authToHave) {
	                    return authToHave === authority.type;
	                });
	            })
	            // Check the left over schema authority types
	            .some(function (schemaAuthority) {
	                return schemaAuthority.authorities.some(function (authorityToCheckFor) {
	                    return _this.authorities.has(authorityToCheckFor);
	                });
	            } // Check if one of the schema authorities are available in the users authorities
	            );
	        }
	    }, {
	        key: 'checkCreateAuthorityForType',
	        value: function checkCreateAuthorityForType(authType, modelType) {
	            // When the modelType is mentioned in the the list of modelTypes that are not
	            // allowed to be created we return false
	            if (isInNoCreateAllowedForList(modelType)) {
	                return false;
	            }
	
	            // Otherwise we check using the normal procedure for checking authorities
	            return this.checkAuthorityForType(authType, modelType);
	        }
	    }, {
	        key: 'canCreate',
	        value: function canCreate(modelType) {
	            return this.checkCreateAuthorityForType(authTypes.CREATE, modelType);
	        }
	    }, {
	        key: 'canCreatePublic',
	        value: function canCreatePublic(modelType) {
	            return this.checkCreateAuthorityForType(authTypes.CREATE_PUBLIC, modelType);
	        }
	    }, {
	        key: 'canCreatePrivate',
	        value: function canCreatePrivate(modelType) {
	            return this.checkCreateAuthorityForType(authTypes.CREATE_PRIVATE, modelType);
	        }
	    }, {
	        key: 'canDelete',
	        value: function canDelete(modelType) {
	            return this.checkAuthorityForType(authTypes.DELETE, modelType);
	        }
	    }, {
	        key: 'canUpdate',
	        value: function canUpdate(modelType) {
	            if (this.checkAuthorityForType(authTypes.UPDATE, modelType)) {
	                return true;
	            }
	            return this.checkAuthorityForType(authTypes.CREATE, modelType);
	        }
	    }, {
	        key: 'uiLocale',
	        get: function get() {
	            if (this.userSettings && this.userSettings.keyUiLocale) {
	                return this.userSettings.keyUiLocale;
	            }
	            return 'en';
	        }
	    }], [{
	        key: 'create',
	        value: function create(userData, authorities, modelDefinitions, userSettings) {
	            return new CurrentUser(userData, _UserAuthorities2['default'].create(authorities), modelDefinitions, new _UserSettings2['default'](userSettings));
	        }
	    }]);
	
	    return CurrentUser;
	})();
	
	exports['default'] = CurrentUser;
	module.exports = exports['default'];

/***/ },
/* 33 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	var auths = Symbol();
	
	var UserAuthorities = (function () {
	    function UserAuthorities() {
	        var authorities = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
	
	        _classCallCheck(this, UserAuthorities);
	
	        this[auths] = new Set(authorities);
	    }
	
	    _createClass(UserAuthorities, [{
	        key: 'has',
	        value: function has(authority) {
	            if (this[auths].has('ALL')) {
	                return true;
	            }
	            return this[auths].has(authority);
	        }
	    }], [{
	        key: 'create',
	        value: function create(authorities) {
	            return new UserAuthorities(authorities);
	        }
	    }]);
	
	    return UserAuthorities;
	})();
	
	exports['default'] = UserAuthorities;
	module.exports = exports['default'];

/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	var _apiApi = __webpack_require__(7);
	
	var _apiApi2 = _interopRequireDefault(_apiApi);
	
	var _libCheck = __webpack_require__(3);
	
	/**
	 * @class UserSettings
	 *
	 * @description
	 * Handles communication with the userSettings endpoint. Can be used to get or save userSettings.
	 */
	
	var UserSettings = (function () {
	    function UserSettings(userSettings) {
	        var api = arguments.length <= 1 || arguments[1] === undefined ? _apiApi2['default'].getApi() : arguments[1];
	
	        _classCallCheck(this, UserSettings);
	
	        this.api = api;
	
	        if (userSettings) {
	            Object.assign(this, userSettings);
	        }
	    }
	
	    /**
	     * @method all
	     *
	     * @returns {Promise} Promise that resolves with the usersettings object from the api.
	     *
	     * @description
	     * Loads all the user settings of current user and returns them as an object from the promise.
	     * ```js
	     * d2.currentUser.userSettings.all()
	     *  .then(userSettings => {
	     *    console.log('UI Locale: ' + userSettings.keyUiLocale);
	     *  });
	     * ```
	     */
	
	    _createClass(UserSettings, [{
	        key: 'all',
	        value: function all() {
	            return this.api.get('userSettings');
	        }
	
	        /**
	         * @method get
	         *
	         * @param {String} key The identifier of the user setting that should be retrieved.
	         * @returns {Promise} A promise that resolves with the value or will fail if the value is not available.
	         *
	         * @description
	         * ```js
	         * d2.currentUser.userSettings.get('keyUiLocale')
	         *  .then(userSettingValue => {
	         *    console.log('UI Locale: ' + userSettingValue);
	         *  });
	         * ```
	         */
	    }, {
	        key: 'get',
	        value: function get(key) {
	            var _this = this;
	
	            function processValue(value) {
	                // Attempt to parse the response as JSON. If this fails we return the value as is.
	                try {
	                    return JSON.parse(value);
	                } catch (e) {
	                    return value;
	                }
	            }
	
	            return new Promise(function (resolve, reject) {
	                if (!(0, _libCheck.isString)(key)) {
	                    throw new TypeError('A "key" parameter should be specified when calling get() on userSettings');
	                }
	
	                _this.api.get(['userSettings', key].join('/'), undefined, { dataType: 'text' }).then(function (response) {
	                    var value = processValue(response);
	                    // Store the value on the user settings object
	                    _this[key] = value;
	                    if (value) {
	                        resolve(processValue(response));
	                    }
	                    reject(new Error('The requested userSetting has no value or does not exist.'));
	                });
	            });
	        }
	
	        /**
	         * @method set
	         *
	         * @param {String} key The identifier of the user setting that should be saved.
	         * @param {String} value The new value of the user setting.
	         * @returns {Promise} A promise that will resolve when the new value has been saved, or fail if saving fails.
	         *
	         * @description
	         * ```js
	         * d2.currentUser.userSettings.set('keyUiLocale', 'fr')
	         *  .then(() => {
	         *   console.log('UI Locale is now "fr");
	         *  });
	         * ```
	         */
	    }, {
	        key: 'set',
	        value: function set(key, value) {
	            var settingUrl = ['userSettings', key].join('/');
	            if (value === null || ('' + value).length === 0) {
	                return this.api['delete'](settingUrl, { dataType: 'text' }).then(this[key] = undefined);
	            }
	            return this.api.post(settingUrl, value, { dataType: 'text', contentType: 'text/plain' }).then(this[key] = value);
	        }
	    }]);
	
	    return UserSettings;
	})();
	
	exports['default'] = UserSettings;
	module.exports = exports['default'];

/***/ }
/******/ ])));
                    return d2.default;
                })();
            
//# sourceMappingURL=d2-browser.js.map