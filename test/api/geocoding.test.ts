import { latitude, longitude } from '../common';

import Radar from '../../src';
import Config from '../../src/config';
import Http from '../../src/http';
import Navigator from '../../src/navigator';
import Geocoding from '../../src/api/geocoding';

import { getResponseWithDebug, mockRequest } from '../utils';

import type { RadarOptions } from '../../src/types';

describe('Geocoding', () => {
  const query = '841 Broadway';

  const baseValidateResponse = { address: {} };
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

  describe('forward geocode', () => {
    const forwardGeocodeResponse = { addresses: undefined };

    it('should return an address', async () => {
      mockRequest(200, baseValidateResponse);

      const response = await Geocoding.forwardGeocode({ query })

      const validateResponse = getResponseWithDebug(options.debug, forwardGeocodeResponse, baseValidateResponse);

      expect(response).toEqual(validateResponse);
    });
  });

  describe('reverseGeocode', () => {
    const reverseGeocodeResponse = { addresses: undefined };

    describe('location permissions denied', () => {
      it('should propagate the navigator error', async () => {
        navigatorSpy.mockRejectedValue('ERROR_PERMISSIONS');

        try {
          await Geocoding.reverseGeocode({});
        } catch (err: any) {
          expect(err).toEqual('ERROR_PERMISSIONS');
          expect(Http.request).toHaveBeenCalledTimes(0);
        }
      });
    });

    describe('location permissions approved', () => {
      it('should return a geocode response', async () => {
        navigatorSpy.mockResolvedValue({ latitude, longitude, accuracy: 100 });
        mockRequest(200, baseValidateResponse);

        const response = await Geocoding.reverseGeocode({});
        const validateResponse = getResponseWithDebug(options.debug, reverseGeocodeResponse, baseValidateResponse);

        expect(response).toEqual(validateResponse);
      });
    });
  });

  describe('ipGeocode', () => {
    const ipGeocodeResponse = { ip: undefined, proxy: undefined, ...baseValidateResponse, response: baseValidateResponse };

    it('should return a geocode response', async () => {
      mockRequest(200, baseValidateResponse);

      const response = await Geocoding.ipGeocode();
      expect(response).toEqual(ipGeocodeResponse);
    });
  });
});
