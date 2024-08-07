
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

// deep merge nested objects
// (arrays are concatenated
export const mergeDeep = (target: any, source: any = {}) => {
  for (const key in source) {
    if (source[key] instanceof Object && !Array.isArray(source[key]) && key in target) {
      Object.assign(source[key], mergeDeep(target[key], source[key]));
    } else if (Array.isArray(source[key]) && Array.isArray(target[key])) {
      target[key] = target[key].concat(source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}
