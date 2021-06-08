import Cookie from '../cookie';
import Http from '../http';

class Trips {

  static async updateTrip(tripOptions={}, status) {

    const {
      externalId,
      destinationGeofenceTag,
      destinationGeofenceExternalId,
      mode,
      metadata,
    } = tripOptions;

    const params = {
      externalId,
      status,
      destinationGeofenceTag,
      destinationGeofenceExternalId,
      mode,
      metadata,
    };

    const basePath = Cookie.getCookie(Cookie.BASE_API_PATH) || 'v1';
    return Http.request('PATCH', `${basePath}/trips/${externalId}`, params);
  }
}

export default Trips;
