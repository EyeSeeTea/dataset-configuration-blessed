'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.legendItemStore$ = exports.legendItemStore = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.openEditDialogFor = openEditDialogFor;
exports.onFieldChange = onFieldChange;
exports.onFormStatusChange = onFormStatusChange;
exports.setDialogStateTo = setDialogStateTo;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _Store = require('../store/Store');

var _Store2 = _interopRequireDefault(_Store);

var _textField = require('material-ui/lib/text-field');

var _textField2 = _interopRequireDefault(_textField);

var _rx = require('rx');

var _ColorPicker = require('./ColorPicker.component');

var _ColorPicker2 = _interopRequireDefault(_ColorPicker);

var _d = require('d2/lib/d2');

var _camelCaseToUnderscores = require('d2-utilizr/lib/camelCaseToUnderscores');

var _camelCaseToUnderscores2 = _interopRequireDefault(_camelCaseToUnderscores);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_d.config.i18n.strings.add('required');
_d.config.i18n.strings.add('should_be_lower_than_end_value');
_d.config.i18n.strings.add('should_be_higher_than_start_value');

var legendItemStore = exports.legendItemStore = _Store2.default.create();

// FormBuilder currently requires an event to be passed for fields
function createFakeEvent(color) {
    return {
        target: {
            value: color
        }
    };
};

var colorPicker = function colorPicker(props) {
    return _react2.default.createElement(_ColorPicker2.default, { color: props.value, onChange: function onChange(color) {
            return props.onChange(createFakeEvent(color));
        } });
};

function openEditDialogFor(model) {
    legendItemStore.setState({
        model: model,
        open: true
    });
}

var formFieldsConfigs = [{
    name: 'name',
    component: _textField2.default
}, {
    name: 'startValue',
    component: _textField2.default,
    props: {
        type: 'number'
    },
    validators: [{
        validator: function validator(value) {
            return value === '' ? false : true;
        },
        message: 'required'
    } /*,{
         validator: value => Number(value) >= Number(legendItemStore.getState().model.endValue) ? false : true,
         message: 'should_be_lower_than_end_value',
      }*/]
}, {
    name: 'endValue',
    component: _textField2.default,
    props: {
        type: 'number'
    },
    validators: [{
        validator: function validator(value) {
            return value === '' ? false : true;
        },
        message: 'required'
    } /*,{
         validator: value => Number(value) <= Number(legendItemStore.getState().model.startValue) ? false : true,
         message: 'should_be_higher_than_start_value',
      }*/]
}, { // Defined in data-table/data-value/Color.component.js
    name: 'color',
    component: colorPicker
}];

// Called when a field is changed
function onFieldChange(fieldName, value) {
    var model = legendItemStore.getState().model;

    model[fieldName] = value;

    legendItemStore.setState(_extends({}, legendItemStore.getState(), {
        model: model
    }));
}

function onFormStatusChange(_ref) {
    var valid = _ref.valid;

    legendItemStore.setState(_extends({}, legendItemStore.getState(), {
        isValid: valid
    }));
}

function setDialogStateTo(open) {
    legendItemStore.setState(_extends({}, legendItemStore.getState(), {
        open: open
    }));
}

var legendItemStore$ = exports.legendItemStore$ = _rx.Observable.combineLatest(legendItemStore, _rx.Observable.just(formFieldsConfigs), _rx.Observable.fromPromise((0, _d.getInstance)()), function (state, fieldConfigs, d2) {
    return _extends({}, state, {
        fieldConfigs: fieldConfigs.map(function (fieldConfig) {
            return _extends({}, fieldConfig, {
                props: _extends({}, fieldConfig.props, {
                    floatingLabelText: d2.i18n.getTranslation((0, _camelCaseToUnderscores2.default)(fieldConfig.name))
                }),
                validators: (fieldConfig.validators || []).map(function (validator) {
                    return _extends({}, validator, {
                        message: d2.i18n.getTranslation(validator.message)
                    });
                })
            });
        })
    });
}) // Return a combined object (will return an array if we don't pass it)
.map(function (state) {
    return _extends({}, state, {
        fieldConfigs: state.fieldConfigs.map(function (fieldConfig) {
            return _extends({}, fieldConfig, {
                value: state.model[fieldConfig.name]
            });
        })
    });
});