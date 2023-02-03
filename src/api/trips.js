import Http from '../http';
import Storage from '../storage';

// https://stackoverflow.com/a/44198641
const isValidDate = (date) => date && Object.prototype.toString.call(date) === '[object Date]' && !isNaN(date);

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
      scheduledArrivalAt,
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

    if (isValidDate(scheduledArrivalAt)) {
      params.scheduledArrivalAt = scheduledArrivalAt.toJSON();
    } else {
      params.scheduledArrivalAt = undefined;
    }

    return Http.request('POST', `trips`, params);
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
      scheduledArrivalAt,
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
      scheduledArrivalAt,
    };

    if (isValidDate(scheduledArrivalAt)) {
      params.scheduledArrivalAt = scheduledArrivalAt.toJSON();
    } else {
      params.scheduledArrivalAt = undefined;
    }

    return Http.request('PATCH', `trips/${externalId}/update`, params);
  }
}

export default Trips;