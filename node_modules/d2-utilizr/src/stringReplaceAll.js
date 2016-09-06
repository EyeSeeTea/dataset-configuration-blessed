/**
 * Replace all occurrences of the `matchValue` within the `str` parameter.
 *
 * @param {string} str The string to operate on
 * @param {string} matchValue The value to match on
 * @param {string|function} replaceValue The value to replace the matches with
 * @param {boolean} ignore Case sensitivity ignore flag. Pass `true` to ignore case. (Defaults to `false`)
 * @returns {XML|void|string|*} The resulting string.
 */
export default function stringReplaceAll(str, matchValue, replaceValue, ignore) {
    return str.replace(new RegExp(matchValue.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, "\\$&"), (ignore ? "gi" : "g")), (typeof(replaceValue) == "string") ? replaceValue.replace(/\$/g, "$$$$") : replaceValue);
}
