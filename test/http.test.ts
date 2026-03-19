import fetchMock from 'jest-fetch-mock';

import Radar from '../src';
import Config from '../src/config';
import Http from '../src/http';
import SDK_VERSION from '../src/version';
import { getRequest, mockNetworkError, mockRequest } from './utils';

describe('Http', () => {
  const publishableKey = 'prj_test_pk_123';

  const httpRequestParams = { method: 'PUT' as const, path: 'users/userId', data: { valid: true, invalid: undefined } };
  const successResponse = { code: 200 };

  describe('http requests', () => {
    beforeEach(() => {
      Radar.initialize(publishableKey);
    });

    afterEach(() => {
      Radar.clear();
    });

    describe('success', () => {
      it('should return api response on success', async () => {
        mockRequest(200, successResponse);

        const response = await Http.request(httpRequestParams);

        expect(response.code).toEqual(200);
      });

      it('should always include Device-Type and SDK-Version headers', async () => {
        mockRequest(200, successResponse);

        const response = await Http.request(httpRequestParams);
        const request = getRequest();

        expect(request.headers['X-Radar-Device-Type']).toEqual('Web');
        expect(request.headers['X-Radar-SDK-Version']).toEqual(SDK_VERSION);

        expect(response.code).toEqual(200);
      });

      it('should filter out undefined values in data', async () => {
        mockRequest(200, successResponse);

        const response = await Http.request(httpRequestParams);
        const request = getRequest();

        expect(request.body).toEqual('{"valid":true}');
        expect(response.code).toEqual(200);
      });
    });

    describe('error', () => {
      it('should return bad request error', async () => {
        mockRequest(400, { code: 400 });
        await expect(Http.request(httpRequestParams)).rejects.toHaveProperty('status', 'ERROR_BAD_REQUEST');
      });

      it('should return unauthorized error', async () => {
        mockRequest(401, { code: 401 });
        await expect(Http.request(httpRequestParams)).rejects.toHaveProperty('status', 'ERROR_UNAUTHORIZED');
      });

      it('should return payment required error', async () => {
        mockRequest(402, { code: 402 });
        await expect(Http.request(httpRequestParams)).rejects.toHaveProperty('status', 'ERROR_PAYMENT_REQUIRED');
      });

      it('should return forbidden error', async () => {
        mockRequest(403, { code: 403 });
        await expect(Http.request(httpRequestParams)).rejects.toHaveProperty('status', 'ERROR_FORBIDDEN');
      });

      it('should return not found error', async () => {
        mockRequest(404, { code: 404 });
        await expect(Http.request(httpRequestParams)).rejects.toHaveProperty('status', 'ERROR_NOT_FOUND');
      });

      it('should return rate limit error', async () => {
        mockRequest(429, { code: 429 });
        await expect(Http.request(httpRequestParams)).rejects.toHaveProperty('status', 'ERROR_RATE_LIMIT');
      });

      it('should return server error', async () => {
        mockRequest(500, { code: 500 });
        await expect(Http.request(httpRequestParams)).rejects.toHaveProperty('status', 'ERROR_SERVER');
      });

      it('should return unknown error', async () => {
        mockRequest(600, { code: 600 });
        await expect(Http.request(httpRequestParams)).rejects.toHaveProperty('status', 'ERROR_UNKNOWN');
      });

      it('should respond with network error status on request error', async () => {
        mockNetworkError();
        await expect(Http.request(httpRequestParams)).rejects.toHaveProperty('status', 'ERROR_NETWORK');
      });

      it('should return an unknown error on invalid JSON', async () => {
        fetchMock.mockResponseOnce(() => Promise.resolve({ body: '{invalid json', status: 200 }));
        await expect(Http.request(httpRequestParams)).rejects.toHaveProperty('status', 'ERROR_UNKNOWN');
      });

      it('should return a publishable key error if not set', async () => {
        Config.clear();
        await expect(Http.request({ method: 'PUT', path: 'users/userId', data: {} })).rejects.toHaveProperty(
          'status',
          'ERROR_PUBLISHABLE_KEY',
        );
      });
    });
  });

  describe('GET request', () => {
    const data = { query: '841 Broadway' };

    beforeEach(() => {
      Radar.initialize(publishableKey);
    });

    afterEach(() => {
      Radar.clear();
    });

    it('should inject GET parameters into the url querystring', async () => {
      mockRequest(200, successResponse);

      const response = await Http.request({ method: 'GET', path: 'geocode/forward', data });
      const request = getRequest();

      expect(request.url).toContain('?query=841+Broadway');

      expect(response.code).toEqual(200);
    });

    it('should not append querystring of no params', async () => {
      mockRequest(200, successResponse);
      const response = await Http.request({ method: 'GET', path: 'geocode/forward', data: {} });
      const request = getRequest();

      expect(request.url).not.toContain('?');
      expect(response.code).toEqual(200);
    });
  });

  describe('custom headers', () => {
    const data = { query: '841 Broadway' };
    const customHeaders = {
      'X-String': 'string',
      'X-Test': 'true',
    };

    beforeEach(() => {
      Radar.initialize(publishableKey, { getRequestHeaders: () => customHeaders });
    });

    afterEach(() => {
      Radar.clear();
    });

    it('should include headers in request', async () => {
      mockRequest(200, successResponse);

      const response = await Http.request({ method: 'GET', path: 'geocode/forward', data });
      const request = getRequest();

      expect(response.code).toEqual(200);
      expect(request.headers['X-Radar-Device-Type']).toEqual('Web');
      expect(request.headers['X-String']).toEqual('string');
      expect(request.headers['X-Test']).toEqual('true');
    });

    it('should allow per-request headers to override defaults', async () => {
      mockRequest(200, successResponse);

      await Http.request({ method: 'GET', path: 'geocode/forward', data, headers: { 'X-Radar-Device-Type': 'iOS' } });
      const request = getRequest();

      expect(request.headers['X-Radar-Device-Type']).toEqual('iOS');
    });
  });

  describe('authToken authentication', () => {
    const authToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.abc123';

    beforeEach(() => {
      Radar.initialize({ authToken });
    });

    afterEach(() => {
      Radar.clear();
    });

    it('should send Bearer authToken in Authorization header', async () => {
      mockRequest(200, successResponse);

      await Http.request(httpRequestParams);
      const request = getRequest();

      expect(request.headers['Authorization']).toEqual(`Bearer ${authToken}`);
    });

    it('should still include Device-Type and SDK-Version headers', async () => {
      mockRequest(200, successResponse);

      await Http.request(httpRequestParams);
      const request = getRequest();

      expect(request.headers['X-Radar-Device-Type']).toEqual('Web');
      expect(request.headers['X-Radar-SDK-Version']).toEqual(SDK_VERSION);
    });
  });

  describe('publishable key authentication (regression)', () => {
    beforeEach(() => {
      Radar.initialize(publishableKey);
    });

    afterEach(() => {
      Radar.clear();
    });

    it('should send raw publishable key in Authorization header', async () => {
      mockRequest(200, successResponse);

      await Http.request(httpRequestParams);
      const request = getRequest();

      expect(request.headers['Authorization']).toEqual(publishableKey);
    });
  });

  describe('no credential set', () => {
    beforeEach(() => {
      Config.clear();
    });

    it('should throw RadarPublishableKeyError', async () => {
      await expect(Http.request(httpRequestParams)).rejects.toMatchObject({
        status: 'ERROR_PUBLISHABLE_KEY',
        message: 'publishableKey or authToken not set.',
      });
    });
  });
});
