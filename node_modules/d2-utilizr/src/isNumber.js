import numberIsFinite from './numberIsFinite';
/**
 * Check if a value is a number
 *
 * @name isNumber
 * @param param Value that will be checked if it is a number
 * @returns {boolean} Returns true when param is a Number otherwise false
 */
export default function isNumber(param) {
    return typeof param === 'number' && numberIsFinite(param);
}
