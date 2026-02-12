import Logger from './logger';

/** typed localStorage wrapper with `radar-*` namespaced keys */
class Storage {
  /** localStorage key for user ID */
  public static get USER_ID() {
    return 'radar-userId';
  }
  /** localStorage key for device ID */
  public static get DEVICE_ID() {
    return 'radar-deviceId';
  }
  /** localStorage key for install ID */
  public static get INSTALL_ID() {
    return 'radar-installId';
  }
  /** localStorage key for session ID */
  public static get SESSION_ID() {
    return 'radar-sessionId';
  }
  /** localStorage key for user description */
  public static get DESCRIPTION() {
    return 'radar-description';
  }
  /** localStorage key for user metadata */
  public static get METADATA() {
    return 'radar-metadata';
  }
  /** localStorage key for cached location */
  public static get CACHED_LOCATION() {
    return 'radar-cached-location';
  }
  /** localStorage key for trip options */
  public static get TRIP_OPTIONS() {
    return 'radar-trip-options';
  }

  /** localStorage key for product identifier */
  public static get PRODUCT() {
    return 'radar-product';
  }

  /** @internal get the underlying localStorage instance */
  private static getStorage() {
    const storage = window?.localStorage;
    if (!storage) {
      Logger.warn('localStorage not available.');
    }
    return storage;
  }

  /**
   * store a string value in localStorage
   * @param key - the storage key
   * @param value - the string value to store
   */
  public static setItem(key: string, value: string) {
    const storage = this.getStorage();
    if (!storage) {
      return;
    }
    if (value === undefined || value === null) {
      return;
    }
    storage.setItem(key, value);
  }

  /**
   * retrieve a string value from localStorage
   * @param key - the storage key
   * @returns the stored value, or null if not found
   */
  public static getItem(key: string) {
    const storage = this.getStorage();
    if (!storage) {
      return null;
    }
    const value = storage.getItem(key);
    if (value !== undefined && value !== null) {
      return value;
    }
    return null;
  }

  /**
   * retrieve and parse a JSON value from localStorage
   * @param key - the storage key
   * @returns the parsed object, or null if not found or parse fails
   */
  public static getJSON(key: string) {
    const item = this.getItem(key);
    if (!item) {
      return null;
    }

    try {
      return JSON.parse(item);
    } catch {
      Logger.warn(`could not getJSON from storage for key: ${key}`);
      return null;
    }
  }

  /**
   * remove an item from localStorage
   * @param key - the storage key to remove
   */
  public static removeItem(key: string) {
    const storage = this.getStorage();
    if (!storage) {
      return null;
    }
    storage.removeItem(key);
  }

  /** clear all localStorage entries */
  public static clear() {
    const storage = this.getStorage();
    if (!storage) {
      return null;
    }
    storage.clear();
  }
}

export default Storage;
