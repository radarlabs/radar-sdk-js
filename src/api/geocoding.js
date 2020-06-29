import Http from '../http';
import Navigator from '../navigator';

class Geocoding {
  static async geocode(geocodeOptions={}) {
    const { query, layers } = geocodeOptions;

    return Http.request('GET', 'v1/geocode/forward', { query, layers });
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

    return Http.request('GET', 'v1/geocode/reverse', params);
  }

  static async ipGeocode(geocodeOptions={}) {
    const { ip } = geocodeOptions;

    return Http.request('GET', 'v1/geocode/ip', { ip });
  }
}

export default Geocoding;
