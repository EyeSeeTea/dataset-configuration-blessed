'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _AccessMaskSwitches = require('../sharing/AccessMaskSwitches.component');

var _AccessMaskSwitches2 = _interopRequireDefault(_AccessMaskSwitches);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = (0, _react.createClass)({
    propTypes: {
        userGroupAccesses: _react.PropTypes.array,
        onChange: _react.PropTypes.func.isRequired
    },

    getDefaultProps: function getDefaultProps() {
        return {
            userGroupAccesses: [],
            onChange: function onChange() {}
        };
    },
    render: function render() {
        var _this = this;

        var onChange = function onChange(currentItem) {
            // eslint-ignore-line
            return function (newAccessMask) {
                var modifiedUserGroupAccesses = _this.props.userGroupAccesses.map(function (item) {
                    return Object.assign({}, item);
                }).map(function (item) {
                    if (item.id === currentItem.id) {
                        item.access = newAccessMask;
                    }
                    return item;
                });

                _this.props.onChange(modifiedUserGroupAccesses);
            };
        };

        return _react2.default.createElement(
            'div',
            null,
            this.props.userGroupAccesses.map(function (item) {
                return _react2.default.createElement(_AccessMaskSwitches2.default, {
                    accessMask: item.access,
                    name: item.name,
                    label: item.name,
                    onChange: onChange(item)
                });
            })
        );
    }
});