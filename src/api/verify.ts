import SDK_VERSION from '../version';
import Config from '../config';
import Device from '../device';
import Http from '../http';
import Logger from '../logger';
import Navigator from '../navigator';
import Session from '../session';
import Storage from '../storage';

import type { RadarTrackVerifiedParams, RadarTrackResponse, RadarTrackTokenResponse } from '../types';

import { importJWK, SignJWT } from 'jose';

class VerifyAPI {
  static async trackVerified(params: RadarTrackVerifiedParams, encrypted: Boolean = false) {
    const options = Config.get();

    // user indentification fields
    const userId = params.userId || Storage.getItem(Storage.USER_ID);
    const deviceId = params.deviceId || Device.getDeviceId();
    const installId = params.installId || Device.getInstallId();
    const sessionId = Session.getSessionId();
    const description = params.description || Storage.getItem(Storage.DESCRIPTION);

    // other info
    const metadata = params.metadata || Storage.getJSON(Storage.METADATA);

    // save userId
    if (!userId) {
      Logger.warn('userId not provided for trackVerified.');
    } else {
      Storage.setItem(Storage.USER_ID, userId);
    }

    let body: any = {
      ...params,
      description,
      deviceId,
      foreground: true,
      installId,
      sessionId,
      metadata,
      sdkVersion: SDK_VERSION,
      stopped: true,
      userId,
      encrypted,
    };

    let response: any;
    if (params.skipDesktopApp) {
      const { verifiedHost } = options;
      const { desiredAccuracy } = params;

      const deviceLocation = await Navigator.getCurrentPosition({ desiredAccuracy });
      const latitude = deviceLocation.latitude;
      const longitude = deviceLocation.longitude;
      const accuracy = deviceLocation.accuracy;

      let locationAuthorization;
      try {
        locationAuthorization = await Navigator.getPermissionStatus();
      } catch (err: any) {
        Logger.warn(`Location authorization error: ${err.message}`);
      }

      body = {
        ...body,
        latitude,
        longitude,
        accuracy,
      };

      let headers;
      if (encrypted) {
        try {
          const { dk }: any = await Http.request({
            method: 'GET',
            path: 'config',
            data: {
              deviceId,
              installId,
              sessionId,
              locationAuthorization,
            },
          });

          const alg = 'HS256';
          const jwk = await importJWK(dk, alg);
          const token = await new SignJWT(body)
            .setProtectedHeader({ alg, typ: 'JWT' })
            .sign(jwk);
          
          body = {
            token,
          };

          headers = {
            'X-Radar-Body-Is-Token': 'true',
          };
        } catch (err: any) {
          Logger.warn(`Error calling /config: ${err.message}`);
        }
      }

      response = await Http.request({
        method: 'POST',
        path: 'track',
        data: body,
        host: verifiedHost,
        headers,
      });
    } else {
      let userAgent = navigator.userAgent;
      const mac = userAgent && userAgent.toLowerCase().includes('mac');

      response = await Http.request({
        method: 'GET',
        path: 'verify',
        data: body,
        host: mac ? 'https://radar-verify.com:52516' : 'http://localhost:52516',
      });
    }

    const { user, events, token } = response;
    let location;
    if (user && user.location && user.location.coordinates && user.locationAccuracy) {
      location = {
        latitude: user.location.coordinates[1],
        longitude: user.location.coordinates[0],
        accuracy: user.locationAccuracy,
      };
    }

    if (encrypted) {
      const trackTokenRes = {
        token,
      } as RadarTrackTokenResponse;
  
      if (options.debug) {
        trackTokenRes.response = response;
      }
  
      return trackTokenRes;
    }

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

export default VerifyAPI;
