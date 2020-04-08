import Http from '../http';
import Navigator from '../navigator';

class Geocoding {
  static async geocode(geocodeOptions={}) {
    const { query } = geocodeOptions;

    return Http.request('GET', 'v1/geocode/forward', { query });
  }

  static async reverseGeocode(geocodeOptions={}) {
    if (!geocodeOptions.latitude || !geocodeOptions.longitude) {
      const { latitude, longitude } = await Navigator.getCurrentPosition();
      geocodeOptions.latitude = latitude;
      geocodeOptions.longitude = longitude;
    }

    const { latitude, longitude } = geocodeOptions;

    const params = {
      coordinates: `${latitude},${longitude}`,
    };

    return Http.request('GET', 'v1/geocode/reverse', params);
  }

  static async ipGeocode() {
    return Http.request('GET', 'v1/geocode/ip', {});
  }
}

export default Geocoding;
