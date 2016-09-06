import isString from 'lodash.isstring';

/**
 *
 * @param checkForIterator The value that should be checked
 * @returns {boolean} Returns `true` when the value is iterable, otherwise false.
 *
 * @example
 * isIterable('My value'); // Returns:  true
 *
 * @example
 * isIterable([1, 2, 3]); // Returns: true
 *
 * @example
 * isIterable({}); // Returns: false
 *
 * @example
 * let iterableObject = {
 *     [Symbol.iterator]: () => {}
 * };
 * isIterable(iterableObject); // Returns: true
 */
export default function isIterable(checkForIterator) {
    return Boolean((checkForIterator || isString(checkForIterator)) && checkForIterator[Symbol.iterator]);
}
