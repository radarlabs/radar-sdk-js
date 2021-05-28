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

    return Http.request('PATCH', `v1/trips/${externalId}`, params);
  }
}

export default Trips;
