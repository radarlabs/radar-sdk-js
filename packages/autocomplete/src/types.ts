import type { RadarAutocompleteAddress, RadarAutocompleteParams } from 'radar-sdk-js';

/** configuration options for the autocomplete UI widget */
export interface RadarAutocompleteUIOptions extends Omit<RadarAutocompleteParams, 'query'> {
  /** element ID or HTMLElement to mount the widget into */
  container: string | HTMLElement;
  /** debounce delay in milliseconds before fetching results */
  debounceMS?: number;
  /**
   * @deprecated use minCharacters instead
   */
  threshold?: number;
  /** minimum number of characters to trigger autocomplete */
  minCharacters?: number;
  /** placeholder text for the input field */
  placeholder?: string;
  /** callback invoked when a result is selected */
  onSelection?: (selection: RadarAutocompleteAddress) => void;
  /** callback invoked before each autocomplete request */
  onRequest?: (params: RadarAutocompleteParams) => void;
  /** callback invoked when results are returned */
  onResults?: (results: RadarAutocompleteAddress[]) => void;
  /** callback invoked on autocomplete errors */
  onError?: (error: Error) => void;
  /** whether the input is disabled */
  disabled?: boolean;
  /** whether to use responsive width (100% with optional max-width) */
  responsive?: boolean;
  /** fixed width or max-width (px number or CSS string) */
  width?: string | number;
  /** max height of the results dropdown (px number or CSS string) */
  maxHeight?: string | number;
  /** whether to show marker icons in results */
  showMarkers?: boolean;
  /** color for marker icons in results */
  markerColor?: string;
  /** whether to hide results when the input loses focus */
  hideResultsOnBlur?: boolean;
  /**
   * HTML `autocomplete` attribute on the input. Default `'off'` reduces native autofill competing with the widget.
   * Use e.g. `'street-address'` when you want the browser to offer saved addresses (often with `ignoreBrowserAutofill`).
   * @default 'off'
   */
  inputAutocomplete?: string;
  /**
   * When true, skip autocomplete API and dropdown after browser address autofill
   * (bulk fill without typing). After the user edits the field (keyboard, paste, cut),
   * autocomplete runs normally. Set false to always search on input.
   * @default true
   */
  ignoreBrowserAutofill?: boolean;
}

/** resolved configuration with required defaults */
export interface RadarAutocompleteConfig extends RadarAutocompleteUIOptions {
  /** debounce delay in milliseconds */
  debounceMS: number;
  /**
   * @deprecated use minCharacters instead
   */
  threshold: number;
  /** minimum characters to trigger autocomplete */
  minCharacters: number;
  /** maximum number of autocomplete results */
  limit: number;
  /** placeholder text for the input field */
  placeholder: string;
  /** whether the input is disabled */
  disabled: boolean;
}
