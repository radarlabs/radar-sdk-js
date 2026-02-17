import Config from '../config';
import Http from '../http';
import Navigator from '../navigator';

import type {
  RadarAutocompleteParams,
  RadarAutocompleteResponse,
  RadarSearchPlacesParams,
  RadarSearchPlacesResponse,
  RadarSearchGeofencesParams,
  RadarSearchGeofencesResponse,
} from '../types';

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

    const { query, limit, layers, countryCode, expandUnits, mailable, lang, postalCode } = params;
    let { near } = params;

    // near can be provided as a string or Location object
    // if "near" is not provided, request will fallback to IP based location
    if (near && typeof near !== 'string') {
      if (near.latitude && near.longitude) {
        near = `${near.latitude},${near.longitude}`;
      }
    }

    const response = await Http.request<Omit<RadarAutocompleteResponse, 'response'>>({
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
      },
      requestId,
    });

    const autocompleteRes: RadarAutocompleteResponse = {
      addresses: response.addresses,
    };

    if (options.debug) {
      autocompleteRes.response = response;
    }

    return autocompleteRes;
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
