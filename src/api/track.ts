import SDK_VERSION from '../version';
import Config from '../config';
import Device from '../device';
import Http from '../http';
import Logger from '../logger';
import Navigator from '../navigator';
import Session from '../session';
import Storage from '../storage';
import TripsAPI from './trips';
import { signJWT } from '../util/jwt';
import { ping } from '../util/net';

import type { RadarTrackParams, RadarTrackResponse, RadarTrackVerifiedResponse } from '../types';

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
      const host = 'https://api-verified.radar.io';
      const pingHost = 'ping.radar-verify.com';

      const lang = navigator.language;
      const langs = navigator.languages;

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
          'X-Radar-Desktop-Device-Type': 'Web',
        },
      });

      let sclVal = -1;
      let cslVal = -1;
      try {
        const [sclRes, csl] = await Promise.all([
          Http.request({
            host: `https://${pingHost}`,
            method: 'GET',
            path: 'ping',
          }),
          ping(`wss://${pingHost}`),
        ]);
        const { scl }: any = sclRes;
        sclVal = scl;
        cslVal = csl;
      } catch (err) {
        // do nothing, send scl = -1 and csl = -1
      }

      const payload = {
        payload: JSON.stringify({
          ...body,
          scl: sclVal,
          csl: cslVal,
          lang,
          langs,
        }),
      };
      
      const token = await signJWT(payload, dk);

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

      if (options.debug && response && response.user) {
        if (!response.user.metadata) {
          response.user.metadata = {};
        }
        
        response.user.metadata['radar:debug'] = {
          sclVal,
          cslVal,
        };

        let { user, events, token, expiresAt } = response;
        const location = { latitude, longitude, accuracy };
        let passed;
        let expiresIn;
        if (expiresAt) {
          expiresAt = new Date(expiresAt);
          passed = user?.fraud?.passed && user?.country?.passed && user?.state?.passed;
          expiresIn = (expiresAt.getTime() - Date.now()) / 1000;
        }

        const trackRes = {
          user,
          events,
          location,
          token,
          expiresAt,
          expiresIn,
          passed,
        } as RadarTrackVerifiedResponse;

        if (options.debug) {
          trackRes.response = response;
        }

        return trackRes;
      }
    }

    response = await Http.request({
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
