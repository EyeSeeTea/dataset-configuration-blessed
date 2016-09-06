'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = addD2Context;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _addContext = require('./addContext');

var _addContext2 = _interopRequireDefault(_addContext);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function addD2Context(Component) {
    return (0, _addContext2.default)(Component, { d2: _react2.default.PropTypes.object });
}