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

    return Http.request('GET', 'v1/search/geofences', params);
  }


  static async autocomplete(searchOptions={}) {
    // NOTE: I'm not sure how caching works with getCurrentPosition,
    // but this could be problematic here if needs to compute each time.
    // We could add a cache: true flag to retreive previous value
    if (!searchOptions.near) {
      const { latitude, longitude } = await Navigator.getCurrentPosition();
      searchOptions.near = { latitude, longitude };
    }

    let {
      query,
      near,
      limit,
    } = searchOptions;

    near = `${near.latitude},${near.longitude}`;

    const params = {
      query,
      near,
      limit,
    };

    return Http.request('GET', 'v1/search/autocomplete', params);
  }
}

export default Search;
