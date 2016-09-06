'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _camelCaseToUnderscores = require('d2-utilizr/lib/camelCaseToUnderscores');

var _camelCaseToUnderscores2 = _interopRequireDefault(_camelCaseToUnderscores);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _Translate = require('../i18n/Translate.mixin');

var _Translate2 = _interopRequireDefault(_Translate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DataTableHeader = _react2.default.createClass({
    displayName: 'DataTableHeader',

    propTypes: {
        isOdd: _react2.default.PropTypes.bool,
        name: _react2.default.PropTypes.string
    },

    mixins: [_Translate2.default],

    render: function render() {
        var classList = (0, _classnames2.default)('data-table__headers__header', {
            'data-table__headers__header--even': !this.props.isOdd,
            'data-table__headers__header--odd': this.props.isOdd
        });

        return _react2.default.createElement(
            'div',
            { className: classList },
            this.props.name ? this.getTranslation((0, _camelCaseToUnderscores2.default)(this.props.name)) : null
        );
    }
});

exports.default = DataTableHeader;