'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _Translate = require('../i18n/Translate.mixin');

var _Translate2 = _interopRequireDefault(_Translate);

var _menu = require('material-ui/lib/menus/menu');

var _menu2 = _interopRequireDefault(_menu);

var _menuItem = require('material-ui/lib/menus/menu-item');

var _menuItem2 = _interopRequireDefault(_menuItem);

var _fontIcon = require('material-ui/lib/font-icon');

var _fontIcon2 = _interopRequireDefault(_fontIcon);

var _popover = require('material-ui/lib/popover/popover');

var _popover2 = _interopRequireDefault(_popover);

var _paper = require('material-ui/lib/paper');

var _paper2 = _interopRequireDefault(_paper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DataTableContextMenu = _react2.default.createClass({
    displayName: 'DataTableContextMenu',

    propTypes: {
        actions: _react2.default.PropTypes.objectOf(_react2.default.PropTypes.func),
        activeItem: _react2.default.PropTypes.object,
        icons: _react2.default.PropTypes.object,
        target: _react2.default.PropTypes.object
    },

    mixins: [_Translate2.default],

    getDefaultProps: function getDefaultProps() {
        return {
            icons: {},
            actions: {}
        };
    },
    render: function render() {
        var _this = this;

        var actionList = Object.keys(this.props.actions).filter(function (menuActionKey) {
            return typeof _this.props.actions[menuActionKey] === 'function';
        });

        var cmStyle = {
            position: 'fixed'
        };
        return _react2.default.createElement(
            _popover2.default,
            _extends({}, this.props, {
                open: this.props.activeItem ? true : false,
                anchorEl: this.props.target,
                anchorOrigin: { horizontal: 'middle', vertical: 'center' },
                animated: false,
                style: cmStyle,
                animation: _paper2.default
            }),
            _react2.default.createElement(
                _menu2.default,
                { className: 'data-table__context-menu', openDirection: 'bottom-right', desktop: true },
                actionList.map(function (action) {
                    var iconName = _this.props.icons[action] ? _this.props.icons[action] : action;

                    return _react2.default.createElement(_menuItem2.default, { key: action,
                        'data-object-id': _this.props.activeItem && _this.props.activeItem.id,
                        className: 'data-table__context-menu__item',
                        onClick: _this.handleClick.bind(_this, action),
                        primaryText: _this.getTranslation(action),
                        leftIcon: _react2.default.createElement(
                            _fontIcon2.default,
                            { className: 'material-icons' },
                            iconName
                        )
                    });
                })
            )
        );
    },
    handleClick: function handleClick(action) {
        this.props.actions[action].apply(this.props.actions, [this.props.activeItem]);
        this.props.onRequestClose && this.props.onRequestClose();
    }
});

exports.default = DataTableContextMenu;