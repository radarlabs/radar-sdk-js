import type RadarMap from './RadarMap';

type RadarFeatureEventType = 'click' | 'mousemove' | 'mouseenter' | 'mouseleave';

interface FeatureListener {
  type: RadarFeatureEventType;
  callback: (event: any) => void;
}

const pointerCursors = new WeakMap<RadarMap, { previous: string; owners: Set<RadarMapFeature> }>();

class RadarFeatureMouseEvent {
  type: RadarFeatureEventType;
  feature: RadarMapFeature;
  originalEvent: any;

  constructor(type: RadarFeatureEventType, feature: RadarMapFeature, originalEvent: any) {
    this.type = type;
    this.feature = feature;
    this.originalEvent = originalEvent;
  }
}

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
  private removed = false;
  private pendingAdd?: () => void;
  private listeners: FeatureListener[] = [];

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

  /** Keep deferred rendering owned by this feature so removal can cancel it. */
  protected addWhenReady(addFeature: () => void) {
    if (this._map.isStyleLoaded()) {
      addFeature();
      return;
    }

    const onReady = () => {
      if (!this._map.isStyleLoaded()) {
        return;
      }
      this._map.off('data', onReady);
      this._map.off('render', onReady);
      this.pendingAdd = undefined;
      if (!this.removed) {
        addFeature();
      }
    };
    this.pendingAdd = onReady;
    this._map.on('data', onReady);
    this._map.on('render', onReady);
  }

  /** remove this feature and its layers from the map */
  remove() {
    if (this.removed) {
      return;
    }
    this.removed = true;

    if (this.pendingAdd) {
      this._map.off('data', this.pendingAdd);
      this._map.off('render', this.pendingAdd);
      this.pendingAdd = undefined;
    }
    this.listeners.forEach(({ type, callback }) => {
      this._map.off(type, this.id, callback);
    });
    this.listeners = [];
    this.restoreCursor();

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
    this._map._features = this._map._features.filter((other) => other !== this);
    this._layerIds = [];
    this._sourceIds = [];
  }

  /** Share pointer ownership so removing one hovered feature does not reset another's cursor. */
  private usePointerCursor() {
    const cursor = this._map.getCanvas().style.cursor;
    let state = pointerCursors.get(this._map);
    if (!state) {
      state = { previous: cursor, owners: new Set() };
      pointerCursors.set(this._map, state);
    } else if (cursor !== 'pointer') {
      state.previous = cursor;
    }
    state.owners.add(this);
    this._map.getCanvas().style.cursor = 'pointer';
  }

  /** Release only our pointer claim and preserve cursor changes made by direct map handlers. */
  private restoreCursor() {
    const state = pointerCursors.get(this._map);
    if (!state || !state.owners.delete(this) || state.owners.size > 0) {
      return;
    }
    pointerCursors.delete(this._map);
    const canvas = this._map.getCanvas();
    if (canvas.style.cursor === 'pointer') {
      canvas.style.cursor = state.previous;
    }
  }

  /** Ignore callbacks already copied by MapLibre if an earlier listener removes this feature. */
  private addListener(type: RadarFeatureEventType, callback: (event: any) => void) {
    const listener = (event: any) => {
      if (!this.removed) {
        callback(event);
      }
    };
    this._map.on(type, this.id, listener);
    this.listeners.push({ type, callback: listener });
  }

  /**
   * register an event listener on this feature's map layer
   *
   * @param eventType - the event type to listen for
   * @param callback - handler receiving the feature event
   */
  on(eventType: RadarFeatureEventType, callback: (event: RadarFeatureMouseEvent) => void) {
    if (this.removed) {
      return;
    }
    this.addListener(eventType, (event) => callback(new RadarFeatureMouseEvent(eventType, this, event)));

    // add pointer cursor if feature is clickable
    if (eventType === 'click') {
      this.addListener('mouseenter', () => {
        this.usePointerCursor();
      });
      this.addListener('mouseleave', () => {
        this.restoreCursor();
      });
    }
  }
}

export default RadarMapFeature;
