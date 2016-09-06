'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = CurrentIcon;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _IconOption = require('./IconOption.component');

var _IconOption2 = _interopRequireDefault(_IconOption);

var _flatButton = require('material-ui/lib/flat-button');

var _flatButton2 = _interopRequireDefault(_flatButton);

var _Translate = require('../i18n/Translate.component');

var _Translate2 = _interopRequireDefault(_Translate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function CurrentIcon(props) {
    if (!props.imgSrc) {
        return _react2.default.createElement(
            _flatButton2.default,
            { onClick: props.onIconClicked },
            _react2.default.createElement(
                _Translate2.default,
                null,
                'select'
            )
        );
    }

    return _react2.default.createElement(_IconOption2.default, props);
}