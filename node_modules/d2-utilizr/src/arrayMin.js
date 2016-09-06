/**
 * Return the lowest value (number) in the given array
 *
 * @param {Array} array The array to be scanned
 * @returns {Array} The lowest value
 *
 * @throws {TypeError} When the passed array is not actually an array.
 *
 * @example
 * const sourceArray = [3,1,2];
 * arrayMax(sourceArray); // Returns: 1
 *
 * @example
 * arrayClean() // throws: Cannot read property 'length' of undefined
 */
export default function arrayMin(array, comparisonFn) {
    var i = 0,
        ln = array.length,
        item,
        min = array[0];

    for (; i < ln; i++) {
        item = array[i];

        if (comparisonFn) {
            if (comparisonFn(min, item) === 1) {
                min = item;
            }
        }
        else {
            if (item < min) {
                min = item;
            }
        }
    }

    return min;
}
