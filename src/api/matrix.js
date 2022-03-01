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
      mode,
      units,
    } = routingOptions;

    origins = origins;
    mode = mode;

    if (destinations) {
      destinations = destinations;
    }

    const params = {
      origins,
      destinations,
      mode,
      units,
    };

    return Http.request('GET', 'v1/route/matrix', params);
  }
}

export default Matrix;
