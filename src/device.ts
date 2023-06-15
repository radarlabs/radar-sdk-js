import Storage from './storage';

const generateUUID = (): string => {
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const r = Math.random() * 16 | 0;
    const v = (char == 'x') ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });

  return uuid;
};

class Device {
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
