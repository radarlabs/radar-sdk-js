import SDK_VERSION from '../version';
import Config from '../config';
import Device from '../device';
import Http from '../http';
import Logger from '../logger';
import Session from '../session';
import Storage from '../storage';

import type { RadarTrackParams, RadarTrackVerifiedResponse } from '../types';

class VerifyAPI {
  static async trackVerified(params: RadarTrackParams, encrypted: Boolean = false) {
    const options = Config.get();

    // user indentification fields
    const userId = params.userId || Storage.getItem(Storage.USER_ID);
    const deviceId = params.deviceId || Device.getDeviceId();
    const installId = params.installId || Device.getInstallId();
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
    };

    let userAgent = navigator.userAgent;
    const apple = userAgent && (userAgent.toLowerCase().includes('mac') || userAgent.toLowerCase().includes('iphone') || userAgent.toLowerCase().includes('ipod') || userAgent.toLowerCase().includes('ipad'));

    const response: any = await Http.request({
      method: 'GET',
      path: 'verify',
      data: body,
      host: apple ? 'https://radar-verify.com:52516' : 'http://localhost:52516',
    });

    let { user, events, token, expiresAt } = response;
    let location;
    if (user && user.location && user.location.coordinates && user.locationAccuracy) {
      location = {
        latitude: user.location.coordinates[1],
        longitude: user.location.coordinates[0],
        accuracy: user.locationAccuracy,
      };
    }
    let passed;
    let expiresIn;
    if (expiresAt) {
      expiresAt = Date.parse(expiresAt);
      passed = user?.fraud?.passed && user?.country?.passed && user?.state?.passed;
      expiresIn = expiresAt ? (expiresAt.getMilliseconds() - new Date().getMilliseconds()) / 1000 : null;
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

export default VerifyAPI;
