import maplibregl from 'maplibre-gl';

import RadarMap from './RadarMap';
import RadarMarker from './RadarMarker';
import RadarPopup from './RadarPopup';

import type { RadarMapOptions, RadarMarkerOptions, RadarPopupOptions } from './types';
import type { RadarPluginContext } from 'radar-sdk-js';

class MapUI {
  private ctx: RadarPluginContext;

  constructor(ctx: RadarPluginContext) {
    this.ctx = ctx;
  }

  public getMapLibre() {
    return maplibregl;
  }

  public createMap(mapOptions: RadarMapOptions): RadarMap {
    return new RadarMap(mapOptions, this.ctx);
  }

  public createMarker(markerOptions: RadarMarkerOptions = {}): RadarMarker {
    return new RadarMarker(markerOptions, this.ctx);
  }

  public createPopup(popupOptions: RadarPopupOptions): maplibregl.Popup {
    return new RadarPopup(popupOptions);
  }
}

export default MapUI;
