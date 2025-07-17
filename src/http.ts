import SDK_VERSION from './version';
import Config from './config';
import Logger from './logger';
import Navigator from './navigator';

import {
  RadarBadRequestError,
  RadarForbiddenError,
  RadarLocationError,
  RadarNetworkError,
  RadarNotFoundError,
  RadarPaymentRequiredError,
  RadarPermissionsError,
  RadarPublishableKeyError,
  RadarRateLimitError,
  RadarServerError,
  RadarUnauthorizedError,
  RadarUnknownError,
  RadarVerifyAppError,
} from './errors';

export type HttpMethod = 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE';

interface HttpResponse {
  code: number;
  data: any;
}

const inFlightRequests = new Map<string, XMLHttpRequest>();

class Http {
  static async request({
    method,
    path,
    data,
    host,
    version,
    headers = {},
    responseType,
    requestId,
  }: {
    method: HttpMethod;
    path: string;
    data?: any;
    host?: string;
    version?: string;
    headers?: Record<string, string>;
    responseType?: XMLHttpRequestResponseType;
    requestId?: string;
  }) {
    return new Promise<HttpResponse>((resolve, reject) => {
      const options = Config.get();

      // check for publishableKey on request
      const publishableKey = options.publishableKey;
      if (!publishableKey) {
        reject(new RadarPublishableKeyError('publishableKey not set.'));
        return;
      }

      // setup request URL
      const urlHost = host || options.host;
      const urlVersion = version || options.version;
      let url = `${urlHost}/${urlVersion}/${path}`;

      // remove undefined values from request data
      let body: any = {};
      Object.keys(data || {}).forEach((key) => {
        const value = data[key];
        if (value !== undefined) {
          body[key] = value;
        }
      });

      // convert data to querystring for GET requests
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

      // check for in-flight requests with matching requestIds
      if (requestId) {
        const request = inFlightRequests.get(requestId);
        if (request) {
          request.abort(); // abort request
        }
      }

      const xhr = new XMLHttpRequest();
      xhr.open(method, url, true);

      // save reference to request
      if (requestId) {
        inFlightRequests.set(requestId, xhr);
      }

      const defaultHeaders = {
        'Authorization': publishableKey,
        'Content-Type': 'application/json',
        'X-Radar-Device-Type': 'Web',
        'X-Radar-SDK-Version': SDK_VERSION,
      };

      // set custom config headers if present
      let configHeaders: { [key: string]: string } = {};
      if (typeof options.getRequestHeaders === 'function') {
        configHeaders = options.getRequestHeaders();
      }

      // combines default headers with custom headers and config headers
      const allHeaders = Object.assign(defaultHeaders, configHeaders, headers);

      // set headers
      Object.keys(allHeaders).forEach((key) => {
        xhr.setRequestHeader(key, allHeaders[key]);
      });

      if (responseType) {
        xhr.responseType = responseType;
      }

      xhr.onload = () => {
        let response: any;

        if (requestId) { // clear in-flight request
          inFlightRequests.delete(requestId);
        }

        try {
          if (xhr.responseType === 'blob') {
            response = { code: xhr.status, data: xhr.response };
          } else {
            response = JSON.parse(xhr.response);
          }
        } catch (e) {
          return reject(new RadarServerError(response));
        }

        const error = response?.meta?.error;
        if (error === 'ERROR_PERMISSIONS') {
          return reject(new RadarPermissionsError('Location permissions not granted.'));
        } else if (error === 'ERROR_LOCATION') {
          return reject(new RadarLocationError('Could not determine location.'));
        } else if (error === 'ERROR_NETWORK') {
          return reject(new RadarNetworkError());
        }

        if (xhr.status == 200) {
          return resolve(response);
        }

        if (options.debug) {
          Logger.debug(`API call failed: ${url}`);
          Logger.debug(JSON.stringify(response));
        }

        if (xhr.status === 400) {
          reject(new RadarBadRequestError(response));

        } else if (xhr.status === 401) {
          reject(new RadarUnauthorizedError(response));

        } else if (xhr.status === 402) {
          reject(new RadarPaymentRequiredError(response));

        } else if (xhr.status === 403) {
          reject(new RadarForbiddenError(response));

        } else if (xhr.status === 404) {
          reject(new RadarNotFoundError(response));

        } else if (xhr.status === 429) {
          reject(new RadarRateLimitError(response));

        } else if (500 <= xhr.status && xhr.status < 600) {
          reject(new RadarServerError(response));

        } else {
          reject(new RadarUnknownError(response));
        }
      }

      xhr.onerror = function () {
        if (host && (host === 'http://localhost:52516' || host === 'https://radar-verify.com:52516')) {
          reject(Navigator.online() ? new RadarVerifyAppError() : new RadarNetworkError());
        } else {
          reject(new RadarNetworkError());
        }
      }

      xhr.ontimeout = function () {
        if (host && (host === 'http://localhost:52516' || host === 'https://radar-verify.com:52516')) {
          reject(Navigator.online() ? new RadarVerifyAppError() : new RadarNetworkError());
        } else {
          reject(new RadarNetworkError());
        }
      }

      xhr.send(JSON.stringify(body));
    });
  }
}

export default Http;
