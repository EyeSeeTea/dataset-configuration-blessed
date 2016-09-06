'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _loglevel = require('loglevel');

var _loglevel2 = _interopRequireDefault(_loglevel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _react2.default.createClass({
    displayName: 'AppWithD2.component',

    propTypes: {
        children: _react2.default.PropTypes.element,
        d2: _react2.default.PropTypes.shape({
            then: _react2.default.PropTypes.func.isRequired
        })
    },

    childContextTypes: {
        d2: _react2.default.PropTypes.object
    },

    getChildContext: function getChildContext() {
        return {
            d2: this.state.d2
        };
    },
    getInitialState: function getInitialState() {
        return {};
    },
    componentDidMount: function componentDidMount() {
        var _this = this;

        if (!this.props.d2) {
            return _loglevel2.default.error('D2 is a required prop to <AppWithD2 />');
        }
        this.props.d2.then(function (d2) {
            return _this.setState({ d2: d2 });
        }).catch(function (error) {
            return _loglevel2.default.error(error);
        });
    },
    render: function render() {
        var _this2 = this;

        var getChildren = function getChildren() {
            if (!_this2.props.children) {
                return null;
            }
            return _react2.default.Children.map(_this2.props.children, function (child) {
                return _react2.default.cloneElement(child);
            });
        };

        return _react2.default.createElement(
            'div',
            null,
            getChildren()
        );
    }
});