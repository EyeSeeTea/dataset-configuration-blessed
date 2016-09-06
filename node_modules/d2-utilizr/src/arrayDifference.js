import arrayUnique from './arrayUnique';
import arrayContains from './arrayContains';

/**
 *
 * @param {Array} array1
 * @param {Array} array2
 * @param {boolean} biDirectional False returns A-B while true returns A-B concat B-A
 * @returns {Array}
 *
 * @throws {TypeError} When `filter` can not be found on `array`. This generally happens when the array is `null` or `undefined`
 *
 * @example
 * const a = [1, 2];
 * const b = [1, 3];
 * difference(a, b) // returns: [2]
 * difference(a, b, true) // returns: [2, 3]
 */
export default function arrayDifference(array1, array2, biDirectional) {
    return arrayUnique(array1.filter(function(item) {
        return !arrayContains(array2, item);
    }).concat(biDirectional === true ? array2.filter(function(item) {
        return !arrayContains(array1, item);
    }) : []));
}
