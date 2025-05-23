import maplibregl from 'maplibre-gl';

import SDK_VERSION from '../version';
import RadarMarker from './RadarMarker';
import RadarMapFeature from './RadarMapFeature';
import RadarLineFeature from './RadarLineFeature';
import RadarPolygonFeature from './RadarPolygonFeature';
import RadarLogoControl from './RadarLogoControl';
import { getAllCoords } from '../util/geojson';

import Config from '../config';
import Logger from '../logger';

import type {
  RadarOptions,
  RadarMapOptions,
  RadarLineOptions,
  RadarPolylineOptions,
  RadarPolygonOptions,
} from '../types';

const DEFAULT_STYLE = 'radar-default-v1';

const RADAR_STYLES = [
  'radar-default-v1',
  'radar-light-v1',
  'radar-dark-v1',
];

// Radar specific configs
const defaultRadarMapOptions: Partial<RadarMapOptions> = {
  showZoomControls: true,
};

const defaultMaplibreOptions: Partial<maplibregl.MapOptions> = {
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
  const style = mapOptions.style || DEFAULT_STYLE;

  let url = `${options.host}/maps/styles/${style}`
  if (mapOptions.language) {
    url += `?language=${mapOptions.language}`
  }
  return url;
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
  _features: RadarMapFeature[] = [];

  constructor(radarMapOptions: RadarMapOptions) {
    const config = Config.get();

    if (!config.publishableKey) {
      Logger.warn('publishableKey not set. Call Radar.initialize() with key before creating a new map.');
    }

    // configure map options
    const style = getStyle(config, radarMapOptions);
    const mapOptions: RadarMapOptions = Object.assign({},
      defaultRadarMapOptions,
      defaultMaplibreOptions,
      radarMapOptions,
      { style },
      { validateStyle: !config.live },
    );
    Logger.debug('map initialized with options', mapOptions);

    (mapOptions as maplibregl.MapOptions).transformRequest = (url, resourceType) => {
      // this handles when a style is switched
      if (resourceType === 'Style' && isRadarStyle(url)) {
        url = createStyleURL(config, { ...mapOptions, style: url });
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

    super(mapOptions); // initialize MapLibre instance

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
    const nav = new maplibregl.NavigationControl({
      showCompass: false,
      showZoom: mapOptions.showZoomControls,
    });
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

  clearMarkers() {
    this._markers.forEach((marker) => {
      marker.remove();
    });
  }

  getFeatures() {
    return this._features;
  }

  fitToFeatures(fitBoundsOptions: maplibregl.FitBoundsOptions = {}, overrideFeatures?: RadarMapFeature[]) {
    const features = (overrideFeatures || this._features).map((mapFeature) => mapFeature._feature);
    const coords = getAllCoords(features);

    if (coords.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      coords.forEach((coord: any) => {
        bounds.extend(coord);
      });
      this.fitBounds(bounds, fitBoundsOptions);
    }
  }

  // remove all features from the map
  clearFeatures() {
    this._features.forEach((feature) => {
      feature.remove();
    });
  }

  addPolygon(polygon: GeoJSON.Feature<GeoJSON.Polygon|GeoJSON.MultiPolygon>, polygonOptions?: RadarPolygonOptions) {
    const feature = new RadarPolygonFeature(this, polygon, polygonOptions);
    this._features.push(feature);
    return feature;
  }

  addLine(line: GeoJSON.Feature<GeoJSON.LineString>, lineOptions?: RadarLineOptions) {
    const feature = new RadarLineFeature(this, line, lineOptions);
    this._features.push(feature);
    return feature;
  }

  addPolyline(polyline: string, polylineOptions?: RadarPolylineOptions) {
    const feature = RadarLineFeature.fromPolyline(this, polyline, polylineOptions);
    this._features.push(feature);
    return feature;
  }
};

export default RadarMap;
