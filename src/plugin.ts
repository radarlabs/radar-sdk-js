import type Radar from './api';
import type AddressesAPI from './api/addresses';
import type ConfigAPI from './api/config';
import type ContextAPI from './api/context';
import type ConversionsAPI from './api/conversions';
import type GeocodingAPI from './api/geocoding';
import type RoutingAPI from './api/routing';
import type SearchAPI from './api/search';
import type TrackAPI from './api/track';
import type TripsAPI from './api/trips';
import type Config from './config';
import type Device from './device';
import type Http from './http';
import type Logger from './logger';
import type Navigator from './navigator';
import type Session from './session';
import type Storage from './storage';

/** interface that all Radar plugins must implement */
export interface RadarPlugin {
  /** unique plugin name (e.g. `'maps'`, `'autocomplete'`) */
  name: string;
  /** semver version of the plugin */
  version: string;
  /** called by `Radar.registerPlugin()` to install the plugin */
  install(ctx: RadarPluginContext): void;
}

/** NOTE(jasonl): intersection preserves typed static methods while allowing plugin method attachment */
export type RadarStatic = typeof Radar & Record<string, unknown>;

/** context object passed to {@link RadarPlugin.install} with access to SDK internals */
export interface RadarPluginContext {
  /** the Radar static class for attaching new namespaces (e.g. `ctx.Radar.ui`) */
  Radar: RadarStatic;
  /** SDK configuration singleton */
  Config: typeof Config;
  /** fetch-based HTTP client */
  Http: typeof Http;
  /** typed localStorage wrapper */
  Storage: typeof Storage;
  /** device ID generator */
  Device: typeof Device;
  /** session management */
  Session: typeof Session;
  /** SDK logger */
  Logger: typeof Logger;
  /** browser geolocation wrapper */
  Navigator: typeof Navigator;
  /** internal API modules for making Radar API calls */
  apis: {
    Addresses: typeof AddressesAPI;
    Config: typeof ConfigAPI;
    Context: typeof ContextAPI;
    Conversions: typeof ConversionsAPI;
    Geocoding: typeof GeocodingAPI;
    Routing: typeof RoutingAPI;
    Search: typeof SearchAPI;
    Track: typeof TrackAPI;
    Trips: typeof TripsAPI;
  };
}
