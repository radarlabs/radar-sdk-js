import * as Cookie from '../cookie';
import * as Device from '../device';
import * as Http from '../http';
import Navigator from '../navigator';

// consts
import SDK_VERSION from '../version';
import STATUS from '../status_codes';

const DEFAULT_HOST = 'https://api.radar.io';

class Track {
  static trackOnce(callback) {
    Navigator.getCurrentPosition((status, { latitude, longitude, accuracy }) => {
      if (status !== STATUS.SUCCESS) {
        if (callback) {
          callback(status);
        }
      }

      this.trackOnceWithLocation({ latitude, longitude, accuracy },
        (status, location, user, events) => {
          if (callback) {
            callback(status, user, location, events);
          }
          return;
        }
      );
    });
  }

  static trackOnceWithLocation({ latitude, longitude, accuracy }, callback) {
    const publishableKey = Cookie.getCookie(Cookie.PUBLISHABLE_KEY);

    if (!publishableKey) {
      if (callback) {
        callback(STATUS.ERROR_PUBLISHABLE_KEY);
      }
      return;
    }

    // Get user data
    const deviceId = Device.getId();
    const userId = Cookie.getCookie(Cookie.USER_ID);
    const description = Cookie.getCookie(Cookie.DESCRIPTION);
    const _id = userId || deviceId;

    // Setup http
    const headers = {
      Authorization: publishableKey
    };

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

    const host = Cookie.getCookie(Cookie.HOST) || DEFAULT_HOST;
    const url = `${host}/v1/users/${_id}`;
    const method = 'PUT';

    const onSuccess = (response) => {
      try {
        response = JSON.parse(response);
        if (callback) {
          callback(STATUS.SUCCESS, { latitude, longitude, accuracy }, response.user, response.events);
        }
      } catch (e) {
        if (callback) {
          callback(STATUS.ERROR_SERVER);
        }
      }
    };

    const onError = (error) => {
      if (callback) {
        callback(error);
      }
    };

    Http.request(method, url, body, headers, onSuccess, onError);
  }
}

export default Track;
