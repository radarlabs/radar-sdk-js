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
      return;
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

  static trackOnce({ latitude, longitude, accuracy }, callback) {
    if (!callback) {
      return;
    }

    if (latitude && longitude && accuracy) {
      Track.trackOnceWithLocation({ latitude, longitude, accuracy },
        (status, location, user, events) => {
          if (callback) {
            callback(status, location, user, events);
            return;
          }
        }
      );
    } else {
      Track.trackOnce(
        (status, location, user, events) => {
          if (callback) {
            callback(status, location, user, events);
            return;
          }
        }
      );
    }
  }

  static getContext({ latitude, longitude }, callback) {
    if (!callback) {
      return;
    }

    if (latitude && longitude) {
      Context.getContextForLocation({ latitude, longitude },
        (status, context) => {
          callback(status, context);
          return;
        }
      );
    } else {
      Context.getContext(
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
