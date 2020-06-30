import Http from '../http';
import Navigator from '../navigator';

class Search {
  static async searchPlaces(searchOptions={}) {
    if (!searchOptions.near) {
      const { latitude, longitude } = await Navigator.getCurrentPosition();
      searchOptions.near = { latitude, longitude };
    }

    let {
      near,
      radius,
      chains,
      categories,
      groups,
      limit,
    } = searchOptions;

    near = `${near.latitude},${near.longitude}`;

    if (chains) {
      chains = chains.join(',');
    }
    if (categories) {
      categories = categories.join(',');
    }
    if (groups) {
      groups = groups.join(',');
    }

    const params = {
      near,
      radius,
      chains,
      categories,
      groups,
      limit,
    };

    return Http.request('GET', 'v1/search/places', params);
  }

  static async searchGeofences(searchOptions={}) {
    if (!searchOptions.near) {
      const { latitude, longitude } = await Navigator.getCurrentPosition();
      searchOptions.near = { latitude, longitude };
    }

    let {
      near,
      radius,
      tags,
      metadata,
      limit,
    } = searchOptions;

    near = `${near.latitude},${near.longitude}`;

    if (tags) {
      tags = tags.join(',');
    }

    const params = {
      near,
      radius,
      tags,
      limit,
    };

    if (metadata) {
      Object.keys(metadata).forEach((k) => {
        const key = `metadata[${k}]`;
        const value = metadata[k];
        params[key] = value;
      });
    }

    return Http.request('GET', 'v1/search/geofences', params);
  }


  static async autocomplete(searchOptions={}) {
    // if near is not provided, server will use geoIP as fallback

    let {
      query,
      near,
      limit,
      layers,
    } = searchOptions;

    if (near?.latitude && near?.longitude) {
      near = `${near.latitude},${near.longitude}`;
    }

    const params = {
      query,
      near,
      limit,
      layers,
    };

    return Http.request('GET', 'v1/search/autocomplete', params);
  }
}

export default Search;
