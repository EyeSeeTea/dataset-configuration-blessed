/**
 * Creates an array of unique values from the array passed. This function does not do a _deep_ compare.
 * Objects with the same values will therefore not be filtered.
 *
 * @param {Array} array The array to create the array of uniques from
 * @returns {Array} The array containing the unique values
 *
 * @throws {TypeError} Is thrown when the argument passed is not an `array`
 *
 * @example
 * const sourceArray = [1, 1, 2, 3, 2, 4, 4, 3];
 * arrayUnique(sourceArray); // returns: [1, 2, 3, 4]
 *
 * @example
 * const A = {name: 'A'};
 * const B = {name: 'B'};
 * arrayUnique([A, A, B, B]); // Returns: [{name: 'A'}, {name: 'B'}]
 *
 * @example
 * const sourceArray = [{name: 'A'}, {name: 'B'}, {name: 'B'}];
 * arrayUnique(sourceArray); // Returns: [{name: 'A'}, {name: 'B'}, {name: 'B'}]
 */
export default function arrayUnique(array) {
    // TODO: Could be written as `return [...(new Set(array))];`
    var newArray = [];
    var i = 0;
    var len = array.length;
    var item;

    for (; i < len; i++) {
        item = array[i];

        if (newArray.indexOf(item) === -1) {
            newArray.push(item);
        }
    }

    return newArray;
}
