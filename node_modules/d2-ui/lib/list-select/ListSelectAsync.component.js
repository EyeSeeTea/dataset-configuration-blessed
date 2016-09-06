'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _ListSelect = require('./ListSelect.component');

var _ListSelect2 = _interopRequireDefault(_ListSelect);

var _rx = require('rx');

var _loglevel = require('loglevel');

var _loglevel2 = _interopRequireDefault(_loglevel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ListSelectAsync = _react2.default.createClass({
    displayName: 'ListSelectAsync',

    propTypes: {
        source: _react2.default.PropTypes.instanceOf(_rx.Observable),
        onItemDoubleClick: _react2.default.PropTypes.func.isRequired,
        listStyle: _react2.default.PropTypes.object
    },

    getInitialState: function getInitialState() {
        return {
            listSource: []
        };
    },
    componentWillMount: function componentWillMount() {
        var _this = this;

        if (!this.props.source) {
            return;
        }

        this.disposable = this.props.source.subscribe(function (listValues) {
            return _this.setState({ listSource: listValues });
        }, function (error) {
            return _loglevel2.default.error(error);
        });
    },
    componentWillUnmount: function componentWillUnmount() {
        this.disposable && this.disposable.dispose();
    },
    render: function render() {
        return _react2.default.createElement(_ListSelect2.default, _extends({}, this.props, {
            onItemDoubleClick: this.props.onItemDoubleClick,
            source: this.state.listSource,
            listStyle: this.props.listStyle
        }));
    }
});

exports.default = ListSelectAsync;