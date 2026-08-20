import fetchMock from 'jest-fetch-mock';

import Radar from '../../src';
import Search from '../../src/api/search';
import Config from '../../src/config';
import Http from '../../src/http';
import Navigator from '../../src/navigator';
import { latitude, longitude } from '../common';
import { getRequest, getResponseWithDebug, mockRequest } from '../utils';

import type { RadarGeocodeLayer, RadarOptions } from '../../src/types';

describe('Search', () => {
  const radius = 100;
  const chains = ['dunkin', 'sbucks'];
  const categories = ['coffee-shop'];
  const groups = ['airport'];
  const tags = ['geofence-tag'];
  const metadata = { 'geofence-metadata-key': 'geofence-metadata-value' };
  const layers: RadarGeocodeLayer[] = ['address'];
  const countryCode = 'US';
  const limit = 50;
  const query = 'mock-query';

  const placesResponse = { meta: {}, places: {} };
  const geofencesResponse = { meta: {}, geofences: {} };
  const autocompleteResponse = { meta: {}, addresses: {} };

  let options: RadarOptions = {};

  beforeEach(() => {
    Radar.initialize('prj_test_pk_123');
    options = Config.get();
  });

  afterEach(() => {
    Radar.clear();
    jest.restoreAllMocks();
  });

  describe('searchPlaces', () => {
    describe('location permissions denied', () => {
      it('should propagate the navigator error', async () => {
        jest.spyOn(Http, 'request');
        jest.spyOn(Navigator, 'getCurrentPosition').mockRejectedValue('ERROR_PERMISSIONS');

        let err;
        try {
          await Search.searchPlaces({});
        } catch (caught: any) {
          err = caught;
        } finally {
          expect(err).toBeDefined();
          expect(err.toString()).toEqual('ERROR_PERMISSIONS');
          expect(Http.request).toHaveBeenCalledTimes(0);
        }
      });
    });

    describe('location permissions approved', () => {
      it('should return a placeSearch response', async () => {
        mockRequest(200, placesResponse);
        jest.spyOn(Navigator, 'getCurrentPosition').mockResolvedValue({ latitude, longitude, accuracy: 100 });

        const response = await Search.searchPlaces({});
        const validateResponse = getResponseWithDebug(options.debug, placesResponse, placesResponse);
        expect(response).toEqual(validateResponse);
      });
    });

    describe('location is given', () => {
      it('should return a placeSearch response', async () => {
        mockRequest(200, placesResponse);

        const near = { latitude, longitude };

        const response = await Search.searchPlaces({ near, radius, chains, categories, groups, limit });
        const validateResponse = getResponseWithDebug(options.debug, placesResponse, placesResponse);
        expect(response).toEqual(validateResponse);
      });
    });
  });

  describe('searchGeofences', () => {
    describe('location permissions denied', () => {
      it('should propagate the navigator error', async () => {
        jest.spyOn(Navigator, 'getCurrentPosition').mockRejectedValue('ERROR_PERMISSIONS');
        jest.spyOn(Http, 'request');

        let err;
        try {
          await Search.searchGeofences({});
        } catch (caught: any) {
          err = caught;
        } finally {
          expect(err.toString()).toEqual('ERROR_PERMISSIONS');
          expect(Http.request).toHaveBeenCalledTimes(0);
        }
      });
    });

    describe('location permissions approved', () => {
      it('should return a geofenceSearch response', async () => {
        mockRequest(200, geofencesResponse);
        jest.spyOn(Navigator, 'getCurrentPosition').mockResolvedValue({ latitude, longitude, accuracy: 100 });

        const response = await Search.searchGeofences({});
        const validateResponse = getResponseWithDebug(options.debug, geofencesResponse, geofencesResponse);
        expect(response).toEqual(validateResponse);
      });
    });

    describe('location is given', () => {
      it('should return a geofenceSearch response', async () => {
        mockRequest(200, geofencesResponse);

        const near = { latitude, longitude };

        const response = await Search.searchGeofences({ near, radius, tags, metadata, limit });
        const validateResponse = getResponseWithDebug(options.debug, geofencesResponse, geofencesResponse);

        expect(response).toEqual(validateResponse);
      });
    });
  });

  describe('autocomplete', () => {
    describe('params are not provided', () => {
      it('should have undefined params and return an autocomplete response', async () => {
        mockRequest(200, autocompleteResponse);
        jest.spyOn(Http, 'request');

        const response = await Search.autocomplete({ query });
        const validateResponse = getResponseWithDebug(options.debug, autocompleteResponse, autocompleteResponse);

        expect(Http.request).toHaveBeenCalledWith({
          method: 'GET',
          path: 'search/autocomplete',
          includeRequestId: true,
          data: {
            query: 'mock-query',
            near: undefined,
            limit: undefined,
            layers: undefined,
            country: undefined,
            countryCode: undefined,
            expandUnits: undefined,
          },
        });
        expect(response).toEqual(validateResponse);
      });
    });

    describe('session tracking', () => {
      it('should pass sessionToken through to the autocomplete request', async () => {
        mockRequest(200, autocompleteResponse);

        await Search.autocomplete({ query, sessionToken: 'ffbcb2ca-1d1c-4f96-9b91-fd0b0b0e1b7f' });

        expect(getRequest().url).toContain('sessionToken=ffbcb2ca-1d1c-4f96-9b91-fd0b0b0e1b7f');
      });

      it('should return the originating x-radar-request-id on the response', async () => {
        fetchMock.mockResponse(async (req) => {
          if (req.url.includes('/v1/config')) {
            return JSON.stringify({});
          }
          return {
            body: JSON.stringify(autocompleteResponse),
            status: 200,
            headers: { 'x-radar-request-id': '01a01c2e-7512-704c-aa02-81253218d810' },
          };
        });

        const response = await Search.autocomplete({ query });

        expect(response.requestId).toEqual('01a01c2e-7512-704c-aa02-81253218d810');
      });
    });

    describe('params are provided', () => {
      it('should return an autocomplete response', async () => {
        mockRequest(200, autocompleteResponse);
        jest.spyOn(Http, 'request');

        const near = { latitude, longitude };

        const response = await Search.autocomplete({ near, query, limit, layers, countryCode });
        const validateResponse = getResponseWithDebug(options.debug, autocompleteResponse, autocompleteResponse);

        expect(Http.request).toHaveBeenCalledWith({
          method: 'GET',
          path: 'search/autocomplete',
          includeRequestId: true,
          data: {
            query: 'mock-query',
            near: `${latitude},${longitude}`,
            limit: 50,
            layers: ['address'],
            countryCode,
            country: undefined,
            expandUnits: undefined,
          },
        });
        expect(response).toEqual(validateResponse);
      });

      it('should return an autocomplete response, with expandUnits', async () => {
        mockRequest(200, autocompleteResponse);
        jest.spyOn(Http, 'request');

        const near = { latitude, longitude };
        const expandUnits = true;

        const response = await Search.autocomplete({ near, query, limit, layers, countryCode, expandUnits });
        const validateResponse = getResponseWithDebug(options.debug, autocompleteResponse, autocompleteResponse);

        expect(Http.request).toHaveBeenCalledWith({
          method: 'GET',
          path: 'search/autocomplete',
          includeRequestId: true,
          data: {
            query: 'mock-query',
            near: `${latitude},${longitude}`,
            limit: 50,
            layers: ['address'],
            countryCode,
            country: undefined,
            expandUnits: true,
          },
        });
        expect(response).toEqual(validateResponse);
      });
    });
  });
  describe('autocompleteClick', () => {
    const sessionToken = 'ffbcb2ca-1d1c-4f96-9b91-fd0b0b0e1b7f';
    const requestId = '01a01c2e-7512-704c-aa02-81253218d810';

    it('should POST the session, request id, and result index', async () => {
      mockRequest(204, '');

      await Search.autocompleteClick({ sessionToken, requestId, idx: 2 });

      const request = getRequest();
      expect(request.method).toEqual('POST');
      expect(request.url).toContain('/v1/search/autocomplete/click');
      expect(JSON.parse(request.body!)).toEqual({ sessionToken, requestId, idx: 2 });
    });

    it('should send the click with keepalive so it survives page navigation', async () => {
      mockRequest(204, '');

      await Search.autocompleteClick({ sessionToken, requestId, idx: 0 });

      const lastCall = [...fetchMock.mock.calls]
        .reverse()
        .find(([url]) => String(url as string).includes('/autocomplete/click'));
      expect(lastCall?.[1]?.keepalive).toBe(true);
    });

    it('should resolve without throwing when the session is unknown or expired', async () => {
      mockRequest(400, { meta: { code: 400 } });

      await expect(Search.autocompleteClick({ sessionToken, requestId, idx: 0 })).resolves.toBeUndefined();
    });

    it('should resolve without throwing on a network error', async () => {
      fetchMock.mockReject(new TypeError('Network error'));

      await expect(Search.autocompleteClick({ sessionToken, requestId, idx: 0 })).resolves.toBeUndefined();
    });
  });
});
