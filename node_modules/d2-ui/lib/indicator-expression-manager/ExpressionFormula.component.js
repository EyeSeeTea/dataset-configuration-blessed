'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ExpressionFormula = _react2.default.createClass({
    displayName: 'ExpressionFormula',

    propTypes: {
        onFormulaChange: _react2.default.PropTypes.func.isRequired,
        formula: _react2.default.PropTypes.string
    },

    render: function render() {
        var textAreaStyle = {
            margin: 0,
            width: '100%',
            height: 200,
            border: '1px solid #DDD',
            padding: '1rem',
            outline: 'none',
            resize: 'vertical'
        };

        return _react2.default.createElement(
            'div',
            { className: 'expression-formula' },
            _react2.default.createElement('textarea', {
                onChange: this.handleFomulaChange,
                value: this.props.formula,
                style: textAreaStyle
            })
        );
    },
    handleFomulaChange: function handleFomulaChange(event) {
        var formulaValue = event.target.value;

        if (this.props.onFormulaChange) {
            this.props.onFormulaChange(formulaValue);
        }
    }
});

exports.default = ExpressionFormula;