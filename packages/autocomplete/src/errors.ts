import { RadarError } from 'radar-sdk-js';

/** error thrown when the autocomplete container element is not found in the DOM */
export class RadarAutocompleteContainerNotFound extends RadarError {
  public override readonly name = 'RadarAutocompleteContainerNotFound';
  public override readonly status = 'CONTAINER_NOT_FOUND';

  constructor(message: string) {
    super(message);
  }
}
