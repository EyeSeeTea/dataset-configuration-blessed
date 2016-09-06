'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _loglevel = require('loglevel');

var _loglevel2 = _interopRequireDefault(_loglevel);

var _FormulaEditor = require('./FormulaEditor.component');

var _FormulaEditor2 = _interopRequireDefault(_FormulaEditor);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

if (process.env.NODE_ENV !== 'production') {
    var msg = ['Deprecated: Importing FormulaEditor components implicitly is deprecated.', 'Please explicitly import the component in stead:', '  d2-ui/lib/formula-editor/FormulaEditor.component.js'].join('\n');
    _loglevel2.default.warn(msg);
}

exports.default = _FormulaEditor2.default;