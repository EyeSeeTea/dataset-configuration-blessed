import isEmpty from './isEmpty';

/**
 * Cleans the given array of _empty_ values
 *
 * @see {isEmpty} for how the values are determined to be empty.
 *
 * @param {Array} array The array to be _cleaned_
 * @returns {Array} The clean array
 *
 * @throws {TypeError} When the passed array is not actually an array.
 *
 * @example
 * const sourceArray = [undefined, null, true, '', {}];
 * arrayClean(sourceArray); // Returns: [true, {}]
 *
 * @example
 * arrayClean() // throws: Cannot read property 'length' of undefined
 */
// TODO: Could be written as `array.filter(isEmpty);`
export default function arrayClean(array) {
    var results = [],
        i = 0,
        ln = array.length,// TODO: throws if the error is undefined
        item;

    for (; i < ln; i++) {
        item = array[i];

        if (!isEmpty(item)) {
            results.push(item);
        }
    }

    return results;
}
