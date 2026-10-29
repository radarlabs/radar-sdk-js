import Config from '../config';
import { RadarBadRequestError } from '../errors';
import Http from '../http';
import Logger from '../logger';
import Navigator from '../navigator';

import type {
  RadarAutocompleteAddress,
  RadarAutocompleteSelectParams,
  RadarAutocompleteSelectResponse,
  RadarAutocompleteParams,
  RadarAutocompleteResponse,
  RadarSearchPlacesParams,
  RadarSearchPlacesResponse,
  RadarSearchGeofencesParams,
  RadarSearchGeofencesResponse,
} from '../types';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const badRequest = (message: string) => new RadarBadRequestError({ meta: { message } });

/** @internal search API — use Radar.autocomplete / searchGeofences / searchPlaces instead */
class SearchAPI {
  /**
   * autocomplete partial addresses and place names
   * @param params - query and search configuration
   * @param requestId - optional ID for deduplicating in-flight requests
   * @returns matching addresses
   */
  static async autocomplete(params: RadarAutocompleteParams, requestId?: string): Promise<RadarAutocompleteResponse> {
    const options = Config.get();

    const { query, limit, layers, countryCode, expandUnits, mailable, lang, postalCode, sessionToken } = params;
    let { near } = params;

    // A malformed token fails the whole search, not just selection -- the API rejects the
    // autocomplete request itself -- so catch it here rather than at the wire.
    if (sessionToken !== undefined && !UUID_PATTERN.test(sessionToken)) {
      throw badRequest('sessionToken: must be a UUID.');
    }

    // near can be provided as a string or Location object
    // if "near" is not provided, request will fallback to IP based location
    if (near && typeof near !== 'string') {
      if (near.latitude && near.longitude) {
        near = `${near.latitude},${near.longitude}`;
      }
    }

    const response = await Http.request<Omit<RadarAutocompleteResponse, 'response' | 'requestId'>>({
      method: 'GET',
      path: 'search/autocomplete',
      data: {
        query,
        near,
        limit,
        layers,
        countryCode,
        expandUnits,
        mailable,
        lang,
        postalCode,
        sessionToken,
      },
      requestId,
    });

    const autocompleteRes: RadarAutocompleteResponse = {
      addresses: response.addresses,
      // echoed back to search/autocomplete/select to attribute a selection to this response
      requestId: response.meta?.requestId,
    };

    if (options.debug) {
      autocompleteRes.response = response;
    }

    return autocompleteRes;
  }

  /**
   * report which autocomplete result the user chose
   * @param address - the selected result, as returned by {@link SearchAPI.autocomplete}
   */
  static async autocompleteSelect(address: RadarAutocompleteSelectParams): Promise<RadarAutocompleteSelectResponse> {
    // Results only carry a handle when the originating request opened a session. A missing one is
    // programmer error -- no sessionToken on the originating autocomplete, or an address that did
    // not come from autocomplete at all -- so unlike the operational failures below, it is loud.
    const resultId = address?.resultId;
    if (!resultId) {
      throw badRequest(
        'resultId: this address carries no resultId. Pass a sessionToken on the originating ' +
          'autocomplete request, and select an address it returned.',
      );
    }

    try {
      const response = await Http.request({
        method: 'POST',
        path: 'search/autocomplete/select',
        data: { resultId },
        // the selection may navigate the page; keepalive lets the report outlive it
        keepalive: true,
      });

      // a 204 means the selection was recorded but the project does not enrich; there is no address
      return { address: (response as { address?: RadarAutocompleteAddress }).address };
    } catch (err) {
      // fire-and-forget: an expired session or network blip never surfaces to the caller, never retried
      Logger.debug(`Autocomplete selection not reported: ${String(err)}`);
      return {};
    }
  }

  /**
   * search for geofences near a location
   * @param params - location, radius, tags, and filters
   * @returns matching geofences
   */
  static async searchGeofences(params: RadarSearchGeofencesParams): Promise<RadarSearchGeofencesResponse> {
    const options = Config.get();

    const { radius, metadata, limit, includeGeometry } = params;
    let { near, tags } = params;

    // use browser location if "near" not provided
    if (!near) {
      const { latitude, longitude } = await Navigator.getCurrentPosition();
      near = `${latitude},${longitude}`;
    } else if (typeof near !== 'string') {
      // near is "Location" object
      const { latitude, longitude } = near;
      near = `${latitude},${longitude}`;
    }

    // convert arrays to comma-strings
    if (Array.isArray(tags)) {
      tags = tags.join(',');
    }

    const response = await Http.request<Omit<RadarSearchGeofencesResponse, 'response'>>({
      method: 'GET',
      path: 'search/geofences',
      data: {
        near,
        radius,
        tags,
        metadata,
        limit,
        includeGeometry,
      },
    });

    const geofencesSearchRes: RadarSearchGeofencesResponse = {
      geofences: response.geofences,
    };

    if (options.debug) {
      geofencesSearchRes.response = response;
    }

    return geofencesSearchRes;
  }

  /**
   * search for places near a location
   * @param params - location, radius, chains, categories, and groups
   * @returns matching places
   */
  static async searchPlaces(params: RadarSearchPlacesParams): Promise<RadarSearchPlacesResponse> {
    const options = Config.get();

    const { radius, limit } = params;
    let { near, chains, categories, groups } = params;

    // use browser location if "near" not provided
    if (!near) {
      const { latitude, longitude } = await Navigator.getCurrentPosition();
      near = `${latitude},${longitude}`;
    } else if (typeof near !== 'string') {
      // near is "Location" object
      const { latitude, longitude } = near;
      near = `${latitude},${longitude}`;
    }

    // convert arrays to comma-strings
    if (Array.isArray(chains)) {
      chains = chains.join(',');
    }
    if (Array.isArray(categories)) {
      categories = categories.join(',');
    }
    if (Array.isArray(groups)) {
      groups = groups.join(',');
    }

    const response = await Http.request<Omit<RadarSearchPlacesResponse, 'response'>>({
      method: 'GET',
      path: 'search/places',
      data: {
        near,
        radius,
        chains,
        categories,
        groups,
        limit,
      },
    });

    const placeSearchRes: RadarSearchPlacesResponse = {
      places: response.places,
    };

    if (options.debug) {
      placeSearchRes.response = response;
    }

    return placeSearchRes;
  }
}

export default SearchAPI;
