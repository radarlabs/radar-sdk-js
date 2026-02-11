import type { RadarAutocompleteParams } from 'radar-sdk-js';

export interface RadarAutocompleteUIOptions extends Omit<RadarAutocompleteParams, 'query'> {
  container: string | HTMLElement;
  debounceMS?: number, // Debounce time in milliseconds
  /** @deprecated use minCharacters instead */
  threshold?: number,
  minCharacters?: number, // Minimum number of characters to trigger autocomplete
  placeholder?: string, // Placeholder text for the input field
  onSelection?: (selection: any) => void,
  onRequest?: (params: RadarAutocompleteParams) => void,
  onResults?: (results: any[]) => void,
  onError?: (error: any) => void,
  disabled?: boolean,
  responsive?: boolean;
  width?: string | number;
  maxHeight?: string | number;
  showMarkers?: boolean;
  markerColor?: string;
  hideResultsOnBlur?: boolean;
}

export interface RadarAutocompleteConfig extends RadarAutocompleteUIOptions {
  debounceMS: number, // Debounce time in milliseconds
  threshold: number, // DEPRECATED(use minCharacters instead)
  minCharacters: number, // Minimum number of characters to trigger autocomplete
  limit: number, // Maximum number of autocomplete results
  placeholder: string, // Placeholder text for the input field
  disabled: boolean,
}
