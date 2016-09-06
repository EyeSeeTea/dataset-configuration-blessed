'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _circularProgress = require('material-ui/lib/circular-progress');

var _circularProgress2 = _interopRequireDefault(_circularProgress);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _react2.default.createClass({
    displayName: 'LoadingMask.component',

    propTypes: {
        style: _react2.default.PropTypes.object,
        size: _react2.default.PropTypes.number
    },

    getDefaultProps: function getDefaultProps() {
        return {
            style: {},
            size: 1.5
        };
    },
    render: function render() {
        var loadingStatusMask = {
            left: '45%',
            position: 'fixed',
            top: '45%'
        };

        return _react2.default.createElement(_circularProgress2.default, {
            mode: 'indeterminate',
            size: this.props.size,
            style: Object.assign(loadingStatusMask, this.props.style)
        });
    }
});