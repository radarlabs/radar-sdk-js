import maplibregl from 'maplibre-gl';

import SDK_VERSION from '../version';
import RadarMarker from './RadarMarker';
import RadarLogoControl from './RadarLogoControl';

import Config from '../config';
import Logger from '../logger';

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

const createStyleURL = (options: RadarOptions, style: string = DEFAULT_STYLE) => (
  `${options.host}/maps/styles/${style}?publishableKey=${options.publishableKey}`
);

// check if style is a Radar style or a custom style
const isRadarStyle = (style: string) => {
  if (RADAR_STYLES.includes(style)) { // Radar built-in style
    return true;
  }
  if (!/^(http:|https:)/.test(style)) { // Radar custom style (not a URL)
    return true;
  }
  return false;
};

// use formatted style URL if using one of Radar's out-of-the-box styles or is a Radar custom style
const getStyle = (options: RadarOptions, mapOptions: RadarMapOptions) => {
  const style = mapOptions.style;

  if (!style || (typeof style === 'string' && isRadarStyle(style))) {
    return createStyleURL(options, style);
  }

  return mapOptions.style; // style object or URL
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

    maplibreOptions.transformRequest = (url, resourceType) => {
      if (resourceType === 'Style' && isRadarStyle(url)) {
        url = createStyleURL(config, url);
      }

      let headers = {
        'Authorization': config.publishableKey,
        'X-Radar-Device-Type': 'Web',
        'X-Radar-SDK-Version': SDK_VERSION,
      };
      if (typeof config.getRequestHeaders === 'function') {
        headers = Object.assign(headers, config.getRequestHeaders());
      }

      return { url, headers };
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
  }

  addMarker(marker: RadarMarker) {
    this._markers.push(marker);
  }

  removeMarker(marker: RadarMarker) {
    this._markers = this._markers.filter((mapMarker: RadarMarker) => mapMarker !== marker);
  }

  getMarkers(): RadarMarker[] {
    return this._markers;
  }
};

export default RadarMap;
