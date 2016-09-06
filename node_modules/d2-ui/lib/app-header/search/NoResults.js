'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _d = require('d2/lib/d2');

var _addD2Context = require('../../component-helpers/addD2Context');

var _addD2Context2 = _interopRequireDefault(_addD2Context);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_d.config.i18n.strings.add('no_results_found');

function NoResults(props, _ref) {
    var d2 = _ref.d2;

    return _react2.default.createElement(
        'div',
        null,
        d2.i18n.getTranslation('no_results_found')
    );
}

exports.default = (0, _addD2Context2.default)(NoResults);