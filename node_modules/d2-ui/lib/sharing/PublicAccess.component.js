'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _Translate = require('../i18n/Translate.mixin');

var _Translate2 = _interopRequireDefault(_Translate);

var _AccessMaskSwitches = require('./AccessMaskSwitches.component');

var _AccessMaskSwitches2 = _interopRequireDefault(_AccessMaskSwitches);

var _d = require('d2/lib/d2');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_d.config.i18n.strings.add('public_access');

exports.default = (0, _react.createClass)({
    propTypes: Object.assign({}, _AccessMaskSwitches2.default.propTypes),

    mixins: [_Translate2.default],

    render: function render() {
        return _react2.default.createElement(_AccessMaskSwitches2.default, {
            label: this.getTranslation('public_access'),
            accessMask: this.props.publicAccess,
            onChange: this.props.onChange,
            name: 'publicAccess',
            disabled: this.props.disabled
        });
    }
});