import * as Cookie from './cookie';
import * as Http from './http';
import Navigator from './navigator';

// consts
import STATUS from './status_codes';

const DEFAULT_HOST = 'https://api.radar.io';

class Routing {
  static getDistanceToDestination(
    {
      destination,
      modes,
      units,
    },
    callback
  ) {
    Navigator.getCurrentPosition((status, { latitude, longitude }) => {
      if (status !== STATUS.SUCCESS) {
        callback(status);
        return;
      }

      this.getDistanceWithOrigin(
        {
          origin: {
            latitude,
            longitude,
          },
          destination,
          modes,
          units,
        },
        (status, routes) => {
          callback(status, routes);
          return;
        },
      );
    });
  }

  static getDistanceWithOrigin(
    {
      origin,
      destination,
      modes,
      units,
    },
    callback
  ) {
    const publishableKey = Cookie.getCookie(Cookie.PUBLISHABLE_KEY);

    if (!publishableKey) {
      callback(STATUS.ERROR_PUBLISHABLE_KEY);

      return;
    }

    const queryParams = {
      origin: `${origin.latitude},${origin.longitude}`,
      destination: `${destination.latitude},${destination.longitude}`,
      modes: modes.join(','),
      units,
    };

    const host = Cookie.getCookie(Cookie.HOST) || DEFAULT_HOST;
    const url = `${host}/v1/route/distance`;
    const method = 'GET';
    const headers = {
      Authorization: publishableKey,
    };

    const onSuccess = (response) => {
      try {
        response = JSON.parse(response);

        callback(STATUS.SUCCESS, response.routes);
      } catch (e) {
        callback(STATUS.ERROR_SERVER);
      }
    }

    const onError = (error) => {
      callback(error);
    };

    Http.request(method, url, queryParams, headers, onSuccess, onError);
  }
}

export default Routing;
