'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _Translate = require('../i18n/Translate.mixin');

var _Translate2 = _interopRequireDefault(_Translate);

var _toggle = require('material-ui/lib/toggle');

var _toggle2 = _interopRequireDefault(_toggle);

var _d = require('d2/lib/d2');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_d.config.i18n.strings.add('external_access');

exports.default = (0, _react.createClass)({
    propTypes: {
        externalAccess: _react.PropTypes.string.isRequired,
        disabled: _react.PropTypes.bool,
        onChange: _react.PropTypes.func.isRequired
    },

    mixins: [_Translate2.default],

    onToggle: function onToggle() {
        this.props.onChange(this.refs.toggle.isToggled());
    },
    render: function render() {
        return _react2.default.createElement(_toggle2.default, {
            ref: 'toggle',
            name: 'externalAccess',
            label: this.getTranslation('external_access'),
            checked: this.props.externalAccess,
            onToggle: this.onToggle,
            disabled: this.props.disabled
        });
    }
});