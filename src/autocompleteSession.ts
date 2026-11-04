import SearchAPI from './api/search';
import { RadarBadRequestError } from './errors';
import generateUUID, { UUID_PATTERN } from './uuid';

import type {
  RadarAutocompleteParams,
  RadarAutocompleteResponse,
  RadarAutocompleteSelectParams,
  RadarAutocompleteSelectResponse,
  RadarIntegration,
} from './types';

/**
 * Integration tags, kept off the class so they stay out of its public surface: a customer
 * opening a session cannot set one, and only {@link openTaggedSession} ever writes here.
 */
const integrations = new WeakMap<AutocompleteSession, RadarIntegration>();

/**
 * An autocomplete search field and the selection a user makes in it.
 *
 * Create one session per address field.
 */
class AutocompleteSession {
  /** the token this session sends */
  public readonly sessionToken: string;

  /**
   * @param sessionToken resumes a session from a token minted elsewhere. Intended for wrapper
   *   SDKs that cannot hold a session instance; omit it to mint a new session.
   * @throws {errors.RadarBadRequestError} if `sessionToken` is given and is not a UUID
   */
  constructor(sessionToken?: string) {
    if (sessionToken !== undefined && !UUID_PATTERN.test(sessionToken)) {
      throw new RadarBadRequestError({ meta: { message: 'sessionToken: must be a UUID.' } });
    }

    this.sessionToken = sessionToken ?? generateUUID();
  }

  /**
   * autocomplete partial addresses and place names within this session
   * @param params - query and search configuration
   * @param requestId - optional ID for deduplicating in-flight requests
   * @returns matching addresses, each selectable via {@link AutocompleteSession.select}
   */
  public autocomplete(params: RadarAutocompleteParams, requestId?: string): Promise<RadarAutocompleteResponse> {
    return SearchAPI.autocomplete({ ...params, sessionToken: this.sessionToken }, requestId, integrations.get(this));
  }

  /**
   * report which result the user chose; selections are how autocomplete quality is
   * measured and improved
   * @param address - the selected result, as returned by {@link AutocompleteSession.autocomplete}
   * @returns the enriched address, where available
   * @throws {errors.RadarBadRequestError} if the address did not come from this SDK's autocomplete
   */
  public select(address: RadarAutocompleteSelectParams): Promise<RadarAutocompleteSelectResponse> {
    return SearchAPI.autocompleteSelect(address, integrations.get(this));
  }
}

/**
 * @internal open a session whose requests are tagged as coming from a first-party widget.
 *
 * Reached through {@link RadarPluginContext.createAutocompleteSession}, never by customer code.
 */
export const openTaggedSession = (integration?: RadarIntegration): AutocompleteSession => {
  const session = new AutocompleteSession();
  if (integration) {
    integrations.set(session, integration);
  }
  return session;
};

export default AutocompleteSession;
