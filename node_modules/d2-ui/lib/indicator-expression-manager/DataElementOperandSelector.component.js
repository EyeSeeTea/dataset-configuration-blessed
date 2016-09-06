'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _ListSelectAsync = require('../list-select/ListSelectAsync.component');

var _ListSelectAsync2 = _interopRequireDefault(_ListSelectAsync);

var _dataElementOperand = require('./dataElementOperand.store');

var _dataElementOperand2 = _interopRequireDefault(_dataElementOperand);

var _dataElementOperandSelector = require('./dataElementOperandSelector.actions');

var _dataElementOperandSelector2 = _interopRequireDefault(_dataElementOperandSelector);

var _textField = require('material-ui/lib/text-field');

var _textField2 = _interopRequireDefault(_textField);

var _linearProgress = require('material-ui/lib/linear-progress');

var _linearProgress2 = _interopRequireDefault(_linearProgress);

var _Pagination = require('../pagination/Pagination.component');

var _Pagination2 = _interopRequireDefault(_Pagination);

var _Translate = require('../i18n/Translate.mixin');

var _Translate2 = _interopRequireDefault(_Translate);

var _d = require('d2/lib/d2');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_d.config.i18n.strings.add('search_by_name');

var DataElementOperandSelector = _react2.default.createClass({
    displayName: 'DataElementOperandSelector',

    propTypes: {
        dataElementOperandSelectorActions: _react2.default.PropTypes.object.isRequired,
        onItemDoubleClick: _react2.default.PropTypes.func.isRequired,
        listStyle: _react2.default.PropTypes.object
    },

    mixins: [_Translate2.default],

    getInitialState: function getInitialState() {
        return {
            isLoading: true,
            pager: {
                hasNextPage: function hasNextPage() {
                    return false;
                },
                hasPreviousPage: function hasPreviousPage() {
                    return false;
                }
            }
        };
    },
    componentWillMount: function componentWillMount() {
        var _this = this;

        if (this.props.dataElementOperandSelectorActions) {
            _dataElementOperandSelector2.default.loadList();
        }

        this.storeObservable = _dataElementOperand2.default.tap(function (collection) {
            return _this.setState({ pager: collection.pager });
        }).map(function (collection) {
            return collection.toArray();
        }).map(function (collection) {
            return collection.map(function (item) {
                return {
                    label: item.displayName,
                    value: item.id
                };
            });
        }).tap(function (value) {
            _this.setState({ isLoading: false });
            return value;
        });

        this.disposable = this.storeObservable.map(function (collection) {
            return collection.pager;
        }).filter(function (pager) {
            return Boolean(pager);
        }).subscribe(function (pager) {
            _this.setState({
                pager: pager
            });
        });
    },
    componentWillUnmount: function componentWillUnmount() {
        this.disposable && this.disposable.dispose();
    },
    getNextPage: function getNextPage() {
        this.setState({ isLoading: true });
        this.props.dataElementOperandSelectorActions.getNextPage(this.state.pager, this.state.searchValue);
    },
    getPreviousPage: function getPreviousPage() {
        this.setState({ isLoading: true });
        this.props.dataElementOperandSelectorActions.getPreviousPage(this.state.pager, this.state.searchValue);
    },
    render: function render() {
        var _this2 = this;

        return _react2.default.createElement(
            'div',
            { className: 'data-element-operand-selector' },
            _react2.default.createElement(
                'div',
                { style: { float: 'right' } },
                _react2.default.createElement(_Pagination2.default, { hasNextPage: function hasNextPage() {
                        return _this2.state.pager.hasNextPage();
                    },
                    hasPreviousPage: function hasPreviousPage() {
                        return _this2.state.pager.hasPreviousPage();
                    },
                    onNextPageClick: this.getNextPage,
                    onPreviousPageClick: this.getPreviousPage
                })
            ),
            _react2.default.createElement(_textField2.default, { style: { marginLeft: '1rem' },
                hintText: this.getTranslation('search_by_name'),
                onChange: this.searchDataElement
            }),
            this.state.isLoading ? _react2.default.createElement(_linearProgress2.default, { mode: 'indeterminate' }) : null,
            _react2.default.createElement(_ListSelectAsync2.default, { size: '12',
                onItemDoubleClick: this.props.onItemDoubleClick,
                source: this.storeObservable,
                listStyle: this.props.listStyle
            })
        );
    },
    searchDataElement: function searchDataElement(event) {
        var _this3 = this;

        var value = event.target.value;
        this.props.dataElementOperandSelectorActions.search(value).subscribe(function () {
            _this3.setState({
                isLoading: false,
                searchValue: value
            });
        });

        this.setState({ isLoading: true });
    }
});

exports.default = DataElementOperandSelector;