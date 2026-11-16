import RadarMapFeature from './RadarMapFeature';
import { filterUndefined, mergeDeep } from './util/object';

import type RadarMap from './RadarMap';
import type { RadarPolygonOptions } from './types';

const defaultPolygonOptions: Partial<RadarPolygonOptions> = {
  paint: {
    'fill-color': '#FF6F00',
    'fill-opacity': 0.3,
    'border-color': '#FF6F00',
    'border-opacity': 1,
    'border-width': 2,
  },
};

/** polygon feature rendered on a RadarMap with fill and border support */
class RadarPolygonFeature extends RadarMapFeature {
  constructor(
    map: RadarMap,
    feature: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>,
    polygonOptions?: RadarPolygonOptions,
  ) {
    super(map, feature);
    const featureId = this.id;

    const options = mergeDeep(defaultPolygonOptions, polygonOptions) as RadarPolygonOptions;

    // use a callback to account for the async loading of the map
    const addFeatureToMap = () => {
      options.paint = options.paint || {};

      // add source for feature
      map.addSource(featureId, { type: 'geojson', data: feature });
      this._sourceIds.push(featureId);

      // polygon-layer
      map.addLayer({
        id: featureId,
        source: featureId,
        type: 'fill',
        layout: {},
        paint: filterUndefined({
          'fill-color': options.paint['fill-color'],
          'fill-opacity': options.paint['fill-opacity'],
        }),
      });
      this._layerIds.push(featureId);

      // border layer
      if (options.paint['border-color'] && options.paint['border-width'] && options.paint['border-opacity']) {
        const borderLayerId = `${featureId}-border`;
        map.addLayer({
          id: borderLayerId,
          source: featureId,
          type: 'line',
          layout: {},
          paint: filterUndefined({
            'line-color': options.paint['border-color'],
            'line-opacity': options.paint['border-opacity'],
            'line-width': options.paint['border-width'],
          }),
        });
        this._layerIds.push(borderLayerId);
      }
    };

    this.addWhenReady(addFeatureToMap);

    return this;
  }
}

export default RadarPolygonFeature;
