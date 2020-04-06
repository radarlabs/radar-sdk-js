import * as Cookie from './cookie';
import Navigator from './navigator';

import Context from './api/context';
import Geocoding from './api/geocoding';
import Routing from './api/routing';
import Search from './api/search';
import Track from './api/track';

// consts
import SDK_VERSION from './version';
import STATUS from './status_codes';

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

  static getLocation(callback) {
    if (!callback) {
      throw new Error(STATUS.ERROR_PARAMETERS);
    }

    Navigator.getCurrentPosition((status, { latitude, longitude, accuracy }) => {
      if (status !== STATUS.SUCCESS) {
        callback(status);
        return;
      }

      callback(status, { latitude, longitude, accuracy });
      return;
    });
  }

  static trackOnce(arg0, arg1) {
    if (!arg0 || (typeof arg0 === 'function')) {
      const callback = arg0;
      Track.trackOnce(
        (status, location, user, events) => {
          if (callback) {
            callback(status, location, user, events);
            return;
          }
        }
      )
    } else if (typeof arg0 === 'object') {
      const { latitude, longitude, accuracy } = arg0;
      const callback = arg1;
      Track.trackOnceWithLocation({ latitude, longitude, accuracy },
        (status, location, user, events) => {
          if (callback) {
            callback(status, location, user, events);
            return;
          }
        }
      )
    } else {
      throw new Error(STATUS.ERROR_PARAMETERS);
    }
  }

  static getContext(arg0, arg1) {
    if (!arg0) {
      throw new Error(STATUS.ERROR_PARAMETERS);
    }

    if (typeof arg0 === 'function') {
      const callback = arg0;
      Context.getContext(
        (status, context) => {
          callback(status, context);
          return;
        }
      );
    } else if (typeof arg0 === 'object') {
      const { latitude, longitude } = arg0;
      const callback = arg1;
      Context.getContextForLocation({ latitude, longitude },
        (status, context) => {
          callback(status, context);
          return;
        }
      );
    }
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
      throw new Error(STATUS.ERROR_PARAMETERS);
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
      throw new Error(STATUS.ERROR_PARAMETERS);
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
      throw new Error(STATUS.ERROR_PARAMETERS);
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
      throw new Error(STATUS.ERROR_PARAMETERS);
    }

    Geocoding.geocode({ query }, (status, addresses) => {
      callback(status, addresses);
      return;
    });
  }

  static reverseGeocode(arg0, arg1) {
    if (!arg0) {
      throw new Error(STATUS.ERROR_PARAMETERS);
    }

    if (typeof arg0 === 'function') {
      const callback = arg0;
      Geocoding.reverseGeocode(
        (status, addresses) => {
          callback(status, addresses);
          return;
        }
      )
    } else if (typeof arg0 === 'object') {
      const { latitude, longitude } = arg0;
      const callback = arg1;
      Geocoding.reverseGeocodeLocation({ latitude, longitude },
        (status, addresses) => {
          callback(status, addresses);
          return;
        }
      )
    }
  }

  static ipGeocode(callback) {
    if (!callback) {
      throw new Error(STATUS.ERROR_PARAMETERS);
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
      throw new Error(STATUS.ERROR_PARAMETERS);
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
