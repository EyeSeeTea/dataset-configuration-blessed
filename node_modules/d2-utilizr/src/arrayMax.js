/**
 * Return the highest value (number) in the given array
 *
 * @param {Array} array The array to be scanned
 * @returns {Array} The highest value
 *
 * @throws {TypeError} When the passed array is not actually an array.
 *
 * @example
 * const sourceArray = [1,3,2];
 * arrayMax(sourceArray); // Returns: 3
 *
 * @example
 * arrayClean() // throws: Cannot read property 'length' of undefined
 */
export default function arrayMax(array, comparisonFn) {
    var i = 0,
        ln = array.length,
        item,
        max = array[0];        

    for (; i < ln; i++) {
        item = array[i];

        if (comparisonFn) {
            if (comparisonFn(max, item) === -1) {
                max = item;
            }
        }
        else {
            if (item > max) {
                max = item;
            }
        }
    }

    return max;
}
