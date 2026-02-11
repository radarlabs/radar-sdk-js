import Config from './config';
import Logger from './logger';
import Storage from './storage';
import Navigator from './navigator';
import Device from './device';
import Session from './session';
import Http from './http';
import { RadarError, RadarPublishableKeyError } from './errors';
import * as errors from './errors';

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

import type { RadarPlugin, RadarPluginContext, RadarStatic } from './plugin';

import type {
  Location,
  NavigatorPosition,
  RadarAutocompleteParams,
  RadarAutocompleteResponse,
  RadarContextResponse,
  RadarConversionParams,
  RadarConversionResponse,
  RadarDistanceParams,
  RadarForwardGeocodeParams,
  RadarGeocodeResponse,
  RadarIPGeocodeResponse,
  RadarMatrixParams,
  RadarMatrixResponse,
  RadarMetadata,
  RadarOptions,
  RadarReverseGeocodeParams,
  RadarRouteResponse,
  RadarSearchGeofencesParams,
  RadarSearchGeofencesResponse,
  RadarSearchPlacesParams,
  RadarSearchPlacesResponse,
  RadarTrackParams,
  RadarTrackResponse,
  RadarTripOptions,
  RadarTripResponse,
  RadarValidateAddressParams,
  RadarValidateAddressResponse,
} from './types';

const isSecretKey = (key: string): boolean => (
  key.includes('_sk_')
);
const isLiveKey = (key: string): boolean => (
  key.includes('_live_')
);

class Radar {
  private static _plugins: Map<string, RadarPlugin> = new Map();

  public static get VERSION() {
    return SDK_VERSION;
  }

  public static registerPlugin(...plugins: RadarPlugin[]) {
    const ctx = Radar._getPluginContext();
    for (const plugin of plugins) {
      if (Radar._plugins.has(plugin.name)) {
        Logger.warn(`plugin "${plugin.name}" already registered.`);
        continue;
      }

      plugin.install(ctx);
      Radar._plugins.set(plugin.name, plugin);
    }
  }

  private static _getPluginContext(): RadarPluginContext {
    return {
      Radar: Radar as RadarStatic,
      Config,
      Http,
      Storage,
      Device,
      Session,
      Logger,
      Navigator,
      SDK_VERSION,
      errors,
      apis: {
        Addresses: AddressesAPI,
        Config: ConfigAPI,
        Context: ContextAPI,
        Conversions: ConversionsAPI,
        Geocoding: GeocodingAPI,
        Routing: RoutingAPI,
        Search: SearchAPI,
        Track: TrackAPI,
        Trips: TripsAPI,
      },
    };
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
    if (!(window)?.RADAR_TEST_ENV) {
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

  public static getLocation(): Promise<NavigatorPosition> {
    return Navigator.getCurrentPosition();
  }

  public static trackOnce(params: RadarTrackParams = {}): Promise<RadarTrackResponse> {
    try {
      return TrackAPI.trackOnce(params);
    } finally {
      ConfigAPI.getConfig(params); // call with updated permissions
    }
  }

  public static getContext(params: Location): Promise<RadarContextResponse> {
    return ContextAPI.getContext(params);
  }

  public static setTripOptions(tripOptions?: RadarTripOptions) {
    TripsAPI.setTripOptions(tripOptions);
  }

  public static clearTripOptions() {
    TripsAPI.clearTripOptions();
  }

  public static getTripOptions(): RadarTripOptions {
    return TripsAPI.getTripOptions();
  }

  public static startTrip(tripOptions: RadarTripOptions): Promise<RadarTripResponse> {
    return TripsAPI.startTrip(tripOptions);
  }

  public static updateTrip(tripOptions: RadarTripOptions): Promise<RadarTripResponse> {
    return TripsAPI.updateTrip(tripOptions);
  }

  public static completeTrip(): Promise<RadarTripResponse> {
    return TripsAPI.completeTrip();
  }

  public static cancelTrip(): Promise<RadarTripResponse> {
    return TripsAPI.cancelTrip();
  }

  public static logConversion(params: RadarConversionParams): Promise<RadarConversionResponse> {
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

  public static onError(callback: (error: RadarError) => void) {
    Config.onError(callback);
  }

  /////////////////
  // Maps Platform
  /////////////////

  public static forwardGeocode(params: RadarForwardGeocodeParams): Promise<RadarGeocodeResponse> {
    return GeocodingAPI.forwardGeocode(params);
  }

  public static reverseGeocode(params: RadarReverseGeocodeParams): Promise<RadarGeocodeResponse> {
    return GeocodingAPI.reverseGeocode(params);
  }

  public static ipGeocode(): Promise<RadarIPGeocodeResponse> {
    return GeocodingAPI.ipGeocode();
  }

  public static autocomplete(params: RadarAutocompleteParams): Promise<RadarAutocompleteResponse> {
    return SearchAPI.autocomplete(params);
  }

  public static searchGeofences(params: RadarSearchGeofencesParams): Promise<RadarSearchGeofencesResponse> {
    return SearchAPI.searchGeofences(params);
  }

  public static searchPlaces(params: RadarSearchPlacesParams): Promise<RadarSearchPlacesResponse> {
    return SearchAPI.searchPlaces(params);
  }

  public static validateAddress(params: RadarValidateAddressParams): Promise<RadarValidateAddressResponse> {
    return AddressesAPI.validateAddress(params);
  }

  public static distance(params: RadarDistanceParams): Promise<RadarRouteResponse> {
    return RoutingAPI.distance(params);
  }

  public static matrix(params: RadarMatrixParams): Promise<RadarMatrixResponse> {
    return RoutingAPI.matrix(params);
  }
}

export default Radar;
