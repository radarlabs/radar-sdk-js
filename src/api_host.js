import Cookie from './cookie';

const DEFAULT_HOST = 'https://api.radar.io';

class API_HOST {
  static getHost() {
    return Cookie.getCookie(Cookie.HOST) || DEFAULT_HOST;
  }
}

export default API_HOST;
