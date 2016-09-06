'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _flatButton = require('material-ui/lib/flat-button');

var _flatButton2 = _interopRequireDefault(_flatButton);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ExpressionOperators = _react2.default.createClass({
    displayName: 'ExpressionOperators',

    propTypes: {
        operatorClicked: _react2.default.PropTypes.func.isRequired
    },

    render: function render() {
        var classList = (0, _classnames2.default)('expression-operators');

        var operatorButtonStyle = {
            minWidth: 50
        };

        return _react2.default.createElement(
            'div',
            { className: classList },
            _react2.default.createElement(
                _flatButton2.default,
                { style: operatorButtonStyle, onClick: this.createOperatorClick('(') },
                '('
            ),
            _react2.default.createElement(
                _flatButton2.default,
                { style: operatorButtonStyle, onClick: this.createOperatorClick(')') },
                ')'
            ),
            _react2.default.createElement(
                _flatButton2.default,
                { style: operatorButtonStyle, onClick: this.createOperatorClick(' * ') },
                '*'
            ),
            _react2.default.createElement(
                _flatButton2.default,
                { style: operatorButtonStyle, onClick: this.createOperatorClick(' / ') },
                '/'
            ),
            _react2.default.createElement(
                _flatButton2.default,
                { style: operatorButtonStyle, onClick: this.createOperatorClick(' + ') },
                '+'
            ),
            _react2.default.createElement(
                _flatButton2.default,
                { style: operatorButtonStyle, onClick: this.createOperatorClick(' - ') },
                '-'
            ),
            _react2.default.createElement(
                _flatButton2.default,
                { style: operatorButtonStyle, onClick: this.createOperatorClick(' [days] ') },
                'Days'
            )
        );
    },
    createOperatorClick: function createOperatorClick(operatorValue) {
        return function operatorButtonClick() {
            this.props.operatorClicked(operatorValue);
        }.bind(this);
    }
});

exports.default = ExpressionOperators;