import maplibregl from 'maplibre-gl';

import RadarMap from './RadarMap';
import RadarMarker from './RadarMarker';

import type { RadarMapOptions, RadarMarkerOptions } from '../types';

class MapUI {
  public static getMapLibre() {
    return maplibregl;
  }

  public static createMap(mapOptions: RadarMapOptions): RadarMap {
    const radarMap = new RadarMap(mapOptions);
<<<<<<< HEAD

=======
>>>>>>> release-4.3
    return radarMap;
  }

  public static createMarker(markerOptions: RadarMarkerOptions = {}): RadarMarker {
    const radarMarker = new RadarMarker(markerOptions);
<<<<<<< HEAD

=======
>>>>>>> release-4.3
    return radarMarker;
  }
}

export default MapUI;
