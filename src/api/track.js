import Cookie from '../cookie';
import Device from '../device';
import Http from '../http';
import Navigator from '../navigator';

// consts
import SDK_VERSION from '../version';

class Track {
  static async trackOnce(location={}) {
    if (!location.latitude || !location.longitude) {
      location = await Navigator.getCurrentPosition();
    }

    const { latitude, longitude, accuracy } = location;

    const deviceId = Device.getId();
    const userId = Cookie.getCookie(Cookie.USER_ID);
    const description = Cookie.getCookie(Cookie.DESCRIPTION);
    let metadata = Cookie.getCookie(Cookie.METADATA);

    if (metadata) {
      metadata = JSON.parse(metadata);
    }

    const body = {
      accuracy,
      description,
      deviceId,
      deviceType: 'Web',
      foreground: true,
      installId: deviceId,
      latitude,
      longitude,
      metadata,
      sdkVersion: SDK_VERSION,
      stopped: true,
      userId,
    };

    const response = await Http.request('POST', `v1/track`, body);

    response.location = location;

    return response;
  }
}

export default Track;
