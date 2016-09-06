'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _isObject = require('d2-utilizr/lib/isObject');

var _isObject2 = _interopRequireDefault(_isObject);

var _isString = require('d2-utilizr/lib/isString');

var _isString2 = _interopRequireDefault(_isString);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _iconButton = require('material-ui/lib/icon-button');

var _iconButton2 = _interopRequireDefault(_iconButton);

var _moreVert = require('material-ui/lib/svg-icons/navigation/more-vert');

var _moreVert2 = _interopRequireDefault(_moreVert);

var _Color = require('./data-value/Color.component');

var _Color2 = _interopRequireDefault(_Color);

var _Translate = require('../i18n/Translate.mixin');

var _Translate2 = _interopRequireDefault(_Translate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function valueTypeGuess(valueType, value) {
    switch (valueType) {
        case 'DATE':
            return (0, _moment2.default)(new Date(value)).fromNow();
        case 'TEXT':
            if (/#([a-z0-9]{6})$/i.test(value)) {
                return _react2.default.createElement(_Color2.default, { value: value });
            }
            return value;
        default:
            break;
    }

    return value;
}

function getValueAfterValueTypeGuess(dataSource, columnName) {
    if (dataSource && dataSource.modelDefinition && dataSource.modelDefinition.modelValidations && dataSource.modelDefinition.modelValidations[columnName]) {
        return valueTypeGuess(dataSource.modelDefinition.modelValidations[columnName].type, dataSource[columnName]);
    }

    return dataSource[columnName];
}

var DataTableRow = _react2.default.createClass({
    displayName: 'DataTableRow',

    propTypes: {
        columns: _react2.default.PropTypes.arrayOf(_react2.default.PropTypes.string).isRequired,
        dataSource: _react2.default.PropTypes.object,
        isEven: _react2.default.PropTypes.bool,
        isOdd: _react2.default.PropTypes.bool,
        itemClicked: _react2.default.PropTypes.func.isRequired,
        primaryClick: _react2.default.PropTypes.func.isRequired
    },

    mixins: [_Translate2.default],

    render: function render() {
        var _this = this;

        var classList = (0, _classnames2.default)('data-table__rows__row', {
            'data-table__rows__row--even': !this.props.isOdd,
            'data-table__rows__row--odd': this.props.isOdd
        });

        var columns = this.props.columns.map(function (columnName, index) {
            var rowValue = getValueAfterValueTypeGuess(_this.props.dataSource, columnName);
            var displayValue = void 0;

            // Render objects by name or otherwise by their toString method.
            // ReactElements are also objects but we want to render them out normally, so they are excluded.
            if ((0, _isObject2.default)(rowValue) && !(0, _react.isValidElement)(rowValue)) {
                displayValue = rowValue.displayName || rowValue.name || rowValue.toString();
            } else {
                displayValue = rowValue;
            }

            // TODO: PublicAccess Hack - need to make it so that value transformers can be registered
            if (columnName === 'publicAccess') {
                var dataSource = _this.props.dataSource;

                if (dataSource[columnName]) {
                    if (dataSource[columnName] === 'rw------') {
                        displayValue = _this.getTranslation('public_can_edit');
                    }

                    if (dataSource[columnName] === 'r-------') {
                        displayValue = _this.getTranslation('public_can_view');
                    }

                    if (dataSource[columnName] === '--------') {
                        displayValue = _this.getTranslation('public_none');
                    }
                }
            }

            var textWrapStyle = {
                width: '100%',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                position: 'absolute',
                wordBreak: 'break-all',
                wordWrap: 'break-word',
                top: 0,
                bottom: 0,
                lineHeight: '50px',
                paddingRight: '1rem'
            };

            return _react2.default.createElement(
                'div',
                {
                    key: index,
                    className: 'data-table__rows__row__column',
                    onContextMenu: _this.handleContextClick,
                    onClick: _this.handleClick
                },
                (0, _isString2.default)(displayValue) ? _react2.default.createElement(
                    'span',
                    { title: displayValue, style: textWrapStyle },
                    displayValue
                ) : displayValue
            );
        });
        return _react2.default.createElement(
            'div',
            { className: classList },
            columns,
            _react2.default.createElement(
                'div',
                { className: 'data-table__rows__row__column', style: { width: '1%' } },
                _react2.default.createElement(
                    _iconButton2.default,
                    { tooltip: this.getTranslation('actions'), onClick: this.iconMenuClick },
                    _react2.default.createElement(_moreVert2.default, null)
                )
            )
        );
    },
    iconMenuClick: function iconMenuClick(event) {
        event && event.preventDefault() && event.stopPropagation();
        this.props.itemClicked(event, this.props.dataSource);
    },
    handleContextClick: function handleContextClick(event) {
        event && event.preventDefault();
        this.props.itemClicked(event, this.props.dataSource);
    },
    handleClick: function handleClick() {
        this.props.primaryClick(this.props.dataSource);
    }
});

exports.default = DataTableRow;