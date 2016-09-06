'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _loglevel = require('loglevel');

var _loglevel2 = _interopRequireDefault(_loglevel);

var _TreeView = require('./TreeView.component');

var _TreeView2 = _interopRequireDefault(_TreeView);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

if (process.env.NODE_ENV !== 'production') {
    var msg = ['Deprecated: Importing TreeView components implicitly is deprecated.', 'Please explicitly import the component in stead:', '  d2-ui/lib/tree-view/TreeViewComponent.js'].join('\n');
    _loglevel2.default.warn(msg);
}

exports.default = _TreeView2.default;