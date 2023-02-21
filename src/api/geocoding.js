import Http from '../http';
import Navigator from '../navigator';

class Geocoding {
  static async geocode(geocodeOptions={}) {
    const { query, layers, country } = geocodeOptions;

    return Http.request('GET', 'geocode/forward', { query, layers, country });
  }

  static async reverseGeocode(geocodeOptions={}) {
    if (!geocodeOptions.latitude || !geocodeOptions.longitude) {
      const { latitude, longitude } = await Navigator.getCurrentPosition();
      geocodeOptions.latitude = latitude;
      geocodeOptions.longitude = longitude;
    }

    const { latitude, longitude, layers } = geocodeOptions;

    const params = {
      coordinates: `${latitude},${longitude}`,
      layers,
    };

    return Http.request('GET', 'geocode/reverse', params);
  }

  static async ipGeocode() {
    return Http.request('GET', 'geocode/ip');
  }
}

export default Geocoding;
