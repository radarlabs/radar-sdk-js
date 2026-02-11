import type maplibregl from 'maplibre-gl';

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
}

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
