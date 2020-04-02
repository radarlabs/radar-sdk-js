import * as Cookie from './cookie';
import * as Device from './device';
import * as Http from './http';
import Navigator from './navigator';

import Geocoding from './geocoding';
import Routing from './routing';
import Search from './search';

// consts
import SDK_VERSION from './version';
import STATUS from './status_codes';

const DEFAULT_HOST = 'https://api.radar.io';

class Radar {
  static get VERSION() {
    return SDK_VERSION;
  }

  static get STATUS() {
    return STATUS;
  }

  static initialize(publishableKey) {
    if (!publishableKey) {
      console.error('Radar "initialize" was called without a publishable key');
    }
    Cookie.setCookie(Cookie.PUBLISHABLE_KEY, publishableKey);
  }

  static setHost(host) {
    Cookie.setCookie(Cookie.HOST, host, true);
  }

  static setUserId(userId) {
    if (!userId) {
      Cookie.deleteCookie(Cookie.USER_ID);
      return;
    }

    userId = String(userId).trim();
    if (userId.length === 0 || userId.length > 256) {
      Cookie.deleteCookie(Cookie.USER_ID);
      return;
    }
    Cookie.setCookie(Cookie.USER_ID, userId);
  }

  static setDescription(description) {
    if (!description) {
      Cookie.deleteCookie(Cookie.DESCRIPTION);
      return;
    }

    description = String(description).trim();
    if (description.length === 0 || description.length > 256) {
      Cookie.deleteCookie(Cookie.DESCRIPTION);
      return;
    }
    Cookie.setCookie(Cookie.DESCRIPTION, description);
  }

  static trackOnce(callback) {
    const publishableKey = Cookie.getCookie(Cookie.PUBLISHABLE_KEY);

    if (!publishableKey) {
      if (callback) {
        callback(STATUS.ERROR_PUBLISHABLE_KEY);
      }
      return;
    }

    Navigator.getCurrentPosition((status, { accuracy, latitude, longitude }) => {
      if (status !== STATUS.SUCCESS) {
        if (callback) {
          callback(status);
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
        userAgent: navigator.userAgent,
        userId,
      };

      const host = Cookie.getCookie(Cookie.HOST) || DEFAULT_HOST;
      const url = `${host}/v1/users/${_id}`;
      const method = 'PUT';

      const onSuccess = (response) => {
        try {
          response = JSON.parse(response);
          if (callback) {
            callback(STATUS.SUCCESS, { accuracy, latitude, longitude }, response.user, response.events);
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
    });
  }

  static getContext(callback) {
    Navigator.getCurrentPosition((status, { latitude, longitude }) => {
      if (status !== STATUS.SUCCESS) {
        if (callback) {
          callback(status);
        }
        return;
      }

      this.getContextForLocation(
        { latitude, longitude },
        (status, context) => {
          callback(status, context);
          return;
        });
    });
  }

  static getContextForLocation(
    {
      latitude,
      longitude
    },
    callback
  ) {
    const publishableKey = Cookie.getCookie(Cookie.PUBLISHABLE_KEY);

    if (!publishableKey) {
      if (callback) {
        callback(STATUS.ERROR_PUBLISHABLE_KEY);
      }

      return;
    }

    const queryParams = {
      coordinates: `${latitude},${longitude}`,
    };

    const host = Cookie.getCookie(Cookie.HOST) || DEFAULT_HOST;
    const url = `${host}/v1/context`;
    const method = 'GET';
    const headers = {
      Authorization: publishableKey,
    };

    const onSuccess = (response) => {
      try {
        response = JSON.parse(response);

        if (callback) {
          callback(STATUS.SUCCESS, response.context);
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

    Http.request(method, url, queryParams, headers, onSuccess, onError);
  }

  static searchPlaces(
    {
      near,
      radius,
      chains,
      categories,
      groups,
      limit
    },
    callback
  ) {
    if (!callback) {
      return;
    }

    if (near) {
      Search.searchPlacesNear({ near, radius, chains, categories, groups, limit },
        (status, places) => {
          callback(status, places);
          return;
        }
      );
    } else {
      Search.searchPlaces({ radius, chains, categories, groups, limit },
        (status, places) => {
          callback(status, places);
          return;
        }
      );
    }
  }

  static searchGeofences(
    {
      near,
      radius,
      tags,
      limit,
    },
    callback
  ) {
    if (!callback) {
      return;
    }

    if (near) {
      Search.searchGeofencesNear({ near, radius, tags, limit },
        (status, geofences) => {
          callback(status, geofences);
          return;
        }
      );
    } else {
      Search.searchGeofences({ radius, tags, limit },
        (status, geofences) => {
          callback(status, geofences);
          return;
        }
      );
    }
  }

  static autocomplete(
    {
      query,
      near,
      limit,
    },
    callback
  ) {
    if (!callback) {
      return;
    }

    if (near) {
      Search.autocompleteNear({ query, near, limit },
        (status, addresses) => {
          callback(status, addresses);
          return;
        }
      );
    } else {
      Search.autocomplete({ query, limit },
        (status, addresses) => {
          callback(status, addresses);
          return;
        }
      );
    }
  }

  static geocode({ query }, callback) {
    if (!callback) {
      return;
    }

    Geocoding.geocode({ query }, (status, addresses) => {
      callback(status, addresses);
      return;
    });
  }

  static reverseGeocode({ latitude, longitude }, callback) {
    if (!callback) {
      return;
    }

    if (latitude && longitude) {
      Geocoding.reverseGeocodeLocation({ latitude, longitude },
        (status, addresses) => {
          callback(status, addresses);
          return;
        }
      );
    } else {
      Geocoding.reverseGeocode(
        (status, addresses) => {
          callback(status, addresses);
          return;
        }
      );
    }
  }

  static ipGeocode(callback) {
    if (!callback) {
      return;
    }

    Geocoding.ipGeocode((status, country) => {
      callback(status, country);
      return;
    });
  }

  static getDistance(
    {
      origin,
      destination,
      modes,
      units,
    },
    callback
  ) {
    if (!callback) {
      return;
    }

    if (origin) {
      Routing.getDistanceWithOrigin({ origin, destination, modes, units },
        (status, routes) => {
          callback(status, routes);
          return;
        }
      );
    }
    else {
      Routing.getDistanceToDestination({ destination, modes, units },
        (status, routes) => {
          callback(status, routes);
          return;
        }
      );
    }
  }
}

export default Radar;
