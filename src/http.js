import * as Cookie from './cookie';

// consts
import API_HOST from './api_host';
import SDK_VERSION from './version';
import STATUS from './status_codes';

function _handleResponse(response, jsonKey) {
  if (jsonKey) {
    const res = JSON.parse(response);
    return res[jsonKey];
  }
  return response;
}

export function request(method, path, data, jsonKey, callback) {
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
    callback(STATUS.ERROR_PUBLISHABLE_KEY);
    return;
  }

  xhr.setRequestHeader('Authorization', publishableKey);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('X-Radar-Device-Type', 'Web');
  xhr.setRequestHeader('X-Radar-SDK-Version', SDK_VERSION);

  xhr.onload = () => {
    if (xhr.status == 200) {
      try {
        const response = _handleResponse(xhr.response, jsonKey);
        callback(STATUS.SUCCESS, response);
      } catch (e) {
        callback(STATUS.ERROR_SERVER);
      }
    } else if (xhr.status == 401) {
      callback(STATUS.ERROR_UNAUTHORIZED);
    } else if (xhr.status == 429) {
      callback(STATUS.ERROR_RATE_LIMIT);
    } else {
      callback(STATUS.ERROR_SERVER);
    }
  }

  xhr.onerror = function() {
    callback(STATUS.ERROR_SERVER);
  }

  xhr.timeout = function() {
    callback(STATUS.ERROR_NETWORK);
  }

  xhr.send(JSON.stringify(body));
}
