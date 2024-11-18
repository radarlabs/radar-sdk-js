import Config from '../config';
import Device from '../device';
import Http from '../http';
import Storage from '../storage';

import type { RadarConversionParams, RadarConversionResponse } from '../types';

class ConversionsAPI {
  static async logConversion(params: RadarConversionParams): Promise<RadarConversionResponse> {
    const options = Config.get();

    const name = params.name;
    const metadata = params.metadata || {};
    const createdAt = params.createdAt;
    // we should only set id if none of userId/deviceId/installId are passed in, or any of them match existing one
    const storedDeviceId = Device.getDeviceId();
    const storedUserId = Storage.getItem(Storage.USER_ID);
    const storedInstallId = Device.getInstallId();

    let id;
    if ((!params.deviceId || params.deviceId === storedDeviceId) &&
        (!params.userId || params.userId === storedUserId) &&
        (!params.installId || params.installId === storedInstallId)) {
      id = Storage.getItem(Storage.ID);
    }
    
    const userId = params.userId || storedUserId;
    const deviceId = params.deviceId || storedDeviceId;
    const installId = params.installId || storedInstallId;
    
    if (params.revenue) {
      metadata.revenue = params.revenue;
    }

    const data: any = {
      id,
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
