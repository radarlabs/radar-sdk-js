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

    return Http.request('PATCH', `trips/${externalId}`, params);
  }
}

export default Trips;