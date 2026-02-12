import type { MapOptions, PopupOptions, MarkerOptions, ExpressionSpecification } from 'maplibre-gl';

/** extends MapLibre MapOptions with Radar-specific options */
export interface RadarMapOptions extends Omit<MapOptions, 'transformRequest'> {
  /** map label language code (e.g. 'en', 'es') */
  language?: string;
  /** whether to show zoom +/- buttons (default: true) */
  showZoomControls?: boolean;
}

/** extends MapLibre PopupOptions with content helpers */
export interface RadarPopupOptions extends PopupOptions {
  /** plain text content for the popup */
  text?: string;
  /** HTML string content for the popup */
  html?: string;
  /** DOM element to use as popup content */
  element?: HTMLElement;
}

/** extends MapLibre MarkerOptions with Radar features */
export interface RadarMarkerOptions extends MarkerOptions {
  /** @deprecated use popup.text */
  text?: string;

  /** @deprecated use popup.html */
  html?: string;

  /** custom image URL for the marker */
  url?: string;
  /** Radar-hosted marker image name */
  marker?: string;
  /** marker image width (px or CSS string) */
  width?: number | string;
  /** marker image height (px or CSS string) */
  height?: number | string;

  /** popup options to attach to this marker */
  popup?: RadarPopupOptions;
}

/** styling options for line features on the map */
export interface RadarLineOptions {
  /** unique feature identifier */
  id?: string;
  /** GeoJSON properties */
  properties?: GeoJSON.GeoJsonProperties;
  /** MapLibre line paint properties plus border styling */
  paint?: {
    'line-color'?: string;
    'line-width'?: number;
    'line-opacity'?: number;
    'line-cap'?: 'butt' | 'round' | 'square';
    'line-offset'?: number;
    'line-blur'?: number;
    'line-dasharray'?: Array<number>;
    'line-gap-width'?: number;
    /** MapLibre style expression for line gradients */
    'line-gradient'?: ExpressionSpecification;
    'border-width'?: number;
    'border-color'?: string;
    'border-opacity'?: number;
  },
}

/** options for encoded polyline features */
export interface RadarPolylineOptions extends RadarLineOptions {
  /** polyline encoding precision (default: 5) */
  precision?: number;
}

/** styling options for polygon features on the map */
export interface RadarPolygonOptions {
  /** unique feature identifier */
  id?: string;
  /** GeoJSON properties */
  properties?: GeoJSON.GeoJsonProperties;
  /** fill and border paint properties */
  paint?: {
    'fill-color'?: string;
    'fill-opacity'?: number;
    'border-width'?: number;
    'border-color'?: string;
    'border-opacity'?: number;
  },
}
