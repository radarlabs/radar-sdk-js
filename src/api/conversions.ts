import Config from '../config';
import Device from '../device';
import Http from '../http';
import Storage from '../storage';

import type { RadarConversionParams, RadarConversionResponse } from '../types';

class ConversionsAPI {
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

    const data: any = {
      name,
      userId,
      deviceId,
      installId,
      metadata,
    }

    if (typeof createdAt === 'string') {
      data.createdAt = createdAt;
    } else if (createdAt instanceof Date) {
      data.createdAt = createdAt.toISOString();
    } else {
      data.createdAt = (new Date()).toISOString();
    }

    const response: any = await Http.request({
      method: 'POST',
      path: 'events',
      data,
    });

    const conversionRes = {
      event: response.event,
    } as RadarConversionResponse;

    if (options.debug) {
      conversionRes.response = response;
    }

    return conversionRes;
  }
}

export default ConversionsAPI;
