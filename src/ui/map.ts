import maplibregl from 'maplibre-gl';

import Config from '../config';
import Logger from '../logger';

import type { RadarOptions, RadarMapOptions, RadarMarkerOptions } from '../types';

const DEFAULT_STYLE = 'radar-default-v1';

const RADAR_LOGO_URL = 'https://api.radar.io/maps/static/images/logo.svg';

const defaultMaplibreOptions: Partial<maplibregl.MapOptions> = {
  minZoom: 1,
  maxZoom: 20,
  attributionControl: false,
  dragRotate: false,
  touchPitch: false,
  maplibreLogo: false,
};

const defaultMarkerOptions: Partial<maplibregl.MarkerOptions> = {
  color: '#000257',
};

const createStyleURL = (options: RadarOptions, style: string = DEFAULT_STYLE) => (
  `${options.host}/maps/styles/${style}?publishableKey=${options.publishableKey}`
);

class MapUI {
  public static getMapLibre() {
    return maplibregl;
  }

  public static createMap(mapOptions: RadarMapOptions): maplibregl.Map {
    const options = Config.get();

    const style = mapOptions.style || DEFAULT_STYLE;
    const radarStyleURL = createStyleURL(options, style);

    if (!options.publishableKey) {
      Logger.warn('publishableKey not set. Call Radar.initialize() with key before creating a new map.');
    }

    // configure maplibre options
    const maplibreOptions: maplibregl.MapOptions = Object.assign({},
      defaultMaplibreOptions,
      {
        style: radarStyleURL,
        container: mapOptions.container,
      },
    );
    Logger.debug(`initialize map with options: ${JSON.stringify(maplibreOptions)}`);

    // set container
    maplibreOptions.container = mapOptions.container;

    // create map
    const map = new maplibregl.Map(maplibreOptions);

    // add zoom controls
    const nav = new maplibregl.NavigationControl({ showCompass: false });
    map.addControl(nav, 'bottom-right');

    // add radar logo
    const img = document.createElement('img');
    img.id = 'radar-map-logo';
    img.src = RADAR_LOGO_URL;
    map.getContainer().appendChild(img);

    // TODO
    // add location button

    return map;
  }

  public static createMarker(markerOptions: RadarMarkerOptions = {}): maplibregl.Marker {
    const maplibreOptions: maplibregl.MarkerOptions = Object.assign({}, defaultMarkerOptions);

    if (markerOptions.color) {
      maplibreOptions.color = markerOptions.color;
    }

    const marker = new maplibregl.Marker(maplibreOptions);

    // set popup text
    if (markerOptions.text) {
      const popup = new maplibregl.Popup({ offset: 35 }).setText(markerOptions.text);
      marker.setPopup(popup);
    }

    return marker;
  }
}

export default MapUI;
