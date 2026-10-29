import SearchAPI from './api/search';
import generateUUID from './uuid';

import type {
  RadarAutocompleteParams,
  RadarIntegration,
  RadarAutocompleteResponse,
  RadarAutocompleteSelectParams,
  RadarAutocompleteSelectResponse,
} from './types';

/**
 * An autocomplete search field and the selection a user makes in it.
 *
 * Create one session per address field.
 */
class AutocompleteSession {
  /** the token this session sends */
  public readonly sessionToken: string;

  /** tags both legs of this session, so first-party widget traffic stays separable */
  private readonly integration?: RadarIntegration;

  /**
   * @param integration - the first-party widget opening this session; omitted for direct SDK use
   */
  constructor(integration?: RadarIntegration) {
    this.sessionToken = generateUUID();
    this.integration = integration;
  }

  /**
   * autocomplete partial addresses and place names within this session
   * @param params - query and search configuration
   * @param requestId - optional ID for deduplicating in-flight requests
   * @returns matching addresses, each selectable via {@link AutocompleteSession.select}
   */
  public autocomplete(params: RadarAutocompleteParams, requestId?: string): Promise<RadarAutocompleteResponse> {
    return SearchAPI.autocomplete({ ...params, sessionToken: this.sessionToken }, requestId, this.integration);
  }

  /**
   * report which result the user chose
   * @param address - the selected result, as returned by {@link AutocompleteSession.autocomplete}
   * @returns the enriched address, where available
   * @throws {errors.RadarBadRequestError} if the address did not come from this SDK's autocomplete
   */
  public select(address: RadarAutocompleteSelectParams): Promise<RadarAutocompleteSelectResponse> {
    return SearchAPI.autocompleteSelect(address, this.integration);
  }
}

export default AutocompleteSession;
