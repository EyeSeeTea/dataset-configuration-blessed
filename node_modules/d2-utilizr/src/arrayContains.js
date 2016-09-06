/**
 * Check if an array contains a specified item
 *
 * @param {Array} array The array to check for the item
 * @param {*} item The item to look for in the array
 * @returns {boolean} Returns true when the item is found, otherwise false
 */
export default function arrayContains(array, item) {
    return Array.prototype.indexOf.call(array, item) !== -1;
}
