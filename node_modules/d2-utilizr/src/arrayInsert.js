import arrayReplace from './arrayReplace';

/**
 * Insert a value into an array
 *
 * @param {Array} array The array to insert the items into
 * @param {number} index The index where to insert the values
 * @param {*} items The item(s) to insert
 * @returns {Array} The resulting array with the inserted `items`
 *
 * @example
 * const sourceArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
 * sourceArray, undefined, ['a', 'b', 'c']); // Returns: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 'a', 'b', 'c']
 */
export default function arrayInsert(array, index, items) {
    return arrayReplace(array, index, 0, items);
}
