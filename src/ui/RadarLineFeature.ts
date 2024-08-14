import RadarMapFeature from './RadarMapFeature';
import Logger from '../logger';
import { decodePolyline } from '../util/polyline';
import { filterUndefined, mergeDeep } from '../util/object';

import type RadarMap from './RadarMap';
import type { RadarLineOptions, RadarPolylineOptions } from '../types';

const defaultLineOptions: Partial<RadarLineOptions> = {
  paint: {
    'line-cap': 'round',
    'line-color': '#000257',
    'line-width': 4,
    'border-color': '#FFFFFF',
    'border-width': 2,
  }
};

class RadarLineFeature extends RadarMapFeature {
  constructor(map: RadarMap, feature: GeoJSON.Feature<GeoJSON.LineString>, lineOptions?: RadarLineOptions) {
    super(map, feature);
    const featureId = this.id;

    const options = mergeDeep(defaultLineOptions, lineOptions) as RadarLineOptions;

    // use a callback to account for the async loading of the map
    const addFeatureToMap = () => {
      options.paint = options.paint || {};

      // add source for feature
      map.addSource(featureId, { type: 'geojson', data: feature });
      this._sourceIds.push(featureId);

      // add border layer if border styling is present
      if (options.paint['line-width'] && options.paint['border-width']) {
        const borderLayerId = `${featureId}-border`;
        const borderWidth = options.paint['line-width'] + options.paint['border-width'];

        map.addLayer({
          id: borderLayerId,
          source: featureId,
          type: 'line',
          layout: {
            'line-cap': options.paint['line-cap'],
          },
          paint: filterUndefined({
            'line-color': options.paint['border-color'],
            'line-opacity': options.paint['border-opacity'],
            'line-width': borderWidth,
          }),
        });
        this._layerIds.push(borderLayerId); // border layer
      }

      // line-layer
      map.addLayer({
        id: featureId,
        source: featureId,
        type: 'line',
        layout: {
          'line-cap': options.paint['line-cap'],
        },
        paint: filterUndefined({
          'line-color': options.paint['line-color'],
          'line-width': options.paint['line-width'],
          'line-opacity': options.paint['line-opacity'],
          'line-offset': options.paint['line-offset'],
          'line-blur': options.paint['line-blur'],
          'line-dasharray': options.paint['line-dasharray'],
          'line-gap-width': options.paint['line-gap-width'],
          'line-gradient': options.paint['line-gradient'],
        }),
      });
      this._layerIds.push(featureId); // line layer
    };

    // ensure map is ready before modifying source and layers
    if (map.loaded()) {
      addFeatureToMap();
    } else {
      map.once('data',() => { // wait for map to be ready
        addFeatureToMap();
      });
    }

    return this;
  }

  static fromPolyline(map: RadarMap, polyline: string, polylineOptions?: RadarPolylineOptions) {
    const featureId = polylineOptions?.id || `polyline-feature-${Date.now()}`;

    const coordinates = decodePolyline(polyline, polylineOptions?.precision);

    const feature: GeoJSON.Feature<GeoJSON.LineString> = {
      id: featureId,
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates,
      },
      properties: polylineOptions?.properties || {},
    }

    const lineFeature = new RadarLineFeature(map, feature, polylineOptions);
    return lineFeature;
  }
}

export default RadarLineFeature;
