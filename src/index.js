import Navigator from './navigator';

import Context from './api/context';
import Geocoding from './api/geocoding';
import Routing from './api/routing';
import Search from './api/search';
import Track from './api/track';
import Trips from './api/trips';
import Events from './api/events';
import Storage from './storage';

// consts
import SDK_VERSION from './version';
import STATUS from './status';
import { TRIP_STATUS } from './tripStatus';
import { API_VERSION } from './api_host';

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

  static initialize(publishableKey, options={}) {
    if (!publishableKey) {
      console.error('Radar "initialize" was called without a publishable key');
    }
    Storage.setItem(Storage.PUBLISHABLE_KEY, publishableKey);

    const { cacheLocationMinutes } = options;

    if (cacheLocationMinutes) {
      const number = Number(cacheLocationMinutes);
      if (Number.isNaN(number)) {
        console.warn('Radar SDK: invalid number for option "cacheLocationMinutes"');
      } else {
        Storage.setItem(Storage.CACHE_LOCATION_MINUTES, cacheLocationMinutes);
      }
    } else {
      Storage.removeItem(Storage.CACHE_LOCATION_MINUTES);
    }
  }

  static setHost(host, baseApiPath=API_VERSION) {
    Storage.setItem(Storage.HOST, host);
    Storage.setItem(Storage.BASE_API_PATH, baseApiPath);
  }

  static setUserId(userId) {
    if (!userId) {
      Storage.removeItem(Storage.USER_ID);
      return;
    }
    Storage.setItem(Storage.USER_ID, String(userId).trim());
  }

  static setDeviceId(deviceId, installId) {
    if (deviceId) {
      Storage.setItem(Storage.DEVICE_ID, String(deviceId).trim());
    } else {
      Storage.removeItem(Storage.DEVICE_ID);
    }

    if (installId) {
      Storage.setItem(Storage.INSTALL_ID, String(installId).trim());
    } else {
      Storage.removeItem(Storage.INSTALL_ID);
    }
  }

  static setDeviceType(deviceType) {
    if (deviceType) {
      Storage.setItem(Storage.DEVICE_TYPE, String(deviceType).trim());
    } else {
      Storage.removeItem(Storage.DEVICE_TYPE);
    }
  }

  static setDescription(description) {
    if (!description) {
      Storage.removeItem(Storage.DESCRIPTION);
      return;
    }
    Storage.setItem(Storage.DESCRIPTION, String(description).trim());
  }

  static setMetadata(metadata) {
    if (!metadata) {
      Storage.removeItem(Storage.METADATA);
      return;
    }

    Storage.setItem(Storage.METADATA, JSON.stringify(metadata));
  }

  static setRequestHeaders(headers={}) {
    if (!Object.keys(headers).length) {
      Storage.removeItem(Storage.CUSTOM_HEADERS);
      return;
    }
    Storage.setItem(Storage.CUSTOM_HEADERS, JSON.stringify(headers));
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
    Trips.startTrip(tripOptions)
      .then((response) => {
        Radar.setTripOptions(tripOptions);
        callback(null, { trip: response.trip, events: response.events, status: STATUS.SUCCESS }, response);
      })
      .catch(handleError(callback));
  }

  static updateTrip(tripOptions, status, callback=defaultCallback) {
    Trips.updateTrip(tripOptions, status)
      .then((response) => {
        Radar.setTripOptions(tripOptions);
        callback(null, { trip: response.trip, events: response.events, status: STATUS.SUCCESS }, response);
      })
      .catch(handleError(callback));
  }

  static completeTrip(callback=defaultCallback) {
    const tripOptions = Radar.getTripOptions();

    Trips.updateTrip(tripOptions, TRIP_STATUS.COMPLETED)
      .then((response) => {
        Radar.clearTripOptions();
        callback(null, { trip: response.trip, events: response.events, status: STATUS.SUCCESS }, response);
      })
      .catch(handleError(callback));
  }

  static cancelTrip(callback=defaultCallback) {
    const tripOptions = Radar.getTripOptions();

    Trips.updateTrip(tripOptions, TRIP_STATUS.CANCELED)
      .then((response) => {
        Radar.clearTripOptions();
        callback(null, { trip: response.trip, events: response.events, status: STATUS.SUCCESS }, response);
      })
      .catch(handleError(callback));
  }

  static setTripOptions(tripOptions) {
    if (!tripOptions) {
      Radar.clearTripOptions();
      return;
    }
    Storage.setItem(Storage.TRIP_OPTIONS, JSON.stringify(tripOptions));
  }

  static clearTripOptions() {
    Storage.removeItem(Storage.TRIP_OPTIONS);
  }

  static getTripOptions() {
    let tripOptions = Storage.getItem(Storage.TRIP_OPTIONS);
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

    if (typeof arg0 === 'function') {
      callback = arg0;
    } else if (typeof arg0 === 'object') {
      console.warn('Radar SDK: ipGeocode parameters have been deprecated.');
      callback = arg1;
    }

    Geocoding.ipGeocode()
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

  static getMatrix(routingOptions, callback=defaultCallback) {
    Routing.getMatrixDistances(routingOptions)
      .then((response) => {
        callback(null, { origins: response.origins, destinations: response.destinations, matrix: response.matrix, status: STATUS.SUCCESS }, response);
      })
      .catch(handleError(callback));
  }

  static sendEvent(eventData, callback=defaultCallback) {
    Events.sendEvent(eventData)
      .then((response) => {
        callback(null, { event: response.event, status: STATUS.SUCCESS, }, response);
      })
      .catch(handleError(callback));
  }
}

export default Radar;
