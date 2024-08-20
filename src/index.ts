import RadarAPI from './api';

import MapUI from './ui/map';
import AutocompleteUI from './ui/autocomplete';

import 'maplibre-gl/dist/maplibre-gl.css';
import '../styles/radar.css';

class Radar extends RadarAPI {
  // "ui" namespace for Maps and Autocomplete
  public static get ui() {
    return {
      maplibregl: MapUI.getMapLibre(),
      map: MapUI.createMap,
      marker: MapUI.createMarker,
      popup: MapUI.createPopup,
      autocomplete: AutocompleteUI.createAutocomplete,
    };
  }
}

export default Radar;
