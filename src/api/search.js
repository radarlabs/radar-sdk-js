import * as Cookie from '../cookie';
import * as Http from '../http';
import Navigator from '../navigator';

// consts
import STATUS from '../status_codes';

const DEFAULT_HOST = 'https://api.radar.io';

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

    const host = Cookie.getCookie(Cookie.HOST) || DEFAULT_HOST;
    const url = `${host}/v1/search/places`;
    const method = 'GET';

    const onSuccess = (response) => {
      try {
        response = JSON.parse(response);

        callback(STATUS.SUCCESS, response.places);
      } catch (e) {
        callback(STATUS.ERROR_SERVER);
      }
    };

    const onError = (error) => {
      callback(error);
    };

    Http.request(method, url, queryParams, onSuccess, onError);
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

    const host = Cookie.getCookie(Cookie.HOST) || DEFAULT_HOST;
    const url = `${host}/v1/search/geofences`;
    const method = 'GET';

    const onSuccess = (response) => {
      try {
        response = JSON.parse(response);

        if (callback) {
          callback(STATUS.SUCCESS, response.geofences);
        }
      } catch (e) {
        if (callback) {
          callback(STATUS.ERROR_SERVER);
        }
      }
    };

    const onError = (error) => {
      if (callback) {
        callback(error);
      }
    };

    Http.request(method, url, queryParams, onSuccess, onError);
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

    const host = Cookie.getCookie(Cookie.HOST) || DEFAULT_HOST;
    const url = `${host}/v1/search/autocomplete`;
    const method = 'GET';

    const onSuccess = (response) => {
      try {
        response = JSON.parse(response);

        if (callback) {
          callback(STATUS.SUCCESS, response.addresses);
        }
      } catch (e) {
        if (callback) {
          callback(STATUS.ERROR_SERVER);
        }
      }
    }

    const onError = (error) => {
      if (callback) {
        callback(error);
      }
    };

    Http.request(method, url, queryParams, onSuccess, onError);
  }
}

export default Search;
