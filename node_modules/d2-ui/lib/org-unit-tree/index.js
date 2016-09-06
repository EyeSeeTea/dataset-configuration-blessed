'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _loglevel = require('loglevel');

var _loglevel2 = _interopRequireDefault(_loglevel);

var _OrgUnitTreeMultipleRoots = require('./OrgUnitTreeMultipleRoots.component');

var _OrgUnitTreeMultipleRoots2 = _interopRequireDefault(_OrgUnitTreeMultipleRoots);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

if (process.env.NODE_ENV !== 'production') {
    var msg = ['Deprecated: Importing d2-ui/lib/org-unit-tree/index.js is deprecated.', 'Please import either:', '    d2-ui/lib/org-unit-tree/OrgUnitTree.component.js', 'Or:', '    d2-ui/lib/org-unit-tree/OrgUnitTreeMultipleRoots.component.js'];
    _loglevel2.default.warn(msg.join('\n'));
}

exports.default = _OrgUnitTreeMultipleRoots2.default;