import maplibregl from 'maplibre-gl';

import Http from '../http';
import Logger from '../logger';

import type RadarMap from './RadarMap';

import type { RadarMarkerImage, RadarMarkerOptions } from '../types';

const defaultMarkerOptions: maplibregl.MarkerOptions = {
  color: '#000257',
};

const fileExtensionToContentType: Record<string, string> = {
  svg: 'image/svg+xml',
  png: 'image/png',
};

const getFileExtension = (file: string): string => {
  return file.split('.').pop() || '';
}

const createImageElement = (options: RadarMarkerImage) => {
  const element = document.createElement('img');
  element.src = options.url;
  if (options.width) {
    element.width = options.width;
  }
  if (options.height) {
    element.height = options.height;
  }
  element.style.maxWidth = '64px';
  element.style.maxHeight = '64px';
  return element;
}
class RadarMarker extends maplibregl.Marker {
  _map!: RadarMap;
  _image?: RadarMarkerImage;
  _customMarkerId?: string;

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
      maplibreOptions.element = createImageElement(markerOptions.image);
    }

    super(maplibreOptions);

    if (markerOptions.image) {
      this._image = markerOptions.image;
    }

    if (markerOptions.customMarkerId) {
      const ext = getFileExtension(markerOptions.customMarkerId);
      if (ext !== 'svg' && ext !== 'png') {
        Logger.error(`Invalid custom marker extension ${ext} - falling back to default marker`);
      } else {
        this._customMarkerId = markerOptions.customMarkerId;

        const originalElement = this._element.cloneNode(true);
        this._element.childNodes.forEach((child) => {
          child.remove();
        });
        const contentType = fileExtensionToContentType[ext];

        Http.request({
          method: 'GET',
          versioned: false,
          path: `maps/PlACEHOLDER/markers/${markerOptions.customMarkerId}`,
          headers: {
            'Content-Type': contentType,
          },
        }).then((res) => {
          if (res.data instanceof Blob) {
            // png returns a Blob
            const customMarkerUrl = URL.createObjectURL(res.data);
            this._element.replaceChildren(createImageElement({ url: customMarkerUrl }));
          } else {
            // svg returns an xml string
            this._element.innerHTML = res.data;
          }
        }).catch((err) => {
          Logger.error(`Could not get custom marker: ${err.message} - falling back to default marker`);
          this._element.replaceChildren(...originalElement.childNodes);
        });
      }
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
    map._markers.push(this);
    return super.addTo(map);
  }

  remove() {
    if (this._map) {
      this._map._markers = this._map._markers.filter((marker) => marker !== this);
    }
    return super.remove();
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