import  Http from '../http';
import Navigator from '../navigator';

class Geocoding {
  static async geocode(geocodeOptions={}) {
    const { query } = geocodeOptions;

    const response = await Http.request('GET', 'v1/geocode/forward', { query });

    return response.addresses;
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

    const response = await Http.request('GET', 'v1/geocode/reverse', params);

    return response.address;
  }

  static async ipGeocode() {
    const response = await Http.request('GET', 'v1/geocode/ip', {});
    return response.address;
  }
}

export default Geocoding;
