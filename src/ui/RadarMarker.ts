import maplibregl from 'maplibre-gl';

import Http from '../http';
import Logger from '../logger';

import type RadarMap from './RadarMap';

import type { RadarMarkerOptions } from '../types';

class RadarMarkerMouseEvent {
  type: 'click';
  target: RadarMarker;
  originalEvent: MouseEvent;
  lngLat: maplibregl.LngLat;
  point: maplibregl.Point2D;

  constructor(type: 'click', marker: RadarMarker, originalEvent: MouseEvent) {
    this.target = marker;
    this.originalEvent = originalEvent;
    this.point = marker._pos;
    this.lngLat = marker.getLngLat();
    this.type = type;
  }
}

interface ImageOptions {
  url?: string;
  width?: number | string;
  height?: number | string;
}

const createImageElement = (options: ImageOptions) => {
  const element = document.createElement('img');
  element.src = options.url!;

  if (options.width) {
    if (typeof options.width === 'number') {
      element.width = options.width;
    } else {
      element.style.width = options.width;
    }
  }
  if (options.height) {
    if (typeof options.height === 'number') {
      element.height = options.height;
    } else {
      element.style.height = options.height;
    }
  }
  if (!options.width && !options.height) {
    element.style.maxWidth = '64px';
    element.style.maxHeight = '64px';
    element.style.width = '100%';
    element.style.height = '100%';
  }
  return element;
}

const defaultMarkerOptions: RadarMarkerOptions = {
  color: '#000257',
};

class RadarMarker extends maplibregl.Marker {
  _map!: RadarMap;

  constructor(markerOptions: RadarMarkerOptions) {
    const maplibreOptions: maplibregl.MarkerOptions = Object.assign({}, defaultMarkerOptions);

    // init MapLibre marker configs
    if (markerOptions.color) {
      maplibreOptions.color = markerOptions.color;
    }
    if (markerOptions.element) {
      maplibreOptions.element = markerOptions.element;
    }
    if (markerOptions.scale) {
      maplibreOptions.scale = markerOptions.scale;
    }

    super(maplibreOptions);

    // handle marker images (Radar marker, or custom URL)
    if (markerOptions.marker || markerOptions.url) {
      const originalElement = this._element.cloneNode(true);
      this._element.childNodes.forEach((child) => {
        child.remove();
      });

      const onSuccess = (blob: Blob) => {
        const markerObject = URL.createObjectURL(blob);
        this._element.replaceChildren(createImageElement({
          width: markerOptions.width,
          height: markerOptions.height,
          url: markerObject,
        }));
      };

      const onError = (err: any) => {
        Logger.error(`Could not load marker: ${err.message} - falling back to default marker`);
        this._element.replaceChildren(...Array.from(originalElement.childNodes));
      }

      if (markerOptions.url) {
        fetch(markerOptions.url)
          .then(res => {
            if (res.status === 200) {
              res.blob()
                .then(onSuccess)
                .catch(onError);
            } else {
              onError(new Error(res.statusText));
            }
          })
          .catch(onError)
      }

      if (markerOptions.marker) {
        // fetch custom marker
        Http.request({
          method: 'GET',
          version: 'maps',
          path: `markers/${markerOptions.marker}`,
          responseType: 'blob',
        })
          .then(({ data }) => onSuccess(data))
          .catch(onError);
      }
    }

    // handle deprecated popup options
    if (markerOptions.text) {
      Logger.warn('marker option "text" is deprecated, and will be removed in a future version. Use "popup.text".');
      markerOptions.popup = markerOptions.popup || {};
      markerOptions.popup!.text = markerOptions.text;
    }
    if (markerOptions.html) {
      Logger.warn('marker option "html" is deprecated, and will be removed in a future version. Use "popup.html".');
      markerOptions.popup = markerOptions.popup || {};
      markerOptions.popup!.html = markerOptions.html;
    }

    // set popup text or HTML
    if (markerOptions.popup) {
      const popup = new maplibregl.Popup(markerOptions.popup);

      if (markerOptions.popup.text) {
        popup.setText(markerOptions.popup.text);
      }
      if (markerOptions.popup.html) {
        popup.setHTML(markerOptions.popup.html);
      }
      if (markerOptions.popup.element) {
        popup.setDOMContent(markerOptions.popup.element);
      }

      this.setPopup(popup);
    }

    // pass-through click event from element to marker
    const element = this.getElement();
    if (element) {
      element.addEventListener('click', (e) => {
        this.fire('click', new RadarMarkerMouseEvent('click', this, e));
      });
    }
  }

  addTo(map: RadarMap) {
    map.addMarker(this);
    return super.addTo(map);
  }

  remove() {
    if (this._map) {
      this._map.removeMarker(this);
    }
    return super.remove();
  }
}

export default RadarMarker;
