import Cookie from './cookie';

// consts
import API_HOST from './api_host';
import SDK_VERSION from './version';
import ERROR from './error_codes';

class Http {
  static request(method, path, data) {
    return new Promise((resolve, reject) => {

      const xhr = new XMLHttpRequest();

      let url = `${API_HOST.getHost()}/${path}`;

      // remove undefined values
      let body = {};
      Object.keys(data).forEach((key) => {
        const value = data[key];
        if (value !== undefined) {
          body[key] = value;
        }
      });

      // convert data to querystring for GET
      if (method === 'GET') {
        const params = Object.keys(body).map((key) => (
          `${key}=${encodeURIComponent(body[key])}`
        ));

        if (params.length > 0) {
          const queryString = params.join('&');
          url = `${url}?${queryString}`;
        }

        body = undefined; // dont send body for GET request
      }

      xhr.open(method, url, true);

      const publishableKey = Cookie.getCookie(Cookie.PUBLISHABLE_KEY);
      if (!publishableKey) {
        reject(new Error(ERROR.PUBLISHABLE_KEY));
        return;
      }

      xhr.setRequestHeader('Authorization', publishableKey);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('X-Radar-Device-Type', 'Web');
      xhr.setRequestHeader('X-Radar-SDK-Version', SDK_VERSION);

      xhr.onload = () => {
        try {
          resolve(JSON.parse(xhr.response));
        } catch (e) {
          reject(new Error(ERROR.SERVER));
        }
      }

      xhr.onerror = function() {
        reject(new Error(ERROR.SERVER));
      }

      xhr.timeout = function() {
        reject(new Error(ERROR.NETWORK));
      }

      xhr.send(JSON.stringify(body));
    });
  }
}

export default Http;
