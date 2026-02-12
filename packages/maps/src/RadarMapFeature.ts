import type RadarMap from './RadarMap';

type RadarFeatureEventType = 'click' | 'mousemove' | 'mouseenter' | 'mouseleave';

class RadarFeatureMouseEvent {
  type: RadarFeatureEventType;
  feature: RadarMapFeature;
  originalEvent: any;

  constructor(type: RadarFeatureEventType, feature: RadarMapFeature, originalEvent: any) {
    this.type = type;
    this.feature = feature;
    this.originalEvent = originalEvent;
  }
};

/** abstract base class for map features (lines, polygons) with source/layer management */
abstract class RadarMapFeature {
  /** unique feature identifier */
  id: string;
  /** GeoJSON geometry of this feature */
  geometry: GeoJSON.Geometry;
  /** GeoJSON properties of this feature */
  properties: GeoJSON.GeoJsonProperties;

  _map: RadarMap;
  _feature: GeoJSON.Feature;
  _sourceIds: string[] = [];
  _layerIds: string[] = [];

  constructor(map: RadarMap, feature: GeoJSON.Feature) {
    this.id = (feature.id ?? `feature-${Date.now()}`).toString();

    // check for duplicate IDs
    (map.getFeatures() || []).forEach((feature) => {
      if (feature.id === this.id) {
        throw new Error(`RadarMapFeature: feature with id ${this.id} already exists.`);
      }
    });

    this.geometry = feature.geometry;
    this.properties = feature.properties || {};
    this._feature = feature;
    this._map = map;
  }

  /** remove this feature and its layers from the map */
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

  /**
   * register an event listener on this feature's map layer
   *
   * @param eventType - the event type to listen for
   * @param callback - handler receiving the feature event
   */
  on(eventType: RadarFeatureEventType, callback: (event: RadarFeatureMouseEvent) => void) {
    this._map.on(eventType, this.id, (event) => {
      callback(new RadarFeatureMouseEvent(eventType, this, event));
    });

    // add pointer cursor if feature is clickable
    if (eventType === 'click') {
      this._map.on('mouseenter', this.id, () => {
        this._map.getCanvas().style.cursor = 'pointer';
      });
      this._map.on('mouseleave', this.id, () => {
        this._map.getCanvas().style.cursor = '';
      });
    }
  }
}

export default RadarMapFeature;
