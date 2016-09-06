'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _addD2Context = require('../component-helpers/addD2Context');

var _addD2Context2 = _interopRequireDefault(_addD2Context);

var _isString = require('d2-utilizr/lib/isString');

var _isString2 = _interopRequireDefault(_isString);

var _isFunction = require('d2-utilizr/lib/isFunction');

var _isFunction2 = _interopRequireDefault(_isFunction);

var _loglevel = require('loglevel');

var _loglevel2 = _interopRequireDefault(_loglevel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function hasAccessToD2TranslationFunction(context) {
    return context.d2 && context.d2.i18n && (0, _isFunction2.default)(context.d2.i18n.getTranslation);
}

function Translate(props, context) {
    if (!(0, _isString2.default)(props.children)) {
        _loglevel2.default.error('<Translate /> requires a string to be passed as a child in order for it to translate. e.g. <Translate>string_to_translate</Translate>');
        return _react2.default.createElement('span', null);
    }

    if (!hasAccessToD2TranslationFunction(context)) {
        _loglevel2.default.error('<Translate />: d2 is not available on the `context`');
        return _react2.default.createElement('span', null);
    }

    return _react2.default.createElement(
        'span',
        null,
        context.d2.i18n.getTranslation(props.children)
    );
}

exports.default = (0, _addD2Context2.default)(Translate);