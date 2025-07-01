import Config from '../config';
import Device from '../device';
import Http from '../http';
import Logger from '../logger';
import Session from '../session';
import Navigator from '../navigator';

import type { RadarTrackParams } from '../types';

class ConfigAPI {
  public static async getConfig(params: RadarTrackParams = {}) {
    const options = Config.get();

    if (options.version != 'v1') {
      Logger.info('Skipping /config call.');
      return;
    }

    const deviceId = params.deviceId || Device.getDeviceId();
    const installId = params.installId || Device.getInstallId();
    const sessionId = Session.getSessionId();

    // location authorization
    let locationAuthorization;
    try {
      locationAuthorization = await Navigator.getPermissionStatus();
    } catch (err: any) {
      Logger.warn(`Location authorization error: ${err.message}`);
    }

    const data = {
      deviceId,
      installId,
      sessionId,
      locationAuthorization,
    };

    try {
      await Http.request({
        method: 'GET',
        path: 'config',
        data,
      });

    } catch (err: any) {
      Logger.warn(`Error calling /config: ${err.message}`);
    }
  }
}

export default ConfigAPI;
