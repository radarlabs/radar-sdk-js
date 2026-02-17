import Config from '../config';
import Device from '../device';
import Http from '../http';
import Logger from '../logger';
import Navigator from '../navigator';
import Session from '../session';
import Storage from '../storage';
import SDK_VERSION from '../version';
import TripsAPI from './trips';

import type { RadarTrackParams, RadarTrackResponse } from '../types';

/** @internal tracking API — use {@link Radar.trackOnce} instead */
class TrackAPI {
  /**
   * track the user's current location once
   * @param params - tracking parameters (location, user info, trip options)
   * @returns tracked user, events, and location
   */
  static async trackOnce(params: RadarTrackParams) {
    const options = Config.get();

    const { desiredAccuracy } = params;
    let { latitude, longitude, accuracy } = params;

    // if latitude & longitude are not provided,
    // try and retrieve device location (will prompt for location permissions)
    if (!latitude || !longitude) {
      const deviceLocation = await Navigator.getCurrentPosition({ desiredAccuracy });
      latitude = deviceLocation.latitude;
      longitude = deviceLocation.longitude;
      accuracy = deviceLocation.accuracy;
    }

    // location authorization
    const locationAuthorization = await Navigator.getPermissionStatus();

    // user indentification fields
    const userId = params.userId || Storage.getItem(Storage.USER_ID);
    const deviceId = params.deviceId || Device.getDeviceId();
    const installId = params.installId || Device.getInstallId();
    const sessionId = Session.getSessionId();
    const deviceType = params.deviceType || 'Web';
    const description = params.description || Storage.getItem(Storage.DESCRIPTION);

    // save userId for trip tracking
    if (!userId) {
      Logger.warn('userId not provided for trackOnce.');
    } else {
      Storage.setItem(Storage.USER_ID, userId);
    }

    // other info
    const metadata = params.metadata || Storage.getJSON(Storage.METADATA);

    // trips
    const tripOptions = params.tripOptions || TripsAPI.getTripOptions();
    if (tripOptions) {
      tripOptions.version = '2';
    }

    const body = {
      ...params,
      locationAuthorization,
      accuracy,
      description,
      deviceId,
      deviceType,
      foreground: true,
      installId,
      sessionId,
      latitude,
      longitude,
      metadata,
      sdkVersion: SDK_VERSION,
      stopped: true,
      userId,
      tripOptions,
    };

    const response = await Http.request<Omit<RadarTrackResponse, 'response' | 'location'>>({
      method: 'POST',
      path: 'track',
      data: body,
    });

    const { user, events } = response;
    const location = { latitude, longitude, accuracy };

    const trackRes: RadarTrackResponse = {
      user,
      events,
      location,
    };

    if (options.debug) {
      trackRes.response = response;
    }

    return trackRes;
  }
}

export default TrackAPI;
