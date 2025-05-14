import Logger from './logger';

class Storage {

  // local storage key definitions for identifying track users
  public static get USER_ID() {
    return 'radar-userId';
  }
  public static get DEVICE_ID() {
    return 'radar-deviceId';
  }
  public static get INSTALL_ID() {
    return 'radar-installId';
  }
  public static get SESSION_ID() {
    return 'radar-sessionId';
  }
  public static get DESCRIPTION() {
    return 'radar-description';
  }
  public static get METADATA() {
    return 'radar-metadata';
  }
  public static get CACHED_LOCATION() {
    return 'radar-cached-location';
  }
  public static get TRIP_OPTIONS() {
    return 'radar-trip-options';
  }

  public static get PRODUCT() {
    return 'radar-product';
  }

  private static getStorage() {
    const storage = window?.localStorage;
    if (!storage) {
      Logger.warn('localStorage not available.');
    }
    return storage;
  }

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

  public static getJSON(key: string) {
    const item = this.getItem(key)
    if (!item) {
      return null;
    }

    try {
      return JSON.parse(item);
    } catch (err) {
      Logger.warn(`could not getJSON from storage for key: ${key}`);
      return null;
    }
  }

  public static removeItem(key: string) {
    const storage = this.getStorage();
    if (!storage) {
      return null;
    }
    storage.removeItem(key);
  }

  public static clear() {
    const storage = this.getStorage();
    if (!storage) {
      return null;
    }
    storage.clear();
  }
}

export default Storage;
