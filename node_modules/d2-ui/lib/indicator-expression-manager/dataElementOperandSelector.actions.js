'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Action = require('../action/Action');

var _Action2 = _interopRequireDefault(_Action);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var dataElementOperandSelectorActions = _Action2.default.createActionsFromNames(['search', 'loadList', 'getNextPage', 'getPreviousPage']);

exports.default = dataElementOperandSelectorActions;