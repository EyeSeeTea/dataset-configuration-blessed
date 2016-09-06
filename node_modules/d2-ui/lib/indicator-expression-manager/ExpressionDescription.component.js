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

var ExpressionDescription = _react2.default.createClass({
    displayName: 'ExpressionDescription',

    propTypes: {
        descriptionLabel: _react2.default.PropTypes.string,
        descriptionValue: _react2.default.PropTypes.string,
        onDescriptionChange: _react2.default.PropTypes.func.isRequired,
        errorText: _react2.default.PropTypes.string
    },

    render: function render() {
        return _react2.default.createElement(
            'div',
            { className: 'expression-description' },
            _react2.default.createElement(_textField2.default, _extends({}, this.props, {
                value: this.props.descriptionValue,
                floatingLabelText: this.props.descriptionLabel,
                onChange: this.handleDescriptionChange,
                fullWidth: true,
                errorText: this.props.errorText
            }))
        );
    },
    handleDescriptionChange: function handleDescriptionChange(event) {
        var descriptionValue = event.target.value;
        this.props.onDescriptionChange(descriptionValue);
    }
});

exports.default = ExpressionDescription;