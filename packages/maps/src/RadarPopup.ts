import { Popup } from 'maplibre-gl';

import type { RadarPopupOptions } from './types';

/** MapLibre popup wrapper with convenience content options */
class RadarPopup extends Popup {
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
