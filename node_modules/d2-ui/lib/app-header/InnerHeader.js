'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _loglevel = require('loglevel');

var _loglevel2 = _interopRequireDefault(_loglevel);

var _headerBarStyles = require('./header-bar-styles');

var _headerBarStyles2 = _interopRequireDefault(_headerBarStyles);

var _rx = require('rx');

var _getBaseUrlFromD2ApiUrl = require('./getBaseUrlFromD2ApiUrl');

var _getBaseUrlFromD2ApiUrl2 = _interopRequireDefault(_getBaseUrlFromD2ApiUrl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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
    }

    return headerData;
}

var InnerHeader = _react2.default.createClass({
    displayName: 'InnerHeader',

    propTypes: {
        lastUpdate: _react2.default.PropTypes.instanceOf(Date)
    },

    contextTypes: {
        d2: _react2.default.PropTypes.object.isRequired
    },

    getInitialState: function getInitialState() {
        this.unmount = new _rx.Subject();

        return {
            headerBar: {}
        };
    },
    componentWillMount: function componentWillMount() {
        var _this = this;

        this.getSystemSettings(this.context.d2).then(this.getHeaderBarData).catch(this.loadDataFromLocalStorageIfAvailable).then(saveToLocalStorage).then(function (headerData) {
            _this.setHeaderData(headerData.userStyleUrl, headerData.title, headerData.link);
        }).catch(function (error) {
            _loglevel2.default.error(error);
        });
    },
    componentDidMount: function componentDidMount() {
        var _this2 = this;

        _rx.Observable.fromEvent(window, 'resize').takeUntil(this.unmount).debounce(200).subscribe(function () {
            return _this2.forceUpdate();
        }, function (e) {
            return _loglevel2.default.error('Could not update the HeaderBar after resize', e);
        });
    },
    componentWillReceiveProps: function componentWillReceiveProps(props) {
        if (this.props.lastUpdate && this.props.lastUpdate.getTime() - props.lastUpdate.getTime() !== 0) {
            dhis2.menu.ui.bootstrapMenu();
        }
    },
    componentWillUnmount: function componentWillUnmount() {
        this.unmount.onNext(true);
    },
    getSystemSettings: function getSystemSettings(d2) {
        if (!d2.system) {
            return Promise.reject(new Error('Offline'));
        }

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
                title: systemSettings.applicationTitle
            };
        }).catch(function (error) {
            return _loglevel2.default.error(error);
        });
    },
    getApiBaseUrl: function getApiBaseUrl() {
        if (!this.context.d2.Api) {
            return '/';
        }
        return this.context.d2.Api.getApi().baseUrl;
    },
    getBaseUrl: function getBaseUrl() {
        return (0, _getBaseUrlFromD2ApiUrl2.default)(this.context.d2);
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
        var headerBannerWrapperStyle = {
            width: 155,
            height: 44,
            verticalAlign: 'middle',
            textAlign: 'center',
            flexDirection: 'row',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        };

        var headerBannerStyle = {
            maxWidth: 175,
            maxHeight: 44
        };

        var linkWrapStyle = {
            flex: 1,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            color: '#FFF',
            alignItems: 'center',
            justifyItems: 'center',
            display: 'flex',
            minWidth: (0, _headerBarStyles.whenWidthLargerThan1150)(450, 'auto'),
            paddingRight: '1rem',
            boxSizing: 'border-box'
        };

        var linkStyle = {
            fontSize: '1rem',
            fontWeight: 'bold',
            color: '#FFF',
            textDecoration: 'none',
            textOverflow: 'ellipsis',
            minWidth: 1,
            overflow: 'hidden',
            whiteSpace: 'nowrap'
        };

        var logoHref = {
            minWidth: 175
        };

        var linkHref = [this.getBaseUrl(), 'dhis-web-commons-about/redirect.action'].join('/');

        var largeScreensInnerHeader = Object.assign({ display: 'flex', minWidth: 450 + 175, overflow: 'hidden', textOverflow: 'ellipsis' }, _headerBarStyles2.default.headerTitle);

        var smallerScreensInnerHeader = Object.assign({ display: 'flex', overflow: 'hidden', textOverflow: 'ellipsis' }, _headerBarStyles2.default.headerTitle);

        return _react2.default.createElement(
            'div',
            { style: (0, _headerBarStyles.whenWidthLargerThan1150)(largeScreensInnerHeader, smallerScreensInnerHeader) },
            _react2.default.createElement(
                'a',
                { href: linkHref, title: this.state.headerBar.title, style: logoHref, className: 'title-link' },
                _react2.default.createElement(
                    'div',
                    { style: headerBannerWrapperStyle },
                    _react2.default.createElement(
                        'div',
                        null,
                        _react2.default.createElement('img', { className: 'header-logo', src: this.getLogoUrl(), id: 'headerBanner', style: headerBannerStyle })
                    )
                )
            ),
            _react2.default.createElement(
                'div',
                { style: linkWrapStyle },
                _react2.default.createElement(
                    'a',
                    { href: linkHref, title: this.state.headerBar.title, style: linkStyle, className: 'title-link' },
                    this.state.headerBar.title
                )
            )
        );
    },
    loadDataFromLocalStorageIfAvailable: function loadDataFromLocalStorageIfAvailable() {
        var title = void 0;
        var userStyle = void 0;

        // Load values from localStorage if they are available
        if (islocalStorageSupported()) {
            title = localStorage.getItem('dhis2.menu.ui.headerBar.title');
            userStyle = localStorage.getItem('dhis2.menu.ui.headerBar.userStyle');
        }

        return {
            userStyleUrl: userStyle,
            title: title
        };
    },
    setHeaderData: function setHeaderData(userStyleUrl, title, link) {
        this.addUserStyleStylesheet(this.getStylesheetUrl(userStyleUrl));
        this.setHeaderTitle(title);
    },
    setHeaderBarProp: function setHeaderBarProp(name, value) {
        this.setState({
            headerBar: Object.assign({}, this.state.headerBar, _defineProperty({}, name, value))
        });
    },
    setHeaderTitle: function setHeaderTitle(applicationTitle) {
        this.setHeaderBarProp('title', applicationTitle || 'District Health Information Software 2');
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

exports.default = InnerHeader;