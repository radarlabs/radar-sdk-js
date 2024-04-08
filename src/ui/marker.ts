import maplibregl, { MapMouseEvent } from 'maplibre-gl';

import RadarMap from './map';

import type { RadarMarkerImage, RadarMarkerOptions } from '../types';

const defaultMarkerOptions: maplibregl.MarkerOptions = {
  color: '#000257',
};

class RadarMarker extends maplibregl.Marker {
  _map!: RadarMap;
  _image?: RadarMarkerImage;

  constructor(markerOptions: RadarMarkerOptions) {
    const maplibreOptions: maplibregl.MarkerOptions = Object.assign({}, defaultMarkerOptions);

    if (markerOptions.color) {
      maplibreOptions.color = markerOptions.color;
    }
    if (markerOptions.element) {
      maplibreOptions.element = markerOptions.element;
    }
    if (markerOptions.scale) {
      maplibreOptions.scale = markerOptions.scale;
    }
    if (markerOptions.image) {
      const element = document.createElement('div');
      element.style.backgroundImage = `url(${markerOptions.image.url})`;
      element.style.width = markerOptions.image.width;
      element.style.height = markerOptions.image.height;

      maplibreOptions.element = element;
    }

    super(maplibreOptions);

    if (markerOptions.image) {
      this._image = markerOptions.image;
    }

    // set popup text or HTML
    if (markerOptions.text) {
      const popup = new maplibregl.Popup({ offset: 35 }).setText(markerOptions.text);
      this.setPopup(popup);
    } else if (markerOptions.html) {
      const popup = new maplibregl.Popup({ offset: 35 }).setHTML(markerOptions.html);
      this.setPopup(popup);
    }
  }

  addTo(map: RadarMap) {
    if (map._customMarkerRawSvg && !this._image) {
      this._element.innerHTML = map._customMarkerRawSvg;
    }
    map._markers.push(this);
    return super.addTo(map);
  }

  remove() {
    if (this._map) {
      this._map._markers = this._map._markers.filter((marker) => marker !== this);
    }
    return super.remove();
  }

  _onMapClick(e: MapMouseEvent): void {
    const targetElement = e.originalEvent.target;
    const element = this._element;

    if (targetElement === element || element.contains(targetElement as any)) {
      // TODO: Need to stop propagation somehow
      // can use addEventListener in the constructor instead but then the togglePopup logic will be kinda wonky
      if (this._popup) {
        this.togglePopup();
      }
      this.fire('click', this);
    }
  }

  getOptions(): RadarMarkerOptions {
    const markerOptions: RadarMarkerOptions = {
      // TODO: element: marker.getElement(),
      image: this._image,
      color: this._color,
      scale: this._scale,
      offset: this.getOffset(),
      anchor: this._anchor,
      draggable: this.isDraggable(),
      clickTolerance: this._clickTolerance,
      rotation: this.getRotation(),
      rotationAlignment: this.getRotationAlignment(),
      pitchAlignment: this.getPitchAlignment()
    }

    return markerOptions;
  }
}

export default RadarMarker;