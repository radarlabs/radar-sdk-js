import Config from './config';
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
  static getPlatform(): string {
    let userAgent = navigator.userAgent;
    if (userAgent) {
      userAgent = userAgent.toLowerCase();
      if (userAgent.includes('macintosh')) {
        return 'MOBILE_IOS';
      } else if (userAgent.includes('windows')) {
        return 'DESKTOP_WINDOWS';
      } else if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) {
        return 'MOBILE_IOS';
      } else if (userAgent.includes('android')) {
        return 'MOBILE_ANDROID';
      }
    }
    return 'OTHER';
  }

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
