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
  /** callback invoked when the results dropdown opens */
  onOpen?: () => void;
  /** callback invoked when the results dropdown closes */
  onClose?: () => void;
  /** return false to prevent the dropdown from opening for the given results */
  shouldOpen?: (results: RadarAutocompleteAddress[]) => boolean;
  /** callback invoked on keydown when the dropdown is open; call event.preventDefault() to override default behavior */
  onKeyDown?: (event: KeyboardEvent, context: RadarAutocompleteKeyDownContext) => void;
}

/** context passed to onKeyDown */
export interface RadarAutocompleteKeyDownContext {
  /** key from the keyboard event */
  key: string;
  /** current results in the dropdown */
  results: RadarAutocompleteAddress[];
  /** index of the currently highlighted result, or -1 if none */
  highlightedIndex: number;
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
