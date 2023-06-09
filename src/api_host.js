import Storage from './storage';

export const DEFAULT_HOST = 'https://api.radar.io';
export const DEFAULT_VERIFIED_HOST = 'https://api-verified.radar.io';
export const API_VERSION = 'v1';

class API_HOST {
  static getHost() {
    return Storage.getItem(Storage.HOST) || DEFAULT_HOST;
  }

  static getVerifiedHost() {
    return Storage.getItem(Storage.VERIFIED_HOST) || DEFAULT_VERIFIED_HOST;
  }
}

export default API_HOST;
