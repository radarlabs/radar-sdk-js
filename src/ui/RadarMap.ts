import maplibregl from 'maplibre-gl';

import RadarMarker from './RadarMarker';

import Config from '../config';
import Http from '../http';
import Logger from '../logger';
import RadarLogoControl from './RadarLogoControl';

import type { RadarOptions, RadarMapOptions } from '../types';

const DEFAULT_STYLE = 'radar-default-v1';

const RADAR_STYLES = [
  'radar-default-v1',
  'radar-light-v1',
  'radar-dark-v1',
];

const defaultMaplibreOptions: Partial<maplibregl.MapOptions> = {
  minZoom: 1,
  maxZoom: 20,
  attributionControl: false,
  dragRotate: false,
  touchPitch: false,
  maplibreLogo: false,
};

const uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/;

const createStyleURL = (options: RadarOptions, style: string = DEFAULT_STYLE) => (
  `${options.host}/maps/styles/${style}?publishableKey=${options.publishableKey}`
);

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

class RadarMap extends maplibregl.Map {
  _customMarkerRawSvg: string | undefined;
  _markers: RadarMarker[] = [];

  constructor(mapOptions: RadarMapOptions) {
    const config = Config.get();

    if (!config.publishableKey) {
      Logger.warn('publishableKey not set. Call Radar.initialize() with key before creating a new map.');
    }

    // configure maplibre options
    const style = getStyle(config, mapOptions);
    const maplibreOptions: maplibregl.MapOptions = Object.assign({},
      defaultMaplibreOptions,
      mapOptions,
      { style },
    );
    Logger.debug(`initialize map with options: ${JSON.stringify(maplibreOptions)}`);

    // custom request handler for Radar styles
    maplibreOptions.transformRequest = (url, resourceType) => {
      let radarStyleURL = url;
      let headers = { 'Authorization': config.publishableKey };
      if (resourceType === 'Style' && isRadarStyle(url)) {
        radarStyleURL = createStyleURL(config, url);
      }

      if (mapOptions.transformRequest) {
        return mapOptions.transformRequest(radarStyleURL, resourceType);
      }

      if (typeof config.getRequestHeaders === 'function') {
        headers = Object.assign(headers, config.getRequestHeaders());
      }

      return { url: radarStyleURL, headers };
    };

    super(maplibreOptions);

    const container = this.getContainer();

    if (!container.style.width && !container.style.height) {
      Logger.warn('map container does not have a set "width" or "height"');
    }

    // add radar logo
    const radarLogo = new RadarLogoControl();
    this.addControl(radarLogo, 'bottom-left');

    // add attribution
    const attribution = new maplibregl.AttributionControl({ compact: false });
    this.addControl(attribution, 'bottom-right');

    // add zoom controls
    const nav = new maplibregl.NavigationControl({ showCompass: false });
    this.addControl(nav, 'bottom-right');

    // handle map resize actions
    const onResize = () => {
      const attrib = document.querySelector('.maplibregl-ctrl-attrib');
      if (attrib) {
        const width = this.getContainer().clientWidth;
        if (width < 380) {
          attrib.classList.add('hidden');
        } else {
          attrib.classList.remove('hidden');
        }
      }
    };
    this.on('resize', onResize);
    this.on('load', onResize);

    const onStyleLoad = async () => {
      this._customMarkerRawSvg = undefined;
      const style = this.getStyle();

      const customMarkers = (style.metadata as any)?.['radar:customMarkers'];
      const radarCustomStyleId = (style.metadata as any)?.['radar:styleId'];
      if (radarCustomStyleId && Array.isArray(customMarkers) && customMarkers.length > 0) {
        const customMarker = customMarkers[0]; // only support one custom marker for now
        try {
          const markerRawSvg = await Http.request({
            method: 'GET',
            versioned: false,
            path: `maps/${radarCustomStyleId}/markers/${customMarker.id}`,
            headers: {
              'Content-Type': 'image/svg+xml',
            },
          });
          this._customMarkerRawSvg = markerRawSvg.data;
        } catch (err) {
          Logger.warn(`Error getting custom marker: ${customMarker.id} - using default marker.`);
        }
      }

      // set markers if necessary
      this._markers.forEach((marker) => {
        if (this._customMarkerRawSvg && !marker._image) {
          // set custom marker
          marker._element.innerHTML = this._customMarkerRawSvg;
        } else {
          const markerOptions = marker.getOptions();
          const newMarker = new RadarMarker(markerOptions); // get default element

          // set default element
          marker._element.innerHTML = newMarker._element.innerHTML;
        }
      });
    }
    this.on('styledata', onStyleLoad);
  }
};

export default RadarMap;