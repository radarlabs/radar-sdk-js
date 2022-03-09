import Http from '../http';
import Navigator from '../navigator';

class Matrix {
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
    };

    return Http.request('GET', 'v1/route/matrix', params);
  }
}

export default Matrix;
