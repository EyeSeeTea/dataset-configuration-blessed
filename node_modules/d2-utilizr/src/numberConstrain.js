/**
 * Constrains the value between the passed min and max
 *
 * @param {Number} number The value to be constrained
 * @param {Number} min The minumum number that the value should be within
 * @param {Number} max The maximum number that the value should be within
 * @returns {Number|*} The resulting number
 */
export default function numberConstrain(number, min, max) {
    number = parseFloat(number);

    if (!isNaN(min)) {
        number = Math.max(number, min);
    }
    if (!isNaN(max)) {
        number = Math.min(number, max);
    }
    return number;
}
