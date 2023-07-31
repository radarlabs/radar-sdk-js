import SDK_VERSION from '../version';
import Config from '../config';
import Device from '../device';
import Http from '../http';
import Logger from '../logger';
import Session from '../session';
import Storage from '../storage';

import type { RadarTrackParams, RadarTrackResponse } from '../types';

class VerifyAPI {
  static async trackVerified(params: RadarTrackParams) {
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
    };

    const response: any = await Http.request({
      method: 'GET',
      path: 'verify',
      data: body,
      host: 'http://localhost:52516',
    });

    const { user, events } = response;
    let location;
    if (user.location && user.location.coordinates && user.locationAccuracy) {
      location = {
        latitude: user.location.coordinates[1],
        longitude: user.location.coordinates[0],
        accuracy: user.locationAccuracy,
      };
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
