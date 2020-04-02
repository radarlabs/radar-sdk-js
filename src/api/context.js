import * as Cookie from '../cookie';
import * as Http from '../http';
import Navigator from '../navigator';

// consts
import STATUS from '../status_codes';

const DEFAULT_HOST = 'https://api.radar.io';

class Context {
  static getContext(callback) {
    Navigator.getCurrentPosition((status, { latitude, longitude }) => {
      if (status !== STATUS.SUCCESS) {
        callback(status);
      }

      this.getContextForLocation({ latitude, longitude },
        (status, context) => {
          callback(status, context);
          return;
        }
      )
    });
  }

  static getContextForLocation({ latitude, longitude }, callback) {
    const publishableKey = Cookie.getCookie(Cookie.PUBLISHABLE_KEY);

    if (!publishableKey) {
      callback(STATUS.ERROR_PUBLISHABLE_KEY);

      return;
    }

    const queryParams = {
      coordinates: `${latitude},${longitude}`,
    };

    const host = Cookie.getCookie(Cookie.HOST) || DEFAULT_HOST;
    const url = `${host}/v1/context`;
    const method = 'GET';
    const headers = {
      Authorization: publishableKey,
    };

    const onSuccess = (response) => {
      try {
        response = JSON.parse(response);

        callback(STATUS.SUCCESS, response.context);
      } catch (e) {
        callback(STATUS.ERROR_SERVER);
      }
    };

    const onError = (error) => {
      callback(error);
    };

    Http.request(method, url, queryParams, headers, onSuccess, onError);
  }
}

export default Context;
