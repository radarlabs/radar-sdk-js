import Storage from '../storage';
import Http from '../http';

class Trips {

  static async updateTrip(tripOptions={}, status) {

    const {
      externalId,
      destinationGeofenceTag,
      destinationGeofenceExternalId,
      mode,
      metadata,
      approachingThreshold,
    } = tripOptions;

    const params = {
      externalId,
      status,
      destinationGeofenceTag,
      destinationGeofenceExternalId,
      mode,
      metadata,
      approachingThreshold,
    };

    const basePath = Storage.getItem(Storage.BASE_API_PATH) || 'v1';
    return Http.request('PATCH', `${basePath}/trips/${externalId}`, params);
  }
}

export default Trips;
