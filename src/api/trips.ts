import Config from '../config';
import Http from '../http';
import Logger from '../logger';
import Storage from '../storage';

import type { RadarTripOptions, RadarTripStatus, RadarTripResponse } from '../types';

// https://stackoverflow.com/a/44198641
const isValidDate = (date: any): Date | undefined =>
  date && Object.prototype.toString.call(date) === '[object Date]' && !isNaN(date);

/** @internal trips API — use Radar.startTrip / updateTrip / completeTrip / cancelTrip instead */
class TripsAPI {
  /** save trip options to localStorage, pass `undefined` to clear */
  static setTripOptions(tripOptions?: RadarTripOptions) {
    if (!tripOptions) {
      TripsAPI.clearTripOptions();
      return;
    }
    const tripOptionsString = JSON.stringify(tripOptions);
    Logger.debug(`Saving trip options: ${tripOptionsString}`);
    Storage.setItem(Storage.TRIP_OPTIONS, tripOptionsString);
  }

  /** get saved trip options from localStorage */
  static getTripOptions(): RadarTripOptions {
    let tripOptions = Storage.getItem(Storage.TRIP_OPTIONS);
    if (tripOptions) {
      tripOptions = JSON.parse(tripOptions);
    }
    return tripOptions as RadarTripOptions;
  }

  /** remove saved trip options from localStorage */
  static clearTripOptions() {
    Storage.removeItem(Storage.TRIP_OPTIONS);
  }

  /**
   * start a new trip
   * @param tripOptions - trip configuration and destination
   * @returns the created trip and any triggered events
   */
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

    if (scheduledArrivalAt && !isValidDate(scheduledArrivalAt)) {
      Logger.warn('Invalid date format for scheduledArrivalAt');
    }

    const data = {
      userId,
      externalId,
      destinationGeofenceTag,
      destinationGeofenceExternalId,
      mode,
      metadata,
      approachingThreshold,
      scheduledArrivalAt: isValidDate(scheduledArrivalAt) ? scheduledArrivalAt!.toJSON() : undefined,
    };

    const response = await Http.request<Omit<RadarTripResponse, 'response'>>({
      method: 'POST',
      path: 'trips',
      data,
    });

    // save trip options
    TripsAPI.setTripOptions(tripOptions);

    const tripRes: RadarTripResponse = {
      trip: response.trip,
      events: response.events,
    };

    if (options.debug) {
      tripRes.response = response;
    }

    return tripRes;
  }

  /**
   * update an in-progress trip
   * @param tripOptions - updated trip configuration
   * @param status - optional trip status override
   * @returns the updated trip and any triggered events
   */
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

    if (scheduledArrivalAt && !isValidDate(scheduledArrivalAt)) {
      Logger.warn('Invalid date format for scheduledArrivalAt');
    }

    const data = {
      status,
      externalId,
      destinationGeofenceTag,
      destinationGeofenceExternalId,
      mode,
      metadata,
      approachingThreshold,
      scheduledArrivalAt: isValidDate(scheduledArrivalAt) ? scheduledArrivalAt!.toJSON() : undefined,
    };

    const response = await Http.request<Omit<RadarTripResponse, 'response'>>({
      method: 'PATCH',
      path: `trips/${externalId}/update`,
      data,
    });

    const tripRes: RadarTripResponse = {
      trip: response.trip,
      events: response.events,
    };

    if (options.debug) {
      tripRes.response = response;
    }

    return tripRes;
  }

  /** complete the current trip and clear local trip options */
  static async completeTrip(): Promise<RadarTripResponse> {
    const tripOptions = TripsAPI.getTripOptions();
    const tripResponse = await TripsAPI.updateTrip(tripOptions, 'completed');

    // clear local trip options
    TripsAPI.clearTripOptions();

    return tripResponse;
  }

  /** cancel the current trip and clear local trip options */
  static async cancelTrip(): Promise<RadarTripResponse> {
    const tripOptions = TripsAPI.getTripOptions();
    const tripResponse = await TripsAPI.updateTrip(tripOptions, 'canceled');

    // clear local trip options
    TripsAPI.clearTripOptions();

    return tripResponse;
  }
}

export default TripsAPI;
