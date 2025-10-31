export type LogLevel = 'none' | 'info' | 'warn' | 'error'

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface NavigatorPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export type LocationAuthorization =
  | 'DENIED'
  | 'NOT_DETERMINED'
  | 'GRANTED_FOREGROUND';

export interface RadarOptions {
  publishableKey?: string;
  live?: boolean;
  logLevel?: LogLevel;
  host?: string;
  version?: string;
  cacheLocationMinutes?: number;
  locationMaximumAge?: number;
  locationTimeout?: number;
  desiredAccuracy?: 'high' | 'medium' | 'low';
  getRequestHeaders?: () => {};
  debug?: boolean;
};

export interface RadarResponse {
  response?: any; // DEBUG ONLY
}

export type RadarTravelMode =
  | 'car'
  | 'foot'
  | 'bike'
  | 'motorbike'
  | 'truck';

export type RadarAvoidOption =
  | 'tolls'
  | 'highways'
  | 'ferries'
  | 'borderCrossings';

export interface RadarTripOptions {
  userId?: string;
  externalId?: string;
  mode?: RadarTravelMode;
  destinationGeofenceTag?: string;
  destinationGeofenceExternalId?: string;
  scheduledArrivalAt?: Date;
  approachingThreshold?: number;
  metadata?: RadarMetadata;
  version?: string;
}

export type RadarMetadata = Record<string, string | number | boolean>;

export interface RadarTrackParams {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  userId?: string;
  deviceId?: string;
  installId?: string;
  description?: string;
  deviceType?: string;
  metadata?: RadarMetadata;
  tripOptions?: RadarTripOptions;
  desiredAccuracy?: 'high' | 'medium' | 'low';
  fraud?: boolean;
  reason?: string;
}

export interface RadarTrackVerifiedParams {
  userId?: string;
  description?: string;
  metadata?: RadarMetadata;
  skipVerifyApp?: boolean;
  reason?: string;
}

export interface RadarStartTrackingVerifiedParams {
  interval: number;
  skipVerifyApp?: boolean;
  ipChanges?: boolean;
}

export enum RadarEventConfidence {
  none = 0,
  low = 1,
  medium = 2,
  high = 3
}

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

export interface RadarGeofence {
  _id: string;
  description: string;
  tag?: string;
  externalId?: string;
  metadata?: RadarMetadata;
}

export interface RadarTripEta {
  distance?: number;
  duration?: number;
}

export type RadarTripStatus =
  | 'pending'
  | 'started'
  | 'approaching'
  | 'arrived'
  | 'completed'
  | 'canceled'
  | 'expired'
  | 'pending';


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

export interface RadarChain {
  name: string;
  slug: string;
  externalId?: string;
  metadata?: RadarMetadata;
}

export interface RadarPlace {
  _id: string;
  name: string;
  categories: string[];
  chain?: RadarChain;
}

export interface RadarRegion {
  _id: string;
  type: string;
  code: string;
  name: string;
}

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

export interface RadarTrackResponse extends RadarResponse {
  location?: Location;
  user?: RadarUser;
  events?: RadarEvent[];
}

export interface RadarTrackVerifiedResponse extends RadarTrackResponse {
  token?: String;
  expiresAt?: Date;
  expiresIn?: number;
  passed?: boolean;
  failureReasons?: string[];
  _id?: string;
}

export interface RadarContextResponse extends RadarResponse {
  location?: Location;
  geofences?: RadarGeofence[];
  place?: RadarPlace;
  country?: RadarRegion;
  state?: RadarRegion;
  dma?: RadarRegion;
  postalCode?: RadarRegion;
}

export interface RadarTripResponse extends RadarResponse {
  trip: RadarTrip;
  events: RadarEvent[];
}

export interface RadarConversionParams {
  name: string;
  metadata?: RadarMetadata;
  revenue?: number;
  userId?: string;
  deviceId?: string;
  installId?: string;
  createdAt?: Date | string;
  duration?: number;
}

export interface RadarCustomEvent {
  _id: string;
  createdAt: string;
  live: boolean;
  type: string;
  confidence?: number;
  user?: RadarUser;
}

export interface RadarConversionResponse extends RadarResponse {
  event: RadarCustomEvent;
}

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
  | 'fine'

export interface RadarAddress {
  addressLabel?: string;
  borough?: string;
  categories?: string[];
  city?: string;
  confidence?: 'exact' | 'interpolated' | 'fallback';
  country?: string;
  countryCode?: string;
  countryFlag?: string;
  county?: string;
  distance?: number;
  dma?: string;
  dmaCode?: string;
  formattedAddress?: string;
  geometry: GeoJSON.Point;
  latitude: number;
  longitude: number;
  layer?: RadarGeocodeLayer;
  neighborhood?: string;
  number?: string;
  placeLabel?: string;
  postalCode?: string;
  state?: string;
  stateCode?: string;
  street?: string;
}

export interface RadarTimeZone {
  id: string;
  name: string;
  code: string;
  currentTime: string;
  utcOffset: number;
  dstOffset: number;
}

export interface RadarAutocompleteAddress extends RadarAddress {
  unit?: string;
}

export interface RadarGeocodeAddress extends RadarAddress {
  unit?: string;
  timeZone?: RadarTimeZone;
}

export type RadarValidationRecordType = 'S' | 'R' | 'P' | 'M' | 'H' | 'G' | 'F' | undefined;

export type RadarValidationPropertyType = 'commercial' | 'residential' | undefined;

export type RadarVerificationStatus = 'verified' | 'partially verified' | 'ambiguous' | 'unverified';

export interface RadarValidationAddress extends RadarAddress {
  unit?: string;
  plus4?: string;
  metadata?: {
    recordType?: RadarValidationRecordType;
    propertyType?: RadarValidationPropertyType;
  };
}

export interface RadarForwardGeocodeParams {
  query: string;
  layers?: RadarGeocodeLayer[];
  country?: string;
  lang?: string;
}

export interface RadarReverseGeocodeParams {
  latitude?: number;
  longitude?: number;
  layers?: RadarGeocodeLayer[];
}

export interface RadarGeocodeResponse extends RadarResponse {
  addresses: RadarGeocodeAddress[];
}

export interface RadarIPGeocodeResponse extends RadarResponse {
  ip: string;
  address?: RadarGeocodeAddress;
  proxy?: boolean;
}

export interface RadarAutocompleteParams {
  query: string;
  near?: Location | string;
  limit?: number;
  layers?: RadarGeocodeLayer[];
  countryCode?: string;
  /** @deprecated this is always true, regardless of the value passed here */
  expandUnits?: boolean;
  mailable?: boolean;
  lang?: string;
  postalCode?: string;
}

export interface RadarAutocompleteResponse extends RadarResponse {
  addresses: RadarAutocompleteAddress[];
}

export interface RadarSearchPlacesParams {
  near?: Location | string;
  radius?: number;
  chains?: string[] | string;
  categories?: string[] | string;
  groups?: string[] | string;
  limit?: number;
}

export interface RadarSearchPlace extends RadarPlace {
  location?: GeoJSON.Point;
}

export interface RadarSearchPlacesResponse extends RadarResponse {
  places: RadarSearchPlace[];
}

export type RadarDistanceGeometryType = 'polyline' | 'polyline5' | 'polyline6' | 'linestring';

export interface RadarDistanceParams {
  origin?: Location | string;
  destination: Location | string;
  modes: RadarTravelMode[] | string;
  units?: 'metric' | 'imperial';
  geometry?: RadarDistanceGeometryType;
  geometryPoints?: number;
  avoid?: RadarAvoidOption[] | string;
}


export interface RadarRouteDistance {
  value: number;
  text: string;
}

export interface RadarRouteDuration {
  value: number;
  text: string;
}

export interface RadarRoute {
  distance?: RadarRouteDistance;
  duration?: RadarRouteDuration;
  geometry?: GeoJSON.LineString;
}

export interface RadarRoutes {
  geodesic: RadarRoute;
  foot?: RadarRoute;
  bike?: RadarRoute;
  car?: RadarRoute;
}

export interface RadarRouteResponse extends RadarResponse {
  routes: RadarRoutes;
}

export interface RadarMatrixParams {
  origins?: Location[] | string;
  destinations: Location[] | string;
  mode: RadarTravelMode;
  units?: 'metric' | 'imperial';
  avoid?: RadarAvoidOption[] | string;
}

export interface RadarMatrixRoute {
  distance?: RadarRouteDistance;
  duration?: RadarRouteDuration;
  originIndex: number;
  destinationIndex: number;
}

export interface RadarMatrixResponse extends RadarResponse {
  origins: Location[];
  destinations: Location[];
  matrix: RadarMatrixRoute[];
}

export interface RadarValidateAddressParams {
  city: string;
  stateCode: string;
  postalCode: string;
  countryCode: string;
  number?: string;
  street?: string;
  unit?: string;
  addressLabel?: string;
}

export interface RadarValidateAddressResponse extends RadarResponse {
  address?: RadarValidationAddress;
  result?: {
    verificationStatus?: RadarVerificationStatus;
  }
}

export interface RadarSearchGeofencesParams {
  near?: Location | string;
  radius?: number;
  tags?: string[] | string;
  metadata?: RadarMetadata;
  limit?: number;
  includeGeometry?: boolean;
}

export interface RadarSearchGeofencesResponse extends RadarResponse {
  geofences: RadarGeofence[];
}

export interface RadarMapOptions extends Omit<maplibregl.MapOptions, 'transformRequest'> {
  language?: string;
  showZoomControls?: boolean;
}

export interface RadarPopupOptions extends maplibregl.PopupOptions {
  text?: string;
  html?: string;
  element?: HTMLElement;
}

export interface RadarMarkerOptions extends maplibregl.MarkerOptions {
  /**
   * @deprecated Use popup.text
   */
  text?: string;

  /**
   * @deprecated Use popup.html
   */
  html?: string;

  // marker configs
  url?: string;
  marker?: string;
  width?: number | string;
  height?: number | string;

  // popup configs
  popup?: RadarPopupOptions;
}

export interface RadarLineOptions {
  id?: string;
  properties?: any;
  paint?: {
    'line-color'?: string;
    'line-width'?: number;
    'line-opacity'?: number;
    'line-cap'?: 'butt' | 'round' | 'square';
    'line-offset'?: number;
    'line-blur'?: number;
    'line-dasharray'?: Array<number>;
    'line-gap-width'?: number;
    'line-gradient'?: any;
    'border-width'?: number;
    'border-color'?: string;
    'border-opacity'?: number;
  },
}

export interface RadarPolylineOptions extends RadarLineOptions {
  precision?: number;
};

export interface RadarPolygonOptions {
  id?: string;
  properties?: any;
  paint?: {
    'fill-color'?: string;
    'fill-opacity'?: number;
    'border-width'?: number;
    'border-color'?: string;
    'border-opacity'?: number;
  },
}
export interface RadarAutocompleteUIOptions extends Omit<RadarAutocompleteParams, 'query'> {
  container: string | HTMLElement;
  debounceMS?: number, // Debounce time in milliseconds
  /** @deprecated use minCharacters instead */
  threshold?: number,
  minCharacters?: number, // Minimum number of characters to trigger autocomplete
  placeholder?: string, // Placeholder text for the input field
  onSelection?: (selection: any) => void,
  onRequest?: (params: RadarAutocompleteParams) => void,
  onResults?: (results: any[]) => void,
  onError?: (error: any) => void,
  disabled?: boolean,
  responsive?: boolean;
  width?: string | number;
  maxHeight?: string | number;
  showMarkers?: boolean;
  markerColor?: string;
  hideResultsOnBlur?: boolean;
}

export interface RadarAutocompleteConfig extends RadarAutocompleteUIOptions {
  debounceMS: number, // Debounce time in milliseconds
  threshold: number, // DEPRECATED(use minCharacters instead)
  minCharacters: number, // Minimum number of characters to trigger autocomplete
  limit: number, // Maximum number of autocomplete results
  placeholder: string, // Placeholder text for the input field
  disabled: boolean,
}
