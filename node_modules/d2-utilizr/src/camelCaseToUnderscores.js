/**
 * Convert a camelCase word to its underscore_case equivalent
 *
 * @name camelCaseToUnderscores
 * @param {string} wordToTransform The string to transform.
 * @returns {string} The wordToTransform as a underscore separated string eg. camelCase -> camel_case
 *
 * @example
 * const word = 'HelloMyAmazingWorld';
 * camelCaseToUnderscores(word); // Returns: 'hello_my_amazing_world'
 */
export default function camelCaseToUnderscores(wordToTransform) {
    return wordToTransform
        .replace(/[a-z][A-Z]/g, (match) => [match.charAt(0), match.charAt(1)].join('_'))
        .toLowerCase();
}
