'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.setGrid = setGrid;

var _Store = require('../../store/Store');

var _Store2 = _interopRequireDefault(_Store);

var _menuSources = require('../menu-sources');

var _rx = require('rx');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var headerBarSettingsStore = _Store2.default.create();

function setGrid(grid) {
    headerBarSettingsStore.setState(Object.assign({}, headerBarSettingsStore.getState() || {}, {
        grid: grid
    }));
}

setGrid({ x: 3, y: 3 });

exports.default = _rx.Observable.combineLatest(_menuSources.appsMenuSource$, headerBarSettingsStore, function (appItems, headerBarSettings) {
    return _extends({}, headerBarSettings, {
        gridOptions: [{ x: 3, y: 3 }, { x: 5, y: 4 }, { x: 8, y: 3 }].concat(appItems ? [{ x: Math.ceil(appItems.length / 4), y: 4 }] : [])
    });
});