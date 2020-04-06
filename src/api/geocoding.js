import * as Http from '../http';
import Navigator from '../navigator';

// consts
import STATUS from '../status_codes';

class Geocoding {
  static geocode({ query }, callback) {
    const queryParams = { query };

    Http.request('GET', 'v1/geocode/forward', queryParams,
      (status, response) => {
        callback(status, response ? response.addresses : null);
        return;
      }
    );
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

    Http.request('GET', 'v1/geocode/reverse', queryParams,
      (status, response) => {
        callback(status, response ? response.addresses : null);
        return;
      }
    );
  }

  static ipGeocode(callback) {
    Http.request('GET', 'v1/geocode/ip', {},
      (status, response) => {
        callback(status, response ? response.address : null);
        return;
      }
    );
  }
}

export default Geocoding;
