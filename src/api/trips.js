import Storage from '../storage';
import Http from '../http';

class Trips {
  static async startTrip(tripOptions={}) {
    const userId = Storage.getItem(Storage.USER_ID);
    const {
      externalId,
      destinationGeofenceTag,
      destinationGeofenceExternalId,
      mode,
      metadata,
      approachingThreshold,
    } = tripOptions;

    const params = {
      userId,
      externalId,
      destinationGeofenceTag,
      destinationGeofenceExternalId,
      mode,
      metadata,
      approachingThreshold,
    };

    const basePath = Storage.getItem(Storage.BASE_API_PATH) || 'v1';
    return Http.request('POST', `${basePath}/trips`, params);
  }

  static async updateTrip(tripOptions={}, status) {
    const userId = Storage.getItem(Storage.USER_ID);
    const {
      externalId,
      destinationGeofenceTag,
      destinationGeofenceExternalId,
      mode,
      metadata,
      approachingThreshold,
    } = tripOptions;

    const params = {
      userId,
      externalId,
      status,
      destinationGeofenceTag,
      destinationGeofenceExternalId,
      mode,
      metadata,
      approachingThreshold,
    };

    const basePath = Storage.getItem(Storage.BASE_API_PATH) || 'v1';
    return Http.request('PATCH', `${basePath}/trips/${externalId}/update`, params);
  }
}

export default Trips;
