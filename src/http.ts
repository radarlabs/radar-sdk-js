import SDK_VERSION from './version';
import Config from './config';
import Logger from './logger';

import {
  RadarBadRequestError,
  RadarDesktopAppError,
  RadarForbiddenError,
  RadarNotFoundError,
  RadarPaymentRequiredError,
  RadarPublishableKeyError,
  RadarRateLimitError,
  RadarServerError,
  RadarTimeoutError,
  RadarUnauthorizedError,
  RadarUnknownError,
} from './errors';

export type HttpMethod = 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE';

interface HttpResponse {
  code: number;
  data: any;
}

class Http {
  static async request({
    method,
    path,
    data,
    host,
  }: {
    method: HttpMethod;
    path: string;
    data?: any;
    host?: string;
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
      const version = options.version;
      let url = `${urlHost}/${version}/${path}`;

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

      const xhr = new XMLHttpRequest();
      xhr.open(method, url, true);

      // set headers
      xhr.setRequestHeader('Authorization', publishableKey);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('X-Radar-Device-Type', 'Web');
      xhr.setRequestHeader('X-Radar-SDK-Version', SDK_VERSION);

      // set custom headers if present
      if (typeof options.getRequestHeaders === 'function') {
        const headers: { [key: string]: string } = options.getRequestHeaders();
        Object.keys(headers || {}).forEach((key) => {
          xhr.setRequestHeader(key, headers[key]);
        });
      }

      xhr.onload = () => {
        let response: any;
        try {
          response = JSON.parse(xhr.response);
        } catch (e) {
          return reject(new RadarServerError(response));
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

      xhr.onerror = function() {
        if (host && host.includes('radar-verify.com:52516')) {
          reject(new RadarDesktopAppError());
        } else {
          reject(new RadarServerError());
        }
      }

      xhr.ontimeout = function() {
        reject(new RadarTimeoutError());
      }

      xhr.send(JSON.stringify(body));
    });
  }
}

export default Http;
