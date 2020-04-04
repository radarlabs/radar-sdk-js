import * as Http from '../http';
import Navigator from '../navigator';

// consts
import STATUS from '../status_codes';

class Geocoding {
  static geocode({ query }, callback) {
    const queryParams = { query };

    const path = `v1/geocode/forward`;
    const method = 'GET';

    const httpCallback = (status, response) => {
      callback(status, response);
      return;
    };

    Http.request(method, path, queryParams, 'addresses', httpCallback);
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
    const queryParams = {
      coordinates: `${latitude},${longitude}`,
    };

    const path = `v1/geocode/reverse`;
    const method = 'GET';

    const httpCallback = (status, response) => {
      callback(status, response);
      return;
    };

    Http.request(method, path, queryParams, 'addresses', httpCallback);
  }

  static ipGeocode(callback) {
    const path = `v1/geocode/ip`;
    const method = 'GET';

    const httpCallback = (status, response) => {
      callback(status, response);
      return;
    };

    Http.request(method, path, {}, 'address', httpCallback);
  }
}

export default Geocoding;
