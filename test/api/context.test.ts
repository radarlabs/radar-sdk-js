import { latitude, longitude } from '../common';

import Radar from '../../src';
import Http from '../../src/http';
import Navigator from '../../src/navigator';

import Context from '../../src/api/context';
import { RadarContextResponse } from '../../src/types';
import { mockRequest } from '../utils';

describe('Context', () => {
  const contextResponse = { meta: {}, context: {} };

  const validateResponse: RadarContextResponse = {
    location: { latitude, longitude, accuracy: 100 },
    geofences: undefined,
    place: undefined,
    country: undefined,
    state: undefined,
    dma: undefined,
    postalCode: undefined,
    response: contextResponse,
  };

  beforeEach(() => {
    Radar.initialize('prj_test_pk_123');
  });

  afterEach(() => {
    Radar.clear();
    jest.restoreAllMocks();
  });

  describe('getContext', () => {
    beforeEach(() => {
      jest.spyOn(Http, 'request');
    });

    describe('location permissions denied', () => {
      it('should throw a navigation error', async () => {
        jest.spyOn(Navigator, 'getCurrentPosition').mockRejectedValue('ERROR_PERMISSIONS');
        mockRequest(200, contextResponse);

        try {
          await Context.getContext({ latitude, longitude });
        } catch (err: any) {
          expect(err.toString()).toEqual('ERROR_PERMISSIONS');
          expect(Http.request).toHaveBeenCalledTimes(0);
        }
      });
    });

    describe('location permissions approved', () => {
      it('should return a context response', async () => {
        jest.spyOn(Navigator, 'getCurrentPosition').mockResolvedValue({ latitude, longitude, accuracy: 100 });
        mockRequest(200, contextResponse);

        // TODO(jasonl): replace as any with the proper typing after pr comment is resolved
        const response = await Context.getContext({} as any);
        expect(response).toEqual(validateResponse);

        expect(Http.request).toHaveBeenCalledTimes(1);
        expect(Navigator.getCurrentPosition).toHaveBeenCalledTimes(1);
      });
    });
  });
});
