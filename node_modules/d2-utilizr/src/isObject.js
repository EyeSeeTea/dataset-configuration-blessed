import _isObject from 'lodash.isobject';
import isArray from './isArray';

/**
 * Check if the value is an Object
 *
 * @param param Value to be checked
 * @returns {boolean} Returns true when the `param` is an Object
 */
export default function isObject(param) {
    return _isObject(param) && !isArray(param);
}
