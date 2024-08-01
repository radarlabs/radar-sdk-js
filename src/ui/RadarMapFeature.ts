import maplibregl from 'maplibre-gl';

abstract class RadarMapFeature {
  id: string;
  _map: maplibregl.Map;
  _feature: GeoJSON.Feature;
  _sourceIds: string[] = [];
  _layerIds: string[] = [];

  constructor(map: maplibregl.Map, feature: GeoJSON.Feature) {
    this.id = (feature.id ?? `feature-${Date.now()}`).toString();
    this._feature = feature;
    this._map = map;
  }

  remove() {
    this._layerIds.forEach((layerId) => {
      if (this._map.getLayer(layerId)) {
        this._map.removeLayer(layerId);
      }
    });

    this._sourceIds.forEach((sourceId) => {
      if (this._map.getSource(sourceId)) {
        this._map.removeSource(sourceId);
      }
    });
  }
}

export default RadarMapFeature;
