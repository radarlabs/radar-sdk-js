import Http from '../../src/http';
import Navigator from '../../src/navigator';

import Search from '../../src/api/search';

import { latitude, longitude } from '../common';
import Radar from '../../src';
import Config from '../../src/config';
import { RadarGeocodeLayer, RadarOptions } from '../../src/types';
import { getResponseWithDebug, mockRequest } from '../utils';

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

  describe('searchPlaces', () => {
    describe('location permissions denied', () => {
      it('should propagate the navigator error', async () => {
        navigatorSpy.mockRejectedValue('ERROR_PERMISSIONS');

        try {
          await Search.searchPlaces({});
        } catch (err: any) {
          expect(err.toString()).toEqual('ERROR_PERMISSIONS');
          expect(Http.request).toHaveBeenCalledTimes(0);
        }
      });
    });

    describe('location permissions approved', () => {
      it('should return a placeSearch response', async () => {
        mockRequest(200, placesResponse);
        navigatorSpy.mockResolvedValue({ latitude, longitude, accuracy: 100 });

        const response = await Search.searchPlaces({});
        const validateResponse = getResponseWithDebug(options.debug, placesResponse, placesResponse);
        expect(response).toEqual(validateResponse);
      });
    });

    describe('location is given', () => {
      it('should return a placeSearch response', async () => {
        mockRequest(200, placesResponse);

        const near = { latitude, longitude };

        const response = await Search.searchPlaces({ near, radius, chains, categories, groups, limit })
        const validateResponse = getResponseWithDebug(options.debug, placesResponse, placesResponse);
        expect(response).toEqual(validateResponse);
      });
    });
  });

  describe('searchGeofences', () => {
    describe('location permissions denied', () => {
      it('should propagate the navigator error', async () => {
        navigatorSpy.mockRejectedValue('ERROR_PERMISSIONS');

        try {
          await Search.searchGeofences({});
        } catch (err: any) {
          expect(err.toString()).toEqual('ERROR_PERMISSIONS');
          expect(Http.request).toHaveBeenCalledTimes(0);
        }
      });
    });

    describe('location permissions approved', () => {
      it('should return a geofenceSearch response', async () => {
        mockRequest(200, geofencesResponse);
        navigatorSpy.mockResolvedValue({ latitude, longitude, accuracy: 100 });

        const response = await Search.searchGeofences({});
        const validateResponse = getResponseWithDebug(options.debug, geofencesResponse, geofencesResponse);
        expect(response).toEqual(validateResponse);
      });
    });

    describe('location is given', () => {
      it('should return a geofenceSearch response', async () => {
        mockRequest(200, geofencesResponse);

        const near = { latitude, longitude };

        const response = await Search.searchGeofences({ near, radius, tags, metadata, limit })
        const validateResponse = getResponseWithDebug(options.debug, geofencesResponse, geofencesResponse);

        expect(response).toEqual(validateResponse);
      });
    });
  });

  describe('autocomplete', () => {
    describe('params are not provided', () => {
      it('should have undefined params and return an autocomplete response', async () => {
        mockRequest(200, autocompleteResponse);

        const response = await Search.autocomplete({ query })
        const validateResponse = getResponseWithDebug(options.debug, autocompleteResponse, autocompleteResponse);

        expect(Http.request).toHaveBeenCalledWith({ method: 'GET', path: 'search/autocomplete', data: { query: 'mock-query', near: undefined, limit: undefined, layers: undefined, country: undefined, countryCode: undefined, expandUnits: undefined } });
        expect(response).toEqual(validateResponse);
      });
    });

    describe('params are provided', () => {
      it('should return an autocomplete response', async () => {
        mockRequest(200, autocompleteResponse);

        const near = { latitude, longitude };

        const response = await Search.autocomplete({ near, query, limit, layers, countryCode })
        const validateResponse = getResponseWithDebug(options.debug, autocompleteResponse, autocompleteResponse);

        expect(Http.request).toHaveBeenCalledWith({ method: 'GET', path: 'search/autocomplete', data: { query: 'mock-query', near: `${latitude},${longitude}`, limit: 50, layers: ['address'], countryCode, country: undefined, expandUnits: undefined } });
        expect(response).toEqual(validateResponse);
      });

      it('should return an autocomplete response, with expandUnits', async () => {
        mockRequest(200, autocompleteResponse);

        const near = { latitude, longitude };
        const expandUnits = true;

        const response = await Search.autocomplete({ near, query, limit, layers, countryCode, expandUnits })
        const validateResponse = getResponseWithDebug(options.debug, autocompleteResponse, autocompleteResponse);

        expect(Http.request).toHaveBeenCalledWith({ method: 'GET', path: 'search/autocomplete', data: { query: 'mock-query', near: `${latitude},${longitude}`, limit: 50, layers: ['address'], countryCode, country: undefined, expandUnits: true } });
        expect(response).toEqual(validateResponse);
      });
    });
  });
});
