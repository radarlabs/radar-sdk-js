import 'maplibre-gl/dist/maplibre-gl.css';

import '../styles/radar-maps.css';
import MapUI from './MapUI';
import version from './version';

import type RadarMap from './RadarMap';
import type RadarMarker from './RadarMarker';
import type RadarPopup from './RadarPopup';
import type { RadarMapOptions, RadarMarkerOptions, RadarPopupOptions } from './types';
import type * as maplibregl from 'maplibre-gl';
import type { RadarPlugin } from 'radar-sdk-js';

export type {
  RadarMapOptions,
  RadarMarkerOptions,
  RadarPopupOptions,
  RadarLineOptions,
  RadarPolylineOptions,
  RadarPolygonOptions,
} from './types';
export type { default as RadarMap } from './RadarMap';
export type { default as RadarMarker } from './RadarMarker';
export type { default as RadarPopup } from './RadarPopup';

declare module 'radar-sdk-js' {
  interface RadarUI {
    /** the MapLibre GL library instance */
    maplibregl: typeof maplibregl;
    /**
     * create a new RadarMap
     * @param options - map configuration and container
     */
    map(options: RadarMapOptions): RadarMap;
    /**
     * create a new RadarMarker
     * @param options - marker configuration
     */
    marker(options?: RadarMarkerOptions): RadarMarker;
    /**
     * create a new RadarPopup
     * @param options - popup configuration and content
     */
    popup(options: RadarPopupOptions): RadarPopup;
  }
  namespace Radar {
    let ui: RadarUI; // eslint-disable-line no-unused-vars
  }
}

/**
 * create the Radar maps plugin
 *
 * @returns a plugin that adds `Radar.ui.map()`, `Radar.ui.marker()`, and `Radar.ui.popup()` methods
 *
 * @example
 * ```ts
 * import { createMapsPlugin } from '@radarlabs/plugin-maps';
 * Radar.registerPlugin(createMapsPlugin());
 * ```
 */
export function createMapsPlugin(): RadarPlugin {
  return {
    name: 'maps',
    version,
    install(ctx) {
      const ui = new MapUI(ctx);
      const existing = ctx.Radar.ui || {};
      // NOTE(jasonl): we're merging with the existing ui namespace since other plugins also add to it like autocomplete
      ctx.Radar.ui = {
        ...existing,
        maplibregl: ui.getMapLibre(),
        map: ui.createMap.bind(ui),
        marker: ui.createMarker.bind(ui),
        popup: ui.createPopup.bind(ui),
      };
    },
  };
}
