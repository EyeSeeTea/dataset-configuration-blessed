'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _textField = require('material-ui/lib/text-field');

var _textField2 = _interopRequireDefault(_textField);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// TODO: Rewrite as ES6 class
/* eslint-disable react/prefer-es6-class */
exports.default = _react2.default.createClass({
    displayName: 'TextField',

    propTypes: {
        value: _react2.default.PropTypes.string,
        multiLine: _react2.default.PropTypes.bool
    },

    getInitialState: function getInitialState() {
        return {
            value: this.props.value
        };
    },
    componentWillReceiveProps: function componentWillReceiveProps(props) {
        this.setState({ value: props.value });
    },
    _change: function _change(e) {
        this.setState({ value: e.target.value });
    },
    render: function render() {
        var errorStyle = {
            lineHeight: this.props.multiLine ? '48px' : '12px',
            marginTop: this.props.multiLine ? -16 : 0
        };

        return _react2.default.createElement(_textField2.default, _extends({ errorStyle: errorStyle }, this.props, { value: this.state.value, onChange: this._change }));
    }
});