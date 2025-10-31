import SDK_VERSION from '../version';
import Config from '../config';
import Device from '../device';
import Http from '../http';
import Logger from '../logger';
import Session from '../session';
import Storage from '../storage';
import TrackAPI from './track';

import type { RadarStartTrackingVerifiedParams, RadarTrackVerifiedParams, RadarTrackVerifiedResponse } from '../types';

let tokenTimeoutId: any | null = null;
let ipChangesIntervalId: any | null = null;
let isTrackingVerified = true;
let tokenCallback: ((token: RadarTrackVerifiedResponse) => void) | null = null;
let lastToken: RadarTrackVerifiedResponse | null = null;
let lastTokenNow: number = 0;
let expectedCountryCode: string | null = null;
let expectedStateCode: string | null = null;
let lastIp: string | null = null;

class VerifyAPI {
  static async checkIpChanges() {
    try {
      const { ip }: any = await Http.request({
        method: 'GET',
        path: 'ping',
      });

      const ipChanged = lastIp && ip !== lastIp;
      if (ipChanged) {
        Logger.info(`IP changed from ${lastIp} to ${ip}`);

        lastToken = null;
      }

      lastIp = ip;

      return ipChanged;
    } catch (err) {
      Logger.error(`Error checking IP: ${err}`);
    }

    return false;
  } 

  static async trackVerified(params: RadarTrackVerifiedParams, encrypted: Boolean = false) {
    try {
      const options = Config.get();

      const { skipVerifyApp, reason } = params;

      // user indentification fields
      const userId = params.userId || Storage.getItem(Storage.USER_ID);
      const deviceId = Device.getDeviceId();
      const installId = Device.getInstallId();
      const sessionId = Session.getSessionId();
      const description = params.description || Storage.getItem(Storage.DESCRIPTION);

      // save userId
      if (!userId) {
        Logger.warn('userId not provided for trackVerified.');
      } else {
        Storage.setItem(Storage.USER_ID, userId);
      }

      // other info
      const metadata = params.metadata || Storage.getJSON(Storage.METADATA);

      let trackRes: RadarTrackVerifiedResponse;
      if (skipVerifyApp) {
        trackRes = await TrackAPI.trackOnce({
          userId: userId ?? undefined,
          description: description ?? undefined,
          metadata: metadata,
          fraud: true,
          reason,
        });
      } else {
        const body = {
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
          expectedCountryCode,
          expectedStateCode,
        };
    
        let userAgent = navigator.userAgent;
        const apple = userAgent && (userAgent.toLowerCase().includes('mac') || userAgent.toLowerCase().includes('iphone') || userAgent.toLowerCase().includes('ipod') || userAgent.toLowerCase().includes('ipad'));
    
        const response: any = await Http.request({
          method: 'GET',
          path: 'verify',
          data: body,
          host: apple ? 'https://radar-verify.com:52516' : 'http://localhost:52516',
        });
    
        let { user, events, token, expiresAt, expiresIn, passed, failureReasons, _id } = response;
        let location;
        if (user && user.location && user.location.coordinates && user.locationAccuracy) {
          location = {
            latitude: user.location.coordinates[1],
            longitude: user.location.coordinates[0],
            accuracy: user.locationAccuracy,
          };
        }
        if (expiresAt) {
          expiresAt = new Date(expiresAt);
        }
    
        trackRes = {
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
    
        if (options.debug) {
          trackRes.response = response;
        }
      }

      lastToken = trackRes;
      lastTokenNow = performance.now();

      if (tokenCallback) {
        tokenCallback(trackRes);
      }

      return trackRes;
    } catch (err: any) {
      Config.sendError(err);
      throw err;
    }
  }

  static startTrackingVerified(params: RadarStartTrackingVerifiedParams) {
    isTrackingVerified = true;
    
    const scheduleNextIntervalWithLastToken = async () => {
      let { interval } = params;

      if (!interval) {
        interval = 20;
      }

      let minInterval = interval;

      if (lastToken) {
        const lastTokenElapsed = (performance.now() - lastTokenNow) / 1000;

        const expiresIn = (lastToken.expiresIn || 0);

        // if expiresIn is shorter than interval, override interval
        // re-request early to maximize the likelihood that a cached token is available
        minInterval = Math.min(expiresIn - lastTokenElapsed, interval);
      }

      minInterval = minInterval - 10;

      // min interval is 10 seconds
      if (minInterval < 10) {
        minInterval = 10;
      }

      if (tokenTimeoutId) {
        clearTimeout(tokenTimeoutId);
      }

      if (isTrackingVerified) {
        tokenTimeoutId = setTimeout(doTrackVerified, minInterval * 1000);
      }
    };

    const doTrackVerified = async () => {
      try {
        await this.trackVerified(params);
      } catch (err: any) {
        Logger.error(`trackVerified error: ${err.message}`);
      }

      scheduleNextIntervalWithLastToken();
    };

    if (params?.ipChanges) {
      if (ipChangesIntervalId) {
        clearInterval(ipChangesIntervalId);
      }

      ipChangesIntervalId = setInterval(async () => {
        const ipChanged = await VerifyAPI.checkIpChanges();

        if (ipChanged) {
          doTrackVerified();
        }
      }, 10000);
    }

    if (this.isLastTokenValid()) {
      scheduleNextIntervalWithLastToken();
    } else {
      doTrackVerified();
    }
  }

  static stopTrackingVerified() {
    isTrackingVerified = false;

    if (tokenTimeoutId) {
      clearTimeout(tokenTimeoutId);
    }

    if (ipChangesIntervalId) {
      clearInterval(ipChangesIntervalId);
    }
  }

  static async getVerifiedLocationToken(params: RadarTrackVerifiedParams) {
    if (this.isLastTokenValid()) {
      return lastToken;
    }

    return this.trackVerified(params);
  }

  static clearVerifiedLocationToken() {
    lastToken = null;
  }

  static isLastTokenValid() {
    if (!lastToken) {
      return false;
    }

    const lastTokenElapsed = (performance.now() - lastTokenNow) / 1000;

    return lastToken.passed && lastTokenElapsed < (lastToken.expiresIn || 0);
  }

  static setExpectedJurisdiction(countryCode?: string, stateCode?: string) {
    expectedCountryCode = countryCode || null;
    expectedStateCode = stateCode || null;
  }

  static onTokenUpdated(callback: (token: RadarTrackVerifiedResponse) => void) {
    tokenCallback = callback;
  }
}

export default VerifyAPI;
