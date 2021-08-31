import Cookie from '../cookie';
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
    const userId = Cookie.getCookie(Cookie.USER_ID);
    const installId = Cookie.getCookie(Cookie.INSTALL_ID) || deviceId;
    const deviceType = Cookie.getCookie(Cookie.DEVICE_TYPE) || 'Web';
    const description = Cookie.getCookie(Cookie.DESCRIPTION);

    let metadata = Cookie.getCookie(Cookie.METADATA);
    if (metadata) {
      metadata = JSON.parse(metadata);
    }

    let tripOptions = Cookie.getCookie(Cookie.TRIP_OPTIONS);
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

    const basePath = Cookie.getCookie(Cookie.BASE_API_PATH) || 'v1';
    const trackEndpoint = `${basePath}/track`;

    const response = await Http.request('POST', trackEndpoint, body);
    response.location = { latitude, longitude, accuracy };

    return response;
  }
}

export default Track;
