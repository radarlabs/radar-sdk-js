import { detectIncognito } from 'detectincognitojs';
// @ts-ignore
import { KJUR } from 'jsrsasign';

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
    };

    let response: any;
    if (fraud) {
      let incognito = false;
      try {
        const result = await detectIncognito();
        incognito = result.isPrivate;
      } catch (err: any) {
        Logger.warn(`Error detecting incognito mode: ${err.message}`);
      }

      const host = 'https://api-verified.radar.io';

      const { dk }: any = await Http.request({
        host,
        method: 'GET',
        path: 'config',
        data: {
          deviceId,
          installId,
          sessionId,
          locationAuthorization,
        },
        headers: {
          'X-Radar-Desktop-Device-Type': 'Mac',
        },
      });

      const header = JSON.stringify({
        alg: 'HS256',
        typ: 'JWT',
      });
      const payload = JSON.stringify({
        payload: JSON.stringify({
          ...body,
          incognito,
        }),
      });
      
      const token = KJUR.jws.JWS.sign('HS256', header, payload, { utf8: dk });

      response = await Http.request({
        host,
        method: 'POST',
        path: 'track',
        data: {
          token,
        },
        headers: {
          'X-Radar-Body-Is-Token': 'true',
        },
      });
    } else {
      response = await Http.request({
        method: 'POST',
        path: 'track',
        data: body,
      });
    }

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
