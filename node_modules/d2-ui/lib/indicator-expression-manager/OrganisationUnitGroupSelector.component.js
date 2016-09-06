'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _ListSelectWithLocalSearch = require('../list-select/ListSelectWithLocalSearch.component');

var _ListSelectWithLocalSearch2 = _interopRequireDefault(_ListSelectWithLocalSearch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _react2.default.createClass({
    displayName: 'OrganisationUnitGroupSelector.component',
    render: function render() {
        return _react2.default.createElement(_ListSelectWithLocalSearch2.default, this.props);
    }
});