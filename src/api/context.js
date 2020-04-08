import Http from '../http';
import Navigator from '../navigator';

class Context {
  static async getContext(location={}) {
    if (!location.latitude || !location.longitude) {
      location = await Navigator.getCurrentPosition();
    }

    const { latitude, longitude } = location;

    const params = {
      coordinates: `${latitude},${longitude}`,
    };

    return Http.request('GET', `v1/context`, params);
  }
}

export default Context;
