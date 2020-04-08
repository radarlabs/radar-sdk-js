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

      let body = {};
      if (method === 'GET') {
        const qsArr = [];
        for (let key in data) {
          qsArr.push(`${key}=${data[key]}`);
        }

        if (qsArr.length > 0) {
          const qs = encodeURIComponent(qsArr.join('&'));
          url = `${url}?${qs}`;
        }
      } else {
        body = data;
      }

      xhr.open(method, url, true);

      const publishableKey = Cookie.getCookie(Cookie.PUBLISHABLE_KEY);
      if (!publishableKey) {
        reject(ERROR.PUBLISHABLE_KEY);
        return;
      }

      xhr.setRequestHeader('Authorization', publishableKey);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('X-Radar-Device-Type', 'Web');
      xhr.setRequestHeader('X-Radar-SDK-Version', SDK_VERSION);

      xhr.onload = () => {
        if (xhr.status == 200) {
          try {
            resolve(JSON.parse(xhr.response));
          } catch (e) {
            reject(ERROR.SERVER);
          }
        } else if (xhr.status == 401) {
          reject(ERROR.UNAUTHORIZED);
        } else if (xhr.status == 429) {
          reject(ERROR.RATE_LIMIT);
        } else {
          reject(ERROR.SERVER);
        }
      }

      xhr.onerror = function() {
        reject(ERROR.SERVER);
      }

      xhr.timeout = function() {
        reject(ERROR.NETWORK);
      }

      xhr.send(JSON.stringify(body));
    });
  }
}

export default Http;
