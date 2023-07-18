import { latitude, longitude } from '../common';

import Http from '../../src/http';
import Navigator from '../../src/navigator';

import Routing from '../../src/api/routing';
import Radar from '../../src';
import Config from '../../src/config';
import { RadarOptions, RadarTravelMode } from '../../src/types';
import { getResponseWithDebug, mockRequest } from '../utils';

describe('Routing', () => {
  const origin = {
    latitude,
    longitude,
    accuracy: 100
  }

  const destination = {
    latitude: 40.7032123,
    longitude: -73.9936137,
  };

  const modes: RadarTravelMode[] = ['foot', 'bike', 'car'];
  const units = 'imperial';

  const routingResponse = { meta: {}, routes: {} };

  const matrixMode = 'car';
  const matrixOrigin = {
    latitude: 40.70390,
    longitude: -73.98690,
    accuracy: 100
  };
  const matrixDestination = [
    { latitude: 40.70390, longitude: -73.98690 },
    { latitude: 40.73237, longitude: -73.94884 }
  ];
  const matrixResponse = { meta: {}, origins: {}, destinations: {}, matrix: {} };

  let options: RadarOptions = {};

  let httpSpy: jest.SpyInstance;
  let navigatorSpy: jest.SpyInstance;

  beforeEach(() => {
    Radar.initialize('prj_test_pk_123');
    options = Config.get();
    httpSpy = jest.spyOn(Http, 'request');
    navigatorSpy = jest.spyOn(Navigator, 'getCurrentPosition');
  });

  afterEach(() => {
    Radar.clear();
    httpSpy.mockRestore();
    navigatorSpy.mockRestore();
  });

  describe('getDistanceToDestination', () => {
    describe('location permissions denied', () => {
      it('should throw a navigation error', async () => {
        navigatorSpy.mockRejectedValue('ERROR_PERMISSIONS');

        try {
          const response = await Routing.distance({ destination, modes })
        } catch (err: any) {
          expect(err.toString()).toEqual('ERROR_PERMISSIONS');
          expect(Http.request).toHaveBeenCalledTimes(0);
        }
      });
    });

    describe('location permissions approved', () => {
      describe('no `origin` arg given', () => {
        it('should return a routing response', async () => {
          mockRequest(200, routingResponse);
          navigatorSpy.mockResolvedValue(origin);

          const response = await Routing.distance({ destination, modes });
          const validateResponse = getResponseWithDebug(options.debug, routingResponse, routingResponse);

          expect(response).toEqual(validateResponse);
        });
      });

      describe('all args given', () => {
        it('should return a routing response', async () => {
          mockRequest(200, routingResponse);

          const response = await Routing.distance({ origin, destination, modes, units })
          const validateResponse = getResponseWithDebug(options.debug, routingResponse, routingResponse);

          expect(response).toEqual(validateResponse);
        });
      });
    });
  });

  describe('getMatrixDistances', () => {
    describe('location permissions denied', () => {
      it('should throw a navigation error', async () => {
        navigatorSpy.mockRejectedValue('ERROR_PERMISSIONS');

        try {
          const response = await Routing.matrix({ destinations: matrixDestination, mode: matrixMode })
        } catch (err: any) {
          expect(err.toString()).toEqual('ERROR_PERMISSIONS');
          expect(Http.request).toHaveBeenCalledTimes(0);
        }
      });
    });

    describe('location permissions approved', () => {
      describe('no `origins` arg given', () => {
        it('should return a routing response', async () => {
          mockRequest(200, matrixResponse);
          navigatorSpy.mockResolvedValue(matrixOrigin);

          const response = await Routing.matrix({ destinations: matrixDestination, mode: matrixMode })
          const validateReponse = getResponseWithDebug(options.debug, matrixResponse, matrixResponse)

          expect(response).toEqual(validateReponse);
        });
      });

      describe('all args given', () => {
        it('should return a routing response', async () => {
          mockRequest(200, matrixResponse);

          const response = await Routing.matrix({ origins: [matrixOrigin], destinations: matrixDestination, mode: matrixMode, units })
          const validateReponse = getResponseWithDebug(options.debug, matrixResponse, matrixResponse)

          expect(response).toEqual(validateReponse);
        });
      });
    });
  });
});
