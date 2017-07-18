import _ from 'lodash';
import fp from 'lodash/fp';

function deepMerge(object, source) {
    return _.mergeWith(object, source, function(objValue, srcValue) {
        if (_.isObject(objValue) && srcValue) {
            return deepMerge(objValue, srcValue);
        }
    });
}

function cartesianProduct(...rest) {
    return fp.reduce((a, b) =>
        fp.flatMap(x =>
            fp.map(y => x.concat([y]))(b)
        )(a)
    )([[]])(rest);
}

function groupConsecutive(xs) {
  return _(xs).reduce((acc, x) => {
    if (_.isEmpty(acc)) {
      return acc.concat([[x]]);
    } else {
      const last = _.last(acc);
      if (_.last(last) === x) {
        last.push(x);
        return acc;
      } else {
        return acc.concat([[x]]);
      }
    }
  },
  [])
}

export {
    deepMerge,
    cartesianProduct,
    groupConsecutive,
};