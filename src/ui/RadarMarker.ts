import maplibregl from 'maplibre-gl';

import Http from '../http';
import Logger from '../logger';

import type RadarMap from './RadarMap';

import type { RadarMarkerImage, RadarMarkerOptions } from '../types';

const defaultMarkerOptions: RadarMarkerOptions = {
  color: '#000257',
};

const createImageElement = (options: RadarMarkerImage) => {
  const element = document.createElement('img');
  element.src = options.url!;

  if (options.width) {
    element.width = options.width;
  }
  if (options.height) {
    element.height = options.height;
  }
  if (!options.width && !options.height) {
    element.style.maxWidth = '64px';
    element.style.maxHeight = '64px';
    element.style.width = '100%';
    element.style.height = '100%';
  }
  return element;
}

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

    super(maplibreOptions);

    if (markerOptions.image) {
      this._image = markerOptions.image;

      const originalElement = this._element.cloneNode(true);
      this._element.childNodes.forEach((child) => {
        child.remove();
      });

      const onSuccess = (blob: Blob) => {
        const markerObject = URL.createObjectURL(blob);
        this._element.replaceChildren(createImageElement({ url: markerObject }));
      };

      const onError = (err: any) => {
        Logger.error(`Could not load marker: ${err.message} - falling back to default marker`);
        this._element.replaceChildren(...Array.from(originalElement.childNodes));
      }

      if (markerOptions.image.url) {
        fetch(markerOptions.image.url)
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

      if (markerOptions.image.radarMarkerId) {
        // fetch custom marker
        Http.request({
          method: 'GET',
          version: 'maps',
          path: `markers/${markerOptions.image.radarMarkerId}`,
          responseType: 'blob',
        })
          .then(({ data }) => onSuccess(data))
          .catch(onError);
      }
    }

    // handle deprecated popup options
    if (markerOptions.text) {
      markerOptions.popup = markerOptions.popup || {};
      markerOptions.popup!.text = markerOptions.text;
    }
    if (markerOptions.html) {
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

      this.setPopup(popup);
    }

    // pass-through click event from element to marker
    const element = this.getElement();
    if (element) {
      element.addEventListener('click', (e) => {
        e.stopPropagation(); // stop propagation to map
        if (this._popup) {
          this.togglePopup();
        }
        this.fire('click', e);
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
