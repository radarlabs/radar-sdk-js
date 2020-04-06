import * as Http from '../http';
import Navigator from '../navigator';

// consts
import STATUS from '../status_codes';

class Search {
  static searchPlaces(
    {
      radius,
      chains,
      categories,
      groups,
      limit,
    },
    callback,
  ) {
    Navigator.getCurrentPosition((status, { latitude, longitude }) => {
      if (status !== STATUS.SUCCESS) {
        callback(status);
        return;
      }

      this.searchPlacesNear(
        {
          near: { latitude, longitude },
          radius,
          chains,
          categories,
          groups,
          limit,
        },
        (status, places) => {
          callback(status, places);
          return;
        }
      );
    });
  }

  static searchPlacesNear(
    {
      near,
      radius,
      chains,
      categories,
      groups,
      limit,
    },
    callback,
  ) {
    const queryParams = {
      near: `${near.latitude},${near.longitude}`,
      radius,
      chains: chains.join(','),
      categories: categories.join(','),
      groups: groups.join(','),
      limit: Math.min(limit, 100),
    };

    Http.request('GET', 'v1/search/places', queryParams,
      (status, response) => {
        callback(status, response ? response.places : null);
        return;
      }
    );
  }

  static searchGeofences(
    {
      radius,
      tags,
      limit,
    },
    callback,
  ) {
    Navigator.getCurrentPosition((status, { latitude, longitude }) => {
      if (status !== STATUS.SUCCESS) {
        callback(status);
        return;
      }

      this.searchGeofencesNear(
        {
          near: { latitude, longitude },
          radius,
          tags,
          limit,
        },
        (status, geofences) => {
          callback(status, geofences);
          return;
        }
      );
    });
  }

  static searchGeofencesNear(
    {
      near,
      radius,
      tags,
      limit,
    },
    callback,
  ) {
    const queryParams = {
      near: `${near.latitude},${near.longitude}`,
      radius,
      tags: tags.join(','),
      limit: Math.min(limit, 100),
    };

    Http.request('GET', 'v1/search/geofences', queryParams,
      (status, response) => {
        callback(status, response ? response.geofences : null);
        return;
      }
    );
  }

  static autocomplete(
    {
      query,
      limit,
    },
    callback
  ) {
    Navigator.getCurrentPosition((status, { latitude, longitude }) => {
      if (status !== STATUS.SUCCESS) {
        callback(status);
        return;
      }

      this.autocompleteNear(
        {
          query,
          near: { latitude, longitude },
          limit,
        },
        (status, addresses) => {
          callback(status, addresses);
          return;
        }
      )
    });
  }

  static autocompleteNear(
    {
      query,
      near,
      limit,
    },
    callback
  ) {
    const queryParams = {
      query,
      near: `${near.latitude},${near.longitude}`,
      limit,
    };

    Http.request('GET', 'v1/search/autocomplete', queryParams,
      (status, response) => {
        callback(status, response ? response.addresses : null);
        return;
      }
    );
  }
}

export default Search;
