'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.formulaParser = formulaParser;

var _curry = require('lodash/fp/curry');

var _curry2 = _interopRequireDefault(_curry);

var _compose = require('lodash/fp/compose');

var _compose2 = _interopRequireDefault(_compose);

var _map = require('lodash/fp/map');

var _map2 = _interopRequireDefault(_map);

var _sortBy = require('lodash/fp/sortBy');

var _sortBy2 = _interopRequireDefault(_sortBy);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// parseFormula :: regexp -> formula -> [object]
var parseFormula = (0, _curry2.default)(function parseFormula(regexp, formula) {
    var matches = [];
    var match = void 0;

    while (match = regexp.exec(formula)) {
        matches.push(match);
    }

    return matches;
});

// extractDataElements :: string -> [object]
var extractDataElements = parseFormula(/(#{[A-z0-9]{11}\.?(?:[A-z0-9]{11})?})/g);
// extractOperators :: string -> [object]
var extractOperators = parseFormula(/([+\-/\*]|\[days\])/g);
// extractBrackets :: string -> [object]
var extractBrackets = parseFormula(/([\(\)])/g);
// createFormulaPartObject :: string -> object -> object
var createFormulaPartObject = (0, _curry2.default)(function (entityType, match) {
    return {
        entityType: entityType,
        value: match[1],
        index: match.index
    };
});

function getCharForIndex(index) {
    var alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

    if (index < 26) {
        return alphabet[index];
    }

    return getCharForIndex(Math.floor(index / 26) - 1) + getCharForIndex(index % 26);
}

var addVariableNames = function addVariableNames(parts) {
    return parts.map(function (part, index) {
        return Object.assign({}, part, { displaySubstitute: getCharForIndex(index) });
    });
};

var extractFormulaParts = function extractFormulaParts(formula) {
    return [].concat((0, _compose2.default)(addVariableNames, (0, _map2.default)(createFormulaPartObject('dataElement')), extractDataElements)(formula), (0, _compose2.default)((0, _map2.default)(createFormulaPartObject('operator')), extractOperators)(formula), (0, _compose2.default)((0, _map2.default)(createFormulaPartObject('bracket')), extractBrackets)(formula));
};

var getOrderedFormulaParts = (0, _compose2.default)((0, _sortBy2.default)('index'), extractFormulaParts);

function formulaParser(formula) {
    if (!formula) {
        return [];
    }

    return getOrderedFormulaParts(formula);
}