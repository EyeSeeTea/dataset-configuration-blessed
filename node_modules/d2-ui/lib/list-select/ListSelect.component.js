'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _react2.default.createClass({
    displayName: 'ListSelect.component',

    propTypes: {
        source: _react2.default.PropTypes.arrayOf(_react2.default.PropTypes.shape({
            label: _react2.default.PropTypes.string,
            value: _react2.default.PropTypes.string
        })).isRequired,
        onItemDoubleClick: _react2.default.PropTypes.func.isRequired,
        listStyle: _react2.default.PropTypes.object,
        size: _react2.default.PropTypes.number
    },

    render: function render() {
        var _this = this;

        return _react2.default.createElement(
            'div',
            { className: 'list-select' },
            _react2.default.createElement(
                'select',
                { size: this.props.size || 15, style: Object.assign({ overflowX: 'auto' }, this.props.listStyle) },
                this.props.source.map(function (item) {
                    return _react2.default.createElement(
                        'option',
                        { style: { padding: '.25rem' }, onDoubleClick: _this.listItemDoubleClicked, value: item.value },
                        item.label
                    );
                })
            )
        );
    },
    listItemDoubleClicked: function listItemDoubleClicked(event) {
        var clickedItemValue = event.target.value;

        if (this.props.onItemDoubleClick) {
            this.props.onItemDoubleClick(clickedItemValue);
        }
    }
});