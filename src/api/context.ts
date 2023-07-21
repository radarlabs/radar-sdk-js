import Config from '../config';
import Http from '../http';
import Navigator from '../navigator';

import type { RadarContextResponse, Location } from '../types';

class ContextAPI {
  public static async getContext(location: Location): Promise<RadarContextResponse> {
    const options = Config.get();

    // get device location if coordinates not provided
    if (!location.latitude || !location.longitude) {
      location = await Navigator.getCurrentPosition();
    }

    const { latitude, longitude, accuracy } = location;

    const response: any = await Http.request({
      method: 'GET',
      path: 'context',
      data: {
        coordinates: `${latitude},${longitude}`,
        accuracy,
      },
    });

    const {
      geofences,
      place,
      country,
      state,
      dma,
      postalCode,
    } = response;

    const contextRes = {
      location,
      geofences,
      place,
      country,
      state,
      dma,
      postalCode,
    } as RadarContextResponse;

    if (options.debug) {
      contextRes.response = response;
    }

    return contextRes;
  }
}

export default ContextAPI;
