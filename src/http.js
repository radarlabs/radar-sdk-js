import SDK_VERSION from './version';
import STATUS from './status_codes';

export function request(method, url, data, headers, successCallback, errorCallback) {
  const xhr = new XMLHttpRequest();

  let body = {};
  if (method === 'GET') {
    const qsArr = [];
    for (let key in data) {
      qsArr.push(`${key}=${data[key]}`);
    }

    if (qsArr.length > 0) {
      const qs = qsArr.join('&');
      url = `${url}?${qs}`;
    }
  } else {
    body = data;
  }

  xhr.open(method, url, true);

  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('X-Radar-Device-Type', 'Web');
  xhr.setRequestHeader('X-Radar-SDK-Version', SDK_VERSION);
  for (let header in headers) {
    xhr.setRequestHeader(header, headers[header]);
  }

  xhr.onload = () => {
    if (xhr.status == 200) {
      successCallback(xhr.response);
    } else if (xhr.status == 401) {
      errorCallback(STATUS.ERROR_UNAUTHORIZED);
    } else if (xhr.status == 429) {
      errorCallback(STATUS.ERROR_RATE_LIMIT);
    } else {
      errorCallback(STATUS.ERROR_SERVER);
    }
  }

  xhr.onerror = function() {
    errorCallback(STATUS.ERROR_SERVER);
  }

  xhr.timeout = function() {
    errorCallback(STATUS.ERROR_NETWORK);
  }

  xhr.send(JSON.stringify(body));
}
