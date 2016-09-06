'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _Translate = require('../i18n/Translate.mixin');

var _Translate2 = _interopRequireDefault(_Translate);

var _d = require('d2/lib/d2');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_d.config.i18n.strings.add('created_by');

exports.default = (0, _react.createClass)({
    propTypes: {
        user: _react.PropTypes.shape({
            name: _react.PropTypes.string.isRequired
        }).isRequired
    },

    mixins: [_Translate2.default],

    getDefaultProps: function getDefaultProps() {
        return {
            user: {}
        };
    },
    render: function render() {
        var nameToRender = '';
        if (this.props.user && this.props.user.name) {
            nameToRender = this.props.user.name;
        }

        var createdByText = this.getTranslation('created_by') + ': ' + nameToRender;

        return _react2.default.createElement(
            'div',
            null,
            createdByText
        );
    }
});