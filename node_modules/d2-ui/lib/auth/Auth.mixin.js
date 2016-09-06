'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Auth = {
    contextTypes: {
        d2: _react2.default.PropTypes.object.isRequired
    },

    getCurrentUser: function getCurrentUser() {
        return this.context.d2.currentUser;
    },
    getModelDefinitionByName: function getModelDefinitionByName(modelType) {
        return this.context.d2.models[modelType];
    }
};

exports.default = Auth;