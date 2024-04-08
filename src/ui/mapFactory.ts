import maplibregl from 'maplibre-gl';

import RadarMap from './map';
import RadarMarker from './marker';

import type { RadarMapOptions, RadarMarkerOptions } from '../types';

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
}

export default MapUI;
