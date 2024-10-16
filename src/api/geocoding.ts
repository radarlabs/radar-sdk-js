import Config from '../config';
import Http from '../http';
import Navigator from '../navigator';

import {
  RadarForwardGeocodeParams,
  RadarReverseGeocodeParams,
  RadarGeocodeResponse,
  RadarIPGeocodeResponse,
} from '../types';

class Geocoding {
  static async forwardGeocode(params: RadarForwardGeocodeParams): Promise<RadarGeocodeResponse> {
    const options = Config.get();

    const { query, layers, country, lang } = params;

    const response: any = await Http.request({
      method: 'GET',
      path: 'geocode/forward',
      data: {
        query,
        layers,
        country,
        lang,
      },
    });

    const forwardGeocodeRes = {
      addresses: response.addresses,
    } as RadarGeocodeResponse;

    if (options.debug) {
      forwardGeocodeRes.response = response;
    }

    return forwardGeocodeRes;
  }

  static async reverseGeocode(params: RadarReverseGeocodeParams): Promise<RadarGeocodeResponse> {
    const options = Config.get();

    let { latitude, longitude, layers } = params;

    if (!latitude || !longitude) {
      const location = await Navigator.getCurrentPosition();
      latitude = location.latitude;
      longitude = location.longitude;
    }

    const response: any = await Http.request({
      method: 'GET',
      path: 'geocode/reverse',
      data: {
        coordinates: `${latitude},${longitude}`,
        layers,
      },
    });

    const reverseGeocodeRes = {
      addresses: response.addresses,
    } as RadarGeocodeResponse;

    if (options.debug) {
      reverseGeocodeRes.response = response;
    }

    return reverseGeocodeRes;
  }

  static async ipGeocode(): Promise<RadarIPGeocodeResponse> {
    const options = Config.get();

    const response: any = await Http.request({
      method: 'GET',
      path: 'geocode/ip',
    });

    const ipGeocodeRes = {
      ip: response.ip,
      address: response.address,
      proxy: response.proxy,
    } as RadarIPGeocodeResponse;

    if (options.debug) {
      ipGeocodeRes.response = response;
    }

    return ipGeocodeRes;
  }
}

export default Geocoding;
