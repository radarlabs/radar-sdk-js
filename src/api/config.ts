import Device from '../device';
import Http from '../http';
import Logger from '../logger';
import Navigator from '../navigator';
import Session from '../session';

import type { LocationAuthorization, RadarConfigResponse, RadarTrackParams } from '../types';

/** @internal SDK configuration API for fetching remote config */
class ConfigAPI {
  /**
   * fetch remote SDK configuration from the Radar API
   * @param params - optional tracking params for device/session identification
   */
  public static async getConfig<T extends RadarConfigResponse = RadarConfigResponse>(
    params: RadarTrackParams = {},
  ): Promise<T | undefined> {
    const deviceId = params.deviceId || Device.getDeviceId();
    const installId = params.installId || Device.getInstallId();
    const sessionId = Session.getSessionId();

    // location authorization
    let locationAuthorization: LocationAuthorization | undefined;
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

    return Http.request<T>({
      method: 'GET',
      path: 'config',
      data,
    });
  }
}

export default ConfigAPI;
