import SearchAPI from './api/search';
import generateUUID from './uuid';

import type {
  RadarAutocompleteParams,
  RadarAutocompleteResponse,
  RadarAutocompleteSelectParams,
  RadarAutocompleteSelectResponse,
} from './types';

/** params for a session's autocomplete call; the session supplies the token itself */
export type RadarAutocompleteSessionParams = Omit<RadarAutocompleteParams, 'sessionToken'>;

/**
 * One autocomplete session: a single search field and the selection a user makes in it.
 *
 * Create one per address field. Two fields sharing a session also share the server's per-session
 * selection cap and its snapshot window, so typing into one can stop the other's results from
 * enriching — a checkout with billing and shipping wants two sessions, not one.
 *
 * The session mints and owns its token, so there is no token for a caller to get wrong. It stays
 * valid as long as the field is in use; the server expires a session after 20 minutes of
 * inactivity, and the next call through this instance simply opens a fresh one.
 */
class AutocompleteSession {
  /** the token this session sends, exposed for correlating with your own analytics */
  public readonly sessionToken: string;

  constructor() {
    this.sessionToken = generateUUID();
  }

  /**
   * autocomplete partial addresses and place names within this session
   * @param params - query and search configuration
   * @param requestId - optional ID for deduplicating in-flight requests
   * @returns matching addresses, each carrying the handle {@link AutocompleteSession.select} needs
   */
  public autocomplete(params: RadarAutocompleteSessionParams, requestId?: string): Promise<RadarAutocompleteResponse> {
    return SearchAPI.autocomplete({ ...params, sessionToken: this.sessionToken }, requestId);
  }

  /**
   * report which result the user chose, and get it back enriched where available
   * @param address - the selected result, as returned by {@link AutocompleteSession.autocomplete}
   * @returns the enriched address, when the project has address enrichment enabled
   * @throws {errors.RadarBadRequestError} if the address carries no handle
   */
  public select(address: RadarAutocompleteSelectParams): Promise<RadarAutocompleteSelectResponse> {
    return SearchAPI.autocompleteSelect(address);
  }
}

export default AutocompleteSession;
