'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = OrgUnitTreeMultipleRoots;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _OrgUnitTree = require('./OrgUnitTree.component');

var _OrgUnitTree2 = _interopRequireDefault(_OrgUnitTree);

var _Model = require('d2/lib/model/Model');

var _Model2 = _interopRequireDefault(_Model);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function OrgUnitTreeMultipleRoots(props) {
    if (props.roots) {
        return _react2.default.createElement(
            'div',
            null,
            props.roots.map(function (root, index) {
                return _react2.default.createElement(_OrgUnitTree2.default, _extends({
                    key: index
                }, props, {
                    root: root,
                    onClick: props.onClick
                }));
            })
        );
    }
    return _react2.default.createElement(_OrgUnitTree2.default, props);
}
OrgUnitTreeMultipleRoots.propTypes = Object.assign({}, _OrgUnitTree2.default.propTypes, {
    root: _react2.default.PropTypes.instanceOf(_Model2.default),
    roots: _react2.default.PropTypes.arrayOf(_react2.default.PropTypes.instanceOf(_Model2.default))
});