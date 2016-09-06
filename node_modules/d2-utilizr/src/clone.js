// TODO: Throw an error on empty `item` (Unexpected token u)
/**
 * Create a clone a value
 *
 * @param {*} item
 *
 * @example
 * const person1 = {name: 'John'};
 * const person2 = clone(person1); // Returns {name: 'John'}
 * // but
 * person1 !== person2 // Returns:  true
 */
export default function clone(item) {
    return global.JSON.parse(global.JSON.stringify(item));
}
