'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function MainContent(props) {
    var mainContentStyle = {
        marginBottom: '4rem',
        width: '100%'
    };

    return _react2.default.createElement(
        'div',
        { style: mainContentStyle },
        props.children
    );
}
MainContent.propTypes = {
    children: _react2.default.PropTypes.oneOfType([_react2.default.PropTypes.array.isRequired, _react2.default.PropTypes.object.isRequired])
};

exports.default = MainContent;