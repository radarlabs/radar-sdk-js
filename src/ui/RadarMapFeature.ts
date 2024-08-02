import type RadarMap from './RadarMap';

abstract class RadarMapFeature {
  id: string;
  _map: RadarMap;
  _feature: GeoJSON.Feature;
  _sourceIds: string[] = [];
  _layerIds: string[] = [];

  constructor(map: RadarMap, feature: GeoJSON.Feature) {
    this.id = (feature.id ?? `feature-${Date.now()}`).toString();
    this._feature = feature;
    this._map = map;
  }

  remove() {
    // remove layers
    this._layerIds.forEach((layerId) => {
      if (this._map.getLayer(layerId)) {
        this._map.removeLayer(layerId);
      }
    });

    // remove source
    this._sourceIds.forEach((sourceId) => {
      if (this._map.getSource(sourceId)) {
        this._map.removeSource(sourceId);
      }
    });

    // remove reference from map
    this._map._features = this._map._features.filter(
      (other) => other.id !== this.id
    );
  }
}

export default RadarMapFeature;
