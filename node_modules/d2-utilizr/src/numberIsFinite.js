/**
 * Check if a number is finite
 *
 * @param param Number to be checked
 * @returns {boolean} Returns true when the `param` is a finite number
 */
export default (Number.isFinite || function(param) {
    return typeof param === 'number' && global.isFinite(param);
})
