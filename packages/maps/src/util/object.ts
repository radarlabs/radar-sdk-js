// Fields whose type includes undefined become optional (with undefined stripped);
// fields that can never be undefined stay required.
type Defined<T extends object> = {
  [K in keyof T as undefined extends T[K] ? never : K]: T[K]
} & {
  [K in keyof T as undefined extends T[K] ? K : never]?: Exclude<T[K], undefined>
};

// remove fields with undefined values from object
// (top-level only)
export const filterUndefined = <T extends object>(object: T): Defined<T> => {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(object)) {
    if (value !== undefined) {
      obj[key] = value;
    }
  }
  return obj as Defined<T>;
};

// deep merge nested objects - returns a new object
// (arrays are concatenated)
export const mergeDeep = <T extends object, S extends object>(target: T, source: S = {} as S): T & S => {
  const output = { ...target } as Record<string, unknown>;
  for (const key in source) {
    const srcVal = (source as Record<string, unknown>)[key];
    const tgtVal = (target as Record<string, unknown>)[key];
    if (srcVal instanceof Object && !Array.isArray(srcVal) && key in target) {
      output[key] = mergeDeep(tgtVal as object, srcVal as object);
    } else if (Array.isArray(srcVal) && Array.isArray(tgtVal)) {
      output[key] = tgtVal.concat(srcVal);
    } else {
      output[key] = srcVal;
    }
  }
  return output as T & S;
};
