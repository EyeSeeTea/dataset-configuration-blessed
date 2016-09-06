'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.whenWidthLargerThan1150 = exports.toggleStyle = exports.MENU_ITEM_WIDTH = undefined;
exports.applyUserStyle = applyUserStyle;
exports.getWindowWidth = getWindowWidth;
exports.getSearchResultsHeight = getSearchResultsHeight;

var _colors = require('material-ui/lib/styles/colors');

var _rx = require('rx');

var _loglevel = require('loglevel');

var _loglevel2 = _interopRequireDefault(_loglevel);

var _curry = require('lodash/fp/curry');

var _curry2 = _interopRequireDefault(_curry);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MENU_ITEM_WIDTH = exports.MENU_ITEM_WIDTH = 125;

function applyUserStyle(user, style) {
    switch (user.userSettings.keyStyle) {
        case 'vietnam/vietnam.css':
            return Object.assign({}, style, { background: '#B40303' });
        case 'india/india.css':
            return Object.assign({}, style, { background: '#EA5911' });
        case 'green/green.css':
            return Object.assign({}, style, { background: '#467E4A' });
        default:
            break;
    }

    return style;
}

var styles = {};

function getWindowWidth() {
    if (!global.document) {
        return 0;
    }

    return Math.max(window.document.documentElement.clientWidth, window.innerWidth || 0);
}

var toggleStyle = exports.toggleStyle = (0, _curry2.default)(function toggleStyle(predicateFn, whenTrue, whenFalse) {
    return predicateFn() ? whenTrue : whenFalse;
});

var whenWidthLargerThan1150 = exports.whenWidthLargerThan1150 = toggleStyle(function () {
    return getWindowWidth() > 1150;
});

/**
 * Calculates the height of the search results box. When the user has a large screen height we fit a max of four rows
 * of search results onto the screen. If four rows is too big for the current screen size we limit the search results box
 * to 80% of the current viewport height.
 *
 * @returns {number} The height of the search result box in pixels.
 */
function getSearchResultsHeight() {
    var maxResultRowsHeight = 465;

    if (!global.document) {
        return maxResultRowsHeight;
    }

    var eightyPercentHeight = Math.max(global.document.documentElement.clientHeight, window.innerHeight || 0) * 0.8;

    if (eightyPercentHeight < maxResultRowsHeight) {
        return eightyPercentHeight;
    }
    return maxResultRowsHeight;
}

// Only attach the window resize listener when we have a document
if (global.document) {
    // Track the resize event on the window to recalculate the height of the search results box.
    _rx.Observable.fromEvent(global, 'resize').debounce(300).subscribe(function () {
        return Object.assign(styles.searchResults, { maxHeight: getSearchResultsHeight() });
    }, _loglevel2.default.error);
}

styles = {
    avatar: {
        fontSize: '1.3rem',
        letterSpacing: -2,
        lineHeight: '32px'
    },

    avatarBig: {
        fontSize: '34px',
        letterSpacing: -2,
        lineHeight: '60px'
    },

    headerBar: {
        boxSizing: 'border-box',
        background: '#276696',
        display: 'flex',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        minHeight: 48,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1400
    },

    headerTitle: {
        flex: 1,
        color: '#FFF'
    },

    headerMenu: {
        flex: '0 0 auto',
        padding: '0 1rem',
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        display: 'flex'
    },

    menusWrap: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingRight: '2rem'
    },

    dropDownWrap: {
        position: 'absolute',
        display: 'none',
        padding: '1rem',
        right: 40,
        overflow: 'hidden',
        width: 400,
        flexDirection: 'column',
        top: 48
    },

    searchField: {
        display: 'flex',
        flex: 1,
        position: 'relative',
        flexDirection: 'row',
        maxWidth: 550,
        justifyContent: 'flex-end',
        minWidth: 420
    },

    searchFieldInnerWrap: {
        transition: 'width .5s cubic-bezier(0.39, -0.04, 0.2, 1)',
        position: 'relative'
    },

    searchResultList: {
        display: 'flex',
        flexWrap: 'wrap'
    },

    searchResults: {
        position: 'absolute',
        top: 48,
        left: 0,
        right: 0,
        maxWidth: 673,
        maxHeight: getSearchResultsHeight(),
        overflow: 'auto',
        transition: 'padding-top .3s cubic-bezier(0.39, -0.04, 0.2, 1), padding-bottom .3s cubic-bezier(0.39, -0.04, 0.2, 1), height .3s cubic-bezier(0.39, -0.04, 0.2, 1)',
        boxSizing: 'border-box'
    },

    searchFieldInput: {
        color: _colors.white,
        flex: 1
    },

    searchFieldHintText: {
        color: 'rgba(255, 255, 255, 0.5)'
    },

    menuItemLink: {
        padding: '1rem',
        display: 'flex',
        width: MENU_ITEM_WIDTH,
        height: MENU_ITEM_WIDTH,
        boxSizing: 'border-box',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textDecoration: 'none',
        color: _colors.black,
        fontSize: '1rem'
    },

    menuItemIcon: {
        height: 48,
        width: 48
    },

    moreAppsButton: {
        marginTop: '1rem',
        width: '100%',
        display: 'block',
        textAlign: 'center'
    },

    moreAppsButtonWrap: {
        width: '100%',
        padding: '1rem', boxSizing: 'border-box'
    },

    clearIcon: {
        position: 'absolute',
        top: '10px',
        right: '5px'
    }
};

exports.default = styles;