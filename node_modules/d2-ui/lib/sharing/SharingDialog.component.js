'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _d = require('d2/lib/d2');

var _dialog = require('material-ui/lib/dialog');

var _dialog2 = _interopRequireDefault(_dialog);

var _flatButton = require('material-ui/lib/flat-button');

var _flatButton2 = _interopRequireDefault(_flatButton);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _Translate = require('../i18n/Translate.mixin');

var _Translate2 = _interopRequireDefault(_Translate);

var _Sharing = require('./Sharing.component');

var _Sharing2 = _interopRequireDefault(_Sharing);

var _sharing = require('./sharing.store');

var _sharing2 = _interopRequireDefault(_sharing);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_d.config.i18n.strings.add('close');
_d.config.i18n.strings.add('sharing_settings');

exports.default = (0, _react.createClass)({
    propTypes: {
        objectToShare: _react.PropTypes.object.isRequired,
        onRequestClose: _react.PropTypes.func.isRequired
    },

    mixins: [_Translate2.default],

    render: function render() {
        var sharingDialogActions = [_react2.default.createElement(_flatButton2.default, {
            label: this.getTranslation('close'),
            onClick: this.closeSharingDialog })];

        return _react2.default.createElement(
            _dialog2.default,
            _extends({
                title: this.getTranslation('sharing_settings'),
                actions: sharingDialogActions,
                autoDetectWindowHeight: true,
                autoScrollBodyContent: true
            }, this.props, {
                onRequestClose: this.closeSharingDialog
            }),
            _react2.default.createElement(_Sharing2.default, { objectToShare: this.props.objectToShare })
        );
    },
    closeSharingDialog: function closeSharingDialog() {
        this.props.onRequestClose(_sharing2.default.getState());
    }
});