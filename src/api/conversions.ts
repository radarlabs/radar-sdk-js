import Config from '../config';
import Device from '../device';
import Http from '../http';
import Storage from '../storage';

import type { RadarConversionParams, RadarConversionResponse } from '../types';

/** @internal conversions API — use {@link Radar.logConversion} instead */
class ConversionsAPI {
  /**
   * log a conversion event
   * @param params - conversion name, user info, and optional metadata/revenue
   * @returns the created event
   */
  static async logConversion(params: RadarConversionParams): Promise<RadarConversionResponse> {
    const options = Config.get();

    const name = params.name;
    const userId = params.userId || Storage.getItem(Storage.USER_ID);
    const deviceId = params.deviceId || Device.getDeviceId();
    const installId = params.installId || Device.getInstallId();
    const metadata = params.metadata || {};
    const createdAt = params.createdAt;

    if (params.revenue) {
      metadata.revenue = params.revenue;
    }

    const createdAtValue =
      typeof createdAt === 'string'
        ? createdAt
        : createdAt instanceof Date
          ? createdAt.toISOString()
          : new Date().toISOString();

    const data = {
      name,
      userId,
      deviceId,
      installId,
      metadata,
      createdAt: createdAtValue,
    };

    const response = await Http.request<Omit<RadarConversionResponse, 'response'>>({
      method: 'POST',
      path: 'events',
      data,
    });

    const conversionRes: RadarConversionResponse = {
      event: response.event,
    };

    if (options.debug) {
      conversionRes.response = response;
    }

    return conversionRes;
  }
}

export default ConversionsAPI;
