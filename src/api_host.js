import SessionStorage from './sessionStorage';

const DEFAULT_HOST = 'https://api.radar.io';

class API_HOST {
  static getHost() {
    return SessionStorage.getSessionStorage(SessionStorage.HOST) || DEFAULT_HOST;
  }
}

export default API_HOST;
