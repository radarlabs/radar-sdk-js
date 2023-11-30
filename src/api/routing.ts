import Config from '../config';
import Http from '../http';
import Navigator from '../navigator';

import type {
  RadarDistanceParams,
  RadarRouteResponse,
  RadarMatrixParams,
  RadarMatrixResponse,
} from '../types';

class RoutingAPI {
  static async distance(params: RadarDistanceParams): Promise<RadarRouteResponse> {
    const options = Config.get();

    let {
      origin,
      destination,
      modes,
      units,
      geometry,
      geometryPoints,
      avoid,
    } = params;

    // use browser location if "near" not provided
    if (!origin) {
      const { latitude, longitude } = await Navigator.getCurrentPosition();
      origin = `${latitude},${longitude}`;
    } else if (typeof origin !== 'string') { // origin is "Location" object
      const { latitude, longitude } = origin;
      origin = `${latitude},${longitude}`;
    }

    if (typeof destination !== 'string') {
      const { latitude, longitude } = destination;
      destination = `${latitude},${longitude}`;
    }

    if (Array.isArray(modes)) {
      modes = modes.join(',');
    }

    if (Array.isArray(avoid)) {
      avoid = avoid.join(',');
    }

    const response: any = await Http.request({
      method: 'GET',
      path: 'route/distance',
      data: {
        origin,
        destination,
        modes,
        units,
        geometry,
        geometryPoints,
        avoid,
      },
    });

    const distanceRes = {
      routes: response.routes,
    } as RadarRouteResponse;

    if (options.debug) {
      distanceRes.response = response;
    }

    return distanceRes;
  }

  static async matrix(params: RadarMatrixParams): Promise<RadarMatrixResponse> {
    const options = Config.get();

    let {
      origins,
      destinations,
      mode,
      units,
      avoid,
    } = params;

    // use browser location if "near" not provided
    if (!origins) {
      const { latitude, longitude } = await Navigator.getCurrentPosition();
      let originStrings = [];
      for (let i = 0; i < destinations.length; i++) {
        originStrings.push(`${latitude},${longitude}`);
      }
      origins = originStrings.join('|');
    } else if (Array.isArray(origins)) { // origin is a list of "Location" objects
      origins = origins.map((location) => `${location.latitude},${location.longitude}`).join('|');
    }

    // convert array to pipe-delimited string
    if (Array.isArray(destinations)) {
      destinations = destinations.map((location) => `${location.latitude},${location.longitude}`).join('|');
    }

    if (Array.isArray(avoid)) {
      avoid = avoid.join(',');
    }

    const response: any = await Http.request({
      method: 'GET',
      path: 'route/matrix',
      data: {
        origins,
        destinations,
        mode,
        units,
        avoid,
      },
    });

    const matrixRes = {
      origins: response.origins,
      destinations: response.destinations,
      matrix: response.matrix,
    } as RadarMatrixResponse;

    if (options.debug) {
      matrixRes.response = response;
    }

    return matrixRes;
  }
}

export default RoutingAPI;
