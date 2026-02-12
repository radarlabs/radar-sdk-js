import { RadarError } from 'radar-sdk-js';

/** error thrown when the autocomplete container element is not found in the DOM */
export class RadarAutocompleteContainerNotFound extends RadarError {
  constructor(message: string) {
    super(message);
    this.name = 'RadarAutocompleteContainerNotFound';
    this.status = 'CONTAINER_NOT_FOUND';
  }
}
