import Config from '../config';
import Http from '../http';
import Navigator from '../navigator';

import type { RadarContextResponse, Location } from '../types';

/** @internal context API — use {@link Radar.getContext} instead */
class ContextAPI {
  /**
   * get context (geofences, place, region) for a location
   * @param location - coordinates to get context for
   * @returns geofences, place, country, state, DMA, and postal code
   */
  public static async getContext(location: Location): Promise<RadarContextResponse> {
    const options = Config.get();

    // get device location if coordinates not provided
    if (!location.latitude || !location.longitude) {
      location = await Navigator.getCurrentPosition();
    }

    const { latitude, longitude, accuracy } = location;

    const response = await Http.request<Omit<RadarContextResponse, 'response' | 'location'>>({
      method: 'GET',
      path: 'context',
      data: {
        coordinates: `${latitude},${longitude}`,
        accuracy,
      },
    });

    const { geofences, place, country, state, dma, postalCode } = response;

    const contextRes: RadarContextResponse = {
      location,
      geofences,
      place,
      country,
      state,
      dma,
      postalCode,
    };

    if (options.debug) {
      contextRes.response = response;
    }

    return contextRes;
  }
}

export default ContextAPI;
