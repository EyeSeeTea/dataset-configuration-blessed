'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = IconOption;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _flatButton = require('material-ui/lib/flat-button');

var _flatButton2 = _interopRequireDefault(_flatButton);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function IconOption(props) {
    return _react2.default.createElement(
        _flatButton2.default,
        { onClick: function onClick(event) {
                return props.onIconClicked(event, props.value);
            } },
        _react2.default.createElement('img', { src: props.imgSrc })
    );
}