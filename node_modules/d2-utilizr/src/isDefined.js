/**
 * Check if `param` is defined.
 *
 * @param {*} param The value to check
 * @returns {boolean} Returns `false` when `param` is `undefined` otherwise true.
 */
export default function isDefined(param) {
    return typeof param !== 'undefined';
}
