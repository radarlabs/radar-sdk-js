import type Radar from './api';
import type Config from './config';
import type Http from './http';
import type Storage from './storage';
import type Device from './device';
import type Session from './session';
import type Logger from './logger';
import type Navigator from './navigator';
import type AddressesAPI from './api/addresses';
import type ConfigAPI from './api/config';
import type ContextAPI from './api/context';
import type ConversionsAPI from './api/conversions';
import type GeocodingAPI from './api/geocoding';
import type RoutingAPI from './api/routing';
import type SearchAPI from './api/search';
import type TrackAPI from './api/track';
import type TripsAPI from './api/trips';
import type * as errors from './errors';

export interface RadarPlugin {
  name: string;
  version: string;
  install(ctx: RadarPluginContext): void;
}

/** NOTE(jasonl): intersection preserves typed static methods while allowing plugin method attachment */
export type RadarStatic = typeof Radar & Record<string, unknown>;

export interface RadarPluginContext {
  Radar: RadarStatic;
  Config: typeof Config;
  Http: typeof Http;
  Storage: typeof Storage;
  Device: typeof Device;
  Session: typeof Session;
  Logger: typeof Logger;
  Navigator: typeof Navigator;
  SDK_VERSION: string;
  errors: typeof errors;
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
