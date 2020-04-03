import * as Http from '../http';
import Navigator from '../navigator';

// consts
import STATUS from '../status_codes';

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
    const queryParams = {
      origin: `${origin.latitude},${origin.longitude}`,
      destination: `${destination.latitude},${destination.longitude}`,
      modes: modes.join(','),
      units,
    };

    const path = `v1/route/distance`;
    const method = 'GET';

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

    Http.request(method, path, queryParams, onSuccess, onError);
  }
}

export default Routing;
