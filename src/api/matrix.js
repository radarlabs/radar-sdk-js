import Http from '../http';
import Navigator from '../navigator';

class Matrix {
  static async getMatrixDistances(routingOptions={}) {
    if (!routingOptions.origins) {
      const { latitude, longitude } = await Navigator.getCurrentPosition();
      routingOptions.origins = { latitude, longitude };
    }

    let {
      origins,
      destinations,
      modes,
      units,
    } = routingOptions;

    origins = origins;

    if (destinations) {
      destinations = destinations;
    }
    if (modes) {
      modes = modes.join(',');
    }

    const params = {
      origins,
      destinations,
      modes,
      units,
    };

    return Http.request('GET', 'v1/route/matrix', params);
  }
}

export default Matrix;
