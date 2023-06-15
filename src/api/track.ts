import SDK_VERSION from '../version';
import Config from '../config';
import Device from '../device';
import Http from '../http';
import Logger from '../logger';
import Navigator from '../navigator';
import Session from '../session';
import Storage from '../storage';

import type { RadarTrackParams, RadarTrackResponse } from '../types';

class TrackAPI {
  static async trackOnce(params: RadarTrackParams) {
    const options = Config.get();

    let { latitude, longitude, accuracy } = params;

    // if latitude & longitude are not provided,
    // try and retrieve device location (will prompt for location permissions)
    if (!latitude || !longitude) {
      const deviceLocation = await Navigator.getCurrentPosition();
      latitude = deviceLocation.latitude;
      longitude = deviceLocation.longitude;
      accuracy = deviceLocation.accuracy;
    }

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
    let metadata = params.metadata || Storage.getJSON(Storage.METADATA);

    // trips
    let tripOptions = params.tripOptions || Storage.getJSON(Storage.TRIP_OPTIONS);
    if (tripOptions) {
      tripOptions.version = '2';
    }

    const body = {
      ...params,
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

    const response: any = await Http.request({
      method: 'POST',
      path: 'track',
      data: body,
    });

    const { user, events } = response;
    const location = { latitude, longitude, accuracy };

    const trackRes = {
      user,
      events,
      location,
    } as RadarTrackResponse;

    if (options.debug) {
      trackRes.response = response;
    }

    return trackRes;
  }
}

export default TrackAPI;
