import maplibregl from 'maplibre-gl';

import RadarMap from './RadarMap';
import RadarMarker from './RadarMarker';
import RadarPopup from './RadarPopup';

import type { RadarMapOptions, RadarMarkerOptions, RadarPopupOptions } from '../types';

class MapUI {
  public static getMapLibre() {
    return maplibregl;
  }

  public static createMap(mapOptions: RadarMapOptions): RadarMap {
    const radarMap = new RadarMap(mapOptions);
    return radarMap;
  }

  public static createMarker(markerOptions: RadarMarkerOptions = {}): RadarMarker {
    const radarMarker = new RadarMarker(markerOptions);
    return radarMarker;
  }

  public static createPopup(popupOptions: RadarPopupOptions): maplibregl.Popup {
    const popup = new RadarPopup(popupOptions);
    return popup;
  }
}

export default MapUI;
