import Storage from './storage';
import generateUUID from './uuid';

/** device and install ID manager backed by localStorage */
class Device {
  /**
   * get or generate a persistent device ID
   * @returns the device UUID (persisted in localStorage)
   */
  static getDeviceId(): string {
    // use existing deviceId if present
    const deviceId = Storage.getItem(Storage.DEVICE_ID);
    if (deviceId) {
      return deviceId;
    }

    // generate new deviceId
    const uuid = generateUUID();
    Storage.setItem(Storage.DEVICE_ID, uuid);
    return uuid;
  }

  /**
   * get or generate a persistent install ID
   * @returns the install UUID (persisted in localStorage)
   */
  static getInstallId(): string {
    // use existing installId if present
    const deviceId = Storage.getItem(Storage.INSTALL_ID);
    if (deviceId) {
      return deviceId;
    }

    // generate new installId
    const uuid = generateUUID();
    Storage.setItem(Storage.INSTALL_ID, uuid);
    return uuid;
  }
}

export default Device;
