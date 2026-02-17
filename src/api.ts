import AddressesAPI from './api/addresses';
import ConfigAPI from './api/config';
import ContextAPI from './api/context';
import ConversionsAPI from './api/conversions';
import GeocodingAPI from './api/geocoding';
import RoutingAPI from './api/routing';
import SearchAPI from './api/search';
import TrackAPI from './api/track';
import TripsAPI from './api/trips';
import Config from './config';
import Device from './device';
import * as errors from './errors';
import { RadarPublishableKeyError } from './errors';
import Http from './http';
import Logger from './logger';
import Navigator from './navigator';
import Session from './session';
import Storage from './storage';
import SDK_VERSION from './version';

import type { RadarError } from './errors';
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

const isSecretKey = (key: string): boolean => key.includes('_sk_');
const isLiveKey = (key: string): boolean => key.includes('_live_');

/**
 * main entry point for the Radar SDK. all methods are static — do not instantiate.
 *
 * @example
 * ```ts
 * Radar.initialize('prj_test_pk_...');
 * const { user, events } = await Radar.trackOnce();
 * ```
 */
class Radar {
  private static _plugins: Map<string, RadarPlugin> = new Map();

  public static errors = errors;

  /** current SDK version string */
  public static get VERSION() {
    return SDK_VERSION;
  }

  /** register one or more plugins (e.g. maps, autocomplete, fraud) */
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

  /**
   * initialize the SDK with a publishable key. must be called before any other method.
   * @param publishableKey - your Radar publishable key (starts with `prj_test_pk_` or `prj_live_pk_`)
   * @param options - optional SDK configuration
   * @throws {RadarPublishableKeyError} if the key is missing or is a secret key
   */
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
    if (!window?.RADAR_TEST_ENV) {
      ConfigAPI.getConfig().catch((err) => {
        Logger.warn(`Error calling /config: ${err.message}`);
      });
    }
  }

  /** clear all SDK state and configuration */
  public static clear() {
    Config.clear();
  }

  ///////////////////////
  // Geofencing Platform
  ///////////////////////

  /** set the user ID for tracking. pass `undefined` to clear. */
  public static setUserId(userId?: string) {
    if (!userId) {
      Storage.removeItem(Storage.USER_ID);
      return;
    }
    Storage.setItem(Storage.USER_ID, String(userId).trim());
  }

  /** set a description for the current user. pass `undefined` to clear. */
  public static setDescription(description?: string) {
    if (!description) {
      Storage.removeItem(Storage.DESCRIPTION);
      return;
    }
    Storage.setItem(Storage.DESCRIPTION, String(description).trim());
  }

  /** set custom metadata for the current user. pass `undefined` to clear. */
  public static setMetadata(metadata?: RadarMetadata) {
    if (!metadata) {
      Storage.removeItem(Storage.METADATA);
      return;
    }
    Storage.setItem(Storage.METADATA, JSON.stringify(metadata));
  }

  /** get the device's current location using the browser geolocation API */
  public static getLocation(): Promise<NavigatorPosition> {
    return Navigator.getCurrentPosition();
  }

  /** track the user's current location once, returning location context and events */
  public static trackOnce(params: RadarTrackParams = {}): Promise<RadarTrackResponse> {
    try {
      return TrackAPI.trackOnce(params);
    } finally {
      // call with updated permissions
      ConfigAPI.getConfig(params).catch((err) => {
        Logger.warn(`Error calling /config: ${err.message}`);
      });
    }
  }

  /** get context (geofences, place, regions) for a location without tracking */
  public static getContext(params: Location): Promise<RadarContextResponse> {
    return ContextAPI.getContext(params);
  }

  /** save trip options for tracking. pass `undefined` to clear */
  public static setTripOptions(tripOptions?: RadarTripOptions) {
    TripsAPI.setTripOptions(tripOptions);
  }

  /** clear saved trip options */
  public static clearTripOptions() {
    TripsAPI.clearTripOptions();
  }

  /** get the currently saved trip options */
  public static getTripOptions(): RadarTripOptions {
    return TripsAPI.getTripOptions();
  }

  /** start a new trip with the given options */
  public static startTrip(tripOptions: RadarTripOptions): Promise<RadarTripResponse> {
    return TripsAPI.startTrip(tripOptions);
  }

  /** update an in-progress trip */
  public static updateTrip(tripOptions: RadarTripOptions): Promise<RadarTripResponse> {
    return TripsAPI.updateTrip(tripOptions);
  }

  /** complete the current trip and clear local trip options */
  public static completeTrip(): Promise<RadarTripResponse> {
    return TripsAPI.completeTrip();
  }

  /** cancel the current trip and clear local trip options */
  public static cancelTrip(): Promise<RadarTripResponse> {
    return TripsAPI.cancelTrip();
  }

  /** log a conversion event */
  public static logConversion(params: RadarConversionParams): Promise<RadarConversionResponse> {
    return ConversionsAPI.logConversion(params);
  }

  /** set the product identifier for tracking requests. pass `undefined` to clear */
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

  /** register a global error callback invoked on SDK errors */
  public static onError(callback: (error: RadarError) => void) {
    Config.onError(callback);
  }

  /////////////////
  // Maps Platform
  /////////////////

  /** geocode an address or place name to coordinates */
  public static forwardGeocode(params: RadarForwardGeocodeParams): Promise<RadarGeocodeResponse> {
    return GeocodingAPI.forwardGeocode(params);
  }

  /** reverse geocode coordinates to addresses */
  public static reverseGeocode(params: RadarReverseGeocodeParams): Promise<RadarGeocodeResponse> {
    return GeocodingAPI.reverseGeocode(params);
  }

  /** geocode the device's IP address to a rough location */
  public static ipGeocode(): Promise<RadarIPGeocodeResponse> {
    return GeocodingAPI.ipGeocode();
  }

  /** autocomplete partial addresses and place names */
  public static autocomplete(params: RadarAutocompleteParams, requestId?: string): Promise<RadarAutocompleteResponse> {
    return SearchAPI.autocomplete(params, requestId);
  }

  /** search for geofences near a location */
  public static searchGeofences(params: RadarSearchGeofencesParams): Promise<RadarSearchGeofencesResponse> {
    return SearchAPI.searchGeofences(params);
  }

  /** search for places (POIs) near a location */
  public static searchPlaces(params: RadarSearchPlacesParams): Promise<RadarSearchPlacesResponse> {
    return SearchAPI.searchPlaces(params);
  }

  /** validate a structured address */
  public static validateAddress(params: RadarValidateAddressParams): Promise<RadarValidateAddressResponse> {
    return AddressesAPI.validateAddress(params);
  }

  /** calculate travel distance and duration between two points */
  public static distance(params: RadarDistanceParams): Promise<RadarRouteResponse> {
    return RoutingAPI.distance(params);
  }

  /** calculate a distance matrix between multiple origins and destinations */
  public static matrix(params: RadarMatrixParams): Promise<RadarMatrixResponse> {
    return RoutingAPI.matrix(params);
  }
}

export default Radar;
