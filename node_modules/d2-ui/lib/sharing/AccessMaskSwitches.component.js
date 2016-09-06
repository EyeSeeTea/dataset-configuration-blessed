'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _Translate = require('../i18n/Translate.mixin');

var _Translate2 = _interopRequireDefault(_Translate);

var _toggle = require('material-ui/lib/toggle');

var _toggle2 = _interopRequireDefault(_toggle);

var _clearfix = require('material-ui/lib/clearfix');

var _clearfix2 = _interopRequireDefault(_clearfix);

var _d = require('d2/lib/d2');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_d.config.i18n.strings.add('can_view');
_d.config.i18n.strings.add('can_edit');

exports.default = (0, _react.createClass)({
    propTypes: {
        accessMask: _react.PropTypes.oneOf(['--------', 'r-------', 'rw------']).isRequired,
        onChange: _react.PropTypes.func.isRequired,
        name: _react.PropTypes.string.isRequired,
        label: _react.PropTypes.string.isRequired,
        style: _react.PropTypes.object,
        disabled: _react.PropTypes.bool
    },

    mixins: [_Translate2.default],

    getDefaultProps: function getDefaultProps() {
        return {
            name: '' + Date.now(), // TODO: Not strictly unique, but perhaps good enough.
            accessMask: '--------'
        };
    },
    getInitialState: function getInitialState() {
        return {
            view: this.hasView(),
            edit: this.hasEdit()
        };
    },
    onChange: function onChange() {
        var viewChar = this.state.view || this.state.edit ? 'r' : '-';
        var editChar = this.state.edit ? 'w' : '-';
        var accessMask = '' + viewChar + editChar + '------';

        if (this.props.onChange) {
            this.props.onChange(accessMask);
        }
    },
    render: function render() {
        var style = Object.assign({
            marginTop: '.5rem',
            paddingTop: '.5rem',
            borderTop: '1px solid #CCC'
        }, this.props.style);

        return _react2.default.createElement(
            'div',
            { style: style, classnName: 'sharing--access-mask-switches' },
            _react2.default.createElement(
                'div',
                null,
                this.props.label
            ),
            _react2.default.createElement(
                _clearfix2.default,
                null,
                _react2.default.createElement(_toggle2.default, {
                    style: {
                        width: '40%',
                        float: 'left'
                    },
                    ref: 'toggleView',
                    name: this.props.name + 'View',
                    label: this.getTranslation('can_view'),
                    checked: this.hasView(),
                    onToggle: this.setView,
                    disabled: this.props.disabled || this.hasEdit()
                }),
                _react2.default.createElement(_toggle2.default, {
                    style: {
                        width: '40%',
                        float: 'right'
                    },
                    ref: 'toggleEdit',
                    name: this.props.name + 'Edit',
                    label: this.getTranslation('can_edit'),
                    checked: this.hasEdit(),
                    onToggle: this.setEdit,
                    disabled: this.props.disabled
                })
            )
        );
    },
    hasView: function hasView() {
        return (/^r/.test(this.props.accessMask)
        );
    },
    setView: function setView() {
        var _this = this;

        this.setState({
            view: !this.state.view
        }, function () {
            return _this.onChange();
        });
    },
    hasEdit: function hasEdit() {
        return (/^rw/.test(this.props.accessMask)
        );
    },
    setEdit: function setEdit() {
        var _this2 = this;

        this.setState({
            view: true,
            edit: !this.state.edit
        }, function () {
            return _this2.onChange();
        });
    }
});