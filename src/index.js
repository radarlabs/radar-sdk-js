import  Cookie from './cookie';
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
      throw new Error(STATUS.ERROR_MISSING_CALLBACK);
    }

    Navigator.getCurrentPosition()
      .then((location) => {
        callback(STATUS.SUCCESS, location);
      })
      .catch(callback);
  }

  static trackOnce(arg0, arg1) {
    if (!arg0) {
      throw new Error(STATUS.ERROR_MISSING_CALLBACK);
    }

    let callback;
    let position;

    if (typeof arg0 === 'function') {
      callback = arg0;

    } else if (arg0 === 'object') {
      position = arg0;

      if (typeof arg1 !== 'function') {
        throw new Error(STATUS.ERROR_MISSING_CALLBACK);
      }
      callback = arg1;
    }

    Track.trackOnce(position)
      .then(({ location, user, events }) => {
        callback(STATUS.SUCCESS, location, user, events);
      })
      .catch(callback);
  }

  static getContext(arg0, arg1) {
    if (!arg0) {
      throw new Error(STATUS.ERROR_PARAMETERS);
    }

    let callback;
    let position;

    if (typeof arg0 === 'function') {
      callback = arg0;

    } else if (arg0 === 'object') {
      position = arg0;

      if (typeof arg1 !== 'function') {
        throw new Error(STATUS.ERROR_MISSING_CALLBACK);
      }
      callback = arg1;
    }

    Context.getContext(position)
      .then((context) => {
        callback(STATUS.SUCCESS, context);
      })
      .catch(callback);
  }

  static searchPlaces(searchOptions, callback) {
    if (!callback) {
      throw new Error(STATUS.ERROR_MISSING_CALLBACK);
    }

    Search.searchPlaces(searchOptions)
      .then((places) => {
        callback(STATUS.SUCCESS, places);
      })
      .catch(callback);
  }

  static searchGeofences(searchOptions, callback) {
    if (!callback) {
      throw new Error(STATUS.ERROR_MISSING_CALLBACK);
    }

    Search.searchGeofences(searchOptions)
      .then((geofences) => {
        callback(STATUS.SUCCESS, geofences);
      })
      .catch(callback);
  }

  static autocomplete(searchOptions, callback) {
    if (!callback) {
      throw new Error(STATUS.ERROR_MISSING_CALLBACK);
    }

    Search.autocomplete(searchOptions)
      .then((addresses) => {
        callback(STATUS.SUCCESS, addresses);
      })
      .catch(callback);
  }

  static geocode(geocodeOptions, callback) {
    if (!callback) {
      throw new Error(STATUS.ERROR_MISSING_CALLBACK);
    }

    Geocoding.geocode(geocodeOptions)
      .then((addresses) => {
        callback(STATUS.SUCCESS, addresses);
      })
      .catch(callback);
  }

  static reverseGeocode(arg0, arg1) {
    if (!arg0) {
      throw new Error(STATUS.ERROR_PARAMETERS);
    }

    let callback;
    let geocodeOptions;

    if (typeof arg0 === 'function') {
      callback = arg0;

    } else if (arg0 === 'object') {
      geocodeOptions = arg0;

      if (typeof arg1 !== 'function') {
        throw new Error(STATUS.ERROR_MISSING_CALLBACK);
      }
      callback = arg1;
    }

    Geocoding.reverseGeocode(geocodeOptions)
      .then((address) => {
        callback(STATUS.SUCCESS, address);
      })
      .catch(callback);
  }

  static ipGeocode(callback) {
    if (!callback) {
      throw new Error(STATUS.ERROR_MISSING_CALLBACK);
    }

    Geocoding.ipGeocode()
      .then((address) => {
        callback(STATUS.SUCCESS, address);
      })
      .catch(callback);
  }

  static getDistance(routingOptions, callback) {
    if (!callback) {
      throw new Error(STATUS.ERROR_MISSING_CALLBACK);
    }

    Routing.getDistanceToDestination(routingOptions)
      .then((routes) => {
        callback(STATUS.SUCCESS, routes);
      })
      .catch(callback);
  }
}

export default Radar;
