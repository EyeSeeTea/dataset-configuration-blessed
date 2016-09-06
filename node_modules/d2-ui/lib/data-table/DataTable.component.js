'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _isArrayOfStrings = require('d2-utilizr/lib/isArrayOfStrings');

var _isArrayOfStrings2 = _interopRequireDefault(_isArrayOfStrings);

var _isIterable = require('d2-utilizr/lib/isIterable');

var _isIterable2 = _interopRequireDefault(_isIterable);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _DataTableHeader = require('./DataTableHeader.component');

var _DataTableHeader2 = _interopRequireDefault(_DataTableHeader);

var _DataTableRow = require('./DataTableRow.component');

var _DataTableRow2 = _interopRequireDefault(_DataTableRow);

var _DataTableContextMenu = require('./DataTableContextMenu.component');

var _DataTableContextMenu2 = _interopRequireDefault(_DataTableContextMenu);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DataTable = _react2.default.createClass({
    displayName: 'DataTable',

    propTypes: {
        contextMenuActions: _react2.default.PropTypes.object,
        contextMenuIcons: _react2.default.PropTypes.object,
        primaryAction: _react2.default.PropTypes.func,
        isContextActionAllowed: _react2.default.PropTypes.func
    },

    getInitialState: function getInitialState() {
        return this.getStateFromProps(this.props);
    },
    componentWillReceiveProps: function componentWillReceiveProps(newProps) {
        this.setState(this.getStateFromProps(newProps));
    },
    getStateFromProps: function getStateFromProps(props) {
        var dataRows = [];

        if ((0, _isIterable2.default)(props.rows)) {
            dataRows = props.rows instanceof Map ? Array.from(props.rows.values()) : props.rows;
        }

        return {
            columns: (0, _isArrayOfStrings2.default)(props.columns) ? props.columns : ['name', 'lastUpdated'],
            dataRows: dataRows
        };
    },
    renderContextMenu: function renderContextMenu() {
        var _this = this;

        var actionAccessChecker = this.props.isContextActionAllowed && this.props.isContextActionAllowed.bind(null, this.state.activeRow) || function () {
            return true;
        };

        var actionsToShow = Object.keys(this.props.contextMenuActions || {}).filter(actionAccessChecker).reduce(function (availableActions, actionKey) {
            availableActions[actionKey] = _this.props.contextMenuActions[actionKey];
            return availableActions;
        }, {});

        return _react2.default.createElement(_DataTableContextMenu2.default, {
            target: this.state.contextMenuTarget,
            onRequestClose: this._hideContextMenu,
            actions: actionsToShow,
            activeItem: this.state.activeRow,
            icons: this.props.contextMenuIcons
        });
    },
    renderHeaders: function renderHeaders() {
        return this.state.columns.map(function (headerName, index) {
            return _react2.default.createElement(_DataTableHeader2.default, { key: index, isOdd: Boolean(index % 2), name: headerName });
        });
    },
    renderRows: function renderRows() {
        var _this2 = this;

        return this.state.dataRows.map(function (dataRowsSource, dataRowsId) {
            return _react2.default.createElement(_DataTableRow2.default, {
                key: dataRowsId,
                dataSource: dataRowsSource,
                columns: _this2.state.columns,
                isActive: _this2.state.activeRow === dataRowsId,
                itemClicked: _this2.handleRowClick,
                primaryClick: _this2.props.primaryAction || function () {}
            });
        });
    },
    render: function render() {
        return _react2.default.createElement(
            'div',
            { className: 'data-table' },
            _react2.default.createElement(
                'div',
                { className: 'data-table__headers' },
                this.renderHeaders(),
                _react2.default.createElement(_DataTableHeader2.default, null)
            ),
            _react2.default.createElement(
                'div',
                { className: 'data-table__rows' },
                this.renderRows()
            ),
            this.renderContextMenu()
        );
    },
    handleRowClick: function handleRowClick(event, rowSource) {
        this.setState({
            contextMenuTarget: event.currentTarget,
            showContextMenu: true,
            activeRow: rowSource !== this.state.activeRow ? rowSource : undefined
        });
    },
    _hideContextMenu: function _hideContextMenu() {
        this.setState({
            activeRow: undefined,
            showContextMenu: false
        });
    }
});

exports.default = DataTable;