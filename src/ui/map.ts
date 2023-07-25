import maplibregl from 'maplibre-gl';

import Config from '../config';
import Logger from '../logger';

import type { RadarOptions, RadarMapOptions, RadarMarkerOptions } from '../types';

const DEFAULT_STYLE = 'radar-default-v1';

const RADAR_LOGO_URL = 'https://api.radar.io/maps/static/images/logo.svg';

const defaultMaplibreOptions: Partial<maplibregl.MapOptions> = {
  minZoom: 1,
  maxZoom: 20,
  attributionControl: true,
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

// use formatted style URL if using one of Radar's out-of-the-box styles
const getStyle = (options: RadarOptions, mapOptions: RadarMapOptions) => {
  if (!mapOptions.style || mapOptions.style === DEFAULT_STYLE) {
    return createStyleURL(options, mapOptions.style);
  }
  return mapOptions.style;
};

class MapUI {
  public static getMapLibre() {
    return maplibregl;
  }

  public static createMap(mapOptions: RadarMapOptions): maplibregl.Map {
    const options = Config.get();

    if (!options.publishableKey) {
      Logger.warn('publishableKey not set. Call Radar.initialize() with key before creating a new map.');
    }

    // configure maplibre options
    const style = getStyle(options, mapOptions);
    const maplibreOptions: maplibregl.MapOptions = Object.assign({},
      defaultMaplibreOptions,
      { style },
      mapOptions,
    );
    Logger.debug(`initialize map with options: ${JSON.stringify(maplibreOptions)}`);

    // set container
    maplibreOptions.container = mapOptions.container;

    // create map
    const map = new maplibregl.Map(maplibreOptions);
    const container = map.getContainer();

    // add radar logo
    const img = document.createElement('img');
    img.src = RADAR_LOGO_URL;

    const link = document.createElement('a');
    link.id = 'radar-map-logo';
    link.href = 'https://radar.com?ref=powered_by_radar';
    link.target = '_blank';
    link.style.position = 'absolute';
    link.style.bottom = '0';
    link.style.left = '5px';
    link.style.width = '80px';
    link.style.height = '38px';
    link.appendChild(img)
    map.getContainer().appendChild(link);

    // add zoom controls
    const nav = new maplibregl.NavigationControl({ showCompass: false });
    map.addControl(nav, 'bottom-right');

    if (!container.style.width && !container.style.height) {
      Logger.warn('map container does not have a set "width" or "height"');
    }

    // dont expand on mobile view by default
    map.on('load', () => {
      const attrib = document.querySelector('.maplibregl-ctrl-attrib')
      if (attrib) {
        attrib.classList.remove('maplibregl-compact-show');
        attrib.classList.remove('mapboxgl-compact-show');
        attrib.classList.add('loaded');
      }
    });

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

    // set popup text or HTML
    if (markerOptions.text) {
      const popup = new maplibregl.Popup({ offset: 35 }).setText(markerOptions.text);
      marker.setPopup(popup);
    } else if (markerOptions.html) {
      const popup = new maplibregl.Popup({ offset: 35 }).setHTML(markerOptions.html);
      marker.setPopup(popup);
    }

    return marker;
  }
}

export default MapUI;
