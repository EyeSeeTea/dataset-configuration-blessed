'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = Color;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _d3Color = require('d3-color');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function Color(props) {
    var styles = {
        color: {
            backgroundColor: props.value,
            color: (0, _d3Color.hcl)(props.value).l < 70 ? '#fff' : '#000',
            textAlign: 'center',
            position: 'relative',
            width: 90,
            height: 36,
            lineHeight: 2.5,
            boxShadow: '0 1px 6px rgba(0,0,0,0.12),0 1px 4px rgba(0,0,0,0.12)'
        }
    };

    return _react2.default.createElement(
        'div',
        { style: styles.color },
        props.value
    );
};