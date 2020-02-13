import * as Cookie from './cookie';
import * as Device from './device';
import * as Http from './http';
import getCurrentPosition from './navigator';

// consts
import PLACES_PROVIDER from './places_providers';
import SDK_VERSION from './version';
import STATUS from './status_codes';

const DEFAULT_HOST = 'https://api.radar.io';

class Radar {
  static get VERSION() {
    return SDK_VERSION;
  }

  static get PLACES_PROVIDER() {
    return PLACES_PROVIDER;
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

  static setPlacesProvider(placesProvider) {
    if (placesProvider !== PLACES_PROVIDER.FACEBOOK) {
      placesProvider = PLACES_PROVIDER.NONE;
    }
    Cookie.setCookie(Cookie.PLACES_PROVIDER, placesProvider);
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

    getCurrentPosition((status, { accuracy, latitude, longitude }) => {
      if (status !== STATUS.SUCCESS) {
        if (callback) {
          callback(status);
        }
        return;
      }

      // Get user data
      const deviceId = Device.getId();
      const userId = Cookie.getCookie(Cookie.USER_ID);
      const placesProvider = Cookie.getCookie(Cookie.PLACES_PROVIDER);
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
        placesProvider,
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
    getCurrentPosition((status, { latitude, longitude }) => {
      if (status !== STATUS.SUCCESS) {
        if (callback) {
          callback(status);
        }
        return;
      }

      this.getContextForLocation(latitude, longitude,
        (status, context) => {
          callback(status, context);
          return;
        }
      );
    });
  }

  static getContextForLocation(latitude, longitude, callback) {
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

  static searchPlaces(radius, chains, categories, groups, limit, callback) {
    getCurrentPosition((status, { latitude, longitude }) => {
      if (status !== STATUS.SUCCESS) {
        if (callback) {
          callback(status);
        }
        return;
      }

      this.searchPlacesNearLocation(latitude, longitude, radius, chains, categories, groups, limit,
        (status, places) => {
          callback(status, places);
          return;
        }
      );
    });
  }

  static searchPlacesNearLocation(latitude, longitude, radius, chains, categories, groups, limit, callback) {
    const publishableKey = Cookie.getCookie(Cookie.PUBLISHABLE_KEY);

    if (!publishableKey) {
      if (callback) {
        callback(STATUS.ERROR_PUBLISHABLE_KEY);
      }

      return;
    }

    const queryParams = {
      near: `${latitude},${longitude}`,
      radius,
      chains: chains.join(','),
      categories: categories.join(','),
      groups: groups.join(','),
      limit: Math.min(limit, 100),
    };

    const host = Cookie.getCookie(Cookie.HOST) || DEFAULT_HOST;
    const url = `${host}/v1/search/places`;
    const method = 'GET';
    const headers = {
      Authorization: publishableKey,
    };

    const onSuccess = (response) => {
      try {
        response = JSON.parse(response);

        if (callback) {
          callback(STATUS.SUCCESS, response.places);
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

  static searchGeofences(radius, tags, limit, callback) {
    getCurrentPosition((status, { latitude, longitude }) => {
      if (status !== STATUS.SUCCESS) {
        if (callback) {
          callback(status);
        }
        return;
      }

      this.searchGeofencesNearLocation(latitude, longitude, radius, tags, limit,
        (status, geofences) => {
          callback(status, geofences);
          return;
        }
      );
    });
  }

  static searchGeofencesNearLocation(latitude, longitude, radius, tags, limit, callback) {
    const publishableKey = Cookie.getCookie(Cookie.PUBLISHABLE_KEY);

    if (!publishableKey) {
      if (callback) {
        callback(STATUS.ERROR_PUBLISHABLE_KEY);
      }

      return;
    }

    const queryParams = {
      near: `${latitude},${longitude}`,
      radius,
      tags: tags.join(','),
      limit: Math.min(limit, 100),
    };

    const host = Cookie.getCookie(Cookie.HOST) || DEFAULT_HOST;
    const url = `${host}/v1/search/geofences`;
    const method = 'GET';
    const headers = {
      Authorization: publishableKey,
    };

    const onSuccess = (response) => {
      try {
        response = JSON.parse(response);

        if (callback) {
          callback(STATUS.SUCCESS, response.geofences);
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

  static autocomplete(query, latitude, longitude, limit, callback) {
    const publishableKey = Cookie.getCookie(Cookie.PUBLISHABLE_KEY);

    if (!publishableKey) {
      if (callback) {
        callback(STATUS.ERROR_PUBLISHABLE_KEY);
      }

      return;
    }

    const queryParams = {
      query,
      near: `${latitude},${longitude}`,
      limit,
    };

    const host = Cookie.getCookie(Cookie.HOST) || DEFAULT_HOST;
    const url = `${host}/v1/search/autocomplete`;
    const method = 'GET';
    const headers = {
      Authorization: publishableKey,
    };

    const onSuccess = (response) => {
      try {
        response = JSON.parse(response);

        if (callback) {
          callback(STATUS.SUCCESS, response.addresses);
        }
      } catch (e) {
        if (callback) {
          callback(STATUS.ERROR_SERVER);
        }
      }
    }

    const onError = (error) => {
      if (callback) {
        callback(error);
      }
    };

    Http.request(method, url, queryParams, headers, onSuccess, onError);
  }

  static geocode(query, callback) {
    const publishableKey = Cookie.getCookie(Cookie.PUBLISHABLE_KEY);

    if (!publishableKey) {
      if (callback) {
        callback(STATUS.ERROR_PUBLISHABLE_KEY);
      }

      return;
    }

    const queryParams = { query };

    const host = Cookie.getCookie(Cookie.HOST) || DEFAULT_HOST;
    const url = `${host}/v1/geocode/forward`;
    const method = 'GET';
    const headers = {
      Authorization: publishableKey,
    };

    const onSuccess = (response) => {
      try {
        response = JSON.parse(response);

        if (callback) {
          callback(STATUS.SUCCESS, response.addresses);
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

  static reverseGeocode(callback) {
    getCurrentPosition((status, { latitude, longitude }) => {
      if (status !== STATUS.SUCCESS) {
        if (callback) {
          callback(status);
        }
        return;
      }

      this.reverseGeocodeLocation(latitude, longitude,
        (status, addresses) => {
          callback(status, addresses);
          return;
        }
      );
    });
  }

  static reverseGeocodeLocation(latitude, longitude, callback) {
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
    const url = `${host}/v1/geocode/reverse`;
    const method = 'GET';
    const headers = {
      Authorization: publishableKey,
    };

    const onSuccess = (response) => {
      try {
        response = JSON.parse(response);

        if (callback) {
          callback(STATUS.SUCCESS, response.addresses);
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

  static geocodeIP(callback) {
    const publishableKey = Cookie.getCookie(Cookie.PUBLISHABLE_KEY);

    if (!publishableKey) {
      if (callback) {
        callback(STATUS.ERROR_PUBLISHABLE_KEY);
      }

      return;
    }

    const host = Cookie.getCookie(Cookie.HOST) || DEFAULT_HOST;
    const url = `${host}/v1/geocode/ip`;
    const method = 'GET';
    const headers = {
      Authorization: publishableKey,
    };

    const onSuccess = (response) => {
      try {
        response = JSON.parse(response);

        if (callback) {
          callback(STATUS.SUCCESS, response.country);
        }
      } catch (e) {
        if (callback) {
          callback(STATUS.ERROR_SERVER);
        }
      }
    }

    const onError = (error) => {
      if (callback) {
        callback(error);
      }
    };

    Http.request(method, url, {}, headers, onSuccess, onError);
  }

  static getDistance(destLat, destLng, modes, units) {
    getCurrentPosition((status, { latitude, longitude }) => {
      if (status !== STATUS.SUCCESS) {
        if (callback) {
          callback(status);
        }
        return;
      }

      this.getDistanceFromLocation(latitude, longitude, destLat, destLng, modes, units,
        (status, routes) => {
          callback(status, routes);
          return;
        }
      );
    });
  }

  static getDistanceFromLocation(originLat, originLng, destLat, destLng, modes, units, callback) {
    const publishableKey = Cookie.getCookie(Cookie.PUBLISHABLE_KEY);

    if (!publishableKey) {
      if (callback) {
        callback(STATUS.ERROR_PUBLISHABLE_KEY);
      }

      return;
    }

    const queryParams = {
      origin: `${originLat},${originLng}`,
      destination: `${destLat},${destLng}`,
      modes: modes.join(','),
      units,
    };

    const host = Cookie.getCookie(Cookie.HOST) || DEFAULT_HOST;
    const url = `${host}/v1/route/distance`;
    const method = 'GET';
    const headers = {
      Authorization: publishableKey,
    };

    const onSuccess = (response) => {
      try {
        response = JSON.parse(response);

        if (callback) {
          callback(STATUS.SUCCESS, response.routes);
        }
      } catch (e) {
        if (callback) {
          callback(STATUS.ERROR_SERVER);
        }
      }
    }

    const onError = (error) => {
      if (callback) {
        callback(error);
      }
    };

    Http.request(method, url, queryParams, headers, onSuccess, onError);
  }
}

export default Radar;
