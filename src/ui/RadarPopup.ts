import maplibregl from 'maplibre-gl';

import { RadarPopupOptions } from '../types';

class RadarPopup extends maplibregl.Popup {
  constructor(popupOptions: RadarPopupOptions) {
    super(popupOptions);

    if (popupOptions.text) {
      this.setText(popupOptions.text);
    }
    if (popupOptions.html) {
      this.setHTML(popupOptions.html);
    }
    if (popupOptions.element) {
      this.setDOMContent(popupOptions.element);
    }
  }
}

export default RadarPopup;
