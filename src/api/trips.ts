import Config from '../config';
import Http from '../http';
import Logger from '../logger';
import Storage from '../storage';

import type { RadarTripOptions, RadarTripStatus, RadarTripResponse } from '../types';

// https://stackoverflow.com/a/44198641
const isValidDate = (date: any): Date | undefined => date && Object.prototype.toString.call(date) === '[object Date]' && !isNaN(date);

class TripsAPI {
  static setTripOptions(tripOptions?: RadarTripOptions) {
    if (!tripOptions) {
      TripsAPI.clearTripOptions();
      return;
    }
    const tripOptionsString = JSON.stringify(tripOptions);
    Logger.debug(`Saving trip options: ${tripOptionsString}`);
    Storage.setItem(Storage.TRIP_OPTIONS, tripOptionsString);
  }

  static getTripOptions(): RadarTripOptions {
    let tripOptions = Storage.getItem(Storage.TRIP_OPTIONS);
    if (tripOptions) {
      tripOptions = JSON.parse(tripOptions);
    }
    return tripOptions as RadarTripOptions;
  }

  static clearTripOptions() {
    Storage.removeItem(Storage.TRIP_OPTIONS);
  }

  static async startTrip(tripOptions: RadarTripOptions): Promise<RadarTripResponse> {
    const options = Config.get();
    tripOptions = tripOptions || TripsAPI.getTripOptions();

    if (!tripOptions) {
      Logger.warn('tripOptions not set when calling "startTrip"');
    }

    const userId = tripOptions.userId || Storage.getItem(Storage.USER_ID);
    if (userId && userId !== Storage.getItem(Storage.USER_ID)) {
      // set as userId for tracking if provided
      Storage.setItem(Storage.USER_ID, userId);
    }

    const {
      externalId,
      destinationGeofenceTag,
      destinationGeofenceExternalId,
      mode,
      metadata,
      approachingThreshold,
      scheduledArrivalAt,
    } = tripOptions;

    const data: any = {
      userId,
      externalId,
      destinationGeofenceTag,
      destinationGeofenceExternalId,
      mode,
      metadata,
      approachingThreshold,
    };

    if (isValidDate(scheduledArrivalAt)) {
      data.scheduledArrivalAt = scheduledArrivalAt?.toJSON();
    } else {
      if (scheduledArrivalAt) {
        Logger.warn('Invalid date format for scheduledArrivalAt');
      }
      data.scheduledArrivalAt = undefined;
    }

    const response: any = await Http.request({
      method: 'POST',
      path: 'trips',
      data,
    });

    // save trip options
    TripsAPI.setTripOptions(tripOptions);

    const tripRes = {
      trip: response.trip,
      events: response.events,
    } as RadarTripResponse;

    if (options.debug) {
      tripRes.response = response;
    }

    return tripRes;
  }

  static async updateTrip(tripOptions: RadarTripOptions, status?: RadarTripStatus): Promise<RadarTripResponse> {
    const options = Config.get();
    tripOptions = tripOptions || TripsAPI.getTripOptions();

    if (!tripOptions) {
      Logger.warn('tripOptions not set when calling "startTrip"');
    }

    const {
      externalId,
      destinationGeofenceTag,
      destinationGeofenceExternalId,
      mode,
      metadata,
      approachingThreshold,
      scheduledArrivalAt,
    } = tripOptions;

    const data: any = {
      status,
      externalId,
      destinationGeofenceTag,
      destinationGeofenceExternalId,
      mode,
      metadata,
      approachingThreshold,
    };

    if (isValidDate(scheduledArrivalAt)) {
      data.scheduledArrivalAt = scheduledArrivalAt?.toJSON();
    } else {
      if (scheduledArrivalAt) {
        Logger.warn('Invalid date format for scheduledArrivalAt');
      }
      data.scheduledArrivalAt = undefined;
    }

    const response: any = await Http.request({
      method: 'PATCH',
      path: `trips/${externalId}/update`,
      data,
    });

    const tripRes = {
      trip: response.trip,
      events: response.events,
    } as RadarTripResponse;

    if (options.debug) {
      tripRes.response = response;
    }

    return tripRes;
  }

  static async completeTrip(): Promise<RadarTripResponse> {
    const tripOptions = TripsAPI.getTripOptions();
    const tripResponse = await TripsAPI.updateTrip(tripOptions, 'completed');

    // clear local trip options
    TripsAPI.clearTripOptions();

    return tripResponse;
  }

  static async cancelTrip(): Promise<RadarTripResponse> {
    const tripOptions = TripsAPI.getTripOptions();
    const tripResponse = await TripsAPI.updateTrip(tripOptions, 'canceled');

    // clear local trip options
    TripsAPI.clearTripOptions();

    return tripResponse;
  }
}

export default TripsAPI;
