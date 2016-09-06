import isArray from './isArray';

/**
 * Create an array from a value
 *
 * @param {*} param Value to transform to an array
 * @param {boolean} [isNewRef] Should return a new reference than the one from the `param` value
 * @returns {Array} The resulting array
 *
 * @requires isArray
 */
export default function arrayFrom(param, isNewRef) {
    var toArray = function(iterable, start, end) {
        if (!iterable || !iterable.length) {
            return [];
        }

        // FIXME: This will never be called as the if check excludes type string
        if (typeof iterable === 'string') {
            iterable = iterable.split('');
        }

        if (supportsSliceOnNodeList) { // FIXME: This does not exist
            return slice.call(iterable, start || 0, end || iterable.length);
        }

        var array = [],
            i;

        // FIXME: start and end are always 0 and iterable.length
        start = start || 0;
        end = end ? ((end < 0) ? iterable.length + end : end) : iterable.length;

        for (i = start; i < end; i++) {
            array.push(iterable[i]);
        }

        return array;
    };

    if (param === undefined || param === null) {
        return [];
    }

    if (isArray(param)) {
        return (isNewRef) ? Array.prototype.slice.call(param) : param;
    }

    var type = typeof param;
    if (param && param.length !== undefined && type !== 'string' && (type !== 'function' || !param.apply)) {
        // TODO: This function call will always fail because of supportsSliceOnNodeList being undefined
        return toArray(param);
    }

    return [param];
}
