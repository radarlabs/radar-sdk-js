import SessionStorage from '../sessionStorage';
import Device from '../device';
import Http from '../http';
import Navigator from '../navigator';

// consts
import SDK_VERSION from '../version';

class Track {
  static async trackOnce(params={}) {
    let { latitude, longitude, accuracy } = params;

    if (!latitude || !longitude) {
      const deviceLocation = await Navigator.getCurrentPosition();
      latitude = deviceLocation.latitude;
      longitude = deviceLocation.longitude;
      accuracy = deviceLocation.accuracy;
    }

    const deviceId = Device.getId();
    const userId = SessionStorage.getSessionStorage(SessionStorage.USER_ID);
    const installId = SessionStorage.getSessionStorage(SessionStorage.INSTALL_ID) || deviceId;
    const deviceType = SessionStorage.getSessionStorage(SessionStorage.DEVICE_TYPE) || 'Web';
    const description = SessionStorage.getSessionStorage(SessionStorage.DESCRIPTION);

    let metadata = SessionStorage.getSessionStorage(SessionStorage.METADATA);
    if (metadata) {
      metadata = JSON.parse(metadata);
    }

    let tripOptions = SessionStorage.getSessionStorage(SessionStorage.TRIP_OPTIONS);
    if (tripOptions) {
      tripOptions = JSON.parse(tripOptions);
    }

    const body = {
      ...params,
      accuracy,
      description,
      deviceId,
      deviceType,
      foreground: true,
      installId,
      latitude,
      longitude,
      metadata,
      sdkVersion: SDK_VERSION,
      stopped: true,
      userId,
      tripOptions,
    };

    const basePath = SessionStorage.getSessionStorage(SessionStorage.BASE_API_PATH) || 'v1';
    const trackEndpoint = `${basePath}/track`;

    const response = await Http.request('POST', trackEndpoint, body);
    response.location = { latitude, longitude, accuracy };

    return response;
  }
}

export default Track;
