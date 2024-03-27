import maplibregl, { Marker, MarkerOptions } from 'maplibre-gl';

import Config from '../config';
import Http from '../http';
import Logger from '../logger';
import RadarLogoControl from './RadarLogoControl';

import type { RadarOptions, RadarMapOptions, RadarMarkerOptions } from '../types';

const DEFAULT_STYLE = 'radar-default-v1';

const RADAR_STYLES = [
  'radar-default-v1',
  'radar-light-v1',
  'radar-dark-v1',
];

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

const uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/;

const createStyleURL = (options: RadarOptions, style: string = DEFAULT_STYLE) => (
  `${options.host}/maps/styles/${style}?publishableKey=${options.publishableKey}`
);

const getMarkerOptions = (marker: Marker): MarkerOptions => {
  const markerOptions: MarkerOptions = {
    // element: marker.getElement(),
    color: marker._color,
    scale: marker._scale,
    offset: marker.getOffset(),
    anchor: marker._anchor,
    draggable: marker.isDraggable(),
    clickTolerance: marker._clickTolerance,
    rotation: marker.getRotation(),
    rotationAlignment: marker.getRotationAlignment(),
    pitchAlignment: marker.getPitchAlignment()
  }

  return markerOptions;
}

/** Check if style is a Radar style or a custom style */
const isRadarStyle = (style: string) => {
  return RADAR_STYLES.includes(style) || uuidRegex.test(style)
};

/** Use formatted style URL if using one of Radar's out-of-the-box styles or is a Radar custom style */
const getStyle = (options: RadarOptions, mapOptions: RadarMapOptions) => {
  const style = mapOptions.style;

  if (!style || (typeof style === 'string' && isRadarStyle(style))) {
    return createStyleURL(options, style);
  }

  return mapOptions.style;
};

class MapUI {
  private static customMarkerRawSvg: string | undefined;
  private static markers: Marker[] = [];

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
      mapOptions,
      { style },
    );
    Logger.debug(`initialize map with options: ${JSON.stringify(maplibreOptions)}`);

    // set container
    maplibreOptions.container = mapOptions.container;

    // custom request handler for Radar styles
    maplibreOptions.transformRequest = (url, resourceType) => {
      if (resourceType === 'Style' && isRadarStyle(url)) {
        const radarStyleURL = createStyleURL(options, url);
        return { url: radarStyleURL };
      } else {
        return { url };
      }
    };

    // create map
    const map = new maplibregl.Map(maplibreOptions);
    const container = map.getContainer();

    if (!container.style.width && !container.style.height) {
      Logger.warn('map container does not have a set "width" or "height"');
    }

    // add radar logo
    const radarLogo = new RadarLogoControl();
    map.addControl(radarLogo, 'bottom-left');

    // add attribution
    const attribution = new maplibregl.AttributionControl({ compact: false });
    map.addControl(attribution, 'bottom-right');

    // add zoom controls
    const nav = new maplibregl.NavigationControl({ showCompass: false });
    map.addControl(nav, 'bottom-right');

    // handle map resize actions
    const onResize = () => {
      const attrib = document.querySelector('.maplibregl-ctrl-attrib');
      if (attrib) {
        const width = map.getContainer().clientWidth;
        if (width < 380) {
          attrib.classList.add('hidden');
        } else {
          attrib.classList.remove('hidden');
        }
      }
    };

    const onStyleLoad = async () => {
      MapUI.customMarkerRawSvg = undefined;
      const style = map.getStyle();

      const customMarkers = (style.metadata as any)?.['radar:customMarkers'];
      if (Array.isArray(customMarkers) && customMarkers.length > 0) {
        const customMarker = customMarkers[0]; // only support one custom marker for now
        try {
          const markerRawSvg = await Http.request({
            method: 'GET',
            versioned: false,
            path: `maps/markers/${customMarker.id}`,
            headers: {
              'Content-Type': 'image/svg+xml',
            },
          });
          MapUI.customMarkerRawSvg = markerRawSvg.data;
        } catch (err) {
          Logger.warn(`Error getting custom marker: ${customMarker.id} - using default marker.`);
        }
      }

      // set markers if necessary
      for (let i = 0; i < MapUI.markers.length; i++) {
        if (MapUI.customMarkerRawSvg) {
          // set custom marker
          MapUI.markers[i]._element.innerHTML = MapUI.customMarkerRawSvg;
        } else {
          const markerOptions = getMarkerOptions(MapUI.markers[i]);
          const newMarker = new Marker(markerOptions); // get default element

          // set default element
          MapUI.markers[i]._element.innerHTML = newMarker._element.innerHTML;
        }
      }
    }
    map.on('resize', onResize);
    map.on('load', onResize);
    map.on('styledata', onStyleLoad);

    return map;
  }

  public static createMarker(markerOptions: RadarMarkerOptions = {}): maplibregl.Marker {
    const maplibreOptions: maplibregl.MarkerOptions = Object.assign({}, defaultMarkerOptions);

    // has a custom marker
    if (MapUI.customMarkerRawSvg) {
      maplibreOptions.element = document.createElement('div');
      maplibreOptions.element.innerHTML = MapUI.customMarkerRawSvg;
    }

    if (markerOptions.color) {
      maplibreOptions.color = markerOptions.color;
    }
    if (markerOptions.element) {
      maplibreOptions.element = markerOptions.element;
    }
    if (markerOptions.scale) {
      maplibreOptions.scale = markerOptions.scale;
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

    MapUI.markers.push(marker);
    return marker;
  }
}

export default MapUI;
