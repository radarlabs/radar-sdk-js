import Config from '../config';
import Http from '../http';
import Navigator from '../navigator';

import type {
  RadarForwardGeocodeParams,
  RadarReverseGeocodeParams,
  RadarGeocodeResponse,
  RadarIPGeocodeResponse,
} from '../types';

/** @internal geocoding API — use Radar.forwardGeocode / reverseGeocode / ipGeocode instead */
class Geocoding {
  /**
   * geocode an address or place name to coordinates
   * @param params - query string, optional layers and country filter
   * @returns matching addresses
   */
  static async forwardGeocode(params: RadarForwardGeocodeParams): Promise<RadarGeocodeResponse> {
    const options = Config.get();

    const { query, layers, country, lang } = params;

    const response = await Http.request<Omit<RadarGeocodeResponse, 'response'>>({
      method: 'GET',
      path: 'geocode/forward',
      data: {
        query,
        layers,
        country,
        lang,
      },
    });

    const forwardGeocodeRes: RadarGeocodeResponse = {
      addresses: response.addresses,
    };

    if (options.debug) {
      forwardGeocodeRes.response = response;
    }

    return forwardGeocodeRes;
  }

  /**
   * reverse geocode coordinates to addresses
   * @param params - latitude/longitude, optional layers filter
   * @returns matching addresses
   */
  static async reverseGeocode(params: RadarReverseGeocodeParams): Promise<RadarGeocodeResponse> {
    const options = Config.get();

    const { layers } = params;
    let { latitude, longitude } = params;

    if (!latitude || !longitude) {
      const location = await Navigator.getCurrentPosition();
      latitude = location.latitude;
      longitude = location.longitude;
    }

    const response = await Http.request<Omit<RadarGeocodeResponse, 'response'>>({
      method: 'GET',
      path: 'geocode/reverse',
      data: {
        coordinates: `${latitude},${longitude}`,
        layers,
      },
    });

    const reverseGeocodeRes: RadarGeocodeResponse = {
      addresses: response.addresses,
    };

    if (options.debug) {
      reverseGeocodeRes.response = response;
    }

    return reverseGeocodeRes;
  }

  /**
   * geocode the device's IP address to a rough location
   * @returns IP address, approximate address, and proxy info
   */
  static async ipGeocode(): Promise<RadarIPGeocodeResponse> {
    const options = Config.get();

    const response = await Http.request<Omit<RadarIPGeocodeResponse, 'response'>>({
      method: 'GET',
      path: 'geocode/ip',
    });

    const ipGeocodeRes: RadarIPGeocodeResponse = {
      ip: response.ip,
      address: response.address,
      proxy: response.proxy,
    };

    if (options.debug) {
      ipGeocodeRes.response = response;
    }

    return ipGeocodeRes;
  }
}

export default Geocoding;
