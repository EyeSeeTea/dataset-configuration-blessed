'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Translate = {
    contextTypes: {
        d2: _react2.default.PropTypes.object.isRequired
    },

    getTranslation: function getTranslation(key) {
        return this.context.d2.i18n.getTranslation(key);
    }
};

exports.default = Translate;