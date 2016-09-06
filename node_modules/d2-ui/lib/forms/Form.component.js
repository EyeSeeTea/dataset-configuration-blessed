'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _FormField = require('./FormField.component');

var _FormField2 = _interopRequireDefault(_FormField);

var _Translate = require('../i18n/Translate.mixin');

var _Translate2 = _interopRequireDefault(_Translate);

var _FormValidator = require('./FormValidator');

var _FormValidator2 = _interopRequireDefault(_FormValidator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Form = _react2.default.createClass({
    displayName: 'Form',

    propTypes: {
        fieldConfigs: _react2.default.PropTypes.arrayOf(_react2.default.PropTypes.shape({
            name: _react2.default.PropTypes.string.isRequired,
            type: _react2.default.PropTypes.func.isRequired,
            fieldOptions: _react2.default.PropTypes.object,
            validators: _react2.default.PropTypes.arrayOf(_react2.default.PropTypes.func)
        })).isRequired,
        formValidator: _react2.default.PropTypes.object,
        onFormFieldUpdate: _react2.default.PropTypes.func,
        source: _react2.default.PropTypes.object.isRequired,
        children: _react2.default.PropTypes.oneOfType([_react2.default.PropTypes.array, _react2.default.PropTypes.object])
    },

    mixins: [_Translate2.default],

    getDefaultProps: function getDefaultProps() {
        return {
            fieldConfigs: [],
            formValidator: (0, _FormValidator2.default)([])
        };
    },
    componentDidMount: function componentDidMount() {
        var _this = this;

        this.disposables = [];
        this.disposables.push(this.props.formValidator.status.subscribe(function () {
            // TODO: Should probably have some sort of check to see if it really needs to update? That update might be better at home in the formValidator however
            _this.forceUpdate();
        }));
    },
    componentWillReceiveProps: function componentWillReceiveProps(props) {
        if (props.hasOwnProperty('formValidator')) {
            this.forceUpdate();
        }
    },
    componentWillUnmount: function componentWillUnmount() {
        this.disposables.forEach(function (d) {
            d.dispose();
        });
    },
    renderFieldsFromFieldConfigs: function renderFieldsFromFieldConfigs() {
        var _this2 = this;

        return this.props.fieldConfigs.filter(function (fieldConfig) {
            return fieldConfig.type;
        }).map(function (fieldConfig) {
            var fieldValue = _this2.props.source && _this2.props.source[fieldConfig.name];
            var updateEvent = fieldConfig.updateEvent === 'onBlur' ? 'onBlur' : 'onChange';
            var validationStatus = _this2.props.formValidator.getStatusFor(fieldConfig.name);
            var errorMessage = void 0;

            if (validationStatus && validationStatus.messages && validationStatus.messages.length) {
                errorMessage = validationStatus.messages[0];
            }

            return _react2.default.createElement(_FormField2.default, {
                fieldOptions: fieldConfig.fieldOptions,
                key: fieldConfig.name,
                type: fieldConfig.type,
                isRequired: fieldConfig.required,
                isValidating: validationStatus.status === _FormValidator.FormFieldStatuses.VALIDATING,
                errorMessage: errorMessage ? _this2.getTranslation(errorMessage) : undefined,
                onChange: _this2.updateRequest.bind(_this2, fieldConfig),
                value: fieldValue,
                isValid: _this2.isValid(),
                updateFn: _this2.updateRequest.bind(_this2, fieldConfig),
                updateEvent: updateEvent
            });
        });
    },
    render: function render() {
        var classList = (0, _classnames2.default)('form');

        return _react2.default.createElement(
            'form',
            { className: classList },
            this.renderFieldsFromFieldConfigs(),
            this.props.children
        );
    },
    isValid: function isValid() {
        return true;
    },
    updateRequest: function updateRequest(fieldConfig, event) {
        this.props.formValidator.runFor(fieldConfig.name, event.target.value, this.props.source);
        this.props.onFormFieldUpdate && this.props.onFormFieldUpdate(fieldConfig.name, fieldConfig.beforeUpdateConverter ? fieldConfig.beforeUpdateConverter(event.target.value, fieldConfig) : event.target.value);
    }
});

exports.default = Form;