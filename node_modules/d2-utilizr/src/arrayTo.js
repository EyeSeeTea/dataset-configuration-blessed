import isArray from './isArray';
import isObject from './isObject';
import isString from './isString';

/**
 * Create an array from the passed `param`. (When the value is an object only takes the iterable properties from the object (not its prototypes))
 *
 * @param {Object|String|Array} param The value to transform to an array
 * @returns {Array} Returns the `param` transformed into an array, or an empty array of the value can not be transformed.
 *
 * @example
 * arrayTo('myData') // Returns: ['myData']
 *
 * @example
 * const sourceObject = {
 *     name: 'ANC First Visit',
 *     shortName: 'ANC1',
 *     level: 1,
 * };
 * arrayTo(sourceObject); // Returns: ['ANC First Visit', 'ANC1', 1]
 *
 * @example
 * arrayTo(null); // Returns: []
 */
export default function arrayTo(param) {
    if (isArray(param)) {
        return param;
    }

    if (isObject(param)) {
        var a = [];
        for (var key in param) {
            if (param.hasOwnProperty(key)) {
                a.push(param[key]);
            }
        }
        return a;
    }

    if (isString(param)) {
        return param.split();
    }

    return [];
}
