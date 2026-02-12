import * as maplibregl from 'maplibre-gl';

import RadarMap from './RadarMap';
import RadarMarker from './RadarMarker';
import RadarPopup from './RadarPopup';

import type { RadarMapOptions, RadarMarkerOptions, RadarPopupOptions } from './types';
import type { RadarPluginContext } from 'radar-sdk-js';

/** factory class for creating Radar map components (used internally by the maps plugin) */
class MapUI {
  private ctx: RadarPluginContext;

  constructor(ctx: RadarPluginContext) {
    this.ctx = ctx;
  }

  /** get the MapLibre GL library instance */
  public getMapLibre() {
    return maplibregl;
  }

  /**
   * create a new RadarMap
   *
   * @param mapOptions - map configuration and container
   * @returns a new RadarMap instance
   */
  public createMap(mapOptions: RadarMapOptions): RadarMap {
    return new RadarMap(mapOptions, this.ctx);
  }

  /**
   * create a new RadarMarker
   *
   * @param markerOptions - marker configuration
   * @returns a new RadarMarker instance
   */
  public createMarker(markerOptions: RadarMarkerOptions = {}): RadarMarker {
    return new RadarMarker(markerOptions, this.ctx);
  }

  /**
   * create a new RadarPopup
   *
   * @param popupOptions - popup configuration and content
   * @returns a new RadarPopup instance
   */
  public createPopup(popupOptions: RadarPopupOptions): RadarPopup {
    return new RadarPopup(popupOptions);
  }
}

export default MapUI;
