import { Map, AttributionControl, LngLatBounds, NavigationControl } from 'maplibre-gl';
import Radar from 'radar-sdk-js';

import RadarLineFeature from './RadarLineFeature';
import RadarLogoControl from './RadarLogoControl';
import RadarPolygonFeature from './RadarPolygonFeature';
import { getAllCoords } from './util/geojson';

import type RadarMapFeature from './RadarMapFeature';
import type RadarMarker from './RadarMarker';
import type { RadarMapOptions, RadarLineOptions, RadarPolylineOptions, RadarPolygonOptions } from './types';
import type { FitBoundsOptions } from 'maplibre-gl';
import type { RadarOptions, RadarPluginContext } from 'radar-sdk-js';

const DEFAULT_STYLE = 'radar-default-v1';

const RADAR_STYLES = ['radar-default-v1', 'radar-light-v1', 'radar-dark-v1'];

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
  const style = (mapOptions.style as string) || DEFAULT_STYLE;

  let url = `${options.host}/maps/styles/${style}`;
  if (mapOptions.language) {
    url += `?language=${mapOptions.language}`;
  }
  return url;
};

// check if style is a Radar style or a custom style
const isRadarStyle = (style: string) => {
  if (RADAR_STYLES.includes(style)) {
    // Radar built-in style
    return true;
  }
  if (!/^(http:|https:)/.test(style)) {
    // Radar custom style (not a URL)
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

/** MapLibre GL map wrapper with Radar styling, markers, and feature management */
class RadarMap extends Map {
  _markers: RadarMarker[] = [];
  _features: RadarMapFeature[] = [];

  constructor(radarMapOptions: RadarMapOptions, ctx: RadarPluginContext) {
    const { Config, Logger } = ctx;
    const config = Config.get();

    if (!config.publishableKey) {
      Logger.warn('publishableKey not set. Call Radar.initialize() with key before creating a new map.');
    }

    // configure map options
    const style = getStyle(config, radarMapOptions);
    const mapOptions: RadarMapOptions = Object.assign(
      {},
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
        Authorization: config.publishableKey,
        'X-Radar-Device-Type': 'Web',
        'X-Radar-SDK-Version': Radar.VERSION,
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
    const attribution = new AttributionControl({ compact: false });
    this.addControl(attribution, 'bottom-right');

    // add zoom controls
    const nav = new NavigationControl({
      showCompass: false,
      showZoom: mapOptions.showZoomControls,
    });
    this.addControl(nav, 'bottom-right');

    this.on('resize', this._onResize.bind(this));
    this.on('load', this._onResize.bind(this));
  }

  private _onResize(): void {
    const attrib = document.querySelector('.maplibregl-ctrl-attrib');
    if (attrib) {
      const width = this.getContainer().clientWidth;
      if (width < 380) {
        attrib.classList.add('hidden');
      } else {
        attrib.classList.remove('hidden');
      }
    }
  }

  /** add a marker to this map's tracked marker list */
  addMarker(marker: RadarMarker) {
    this._markers.push(marker);
  }

  /** remove a marker from this map's tracked marker list */
  removeMarker(marker: RadarMarker) {
    this._markers = this._markers.filter((mapMarker: RadarMarker) => mapMarker !== marker);
  }

  /** get all markers currently tracked by this map */
  getMarkers(): RadarMarker[] {
    return this._markers;
  }

  /**
   * fit the map viewport to contain all tracked markers
   *
   * @param fitBoundsOptions - MapLibre fit bounds options
   * @param overrideMarkers - optional subset of markers to fit (defaults to all)
   */
  fitToMarkers(fitBoundsOptions: maplibregl.FitBoundsOptions = {}, overrideMarkers?: RadarMarker[]) {
    const markers = overrideMarkers || this.getMarkers();

    if (markers.length === 0) {
      return;
    }

    const bounds = new LngLatBounds();
    markers.forEach((marker) => {
      bounds.extend(marker.getLngLat());
    });

    const options = Object.assign(defaultFitMarkersOptions, fitBoundsOptions);
    this.fitBounds(bounds, options);
  }

  /** remove all markers from this map */
  clearMarkers() {
    this._markers.forEach((marker) => {
      marker.remove();
    });
  }

  /** get all features currently added to this map */
  getFeatures() {
    return this._features;
  }

  /**
   * fit the map viewport to contain all tracked features
   *
   * @param fitBoundsOptions - MapLibre fit bounds options
   * @param overrideFeatures - optional subset of features to fit (defaults to all)
   */
  fitToFeatures(fitBoundsOptions: FitBoundsOptions = {}, overrideFeatures?: RadarMapFeature[]) {
    const features = (overrideFeatures || this._features).map((mapFeature) => mapFeature._feature);
    const coords = getAllCoords(features);

    if (coords.length > 0) {
      const bounds = new LngLatBounds();
      coords.forEach((coord) => {
        bounds.extend(coord as [number, number]);
      });
      this.fitBounds(bounds, fitBoundsOptions);
    }
  }

  /** remove all features from the map */
  clearFeatures() {
    this._features.forEach((feature) => {
      feature.remove();
    });
  }

  /**
   * add a polygon feature to the map
   *
   * @param polygon - GeoJSON polygon or multi-polygon feature
   * @param polygonOptions - optional polygon styling
   * @returns the created polygon feature
   */
  addPolygon(polygon: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>, polygonOptions?: RadarPolygonOptions) {
    const feature = new RadarPolygonFeature(this, polygon, polygonOptions);
    this._features.push(feature);
    return feature;
  }

  /**
   * add a GeoJSON line feature to the map
   *
   * @param line - GeoJSON line string feature
   * @param lineOptions - optional line styling
   * @returns the created line feature
   */
  addLine(line: GeoJSON.Feature<GeoJSON.LineString>, lineOptions?: RadarLineOptions) {
    const feature = new RadarLineFeature(this, line, lineOptions);
    this._features.push(feature);
    return feature;
  }

  /**
   * add an encoded polyline to the map
   *
   * @param polyline - encoded polyline string
   * @param polylineOptions - optional line styling and precision
   * @returns the created line feature
   */
  addPolyline(polyline: string, polylineOptions?: RadarPolylineOptions) {
    const feature = RadarLineFeature.fromPolyline(this, polyline, polylineOptions);
    this._features.push(feature);
    return feature;
  }
}

export default RadarMap;
