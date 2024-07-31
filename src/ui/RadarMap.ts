import maplibregl from 'maplibre-gl';

import SDK_VERSION from '../version';
import RadarMarker from './RadarMarker';
import RadarLogoControl from './RadarLogoControl';
import { decodePolyline } from '../util/polyline';
import { filterUndefined } from '../util/object';

import Config from '../config';
import Logger from '../logger';

import type {
  RadarOptions,
  RadarMapOptions,
  RadarLineOptions,
  RadarPolylineOptions,
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

const defaultLineOptions: Partial<RadarLineOptions> = {
  paint: {
    'line-cap': 'round',
    'line-color': '#000257',
    'line-width': 4,
    'border-color': '#FFFFFF',
    'border-width': 2,
  }
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
  _features: GeoJSON.Feature[] = [];

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
    );
    Logger.debug(`initialize map with options: ${JSON.stringify(mapOptions)}`);

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

  addPolyline(polyline: string, polylineOptions?: RadarPolylineOptions) {
    // make sure map is loaded before attempting to add new features
    if (!this.loaded()) {
      setTimeout(() => {
        Logger.debug('addPolyline: map not ready - retrying in 250ms');
        this.addPolyline(polyline, polylineOptions);
      }, 250);
      return;
    }

    const lineOptions: RadarPolylineOptions = Object.assign({},
      defaultLineOptions,
      polylineOptions,
    );

    // create a GeoJSON LineString feature from polyline
    const featureId = lineOptions.id || `polyline-feature-${Date.now()}`;
    const coordinates = decodePolyline(polyline, lineOptions.precision);
    const feature: GeoJSON.Feature = {
      id: featureId,
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates,
      },
      properties: lineOptions.properties || {},
    }

    if (lineOptions.paint) { // paint will always be present due to default options, but not required as params

      // add geojson feature as data source
      this.addSource(featureId, { type: 'geojson', data: feature });

      // add border layer if options are present
      if (lineOptions.paint['line-width'] && lineOptions.paint['border-width']) {
        const borderWidth = lineOptions.paint['line-width'] + lineOptions.paint['border-width'];
        this.addLayer({
          id: `${featureId}-border`,
          source: featureId,
          type: 'line',
          layout: {
            'line-cap': lineOptions.paint['line-cap'],
          },
          paint: filterUndefined({
            'line-color': lineOptions.paint['border-color'],
            'line-opacity': lineOptions.paint['border-opacity'],
            'line-width': borderWidth,
          }),
        });
      }

      // add layer(s) for styling feature
      this.addLayer({
        id: featureId,
        source: featureId,
        type: 'line',
        layout: {
          'line-cap': lineOptions.paint['line-cap'],
        },
        paint: filterUndefined({
          'line-color': lineOptions.paint['line-color'],
          'line-width': lineOptions.paint['line-width'],
          'line-opacity': lineOptions.paint['line-opacity'],
          'line-offset': lineOptions.paint['line-offset'],
          'line-blur': lineOptions.paint['line-blur'],
          'line-dasharray': lineOptions.paint['line-dasharray'],
          'line-gap-width': lineOptions.paint['line-gap-width'],
          'line-gradient': lineOptions.paint['line-gradient'],
        }),
      });

      // fit map to line when adding if fitOptions are given
      if (lineOptions.fitToLine || lineOptions.fitOptions) {
        const bounds = new maplibregl.LngLatBounds();
        coordinates.forEach((coord: any) => {
          bounds.extend(coord);
        });
        this.fitBounds(bounds, lineOptions.fitOptions);
      }
    }

    if (lineOptions.onClick) {
      // set hover state if click handler is present
      this.on('mouseenter', featureId, () => {
        this.getCanvas().style.cursor = 'pointer';
      });
      this.on('mouseleave', featureId, () => {
        this.getCanvas().style.cursor = '';
      });
      // call onClick if line clicked
      this.on('click', featureId, (e) => {
        (lineOptions.onClick as any)(e, feature);
      });
    }

    this._features.push(feature);
    return feature;
  }

  // take a feature, or featureId to remove the feature from map
  removeFeature(featureOrId: string | GeoJSON.Feature) {
    let featureId;
    if (typeof featureOrId === 'string') {
      featureId = featureOrId;
    } else {
      featureId = (featureOrId.id || '').toString();
    }

    if (featureId) {
      if (this.getLayer(featureId)) {
        this.removeLayer(featureId);
      }
      if (this.getLayer(`${featureId}-border`)) {
        this.removeLayer(`${featureId}-border`);
      }
      if (this.getSource(featureId)) {
        this.removeSource(featureId);
      }
    }
  }

  // remove all features from the map
  clearFeatures() {
    this._features.forEach((feature) => {
      this.removeFeature(feature);
    });
  }
};

export default RadarMap;
