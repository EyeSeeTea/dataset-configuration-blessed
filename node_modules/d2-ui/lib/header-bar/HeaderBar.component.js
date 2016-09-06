'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

require('./translate');

require('./menu');

require('./menu-ui');

var _dhis = require('./dhis2');

var _dhis2 = _interopRequireDefault(_dhis);

var _loglevel = require('loglevel');

var _loglevel2 = _interopRequireDefault(_loglevel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /**
                                                                                                                                                                                                                   * @component HeaderBar
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * @description
                                                                                                                                                                                                                   * The `HeaderBar` component can be used to display the systems header bar at the top of your app. The headerbar
                                                                                                                                                                                                                   * includes the `Apps` and `Profile` menus that are displayed in all the core
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * @example
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * ```html
                                                                                                                                                                                                                   * <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.4.0/css/font-awesome.min.css">
                                                                                                                                                                                                                   * ```
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * ```js
                                                                                                                                                                                                                   * import React from 'react';
                                                                                                                                                                                                                   * import HeaderBar from 'd2-ui/lib/header-bar/HeaderBar.component';
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * const App = React.createClass({
                                                                                                                                                                                                                   *     render() {
                                                                                                                                                                                                                   *         return (
                                                                                                                                                                                                                   *             <div>
                                                                                                                                                                                                                   *                 <HeaderBar />
                                                                                                                                                                                                                   *             </div>
                                                                                                                                                                                                                   *         );
                                                                                                                                                                                                                   *     }
                                                                                                                                                                                                                   * });
                                                                                                                                                                                                                   ```
                                                                                                                                                                                                                   */


var defaultStyle = 'light_blue';
var defaultStylesheetUrl = 'light_blue/light_blue.css';
var stylesLocation = 'dhis-web-commons/css';

function islocalStorageSupported() {
    try {
        localStorage.setItem('dhis2.menu.localstorage.test', 'dhis2.menu.localstorage.test');
        localStorage.removeItem('dhis2.menu.localstorage.test');
        return true;
    } catch (e) {
        return false;
    }
}

function saveToLocalStorage(headerData) {
    if (islocalStorageSupported()) {
        localStorage.setItem('dhis2.menu.ui.headerBar.userStyle', headerData.userStyleUrl);
        localStorage.setItem('dhis2.menu.ui.headerBar.title', headerData.title);
        localStorage.setItem('dhis2.menu.ui.headerBar.link', headerData.link);
    }

    return headerData;
}

var HeaderBar = _react2.default.createClass({
    displayName: 'HeaderBar',

    propTypes: {
        lastUpdate: _react2.default.PropTypes.instanceOf(Date)
    },

    contextTypes: {
        d2: _react2.default.PropTypes.object.isRequired
    },

    getInitialState: function getInitialState() {
        return {
            headerBar: {}
        };
    },
    componentWillMount: function componentWillMount() {
        var _this = this;

        // dhis2.settings.baseUrl = dhis2.settings.baseUrl || '..';
        _dhis2.default.menu.ui.initMenu();

        this.getSystemSettings(this.context.d2).then(this.getHeaderBarData).catch(this.loadDataFromLocalStorageIfAvailable).then(saveToLocalStorage).then(function (headerData) {
            _this.setHeaderData(headerData.userStyleUrl, headerData.title, headerData.link);
        }).catch(function (error) {
            _loglevel2.default.error(error);
        });
    },
    componentWillReceiveProps: function componentWillReceiveProps(props) {
        if (this.props.lastUpdate && this.props.lastUpdate.getTime() - props.lastUpdate.getTime() !== 0) {
            _dhis2.default.menu.ui.bootstrapMenu();
        }
    },
    getSystemSettings: function getSystemSettings(d2) {
        return d2.system.settings.all();
    },
    getHeaderBarData: function getHeaderBarData(systemSettings) {
        return this.requestUserStyle().catch(function () {
            _loglevel2.default.info('Unable to load usersettings, falling back to systemSettings');
            localStorage.setItem('dhis2.menu.ui.headerBar.userStyle', systemSettings.keyCurrentStyle);
            return systemSettings.keyCurrentStyle;
        }).then(function (userStyleUrl) {
            return {
                userStyleUrl: userStyleUrl || systemSettings.keyCurrentStyle,
                title: systemSettings.applicationTitle,
                link: systemSettings.startModule
            };
        }).catch(function (error) {
            return _loglevel2.default.error(error);
        });
    },
    getApiBaseUrl: function getApiBaseUrl() {
        return this.context.d2.Api.getApi().baseUrl;
    },
    getBaseUrl: function getBaseUrl() {
        return this.getApiBaseUrl().replace(/\/api\/?$/, '');
    },
    getLogoUrl: function getLogoUrl() {
        return [this.getApiBaseUrl(), 'staticContent', 'logo_banner'].join('/');
    },
    getStylesheetUrl: function getStylesheetUrl(stylesheet) {
        return [this.getBaseUrl(), stylesLocation, 'themes', stylesheet || defaultStylesheetUrl].join('/');
    },
    getStyleName: function getStyleName(userStyle) {
        if (typeof userStyle === 'string' && userStyle.split('/')[0] && userStyle.split('/').length > 0) {
            return userStyle.split('/')[0];
        }
        return defaultStyle;
    },
    render: function render() {
        var headerBarStyle = {
            height: '44px',
            position: 'fixed',
            zIndex: 15,
            top: 0,
            left: 0,
            right: 0,
            paddingLeft: 10,
            boxShadow: '0 0 3px #222'
        };

        var headerBarContentStyle = {
            position: 'relative',
            maxWidth: 1200
        };

        var headerBannerWrapperStyle = {
            display: 'table-cell',
            width: 155,
            height: 44,
            verticalAlign: 'middle',
            textAlign: 'center'
        };

        var headerBannerStyle = {
            maxWidth: 175,
            maxHeight: 44
        };

        var headerTextStyle = {
            position: 'absolute',
            top: 12,
            left: 175,
            fontWeight: 'bold',
            color: '#fff',
            fontSize: 16
        };

        var dropDownMenuStyle = {
            position: 'absolute',
            top: 0,
            right: 0
        };

        return _react2.default.createElement(
            'div',
            { className: 'header-bar', style: headerBarStyle, id: 'header' },
            _react2.default.createElement(
                'div',
                { style: headerBarContentStyle },
                _react2.default.createElement(
                    'a',
                    { href: this.state.headerBar.link, title: this.state.headerBar.title, className: 'title-link' },
                    _react2.default.createElement(
                        'div',
                        { style: headerBannerWrapperStyle },
                        _react2.default.createElement('img', { className: 'header-logo', src: this.getLogoUrl(), id: 'headerBanner', style: headerBannerStyle })
                    ),
                    _react2.default.createElement(
                        'span',
                        { className: 'header-text', id: 'headerText', style: headerTextStyle },
                        this.state.headerBar.title
                    )
                ),
                _react2.default.createElement(
                    'div',
                    null,
                    this.state.headerBar.message
                ),
                _react2.default.createElement('div', { style: dropDownMenuStyle, id: 'dhisDropDownMenu' })
            )
        );
    },
    loadDataFromLocalStorageIfAvailable: function loadDataFromLocalStorageIfAvailable() {
        var title = void 0;
        var link = void 0;
        var userStyle = void 0;

        // Load values from localStorage if they are available
        if (islocalStorageSupported()) {
            title = localStorage.getItem('dhis2.menu.ui.headerBar.title');
            link = localStorage.getItem('dhis2.menu.ui.headerBar.link');
            userStyle = localStorage.getItem('dhis2.menu.ui.headerBar.userStyle');
        }

        return {
            userStyleUrl: userStyle,
            title: title,
            link: link
        };
    },
    setHeaderData: function setHeaderData(userStyleUrl, title, link) {
        this.addUserStyleStylesheet(this.getStylesheetUrl(userStyleUrl));
        this.setHeaderTitle(title);
        this.setHeaderLink(link);
    },
    setHeaderBarProp: function setHeaderBarProp(name, value) {
        this.setState({
            headerBar: Object.assign({}, this.state.headerBar, _defineProperty({}, name, value))
        });
    },
    setHeaderTitle: function setHeaderTitle(applicationTitle) {
        this.setHeaderBarProp('title', applicationTitle || 'District Health Information Software 2');
    },
    setHeaderLink: function setHeaderLink() {
        this.setHeaderBarProp('link', [this.getBaseUrl(), 'dhis-web-commons-about/redirect.action'].join('/'));
    },
    requestUserStyle: function requestUserStyle() {
        var api = this.context.d2.Api.getApi();
        return api.get('userSettings/keyStyle', {}, { dataType: 'text' }).then(function (response) {
            return response.trim();
        });
    },
    isValidUserStyle: function isValidUserStyle(userStyle) {
        return typeof userStyle === 'string' && /^[A-z0-9_\-]+$/.test(userStyle);
    },
    addUserStyleStylesheet: function addUserStyleStylesheet(stylesheetUrl) {
        jQuery('head').append('<link href="' + stylesheetUrl + '" type="text/css" rel="stylesheet" media="screen,print" />');
    }
});

exports.default = HeaderBar;