'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _selectField = require('material-ui/lib/select-field');

var _selectField2 = _interopRequireDefault(_selectField);

var _menuItem = require('material-ui/lib/menus/menu-item');

var _menuItem2 = _interopRequireDefault(_menuItem);

var _Translate = require('../i18n/Translate.mixin');

var _Translate2 = _interopRequireDefault(_Translate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _react2.default.createClass({
    displayName: 'LocaleSelector.component',

    propTypes: {
        value: _react2.default.PropTypes.string,
        locales: _react2.default.PropTypes.arrayOf(_react2.default.PropTypes.shape({
            name: _react2.default.PropTypes.string.isRequired,
            locale: _react2.default.PropTypes.string.isRequired
        })).isRequired,
        onChange: _react2.default.PropTypes.func.isRequired
    },

    mixins: [_Translate2.default],

    render: function render() {
        var localeMenuItems = [{ payload: '', text: '' }].concat(this.props.locales).map(function (locale, index) {
            return _react2.default.createElement(_menuItem2.default, {
                key: index,
                primaryText: locale.name,
                value: locale.locale
            });
        });

        return _react2.default.createElement(
            _selectField2.default,
            _extends({
                fullWidth: true
            }, this.props, {
                value: this.state && this.state.locale,
                hintText: this.getTranslation('select_locale'),
                onChange: this._localeChange
            }),
            localeMenuItems
        );
    },
    _localeChange: function _localeChange(event, index, locale) {
        this.setState({
            locale: locale
        });

        this.props.onChange(locale, event);
    }
});