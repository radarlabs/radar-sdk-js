import Storage from './storage';

const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // fallback for older browsers
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // variant 10

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

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
