import Cookie from './cookie';
import Navigator from './navigator';

import Context from './api/context';
import Geocoding from './api/geocoding';
import Routing from './api/routing';
import Search from './api/search';
import Track from './api/track';

// consts
import SDK_VERSION from './version';
import STATUS from './status';

const handleError = (callback) => {
  return (err) => {

    // Radar Error
    if (typeof err === 'string') {
      callback(err, {});
      return;
    }

    // Http Error
    if (typeof err === 'object' && err.httpError) {
      callback(err.httpError, {}, err.response);
      return;
    }

    // Unknown
    callback(STATUS.ERROR_UNKNOWN, {});
  };
};

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
        callback(null, { location, status: STATUS.SUCCESS });
      })
      .catch(handleError(callback));
  }

  static trackOnce(arg0, arg1) {
    let callback;
    let location;

    if (typeof arg0 === 'function') {
      callback = arg0;

    } else if (typeof arg0 === 'object') {
      location = arg0;
      callback = arg1;

    } else if (arg0) {
      throw new Error(STATUS.ERROR_PARAMETERS);
    }

    Track.trackOnce(location)
      .then((response) => {
        if (!callback) {
          return;
        }
        callback(null, {
          location: response.location,
          user: response.user,
          events: response.events,
          status: STATUS.SUCCESS,
        }, response);
      })
      .catch(handleError(callback));
  }

  static getContext(arg0, arg1) {
    if (!arg0) {
      throw new Error(STATUS.ERROR_MISSING_CALLBACK);
    }

    let callback;
    let location;

    if (typeof arg0 === 'function') {
      callback = arg0;

    } else if (typeof arg0 === 'object') {
      location = arg0;

      if (typeof arg1 !== 'function') {
        throw new Error(STATUS.ERROR_MISSING_CALLBACK);
      }
      callback = arg1;

    } else {
      throw new Error(STATUS.ERROR_PARAMETERS);
    }

    Context.getContext(location)
      .then((response) => {
        callback(null, { context: response.context, status: STATUS.SUCCESS }, response);
      })
      .catch(handleError(callback));
  }

  static searchPlaces(searchOptions, callback) {
    if (!callback) {
      throw new Error(STATUS.ERROR_MISSING_CALLBACK);
    }

    Search.searchPlaces(searchOptions)
      .then((response) => {
        callback(null, { places: response.places, status: STATUS.SUCCESS }, response);
      })
      .catch(handleError(callback));
  }

  static searchGeofences(searchOptions, callback) {
    if (!callback) {
      throw new Error(STATUS.ERROR_MISSING_CALLBACK);
    }

    Search.searchGeofences(searchOptions)
      .then((response) => {
        callback(null, { geofences: response.geofences, status: STATUS.SUCCESS }, response);
      })
      .catch(handleError(callback));
  }

  static autocomplete(searchOptions, callback) {
    if (!callback) {
      throw new Error(STATUS.ERROR_MISSING_CALLBACK);
    }

    Search.autocomplete(searchOptions)
      .then((response) => {
        callback(null, { addresses: response.addresses, status: STATUS.SUCCESS }, response);
      })
      .catch(handleError(callback));
  }

  static geocode(geocodeOptions, callback) {
    if (!callback) {
      throw new Error(STATUS.ERROR_MISSING_CALLBACK);
    }

    Geocoding.geocode(geocodeOptions)
      .then((response) => {
        callback(null, { addresses: response.addresses, staus: STATUS.SUCCESS }, response);
      })
      .catch(handleError(callback));
  }

  static reverseGeocode(arg0, arg1) {
    if (!arg0) {
      throw new Error(STATUS.ERROR_PARAMETERS);
    }

    let callback;
    let geocodeOptions;

    if (typeof arg0 === 'function') {
      callback = arg0;

    } else if (typeof arg0 === 'object') {
      geocodeOptions = arg0;

      if (typeof arg1 !== 'function') {
        throw new Error(STATUS.ERROR_MISSING_CALLBACK);
      }
      callback = arg1;

    } else {
      throw new Error(STATUS.ERROR_PARAMETERS);
    }

    Geocoding.reverseGeocode(geocodeOptions)
      .then((response) => {
        callback(null, { addresses: response.addresses, status: STATUS.SUCCESS }, response);
      })
      .catch(handleError(callback));
  }

  static ipGeocode(callback) {
    if (!callback) {
      throw new Error(STATUS.ERROR_MISSING_CALLBACK);
    }

    Geocoding.ipGeocode()
      .then((response) => {
        callback(null, { address: response.address, status: STATUS.SUCCESS }, response);
      })
      .catch(handleError(callback));
  }

  static getDistance(routingOptions, callback) {
    if (!callback) {
      throw new Error(STATUS.ERROR_MISSING_CALLBACK);
    }

    Routing.getDistanceToDestination(routingOptions)
      .then((response) => {
        callback(null, { routes: response.routes, status: STATUS.SUCCESS }, response);
      })
      .catch(handleError(callback));
  }
}

export default Radar;
