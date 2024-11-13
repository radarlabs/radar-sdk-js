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

class SearchAPI {
  static async autocomplete(params: RadarAutocompleteParams, requestId?: string): Promise<RadarAutocompleteResponse> {
    const options = Config.get();

    let {
      query,
      near,
      limit,
      layers,
      countryCode,
      expandUnits,
      mailable,
      lang,
      postalCode,
    } = params;

    // near can be provided as a string or Location object
    // if "near" is not provided, request will fallback to IP based location
    if (near && typeof near !== 'string') {
      if (near.latitude && near.longitude) {
        near = `${near.latitude},${near.longitude}`;
      }
    }

    const response: any = await Http.request({
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

    const autocompleteRes = {
      addresses: response.addresses,
    } as RadarAutocompleteResponse;

    if (options.debug) {
      autocompleteRes.response = response;
    }

    return autocompleteRes;
  }

  static async searchGeofences(params: RadarSearchGeofencesParams): Promise<RadarSearchGeofencesResponse> {
    const options = Config.get();

    let {
      near,
      radius,
      tags,
      metadata,
      limit,
      includeGeometry,
    } = params;

    // use browser location if "near" not provided
    if (!near) {
      const { latitude, longitude } = await Navigator.getCurrentPosition();
      near = `${latitude},${longitude}`;
    } else if (typeof near !== 'string') { // near is "Location" object
      const { latitude, longitude } = near;
      near = `${latitude},${longitude}`;
    }

    // convert arrays to comma-strings
    if (Array.isArray(tags)) {
      tags = tags.join(',');
    }

    const response: any = await Http.request({
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

    const geofencesSearchRes = {
      geofences: response.geofences,
    } as RadarSearchGeofencesResponse;

    if (options.debug) {
      geofencesSearchRes.response = response;
    }

    return geofencesSearchRes;
  }

  static async searchPlaces(params: RadarSearchPlacesParams): Promise<RadarSearchPlacesResponse> {
    const options = Config.get();

    let {
      near,
      radius,
      chains,
      categories,
      groups,
      limit,
    } = params;

    // use browser location if "near" not provided
    if (!near) {
      const { latitude, longitude } = await Navigator.getCurrentPosition();
      near = `${latitude},${longitude}`;
    } else if (typeof near !== 'string') { // near is "Location" object
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

    const response: any = await Http.request({
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

    const placeSearchRes = {
      places: response.places,
    } as RadarSearchPlacesResponse;

    if (options.debug) {
      placeSearchRes.response = response;
    }

    return placeSearchRes;
  }
}

export default SearchAPI;
