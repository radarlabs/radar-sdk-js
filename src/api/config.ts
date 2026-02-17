import Device from '../device';
import Http from '../http';
import Logger from '../logger';
import Navigator from '../navigator';
import Session from '../session';

import type { LocationAuthorization, RadarConfigResponse, RadarTrackParams } from '../types';

/** options for customizing the config request (e.g. host, headers) */
interface ConfigRequestOptions {
  /** override the API host */
  host?: string;
  /** additional headers to include in the request */
  headers?: Record<string, string>;
}

/** @internal SDK configuration API for fetching remote config */
class ConfigAPI {
  /**
   * fetch remote SDK configuration from the Radar API. Generic so plugins can extend the response shape.
   *
   * @param params - optional tracking params for device/session identification
   * @param options - optional request overrides (host, headers)
   */
  public static async getConfig<T extends RadarConfigResponse = RadarConfigResponse>(
    params: RadarTrackParams = {},
    options: ConfigRequestOptions = {},
  ): Promise<T> {
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
      host: options.host,
      headers: options.headers,
    });
  }
}

export default ConfigAPI;
