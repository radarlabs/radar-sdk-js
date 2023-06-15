import Config from './config';
import Logger from './logger';
import Storage from './storage';
import Navigator from './navigator';
import { RadarPublishableKeyError } from './errors';

import AddressesAPI from './api/addresses';
import ConfigAPI from './api/config';
import ContextAPI from './api/context';
import ConversionsAPI from './api/conversions';
import GeocodingAPI from './api/geocoding';
import RoutingAPI from './api/routing';
import SearchAPI from './api/search';
import TrackAPI from './api/track';
import TripsAPI from './api/trips';

import SDK_VERSION from './version';

import type {
  Location,
  RadarAutocompleteParams,
  RadarConversionParams,
  RadarDistanceParams,
  RadarForwardGeocodeParams,
  RadarMatrixParams,
  RadarMetadata,
  RadarOptions,
  RadarReverseGeocodeParams,
  RadarSearchGeofencesParams,
  RadarSearchPlacesParams,
  RadarTrackParams,
  RadarTripOptions,
  RadarValidateAddressParams,
} from './types';


const isSecretKey = (key: string): boolean => (
  key.includes('_sk_')
);
const isLiveKey = (key: string): boolean => (
  key.includes('_live_')
);

class Radar {
  public static get VERSION() {
    return SDK_VERSION;
  }

  public static initialize(publishableKey: string, options: RadarOptions = {}) {
    if (!publishableKey) {
      throw new RadarPublishableKeyError('Publishable key required in initialization.');
    }

    if (isSecretKey(publishableKey)) {
      throw new RadarPublishableKeyError('Secret keys are not allowed. Please use your Radar publishable key.');
    }

    // store settings in global config
    const live = isLiveKey(publishableKey);
    const logLevel = live ? 'error' : 'warn';
    const radarOptions = Object.assign({},
      {
        publishableKey,
        live,
        logLevel,
      },
      options,
    );
    Config.setup(radarOptions);

    Logger.info(`initialized with ${live ? 'live' : 'test'} publishableKey.`);

    ConfigAPI.getConfig();
  }

  public static clear() {
    Config.clear();
  }

  ///////////////////////
  // geofencing platform
  ///////////////////////

  public static setUserId(userId?: string) {
    if (!userId) {
      Storage.removeItem(Storage.USER_ID);
      return;
    }
    Storage.setItem(Storage.USER_ID, String(userId).trim());
  }

  public static setDescription(description?: string) {
    if (!description) {
      Storage.removeItem(Storage.DESCRIPTION);
      return;
    }
    Storage.setItem(Storage.DESCRIPTION, String(description).trim());
  }

  public static setMetadata(metadata?: RadarMetadata) {
    if (!metadata) {
      Storage.removeItem(Storage.METADATA);
      return;
    }
    Storage.setItem(Storage.METADATA, JSON.stringify(metadata));
  }

  public static getLocation() {
    return Navigator.getCurrentPosition();
  }

  public static trackOnce(params: RadarTrackParams = {}) {
    try {
      return TrackAPI.trackOnce(params);
    } finally {
      ConfigAPI.getConfig(params); // call with updated permissions
    }
  }

  public static getContext(params: Location) {
    return ContextAPI.getContext(params);
  }

  public static setTripOptions(tripOptions?: RadarTripOptions) {
    TripsAPI.setTripOptions(tripOptions);
  }

  public static clearTripOptions() {
    TripsAPI.clearTripOptions();
  }

  public static getTripOptions() {
    return TripsAPI.getTripOptions();
  }

  public static startTrip(tripOptions: RadarTripOptions) {
    return TripsAPI.startTrip(tripOptions);
  }

  public static updateTrip(tripOptions: RadarTripOptions) {
    return TripsAPI.updateTrip(tripOptions);
  }

  public static completeTrip() {
    return TripsAPI.completeTrip();
  }

  public static cancelTrip() {
    return TripsAPI.cancelTrip();
  }

  public static logConversion(params: RadarConversionParams) {
    return ConversionsAPI.logConversion(params);
  }


  /////////////////
  // maps platform
  /////////////////

  public static forwardGeocode(params: RadarForwardGeocodeParams) {
    return GeocodingAPI.forwardGeocode(params);
  }

  public static reverseGeocode(params: RadarReverseGeocodeParams) {
    return GeocodingAPI.reverseGeocode(params);
  }

  public static ipGeocode() {
    return GeocodingAPI.ipGeocode();
  }

  public static autocomplete(params: RadarAutocompleteParams) {
    return SearchAPI.autocomplete(params);
  }

  public static searchGeofences(params: RadarSearchGeofencesParams) {
    return SearchAPI.searchGeofences(params);
  }

  public static searchPlaces(params: RadarSearchPlacesParams) {
    return SearchAPI.searchPlaces(params);
  }

  public static validateAddress(params: RadarValidateAddressParams) {
    return AddressesAPI.validateAddress(params);
  }

  public static distance(params: RadarDistanceParams) {
    return RoutingAPI.distance(params);
  }

  public static matrix(params: RadarMatrixParams) {
    return RoutingAPI.matrix(params);
  }
}

export default Radar;
