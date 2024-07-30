
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
