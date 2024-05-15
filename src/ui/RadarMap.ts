import maplibregl from 'maplibre-gl';

import SDK_VERSION from '../version';
import RadarMarker from './RadarMarker';
import RadarLogoControl from './RadarLogoControl';

import Config from '../config';
import Logger from '../logger';
import Navigator from '../navigator';

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

const defaultFitMarkersOptions: maplibregl.FitBoundsOptions = {
  padding: 50,
};

const createStyleURL = (options: RadarOptions, mapOptions: RadarMapOptions) => {
  let url = `${options.host}/maps/styles/${mapOptions.style}?publishableKey=${options.publishableKey}`
  if (mapOptions.language) {
    url += `&language=${mapOptions.language}`
  }
  return url
};

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
    return createStyleURL(options, mapOptions);
  }

  return mapOptions.style; // style object or URL
};

class RadarMap extends maplibregl.Map {
  _markers: RadarMarker[] = [];

  constructor(mapOptions: RadarMapOptions) {
    const config = Config.get();

    if (!config.publishableKey) {
      Logger.warn('publishableKey not set. Call Radar.initialize() with key before creating a new map.');
    }

    // configure maplibre options
    const style = getStyle(config, mapOptions);
    const maplibreOptions: RadarMapOptions = Object.assign({},
      defaultMaplibreOptions,
      mapOptions,
      { style },
    );
    Logger.debug(`initialize map with options: ${JSON.stringify(maplibreOptions)}`);

    (maplibreOptions as maplibregl.MapOptions).transformRequest = (url, resourceType) => {
      // this handles when a style is switched
      if (resourceType === 'Style' && isRadarStyle(url)) {
        url = createStyleURL(config, { ...maplibreOptions, style: url });
      }

      let headers = {
        'Authorization': config.publishableKey,
        'X-Radar-Device-Type': 'Web',
        'X-Radar-SDK-Version': SDK_VERSION,
        'X-Radar-Device-Language': Navigator.getLanguage(),
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

  fitToMarkers(fitBoundsOptions: maplibregl.FitBoundsOptions = {}, overrideMarkers?: RadarMarker[]) {
    const markers = overrideMarkers || this.getMarkers();

    if (markers.length === 0) {
      return;
    }

    const bounds = new maplibregl.LngLatBounds();
    markers.forEach((marker) => {
      bounds.extend(marker.getLngLat());
    });

    const options = Object.assign(defaultFitMarkersOptions, fitBoundsOptions);
    this.fitBounds(bounds, options);
  }
};

export default RadarMap;
