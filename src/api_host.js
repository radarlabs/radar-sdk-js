import Storage from './storage';

const DEFAULT_HOST = 'https://api.radar.io';

class API_HOST {
  static getHost() {
    return Storage.getItem(Storage.HOST) || DEFAULT_HOST;
  }
}

export default API_HOST;
