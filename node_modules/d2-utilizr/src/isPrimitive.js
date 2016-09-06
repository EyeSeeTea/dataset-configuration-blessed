/**
 * Check if a value is a _primitive_ (string, number, boolean)
 *
 * @param {*} param Value to be checked for a primitive type definition.
 * @returns {boolean} Returns `true` if the value is a primitive, otherwise `false`
 */
export default function isPrimitive(param) {
    var type = typeof param;
    return type === 'string' || type === 'number' || type === 'boolean';
}
