import Config from './config';
import Logger from './logger';
import Storage from './storage';
import Navigator from './navigator';
import { RadarError, RadarPublishableKeyError } from './errors';

import AddressesAPI from './api/addresses';
import ConfigAPI from './api/config';
import ContextAPI from './api/context';
import ConversionsAPI from './api/conversions';
import GeocodingAPI from './api/geocoding';
import RoutingAPI from './api/routing';
import SearchAPI from './api/search';
import TrackAPI from './api/track';
import TripsAPI from './api/trips';
import VerifyAPI from './api/verify';

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
  RadarStartTrackingVerifiedParams,
  RadarTrackParams,
  RadarTrackVerifiedParams,
  RadarTrackVerifiedResponse,
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
    const logLevel = live ? 'error' : 'info';
    const debug = !live;
    const radarOptions = Object.assign(
      Config.defaultOptions,
      {
        publishableKey,
        live,
        logLevel,
        debug,
      },
      options,
    );
    Config.setup(radarOptions);

    Logger.info(`initialized with ${live ? 'live' : 'test'} publishableKey.`);
    if (options.debug) {
      Logger.debug('using options', options);
    }

    // NOTE(jasonl): this allows us to run jest tests
    // without having to mock the ConfigAPI.getConfig call
    if (!(window as any)?.RADAR_TEST_ENV) {
      ConfigAPI.getConfig();
    }
  }

  public static clear() {
    Config.clear();
  }

  ///////////////////////
  // Geofencing Platform
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

  public static trackVerified(params: RadarTrackVerifiedParams = {}) {
    return VerifyAPI.trackVerified(params);
  }

  public static startTrackingVerified(params: RadarStartTrackingVerifiedParams) {
    VerifyAPI.startTrackingVerified(params);
  }

  public static stopTrackingVerified() {
    VerifyAPI.stopTrackingVerified();
  }

  public static getVerifiedLocationToken(params: RadarTrackVerifiedParams = {}) {
    return VerifyAPI.getVerifiedLocationToken(params);
  }

  public static clearVerifiedLocationToken() {
    VerifyAPI.clearVerifiedLocationToken();
  }

  public static setExpectedJurisdiction(countryCode?: string, stateCode?: string) {
    VerifyAPI.setExpectedJurisdiction(countryCode, stateCode);
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

  public static setProduct(product?: string) {
    if (!product) {
      Storage.removeItem(Storage.PRODUCT);
      return;
    }
    Storage.setItem(Storage.PRODUCT, String(product).trim());
  }

  ///////////////////////
  // Listeners
  ///////////////////////

  public static onTokenUpdated(callback: (token: RadarTrackVerifiedResponse) => void) {
    VerifyAPI.onTokenUpdated(callback);
  }

  public static onError(callback: (error: RadarError) => void) {
    Config.onError(callback);
  }

  /////////////////
  // Maps Platform
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
