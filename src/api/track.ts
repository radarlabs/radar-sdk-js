import { detectIncognito } from 'detectincognitojs';

import SDK_VERSION from '../version';
import Config from '../config';
import Device from '../device';
import Http from '../http';
import Logger from '../logger';
import Navigator from '../navigator';
import Session from '../session';
import Storage from '../storage';
import TripsAPI from './trips';

import type { RadarTrackParams, RadarTrackResponse } from '../types';

class TrackAPI {
  static async trackOnce(params: RadarTrackParams) {
    const options = Config.get();

    let { latitude, longitude, accuracy, desiredAccuracy, fraud } = params;

    // if latitude & longitude are not provided,
    // try and retrieve device location (will prompt for location permissions)
    if (!latitude || !longitude) {
      const deviceLocation = await Navigator.getCurrentPosition({ desiredAccuracy });
      latitude = deviceLocation.latitude;
      longitude = deviceLocation.longitude;
      accuracy = deviceLocation.accuracy;
    }

    // location authorization
    let locationAuthorization;
    try {
      locationAuthorization = await Navigator.getPermissionStatus();
    } catch (err: any) {
      Logger.warn(`Location authorization error: ${err.message}`);
    }

    // user indentification fields
    const userId = params.userId || Storage.getItem(Storage.USER_ID);
    const deviceId = params.deviceId || Device.getDeviceId();
    const installId = params.installId || Device.getInstallId();
    const sessionId = Session.getSessionId();
    const deviceType = params.deviceType || 'Web';
    const description = params.description || Storage.getItem(Storage.DESCRIPTION);

    let timeZone;
    try {
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (err: any) {
      Logger.warn(`Error getting time zone: ${err.message}`);
    }

    let incognito = false;
    if (fraud) {
      try {
        const result = await detectIncognito();
        incognito = result.isPrivate;
      } catch (err: any) {
        Logger.warn(`Error detecting incognito mode: ${err.message}`);
      }
    }

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
      timeZone,
      incognito,
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
