'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _checkbox = require('material-ui/lib/checkbox');

var _checkbox2 = _interopRequireDefault(_checkbox);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// TODO: Rewrite as ES6 class
/* eslint-disable react/prefer-es6-class */
exports.default = _react2.default.createClass({
    displayName: 'CheckBox.component',

    propTypes: {
        onChange: _react2.default.PropTypes.func.isRequired
    },

    render: function render() {
        return _react2.default.createElement(
            'div',
            { style: { marginTop: 12, marginBottom: 12 } },
            _react2.default.createElement(_checkbox2.default, _extends({ onCheck: this.props.onChange }, this.props))
        );
    }
});