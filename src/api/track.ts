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

import type { RadarConfigResponse, RadarTrackParams, RadarTrackResponse, RadarTrackVerifiedResponse } from '../types';
import { RadarPaymentRequiredError } from '../errors';

type TrackRequestHeaders = {
  'X-Radar-Body-Is-Token'?: string;
  'X-Radar-Product'?: string;
}

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
    const locationAuthorization = await Navigator.getPermissionStatus();

    // user indentification fields
    const id = Storage.getItem(Storage.ID) || undefined; // `undefined` so it's removed from any fields
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

    const headers: TrackRequestHeaders = {}

    const product = Storage.getItem(Storage.PRODUCT)
    if (product) {
      headers['X-Radar-Product'] = product
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
      id,
    };

    let response: any;
    if (fraud) {
      const host = 'https://api-verified.radar.io';

      const lang = navigator.language;
      const langs = navigator.languages;

      const configResponse = await Http.request({
        host,
        method: 'GET',
        path: 'config',
        data: {
          id,
          deviceId,
          installId,
          sessionId,
          locationAuthorization,
        },
        headers: {
          'X-Radar-Desktop-Device-Type': 'Web',
        },
      }) as RadarConfigResponse;

      // If the project does not have fraud enabled and calls config, the server will not send a desktop key
      const { dk } = configResponse;
      if (!dk) {
        throw new RadarPaymentRequiredError(configResponse);
      }

      const payload = {
        payload: JSON.stringify({
          ...body,
          lang,
          langs,
        }),
      };
      
      const reqToken = await signJWT(payload, dk);
      headers['X-Radar-Body-Is-Token'] = 'true'

      response = await Http.request({
        host,
        method: 'POST',
        path: 'track',
        data: {
          token: reqToken,
        },
        headers,
      });

      let { user, events, token, expiresAt, expiresIn, passed, failureReasons, _id } = response;
      const location = { latitude, longitude, accuracy };
      if (expiresAt) {
        expiresAt = new Date(expiresAt);
      }

      const trackRes = {
        user,
        events,
        location,
        token,
        expiresAt,
        expiresIn,
        passed,
        failureReasons,
        _id,
      } as RadarTrackVerifiedResponse;

      if (user) {
        Storage.setItem(Storage.ID, user._id);
      }

      if (options.debug) {
        trackRes.response = response;
      }

      return trackRes;
    }

    // unverified track
    response = await Http.request({
      method: 'POST',
      path: 'track',
      data: body,
      headers,
    });

    const { user, events } = response;
    const location = { latitude, longitude, accuracy };

    const trackRes = {
      user,
      events,
      location,
    } as RadarTrackResponse;

    Storage.setItem(Storage.ID, user?._id);
    
    if (options.debug) {
      trackRes.response = response;
    }

    return trackRes;
  }
}

export default TrackAPI;
