'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setDialogStateToAction = undefined;

var _Action = require('../action/Action');

var _Action2 = _interopRequireDefault(_Action);

var _LegendItem = require('./LegendItem.store');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var setDialogStateToAction = exports.setDialogStateToAction = _Action2.default.create('setDialogStateToAction'); // name in debug

setDialogStateToAction.subscribe(function (action) {
  return (0, _LegendItem.setDialogStateTo)(action.data);
});