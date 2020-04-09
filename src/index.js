import Cookie from './cookie';
import Navigator from './navigator';

import Context from './api/context';
import Geocoding from './api/geocoding';
import Routing from './api/routing';
import Search from './api/search';
import Track from './api/track';

// consts
import SDK_VERSION from './version';
import ERROR from './error_codes';
import SUCCESS from './status_codes';

class Radar {
  static get VERSION() {
    return SDK_VERSION;
  }

  static get ERROR() {
    return ERROR;
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
      throw new Error(ERROR.MISSING_CALLBACK);
    }

    Navigator.getCurrentPosition()
      .then((location) => {
        callback(null, { location, status: SUCCESS });
      })
      .catch(callback);
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
      throw new Error(ERROR.PARAMETERS);
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
          response,
        });
      })
      .catch(callback);
  }

  static getContext(arg0, arg1) {
    if (!arg0) {
      throw new Error(ERROR.MISSING_CALLBACK);
    }

    let callback;
    let location;

    if (typeof arg0 === 'function') {
      callback = arg0;

    } else if (typeof arg0 === 'object') {
      location = arg0;

      if (typeof arg1 !== 'function') {
        throw new Error(ERROR.MISSING_CALLBACK);
      }
      callback = arg1;

    } else {
      throw new Error(ERROR.PARAMETERS);
    }

    Context.getContext(location)
      .then((response) => {
        callback(null, { context: response.context, status: SUCCESS }, response);
      })
      .catch(callback);
  }

  static searchPlaces(searchOptions, callback) {
    if (!callback) {
      throw new Error(ERROR.MISSING_CALLBACK);
    }

    Search.searchPlaces(searchOptions)
      .then((response) => {
        callback(null, { places: response.places, status: SUCCESS }, response);
      })
      .catch(callback);
  }

  static searchGeofences(searchOptions, callback) {
    if (!callback) {
      throw new Error(ERROR.MISSING_CALLBACK);
    }

    Search.searchGeofences(searchOptions)
      .then((response) => {
        callback(null, { geofences: response.geofences, status: SUCCESS }, response);
      })
      .catch(callback);
  }

  static autocomplete(searchOptions, callback) {
    if (!callback) {
      throw new Error(ERROR.MISSING_CALLBACK);
    }

    Search.autocomplete(searchOptions)
      .then((response) => {
        callback(null, { addresses: response.addresses, status: SUCCESS }, response);
      })
      .catch(callback);
  }

  static geocode(geocodeOptions, callback) {
    if (!callback) {
      throw new Error(ERROR.MISSING_CALLBACK);
    }

    Geocoding.geocode(geocodeOptions)
      .then((response) => {
        callback(null, { addresses: response.addresses, staus: SUCCESS }, response);
      })
      .catch(callback);
  }

  static reverseGeocode(arg0, arg1) {
    if (!arg0) {
      throw new Error(ERROR.PARAMETERS);
    }

    let callback;
    let geocodeOptions;

    if (typeof arg0 === 'function') {
      callback = arg0;

    } else if (typeof arg0 === 'object') {
      geocodeOptions = arg0;

      if (typeof arg1 !== 'function') {
        throw new Error(ERROR.MISSING_CALLBACK);
      }
      callback = arg1;

    } else {
      throw new Error(ERROR.PARAMETERS);
    }

    Geocoding.reverseGeocode(geocodeOptions)
      .then((response) => {
        callback(null, { addresses: response.addresses, status: SUCCESS }, response);
      })
      .catch(callback);
  }

  static ipGeocode(callback) {
    if (!callback) {
      throw new Error(ERROR.MISSING_CALLBACK);
    }

    Geocoding.ipGeocode()
      .then((response) => {
        callback(null, { address: response.address, status: SUCCESS }, response);
      })
      .catch(callback);
  }

  static getDistance(routingOptions, callback) {
    if (!callback) {
      throw new Error(ERROR.MISSING_CALLBACK);
    }

    Routing.getDistanceToDestination(routingOptions)
      .then((response) => {
        callback(null, { routes: response.routes, status: SUCCESS }, response);
      })
      .catch(callback);
  }
}

export default Radar;
