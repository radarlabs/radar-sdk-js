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

const base64Encode = (str: string): string => 
  btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const signJWT = async (payload: object, key: string): Promise<string> => {
  const encoder = new TextEncoder();

  const encodedHeader = base64Encode(JSON.stringify({
    alg: 'HS256',
    typ: 'JWT',
  }));
  const encodedPayload = base64Encode(JSON.stringify(payload));

  const keyData = encoder.encode(key);
  const messageData = encoder.encode(`${encodedHeader}.${encodedPayload}`);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign']
  );

  const signatureArrayBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const signature = base64Encode(String.fromCharCode(...Array.from(new Uint8Array(signatureArrayBuffer))));

  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

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

      const now = Date.now();

      const { dk, scl }: any = await Http.request({
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

      let csl = -1;
      if (scl > 0) {
        csl = Date.now() - now - scl;
      }

      const payload = {
        payload: JSON.stringify({
          ...body,
          scl,
          csl,
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
