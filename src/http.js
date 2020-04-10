import Cookie from './cookie';

// consts
import API_HOST from './api_host';
import SDK_VERSION from './version';
import STATUS from './status';

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
        reject(STATUS.ERROR_PUBLISHABLE_KEY);
        return;
      }

      xhr.setRequestHeader('Authorization', publishableKey);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('X-Radar-Device-Type', 'Web');
      xhr.setRequestHeader('X-Radar-SDK-Version', SDK_VERSION);

      xhr.onload = () => {
        let response;
        try {
          response = JSON.parse(xhr.response);
        } catch (e) {
          reject(STATUS.ERROR_SERVER);
        }

        if (xhr.status == 200) {
          resolve(response);

        } else if (xhr.status === 400) {
          reject({ httpError: STATUS.ERROR_BAD_REQUEST, response });

        } else if (xhr.status === 401) {
          reject({ httpError: STATUS.ERROR_UNAUTHORIZED, response });

        } else if (xhr.status === 402) {
          reject({ httpError: STATUS.ERROR_PAYMENT_REQUIRED, response });

        } else if (xhr.status === 403) {
          reject({ httpError: STATUS.ERROR_FORBIDDEN, response });

        } else if (xhr.status === 404) {
          reject({ httpError: STATUS.ERROR_NOT_FOUND, response });

        } else if (xhr.status === 429) {
          reject({ httpError: STATUS.ERROR_RATE_LIMIT, response });

        } else if (500 <= xhr.status && xhr.status < 600) {
          reject({ httpError: STATUS.ERROR_SERVER, response });

        } else {
          reject({ httpError: STATUS.ERROR_UNKNOWN, response });
        }
      }

      xhr.onerror = function() {
        reject(STATUS.ERROR_SERVER);
      }

      xhr.timeout = function() {
        reject(STATUS.ERROR_NETWORK);
      }

      xhr.send(JSON.stringify(body));
    });
  }
}

export default Http;
