import STATUS from './status_codes';

export function request(method, url, body, headers, successCallback, errorCallback) {
  const xhr = new XMLHttpRequest();

  xhr.open(method, url, true);

  xhr.setRequestHeader('Content-Type', 'application/json');
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
