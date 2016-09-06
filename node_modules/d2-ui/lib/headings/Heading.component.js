'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function Heading(props) {
    var level = props.level;
    var text = props.text;
    var style = props.style;
    var children = props.children;

    var other = _objectWithoutProperties(props, ['level', 'text', 'style', 'children']);

    var tag = { type: level <= 6 ? 'h' + level : 'span' };
    var headingStyle = _extends({
        fontSize: 24,
        fontWeight: 300,
        color: 'rgba(0, 0, 0, 0.87)',
        padding: '16px 0 5px 0',
        margin: 0
    }, style);

    return _react2.default.createElement(
        tag.type,
        _extends({}, other, { style: headingStyle }),
        children || text
    );
}
Heading.propTypes = {
    level: _react.PropTypes.oneOf([1, 2, 3, 4, 5, 6]),
    text: _react.PropTypes.string
};
Heading.defaultProps = {
    level: 1
};

exports.default = Heading;