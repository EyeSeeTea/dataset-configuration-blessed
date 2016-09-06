'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _Translate = require('../i18n/Translate.mixin');

var _Translate2 = _interopRequireDefault(_Translate);

var _d = require('d2/lib/d2');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var noop = function noop() {};

_d.config.i18n.strings.add('of_page');

var Pagination = _react2.default.createClass({
    displayName: 'Pagination',

    propTypes: {
        hasPreviousPage: _react2.default.PropTypes.func,
        hasNextPage: _react2.default.PropTypes.func,
        onPreviousPageClick: _react2.default.PropTypes.func,
        onNextPageClick: _react2.default.PropTypes.func,
        total: _react2.default.PropTypes.number,
        currentlyShown: _react2.default.PropTypes.oneOfType([_react2.default.PropTypes.string, _react2.default.PropTypes.number])
    },

    mixins: [_Translate2.default],

    getDefaultProps: function getDefaultProps() {
        return {
            hasPreviousPage: noop,
            hasNextPage: noop,
            onPreviousPageClick: noop,
            onNextPageClick: noop,
            total: 0,
            currentlyShown: 0
        };
    },
    render: function render() {
        var _props = this.props;
        var hasPreviousPage = _props.hasPreviousPage;
        var hasNextPage = _props.hasNextPage;
        var onPreviousPageClick = _props.onPreviousPageClick;
        var onNextPageClick = _props.onNextPageClick;
        var currentlyShown = _props.currentlyShown;
        var total = _props.total;

        var pagerButtonClasses = ['material-icons', 'waves-effect'];

        var previousPageClasses = (0, _classnames2.default)(pagerButtonClasses, { 'data-table-pager--previous-page__disabled': !hasPreviousPage() });
        var nextPageClasses = (0, _classnames2.default)(pagerButtonClasses, { 'data-table-pager--next-page__disabled': !hasNextPage() });

        return _react2.default.createElement(
            'div',
            { className: 'data-table-pager' },
            _react2.default.createElement(
                'ul',
                { className: 'data-table-pager--buttons' },
                total ? _react2.default.createElement(
                    'li',
                    { className: 'data-table-pager--page-info' },
                    _react2.default.createElement(
                        'span',
                        null,
                        currentlyShown,
                        ' ',
                        '' + this.getTranslation('of_page'),
                        ' ',
                        total
                    )
                ) : '',
                _react2.default.createElement(
                    'li',
                    { className: 'data-table-pager--previous-page' },
                    _react2.default.createElement(
                        'i',
                        { className: previousPageClasses,
                            onClick: hasPreviousPage() ? onPreviousPageClick : noop },
                        'navigate_before'
                    )
                ),
                _react2.default.createElement(
                    'li',
                    { className: 'data-table-pager--next-page' },
                    _react2.default.createElement(
                        'i',
                        { className: nextPageClasses,
                            onClick: hasNextPage() ? onNextPageClick : noop },
                        'navigate_next'
                    )
                )
            )
        );
    }
});

exports.default = Pagination;