import * as Cookie from '../cookie';
import * as Http from '../http';
import Navigator from '../navigator';

// consts
import STATUS from '../status_codes';

const DEFAULT_HOST = 'https://api.radar.io';

class Geocoding {
  static geocode({ query }, callback) {
    const publishableKey = Cookie.getCookie(Cookie.PUBLISHABLE_KEY);

    if (!publishableKey) {
      callback(STATUS.ERROR_PUBLISHABLE_KEY);

      return;
    }

    const queryParams = { query };

    const host = Cookie.getCookie(Cookie.HOST) || DEFAULT_HOST;
    const url = `${host}/v1/geocode/forward`;
    const method = 'GET';
    const headers = {
      Authorization: publishableKey,
    };

    const onSuccess = (response) => {
      try {
        response = JSON.parse(response);

        callback(STATUS.SUCCESS, response.addresses);
      } catch (e) {
        callback(STATUS.ERROR_SERVER);
      }
    };

    const onError = (error) => {
      callback(error);
    };

    Http.request(method, url, queryParams, headers, onSuccess, onError);
  }

  static reverseGeocode(callback) {
    Navigator.getCurrentPosition((status, { latitude, longitude }) => {
      if (status !== STATUS.SUCCESS) {
        callback(status);
        return;
      }

      this.reverseGeocodeLocation(
        { latitude, longitude },
        (status, addresses) => {
          callback(status, addresses);
          return;
        }
      );
    });
  }

  static reverseGeocodeLocation({ latitude, longitude }, callback) {
    const publishableKey = Cookie.getCookie(Cookie.PUBLISHABLE_KEY);

    if (!publishableKey) {
      callback(STATUS.ERROR_PUBLISHABLE_KEY);

      return;
    }

    const queryParams = {
      coordinates: `${latitude},${longitude}`,
    };

    const host = Cookie.getCookie(Cookie.HOST) || DEFAULT_HOST;
    const url = `${host}/v1/geocode/reverse`;
    const method = 'GET';
    const headers = {
      Authorization: publishableKey,
    };

    const onSuccess = (response) => {
      try {
        response = JSON.parse(response);

        callback(STATUS.SUCCESS, response.addresses);
      } catch (e) {
        callback(STATUS.ERROR_SERVER);
      }
    };

    const onError = (error) => {
      callback(error);
    };

    Http.request(method, url, queryParams, headers, onSuccess, onError);
  }

  static ipGeocode(callback) {
    const publishableKey = Cookie.getCookie(Cookie.PUBLISHABLE_KEY);

    if (!publishableKey) {
      callback(STATUS.ERROR_PUBLISHABLE_KEY);

      return;
    }

    const host = Cookie.getCookie(Cookie.HOST) || DEFAULT_HOST;
    const url = `${host}/v1/geocode/ip`;
    const method = 'GET';
    const headers = {
      Authorization: publishableKey,
    };

    const onSuccess = (response) => {
      try {
        response = JSON.parse(response);

        callback(STATUS.SUCCESS, response.country);
      } catch (e) {
        callback(STATUS.ERROR_SERVER);
      }
    }

    const onError = (error) => {
      callback(error);
    };

    Http.request(method, url, {}, headers, onSuccess, onError);
  }
}

export default Geocoding;
