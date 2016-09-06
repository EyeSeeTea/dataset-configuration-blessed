import isArray from './isArray';
import isMap from 'lodash.ismap';
import isSet from 'lodash.isset';

/**
 * Check if a value is concidered _empty_. An _empty_ value is an empty `Set`, `Map` or `Array`.
 * Depending on if the `allowEmptyString` flag, empty strings are also considered _empty_
 *
 * @param {*} param Value to check
 * @param {boolean} allowEmptyString When set to true an empty string will not be considered _empty_.
 * @returns {boolean} Returns `true` when the value is _empty_, otherwise false
 *
 * @example
 * isEmpty(''); // Returns: true
 * isEmpty('', true); // Returns: false
 * isEmpty(null); // Returns: true
 * isEmpty(new Map()); // Returns: true
 */
export default function isEmpty(param, allowEmptyString) {
    return (param == null) ||
        (!allowEmptyString ? param === '' : false) ||
        (isArray(param) && param.length === 0) ||
        ((isMap(param) || isSet(param)) && param.size === 0);
}
