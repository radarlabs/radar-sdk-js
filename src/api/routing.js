import Http from '../http';
import Navigator from '../navigator';

class Routing {
  static async getDistanceToDestination(routingOptions={}) {
    if (!routingOptions.origin) {
      const { latitude, longitude } = await Navigator.getCurrentPosition();
      routingOptions.origin = { latitude, longitude };
    }

    let {
      origin,
      destination,
      modes,
      units,
      geometry,
      geometryPoints,
    } = routingOptions;

    origin = `${origin.latitude},${origin.longitude}`;

    if (destination) {
      destination = `${destination.latitude},${destination.longitude}`;
    }

    if (modes) {
      modes = modes.join(',');
    }

    const params = {
      origin,
      destination,
      modes,
      units,
      geometry,
      geometryPoints
    };

    return Http.request('GET', 'route/distance', params);
  }

  static async getMatrixDistances(routingOptions={}) {
    if (!routingOptions.origins) {
      const { latitude, longitude } = await Navigator.getCurrentPosition();
      routingOptions.origins = [{ latitude, longitude }];
    }

    let {
      origins,
      destinations,
      mode,
      units,
      geometry,
    } = routingOptions;

    origins = (origins || [])
      .map(origin => `${origin.latitude},${origin.longitude}`)
      .join('|');

    destinations = (destinations || [])
      .map(destination => `${destination.latitude},${destination.longitude}`)
      .join('|');

    const params = {
      origins,
      destinations,
      mode,
      units,
      geometry,
    };

    return Http.request('GET', 'route/matrix', params);
  }
}

export default Routing;
