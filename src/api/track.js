import  Cookie from '../cookie';
import  Device from '../device';
import  Http from '../http';
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
    const _id = userId || deviceId;

    const body = {
      accuracy,
      description,
      deviceId,
      deviceType: 'Web',
      foreground: true,
      latitude,
      longitude,
      sdkVersion: SDK_VERSION,
      stopped: true,
      userId,
    };

    const response = await Http.request('PUT', `v1/users/${_id}`, body);
    response.location = location;

    return response;
  }
}

export default Track;
