import Cookie from './cookie';
import Navigator from './navigator';

import Context from './api/context';
import Geocoding from './api/geocoding';
import Routing from './api/routing';
import Search from './api/search';
import Track from './api/track';
import Trips from './api/trips';

// consts
import SDK_VERSION from './version';
import STATUS from './status';
import { TRIP_STATUS } from './tripStatus';

const defaultCallback = () => {};

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

  static setHost(host, trackEndpoint) {
    Cookie.setCookie(Cookie.HOST, host, true);
    Cookie.setCookie(Cookie.TRACK_ENDPOINT, trackEndpoint);
  }

  static setUserId(userId) {
    if (!userId) {
      Cookie.deleteCookie(Cookie.USER_ID);
      return;
    }

    Cookie.setCookie(Cookie.USER_ID, String(userId).trim());
  }

  static setDeviceId(deviceId) {
    if (!deviceId) {
      Cookie.deleteCookie(Cookie.DEVICE_ID);
      return;
    }

    Cookie.setCookie(Cookie.DEVICE_ID, String(deviceId).trim());
  }

  static setDescription(description) {
    if (!description) {
      Cookie.deleteCookie(Cookie.DESCRIPTION);
      return;
    }

    Cookie.setCookie(Cookie.DESCRIPTION, String(description).trim());
  }

  static setMetadata(metadata) {
    if (!metadata) {
      Cookie.deleteCookie(Cookie.METADATA);
      return;
    }

    Cookie.setCookie(Cookie.METADATA, JSON.stringify(metadata));
  }

  static setRequestHeaders(headers={}) {
    if (!Object.keys(headers).length) {
      Cookie.deleteCookie(Cookie.CUSTOM_HEADERS);
      return;
    }

    Cookie.setCookie(Cookie.CUSTOM_HEADERS, JSON.stringify(headers));
  }

  static getLocation(callback=defaultCallback) {
    Navigator.getCurrentPosition()
      .then((location) => {
        callback(null, { location, status: STATUS.SUCCESS });
      })
      .catch(handleError(callback));
  }

  static trackOnce(arg0, arg1=defaultCallback) {
    let callback;
    let location;

    if (typeof arg0 === 'function') {
      callback = arg0;
    } else {
      location = arg0;
      callback = arg1;
    }

    Track.trackOnce(location)
      .then((response) => {
        callback(null, {
          location: response.location,
          user: response.user,
          events: response.events,
          status: STATUS.SUCCESS,
        }, response);
      })
      .catch(handleError(callback));
  }

  static getContext(arg0, arg1=defaultCallback) {
    let callback;
    let location;

    if (typeof arg0 === 'function') {
      callback = arg0;

    } else {
      location = arg0;
      callback = arg1;
    }

    Context.getContext(location)
      .then((response) => {
        callback(null, { context: response.context, status: STATUS.SUCCESS }, response);
      })
      .catch(handleError(callback));
  }

  static startTrip(tripOptions, callback=defaultCallback) {
    Trips.updateTrip(tripOptions, TRIP_STATUS.STARTED)
      .then((response) => {
        Cookie.setCookie(Cookie.TRIP_OPTIONS, JSON.stringify(tripOptions));

        callback(null, { trip: response.trip, status: STATUS.SUCCESS }, response);
      })
      .catch(handleError(callback));
  }

  static updateTrip(tripOptions, status, callback=defaultCallback) {
    Trips.updateTrip(tripOptions, status)
      .then((response) => {
        // set cookie
        Cookie.setCookie(Cookie.TRIP_OPTIONS, JSON.stringify(tripOptions));

        callback(null, { trip: response.trip, status: STATUS.SUCCESS }, response);
      })
      .catch(handleError(callback));
  }

  static completeTrip(callback=defaultCallback) {
    const tripOptions = Radar.getTripOptions();

    Trips.updateTrip(tripOptions, TRIP_STATUS.COMPLETED)
      .then((response) => {
        // clear tripOptions
        Cookie.deleteCookie(Cookie.TRIP_OPTIONS);

        callback(null, { trip: response.trip, status: STATUS.SUCCESS }, response);
      })
      .catch(handleError(callback));
  }

  static cancelTrip(callback=defaultCallback) {
    const tripOptions = Radar.getTripOptions();

    Trips.updateTrip(tripOptions, TRIP_STATUS.CANCELLED)
      .then((response) => {
        // clear tripOptions
        Cookie.deleteCookie(Cookie.TRIP_OPTIONS);

        callback(null, { trip: response.trip, status: STATUS.SUCCESS }, response);
      })
      .catch(handleError(callback));
  }

  static getTripOptions() {
    let tripOptions = Cookie.getCookie(Cookie.TRIP_OPTIONS);
    if (tripOptions) {
      tripOptions = JSON.parse(tripOptions);
    }
    return tripOptions;
  }

  static searchPlaces(searchOptions, callback=defaultCallback) {
    Search.searchPlaces(searchOptions)
      .then((response) => {
        callback(null, { places: response.places, status: STATUS.SUCCESS }, response);
      })
      .catch(handleError(callback));
  }

  static searchGeofences(searchOptions, callback=defaultCallback) {
    Search.searchGeofences(searchOptions)
      .then((response) => {
        callback(null, { geofences: response.geofences, status: STATUS.SUCCESS }, response);
      })
      .catch(handleError(callback));
  }

  static autocomplete(searchOptions, callback=defaultCallback) {
    Search.autocomplete(searchOptions)
      .then((response) => {
        callback(null, { addresses: response.addresses, status: STATUS.SUCCESS }, response);
      })
      .catch(handleError(callback));
  }

  static geocode(geocodeOptions, callback=defaultCallback) {
    Geocoding.geocode(geocodeOptions)
      .then((response) => {
        callback(null, { addresses: response.addresses, staus: STATUS.SUCCESS }, response);
      })
      .catch(handleError(callback));
  }

  static reverseGeocode(arg0, arg1=defaultCallback) {
    let callback;
    let geocodeOptions;

    if (typeof arg0 === 'function') {
      callback = arg0;

    } else {
      geocodeOptions = arg0;
      callback = arg1;
    }

    Geocoding.reverseGeocode(geocodeOptions)
      .then((response) => {
        callback(null, { addresses: response.addresses, status: STATUS.SUCCESS }, response);
      })
      .catch(handleError(callback));
  }

  static ipGeocode(arg0, arg1=defaultCallback) {
    let callback;
    let geocodeOptions;

    if (typeof arg0 === 'function') {
      callback = arg0;

    } else if (typeof arg0 === 'object') {
      geocodeOptions = arg0;
      callback = arg1;
    }

    Geocoding.ipGeocode(geocodeOptions)
      .then((response) => {
        callback(null, { address: response.address, status: STATUS.SUCCESS }, response);
      })
      .catch(handleError(callback));
  }

  static getDistance(routingOptions, callback=defaultCallback) {
    Routing.getDistanceToDestination(routingOptions)
      .then((response) => {
        callback(null, { routes: response.routes, status: STATUS.SUCCESS }, response);
      })
      .catch(handleError(callback));
  }
}

export default Radar;
