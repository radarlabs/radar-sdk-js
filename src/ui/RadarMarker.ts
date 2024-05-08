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
        const customMarkerUrl = URL.createObjectURL(blob);
        this._element.replaceChildren(createImageElement({ url: customMarkerUrl }));
      };

      const onError = (err: any) => {
        Logger.error(`Could not get custom marker: ${err.message} - falling back to default marker`);
        this._element.replaceChildren(...originalElement.childNodes);
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
