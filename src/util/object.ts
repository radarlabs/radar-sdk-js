
// remove fields with undefined values from object
// (top-level only)
export const filterUndefined = (object: any) => {
  const obj: any = {};
  Object.entries(object).forEach(([key, value]) => {
    if (value !== undefined) {
      obj[key] = value;
    }
  });
  return obj;
};

// deep merge nested objects - returns a new object
// (arrays are concatenated)
export const mergeDeep = (target: any, source: any = {}) => {
  let output = Object.assign({}, target);
  for (const key in source) {
    if (source[key] instanceof Object && !Array.isArray(source[key]) && key in target) {
      output[key] = mergeDeep(target[key], source[key]);
    } else if (Array.isArray(source[key]) && Array.isArray(target[key])) {
      output[key] = target[key].concat(source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}
