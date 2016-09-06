import isString from './isString';
import isNumber from './isNumber';
import isArray from './isArray';
import isObject from './isObject';

export default function arraySort(array, direction, key, emptyFirst) {
    // supports [number], [string], [{key: number}], [{key: string}], [[string]], [[number]]

    if (!isArray(array)) {
        return;
    }

    key = !!key || isNumber(key) ? key : 'name';

    array.sort( function(a, b) {
        // if object, get the property values
        if (isObject(a) && isObject(b)) {
            a = a[key];
            b = b[key];
        }

        // if array, get from the right index
        if (isArray(a) && isArray(b)) {
            a = a[key];
            b = b[key];
        }

        // string
        if (isString(a) && isString(b)) {
            a = a.toLowerCase();
            b = b.toLowerCase();

            if (direction === 'DESC') { // TODO: Case sensitive really required? Why not allow `desc`, `Desc` or `dEsC`?
                return a < b ? 1 : (a > b ? -1 : 0);
            }
            else {
                return a < b ? -1 : (a > b ? 1 : 0);
            }
        }

        // number
        else if (isNumber(a) && isNumber(b)) {
            return direction === 'DESC' ? b - a : a - b;
        }

        else if (a === undefined || a === null) {
            return emptyFirst ? -1 : 1;
        }

        else if (b === undefined || b === null) {
            return emptyFirst ? 1 : -1;
        }

        return -1;
    });

    return array;
}
