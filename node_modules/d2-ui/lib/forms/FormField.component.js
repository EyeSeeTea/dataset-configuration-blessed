'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _linearProgress = require('material-ui/lib/linear-progress');

var _linearProgress2 = _interopRequireDefault(_linearProgress);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var emptyComponent = _react2.default.createClass({
    displayName: 'emptyComponent',
    render: function render() {
        return null;
    }
});

/**
 * Is required to be a direct child of the `Form.component`
 * Will receive a updateFormStatus method from the Form to be called when the state of the input changes.
 * This will be passed down as an onChange event.
 * If the component passed as `type` does not support onChange
 * consider passing a wrapper component that wraps your `type` component
 * and fires the onChange
 *
 * The field fires an update request for the value by calling `onChange` by default but it is optional to set the update event to `onBlur`.
 * Pass the string `onBlur` to `updateEvent` to update the `<Form>` component on blur.
 */
var FormField = _react2.default.createClass({
    displayName: 'FormField',
    // eslint-disable-line react/no-multi-comp
    propTypes: {
        type: _react.PropTypes.func.isRequired,
        isValid: _react.PropTypes.bool.isRequired,
        errorMessage: _react.PropTypes.string,
        fieldOptions: _react.PropTypes.shape({
            helpText: _react.PropTypes.string,
            dynamicHelpText: _react.PropTypes.bool
        }).isRequired,
        value: _react.PropTypes.any,
        updateFn: _react.PropTypes.func.isRequired,
        updateEvent: _react.PropTypes.oneOf(['onChange', 'onBlur']),
        isValidating: _react.PropTypes.bool,
        isRequired: _react.PropTypes.bool
    },

    getDefaultProps: function getDefaultProps() {
        return {
            type: emptyComponent,
            validators: []
        };
    },
    getInitialState: function getInitialState() {
        return { isFocused: false };
    },
    renderHelpText: function renderHelpText() {
        if (!this.props.fieldOptions || !this.props.fieldOptions.helpText || this.props.errorMessage) {
            return null;
        }

        var helpText = this.props.fieldOptions.helpText;
        var dynamic = this.props.fieldOptions.dynamicHelpText;

        var helpStyle = {
            color: '#888',
            fontSize: '12px'
        };

        if (dynamic) {
            Object.assign(helpStyle, {
                marginTop: this.state.isFocused ? 0 : -18,
                marginBottom: this.state.isFocused ? 0 : 0,
                transition: 'margin 175ms ease-in-out'
            });
        }

        return _react2.default.createElement(
            'div',
            { style: { overflow: 'hidden', marginTop: dynamic ? -5 : 0 } },
            _react2.default.createElement(
                'div',
                { style: helpStyle },
                helpText
            )
        );
    },
    render: function render() {
        var _this = this;

        var classList = (0, _classnames2.default)('form-field');

        var onChangeFn = this.props.updateFn;
        var onBlurFn = this._blur;
        if (this.props.updateEvent === 'onBlur') {
            onBlurFn = function onBlurFn(e) {
                _this._blur(e);
                if (e.target.value !== (_this.props.value ? _this.props.value : '')) {
                    _this.props.updateFn(e);
                }
            };
            onChangeFn = undefined;
        }

        return _react2.default.createElement(
            'div',
            { className: classList },
            _react2.default.createElement(this.props.type, _extends({
                errorText: this.props.errorMessage,
                defaultValue: this.props.value,
                onChange: onChangeFn,
                onBlur: onBlurFn,
                onFocus: this._focus,
                isRequired: this.props.isRequired
            }, this.props.fieldOptions)),
            this.renderHelpText(),
            this.props.isValidating ? _react2.default.createElement(_linearProgress2.default, { mode: 'indeterminate' }) : null
        );
    },
    _focus: function _focus() {
        this.setState({ isFocused: true });
    },
    _blur: function _blur() {
        this.setState({ isFocused: false });
    }
});

exports.default = FormField;