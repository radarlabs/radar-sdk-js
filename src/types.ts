/** log verbosity level for the SDK */
export type LogLevel = 'none' | 'info' | 'warn' | 'error';

/** a geographic coordinate with optional accuracy and timestamp */
export interface Location {
  latitude: number;
  longitude: number;
  /** accuracy in meters */
  accuracy?: number;
  /** unix time in seconds */
  timestamp?: number;
}

/** position returned by the browser's geolocation API */
export interface NavigatorPosition {
  latitude: number;
  longitude: number;
  /** accuracy in meters */
  accuracy: number;
}

/** browser location permission state */
export type LocationAuthorization = 'DENIED' | 'NOT_DETERMINED' | 'GRANTED_FOREGROUND';

/** configuration options passed to {@link Radar.initialize} */
export interface RadarOptions {
  /** Radar publishable key (set automatically by `initialize`) */
  publishableKey?: string;
  /** whether the key is a live key (set automatically) */
  live?: boolean;
  /** SDK log verbosity */
  logLevel?: LogLevel;
  /** override the Radar API host */
  host?: string;
  /** API version string */
  version?: string;
  /** minutes to cache the device location */
  cacheLocationMinutes?: number;
  /** max age (ms) of a cached geolocation position */
  locationMaximumAge?: number;
  /** geolocation timeout in ms */
  locationTimeout?: number;
  /** geolocation accuracy hint */
  desiredAccuracy?: 'high' | 'medium' | 'low';
  /** callback that returns extra headers to send with every request */
  getRequestHeaders?: () => Record<string, string>;
  /** enable debug logging */
  debug?: boolean;
}

/** response from GET /v1/config */
export interface RadarConfigResponse {
  meta: {
    code: number;
    featureSettings?: Record<string, unknown>;
    sdkConfiguration?: Record<string, unknown>;
    trackingOptions?: Record<string, unknown>;
  };
}

/** base response shape shared by all API responses */
export interface RadarResponse {
  /** raw API response body (only present in debug mode) */
  response?: unknown;
}

/** travel mode for routing and trips */
export type RadarTravelMode = 'car' | 'foot' | 'bike' | 'motorbike' | 'truck';

/** road feature to avoid in routing requests */
export type RadarAvoidOption = 'tolls' | 'highways' | 'ferries' | 'borderCrossings';

/** options for creating or updating a trip */
export interface RadarTripOptions {
  userId?: string;
  externalId?: string;
  /** travel mode for ETA calculation */
  mode?: RadarTravelMode;
  /** geofence tag of the trip destination */
  destinationGeofenceTag?: string;
  /** geofence external ID of the trip destination */
  destinationGeofenceExternalId?: string;
  /** expected arrival time */
  scheduledArrivalAt?: Date;
  /** distance threshold (meters) for the "approaching" event */
  approachingThreshold?: number;
  metadata?: RadarMetadata;
  version?: string;
}

/** arbitrary key-value metadata attached to Radar objects */
export type RadarMetadata = Record<string, string | number | boolean>;

/**
 * extend this interface via declaration merging to add custom fields to track requests.
 *
 * @example
 * ```ts
 * declare module 'radar-sdk-js' {
 *   interface TrackBodyExtension {
 *     param?: boolean;
 *   }
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TrackBodyExtension {}

/** parameters for {@link Radar.trackOnce} */
export interface RadarTrackParams extends TrackBodyExtension {
  /** override latitude (skips device geolocation) */
  latitude?: number;
  /** override longitude (skips device geolocation) */
  longitude?: number;
  /** override accuracy in meters */
  accuracy?: number;
  userId?: string;
  deviceId?: string;
  installId?: string;
  description?: string;
  deviceType?: string;
  metadata?: RadarMetadata;
  tripOptions?: RadarTripOptions;
  /** geolocation accuracy hint */
  desiredAccuracy?: 'high' | 'medium' | 'low';
}

/** confidence level for Radar events */
export const RadarEventConfidence = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
} as const;
export type RadarEventConfidence = (typeof RadarEventConfidence)[keyof typeof RadarEventConfidence];

/** all possible Radar event types */
export type RadarEventType =
  | 'unknown'
  | 'user.entered_geofence'
  | 'user.entered_home'
  | 'user.entered_office'
  | 'user.entered_place'
  | 'user.entered_region_country'
  | 'user.entered_region_dma'
  | 'user.entered_region_state'
  | 'user.exited_geofence'
  | 'user.exited_home'
  | 'user.exited_office'
  | 'user.exited_place'
  | 'user.exited_region_country'
  | 'user.exited_region_dma'
  | 'user.exited_region_state'
  | 'user.nearby_place_chain'
  | 'user.started_traveling'
  | 'user.stopped_traveling'
  | 'user.started_commuting'
  | 'user.stopped_commuting'
  | 'user.started_trip'
  | 'user.updated_trip'
  | 'user.approaching_trip_destination'
  | 'user.arrived_at_trip_destination'
  | 'user.stopped_trip'
  | 'user.failed_fraud';

/** a Radar geofence */
export interface RadarGeofence {
  _id: string;
  description: string;
  tag?: string;
  externalId?: string;
  metadata?: RadarMetadata;
}

/** ETA estimate for a trip (distance in meters, duration in minutes) */
export interface RadarTripEta {
  /** distance remaining in meters */
  distance?: number;
  /** time remaining in minutes */
  duration?: number;
}

/** lifecycle status of a trip */
export type RadarTripStatus = 'pending' | 'started' | 'approaching' | 'arrived' | 'completed' | 'canceled' | 'expired';

/** a Radar trip with destination, ETA, and status */
export interface RadarTrip {
  _id: string;
  externalId: string;
  metadata?: RadarMetadata;
  destinationGeofenceTag?: string;
  destinationGeofenceExternalId?: string;
  mode?: RadarTravelMode;
  eta?: RadarTripEta;
  status: RadarTripStatus;
  scheduledArrivalAt?: Date;
}

/** fraud detection signals for a tracked user */
export interface RadarFraud {
  passed: boolean;
  bypassed: boolean;
  verified: boolean;
  proxy: boolean;
  mocked: boolean;
  compromised: boolean;
  jumped: boolean;
  sharing: boolean;
}

/** a place chain (e.g. Starbucks, McDonald's) */
export interface RadarChain {
  name: string;
  slug: string;
  externalId?: string;
  metadata?: RadarMetadata;
}

/** a Radar place (POI) */
export interface RadarPlace {
  _id: string;
  name: string;
  categories: string[];
  chain?: RadarChain;
}

/** a geographic or administrative region */
export interface RadarRegion {
  _id: string;
  type: string;
  code: string;
  name: string;
}

/** a Radar event triggered by user location changes */
export interface RadarEvent {
  _id: string;
  live: boolean;
  type: RadarEventType;
  confidence: RadarEventConfidence;
  geofence?: RadarGeofence;
  place?: RadarPlace;
  alternatePlaces?: RadarPlace;
  region?: RadarRegion;
  trip?: RadarTrip;
}

/** a tracked Radar user with location context */
export interface RadarUser {
  _id: string;
  userId?: string;
  deviceId?: string;
  description?: string;
  metadata?: RadarMetadata;
  trip?: RadarTrip;
  geofences?: RadarGeofence[];
  place?: RadarPlace;
  country?: RadarRegion;
  state?: RadarRegion;
  dma?: RadarRegion;
  postalCode?: RadarRegion;
  fraud?: RadarFraud;
}

/** response from {@link Radar.trackOnce} */
export interface RadarTrackResponse extends RadarResponse {
  location?: Location;
  user?: RadarUser;
  events?: RadarEvent[];
}

/** response from {@link Radar.getContext} */
export interface RadarContextResponse extends RadarResponse {
  location?: Location;
  geofences?: RadarGeofence[];
  place?: RadarPlace;
  country?: RadarRegion;
  state?: RadarRegion;
  dma?: RadarRegion;
  postalCode?: RadarRegion;
}

/** response from trip operations (start, update, complete, cancel) */
export interface RadarTripResponse extends RadarResponse {
  trip: RadarTrip;
  events: RadarEvent[];
}

/** parameters for {@link Radar.logConversion} */
export interface RadarConversionParams {
  /** conversion event name */
  name: string;
  metadata?: RadarMetadata;
  /** revenue amount in dollars */
  revenue?: number;
  userId?: string;
  deviceId?: string;
  installId?: string;
  createdAt?: Date | string;
  /** event duration in seconds */
  duration?: number;
}

/** a custom conversion event */
export interface RadarCustomEvent {
  _id: string;
  createdAt: string;
  live: boolean;
  type: string;
  confidence?: number;
  user?: RadarUser;
}

/** response from {@link Radar.logConversion} */
export interface RadarConversionResponse extends RadarResponse {
  event: RadarCustomEvent;
}

/** geocode layer filter for forward/reverse geocode and autocomplete */
export type RadarGeocodeLayer =
  | 'place'
  | 'address'
  | 'postalCode'
  | 'locality'
  | 'neighborhood'
  | 'county'
  | 'state'
  | 'country'
  | 'coarse'
  | 'fine';

/** a geocoded address result */
export interface RadarAddress {
  addressLabel?: string;
  borough?: string;
  categories?: string[];
  city?: string;
  /** geocode match confidence */
  confidence?: 'exact' | 'interpolated' | 'fallback';
  country?: string;
  countryCode?: string;
  countryFlag?: string;
  county?: string;
  /** distance from the query point in meters */
  distance?: number;
  dma?: string;
  dmaCode?: string;
  formattedAddress?: string;
  geometry: GeoJSON.Point;
  latitude: number;
  longitude: number;
  layer?: RadarGeocodeLayer;
  neighborhood?: string;
  /** street number */
  number?: string;
  placeLabel?: string;
  postalCode?: string;
  state?: string;
  stateCode?: string;
  street?: string;
}

/** time zone information for a geocoded address */
export interface RadarTimeZone {
  /** IANA time zone ID (e.g. `'America/New_York'`) */
  id: string;
  name: string;
  code: string;
  currentTime: string;
  utcOffset: number;
  dstOffset: number;
}

/** autocomplete address result with optional unit */
export interface RadarAutocompleteAddress extends RadarAddress {
  unit?: string;
}

/** forward/reverse geocode address result with unit and time zone */
export interface RadarGeocodeAddress extends RadarAddress {
  unit?: string;
  timeZone?: RadarTimeZone;
}

/** USPS record type code */
export type RadarValidationRecordType = 'S' | 'R' | 'P' | 'M' | 'H' | 'G' | 'F';

/** property type for address validation */
export type RadarValidationPropertyType = 'commercial' | 'residential';

/** address verification status */
export type RadarVerificationStatus = 'verified' | 'partially verified' | 'ambiguous' | 'unverified';

/** validated address with USPS metadata */
export interface RadarValidationAddress extends RadarAddress {
  unit?: string;
  plus4?: string;
  metadata?: {
    recordType?: RadarValidationRecordType;
    propertyType?: RadarValidationPropertyType;
  };
}

/** parameters for {@link Radar.forwardGeocode} */
export interface RadarForwardGeocodeParams {
  /** address or place name to geocode */
  query: string;
  /** filter results by geocode layer */
  layers?: RadarGeocodeLayer[];
  /** filter by country code */
  country?: string;
  /** language code for results */
  lang?: string;
}

/** parameters for {@link Radar.reverseGeocode} */
export interface RadarReverseGeocodeParams {
  /** latitude to reverse geocode (defaults to device location) */
  latitude?: number;
  /** longitude to reverse geocode (defaults to device location) */
  longitude?: number;
  /** filter results by geocode layer */
  layers?: RadarGeocodeLayer[];
}

/** response from {@link Radar.forwardGeocode} and {@link Radar.reverseGeocode} */
export interface RadarGeocodeResponse extends RadarResponse {
  addresses: RadarGeocodeAddress[];
}

/** response from {@link Radar.ipGeocode} */
export interface RadarIPGeocodeResponse extends RadarResponse {
  /** the detected IP address */
  ip: string;
  address?: RadarGeocodeAddress;
  /** whether the IP is a known proxy */
  proxy?: boolean;
}

/** parameters for {@link Radar.autocomplete} */
export interface RadarAutocompleteParams {
  /** search query string */
  query: string;
  /** bias results near a location or `'lat,lng'` string */
  near?: Location | string;
  /** max number of results */
  limit?: number;
  /** filter results by geocode layer */
  layers?: RadarGeocodeLayer[];
  /** filter by country code */
  countryCode?: string;
  /** @deprecated this is always true, regardless of the value passed here */
  expandUnits?: boolean;
  /** only return mailable addresses */
  mailable?: boolean;
  /** language code for results */
  lang?: string;
  /** filter by postal code */
  postalCode?: string;
}

/** response from {@link Radar.autocomplete} */
export interface RadarAutocompleteResponse extends RadarResponse {
  addresses: RadarAutocompleteAddress[];
}

/** parameters for {@link Radar.searchPlaces} */
export interface RadarSearchPlacesParams {
  /** center point or `'lat,lng'` string (defaults to device location) */
  near?: Location | string;
  /** search radius in meters */
  radius?: number;
  /** filter by chain slugs */
  chains?: string[] | string;
  /** filter by place categories */
  categories?: string[] | string;
  /** filter by place groups */
  groups?: string[] | string;
  /** max number of results */
  limit?: number;
}

/** a place search result with location geometry */
export interface RadarSearchPlace extends RadarPlace {
  location?: GeoJSON.Point;
}

/** response from {@link Radar.searchPlaces} */
export interface RadarSearchPlacesResponse extends RadarResponse {
  places: RadarSearchPlace[];
}

/** route geometry encoding format */
export type RadarDistanceGeometryType = 'polyline' | 'polyline5' | 'polyline6' | 'linestring';

/** parameters for {@link Radar.distance} */
export interface RadarDistanceParams {
  /** origin location or `'lat,lng'` string (defaults to device location) */
  origin?: Location | string;
  /** destination location or `'lat,lng'` string */
  destination: Location | string;
  /** travel modes to calculate (e.g. `['car', 'foot']`) */
  modes: RadarTravelMode[] | string;
  /** distance units */
  units?: 'metric' | 'imperial';
  /** route geometry encoding */
  geometry?: RadarDistanceGeometryType;
  /** number of points in the route geometry */
  geometryPoints?: number;
  /** road features to avoid */
  avoid?: RadarAvoidOption[] | string;
}

/** a route distance value with human-readable text */
export interface RadarRouteDistance {
  /** distance in meters (metric) or miles (imperial) */
  value: number;
  /** human-readable distance string (e.g. `'1.2 km'`) */
  text: string;
}

/** a route duration value with human-readable text */
export interface RadarRouteDuration {
  /** duration in minutes */
  value: number;
  /** human-readable duration string (e.g. `'5 mins'`) */
  text: string;
}

/** a single route with distance, duration, and optional geometry */
export interface RadarRoute {
  distance?: RadarRouteDistance;
  duration?: RadarRouteDuration;
  geometry?: GeoJSON.LineString;
}

/** routes keyed by travel mode */
export interface RadarRoutes {
  /** straight-line (geodesic) route — always present */
  geodesic: RadarRoute;
  foot?: RadarRoute;
  bike?: RadarRoute;
  car?: RadarRoute;
}

/** response from {@link Radar.distance} */
export interface RadarRouteResponse extends RadarResponse {
  routes: RadarRoutes;
}

/** parameters for {@link Radar.matrix} */
export interface RadarMatrixParams {
  /** origin locations or pipe-separated `'lat,lng'` strings (defaults to device location) */
  origins?: Location[] | string;
  /** destination locations or pipe-separated `'lat,lng'` strings */
  destinations: Location[] | string;
  /** travel mode */
  mode: RadarTravelMode;
  /** distance units */
  units?: 'metric' | 'imperial';
  /** road features to avoid */
  avoid?: RadarAvoidOption[] | string;
}

/** a single origin→destination route in a distance matrix */
export interface RadarMatrixRoute {
  distance?: RadarRouteDistance;
  duration?: RadarRouteDuration;
  /** index of the origin in the origins array */
  originIndex: number;
  /** index of the destination in the destinations array */
  destinationIndex: number;
}

/** response from {@link Radar.matrix} */
export interface RadarMatrixResponse extends RadarResponse {
  origins: Location[];
  destinations: Location[];
  /** 2D array of routes indexed by `[originIndex][destinationIndex]` */
  matrix: RadarMatrixRoute[][];
}

/** parameters for {@link Radar.validateAddress} */
export interface RadarValidateAddressParams {
  city: string;
  stateCode: string;
  postalCode: string;
  countryCode: string;
  /** street number */
  number?: string;
  street?: string;
  /** apartment/suite/unit */
  unit?: string;
  addressLabel?: string;
}

/** response from {@link Radar.validateAddress} */
export interface RadarValidateAddressResponse extends RadarResponse {
  address?: RadarValidationAddress;
  result?: {
    verificationStatus?: RadarVerificationStatus;
  };
}

/** parameters for {@link Radar.searchGeofences} */
export interface RadarSearchGeofencesParams {
  /** center point or `'lat,lng'` string (defaults to device location) */
  near?: Location | string;
  /** search radius in meters */
  radius?: number;
  /** filter by geofence tags */
  tags?: string[] | string;
  /** filter by geofence metadata */
  metadata?: RadarMetadata;
  /** max number of results */
  limit?: number;
  /** include geofence geometry in results */
  includeGeometry?: boolean;
}

/** response from {@link Radar.searchGeofences} */
export interface RadarSearchGeofencesResponse extends RadarResponse {
  geofences: RadarGeofence[];
}
