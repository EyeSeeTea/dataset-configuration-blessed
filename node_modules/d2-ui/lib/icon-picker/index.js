'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _loglevel = require('loglevel');

var _loglevel2 = _interopRequireDefault(_loglevel);

var _IconPicker = require('./IconPicker.component');

var _IconPicker2 = _interopRequireDefault(_IconPicker);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

if (process.env.NODE_ENV !== 'production') {
    var msg = ['Deprecated: Importing IconPicker components implicitly is deprecated.', 'Please explicitly import the component in stead:', '  d2-ui/lib/icon-picker/IconPicker.component.js'].join('\n');
    _loglevel2.default.warn(msg);
}

exports.default = _IconPicker2.default;