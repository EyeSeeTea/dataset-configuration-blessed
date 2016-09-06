'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _checkbox = require('material-ui/lib/checkbox');

var _checkbox2 = _interopRequireDefault(_checkbox);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// TODO: Rewrite as ES6 class
/* eslint-disable react/prefer-es6-class */
exports.default = _react2.default.createClass({
    displayName: 'MultiToggle',

    propTypes: {
        label: _react2.default.PropTypes.string.isRequired,
        onChange: _react2.default.PropTypes.func.isRequired,
        items: _react2.default.PropTypes.arrayOf(_react2.default.PropTypes.shape({
            name: _react2.default.PropTypes.string.isRequired,
            value: _react2.default.PropTypes.bool,
            text: _react2.default.PropTypes.string.isRequired
        })),
        style: _react2.default.PropTypes.object
    },

    contextTypes: {
        muiTheme: _react2.default.PropTypes.object
    },

    getInitialState: function getInitialState() {
        return {
            values: this.props.items.reduce(function (prev, curr) {
                if (curr.value) {
                    prev.push(curr.name);
                }
                return prev;
            }, [])
        };
    },
    _handleToggle: function _handleToggle(value, event, checked) {
        var _this = this;

        this.setState(function (oldState) {
            if (checked) {
                if (oldState.values.indexOf(value) === -1) {
                    oldState.values.push(value);
                }
            } else {
                if (oldState.values.indexOf(value) !== -1) {
                    oldState.values.splice(oldState.values.indexOf(value), 1);
                }
            }
            return oldState;
        }, function () {
            _this.props.onChange({ target: { value: _this.state.values } });
        });
    },
    render: function render() {
        var _this2 = this;

        var style = Object.assign({}, this.context.muiTheme.forms, this.props.style);
        return _react2.default.createElement(
            'div',
            null,
            _react2.default.createElement(
                'div',
                { style: { marginTop: 16, marginBottom: 8 } },
                this.props.label
            ),
            this.props.items.map(function (item) {
                var togglor = _this2._handleToggle.bind(null, item.name);
                return _react2.default.createElement(_checkbox2.default, {
                    key: item.name,
                    name: item.name,
                    value: 'true',
                    defaultChecked: item.value === true,
                    label: item.text,
                    onCheck: togglor,
                    style: style,
                    labelPosition: 'right'
                });
            })
        );
    }
});

// Material UI