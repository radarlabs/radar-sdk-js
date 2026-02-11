import { RadarError } from 'radar-sdk-js';

export class RadarAutocompleteContainerNotFound extends RadarError {
  constructor(message: string) {
    super(message);
    this.name = 'RadarAutocompleteContainerNotFound';
    this.status = 'CONTAINER_NOT_FOUND';
  }
}
