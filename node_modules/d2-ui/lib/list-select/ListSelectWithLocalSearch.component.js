'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _textField = require('material-ui/lib/text-field');

var _textField2 = _interopRequireDefault(_textField);

var _Translate = require('../i18n/Translate.mixin');

var _Translate2 = _interopRequireDefault(_Translate);

var _ListSelect = require('../list-select/ListSelect.component');

var _ListSelect2 = _interopRequireDefault(_ListSelect);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _react2.default.createClass({
    displayName: 'ListSelectWithLocalSearch.component',

    propTypes: {
        source: _react2.default.PropTypes.array.isRequired
    },

    mixins: [_Translate2.default],

    getInitialState: function getInitialState() {
        return {
            source: this.props.source || [],
            textSearch: ''
        };
    },
    componentWillReceiveProps: function componentWillReceiveProps(newProps) {
        this.setState({
            source: newProps.source
        });
    },
    render: function render() {
        var _this = this;

        var listStyle = { width: '100%', outline: 'none', border: 'none', padding: '0rem 1rem', overflowX: 'auto' };

        return _react2.default.createElement(
            'div',
            null,
            _react2.default.createElement(_textField2.default, { style: { marginLeft: '1rem' },
                hintText: this.getTranslation('search_by_name'),
                onChange: this._filterList,
                value: this.state.textSearch
            }),
            _react2.default.createElement(_ListSelect2.default, _extends({}, this.props, {
                listStyle: listStyle,
                source: this.state.source.filter(function (option) {
                    return option.label.toLowerCase().indexOf(_this.state.textSearch.toLowerCase()) !== -1;
                }),
                size: '10'
            }))
        );
    },
    _filterList: function _filterList(event) {
        this.setState({
            textSearch: event.target.value
        });
    }
});