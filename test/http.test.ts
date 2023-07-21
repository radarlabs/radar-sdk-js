import Radar from '../src';
import Config from '../src/config';
import Http, { HttpMethod } from '../src/http';
import SDK_VERSION from '../src/version';
import { getRequest, mockNetworkError, mockRequest } from './utils';

import type MockXhrRequest from 'mock-xmlhttprequest/dist/types/MockXhrRequest';


describe('Http', () => {
  const publishableKey = 'prj_test_pk_123';

  const httpRequestParams = { method: 'PUT' as HttpMethod, path: 'users/userId', data: { valid: true, invalid: undefined } };
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
        const request: MockXhrRequest = getRequest();

        expect(request.requestHeaders.getHeader('X-Radar-Device-Type')).toEqual('Web');
        expect(request.requestHeaders.getHeader('X-Radar-SDK-Version')).toEqual(SDK_VERSION);

        expect(response.code).toEqual(200);
      });

      it('should filter out undefined values in data', async () => {
        mockRequest(200, successResponse);

        const response = await Http.request(httpRequestParams);
        const request: MockXhrRequest = getRequest();

        expect(request.body).toEqual('{"valid":true}');
        expect(response.code).toEqual(200);
      });
    });

    describe('error', () => {
      it('should return bad request error', async () => {
        mockRequest(400, { code: 400 });

        try {
          await Http.request(httpRequestParams);
        } catch (e: any) {
          expect(e.status).toEqual('ERROR_BAD_REQUEST');
        }
      });

      it('should return unauthorized error', async () => {
        mockRequest(401, { code: 401 });

        try {
          await Http.request(httpRequestParams);
        } catch (e: any) {
          expect(e.status).toEqual('ERROR_UNAUTHORIZED');
        }
      });

      it('should return payment required error', async () => {
        mockRequest(402, { code: 402 });

        try {
          await Http.request(httpRequestParams);
        } catch (e: any) {
          expect(e.status).toEqual('ERROR_PAYMENT_REQUIRED');
        }
      });

      it('should return forbidden error', async () => {
        mockRequest(403, { code: 403 });

        try {
          await Http.request(httpRequestParams);
        } catch (e: any) {
          expect(e.status).toEqual('ERROR_FORBIDDEN');
        }
      });

      it('should return not found error', async () => {
        mockRequest(404, { code: 404 });

        try {
          await Http.request(httpRequestParams);
        } catch (e: any) {
          expect(e.status).toEqual('ERROR_NOT_FOUND');
        }
      });

      it('should return rate limit error', async () => {
        mockRequest(429, { code: 429 });

        try {
          await Http.request(httpRequestParams);
        } catch (e: any) {
          expect(e.status).toEqual('ERROR_RATE_LIMIT');
        }
      });

      it('should return server error', async () => {
        mockRequest(500, { code: 500 });

        try {
          await Http.request(httpRequestParams);
        } catch (e: any) {
          expect(e.status).toEqual('ERROR_SERVER');
        }
      });

      it('should return unknown error', async () => {
        mockRequest(600, { code: 600 });

        try {
          await Http.request(httpRequestParams);
        } catch (e: any) {
          expect(e.status).toEqual('ERROR_UNKNOWN');
        }
      });

      it('should respond with server error status on request error', async () => {
        mockNetworkError();

        try {
          await Http.request(httpRequestParams);
        } catch (e: any) {
          expect(e.status).toEqual('ERROR_SERVER');
        }
      });

      // it('should respond with network error status on timeout', async () => {
      // TODO(jasonl): figure out how to mock timeout errors
      // });

      it('should return a server error on invalid JSON', async () => {
        const jsonErrorResponse = '"invalid_json": true}';
        mockRequest(200, jsonErrorResponse)

        try {
          await Http.request(httpRequestParams);
        } catch (e: any) {
          expect(e).toEqual('ERROR_SERVER');
        }
      });

      it('should return a publishable key error if not set', async () => {
        Config.clear();
        
        try {
          await Http.request({ method: 'PUT', path: 'users/userId', data: {} });
        } catch (e: any) {
          expect(e.status).toEqual('ERROR_PUBLISHABLE_KEY');
        }
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
      const request: MockXhrRequest = getRequest();

      const urlencodedData = `query=${encodeURIComponent(data.query)}`;
      expect(request.url).toContain(`?${urlencodedData}`);

      expect(response.code).toEqual(200);
    });

    it('should not append querystring of no params', async () => {
      mockRequest(200, successResponse);
      const response = await Http.request({ method: 'GET', path: 'geocode/forward', data: {} });
      const request: MockXhrRequest = getRequest();

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
      const request: MockXhrRequest = getRequest();

      expect(response.code).toEqual(200);
      expect(request.requestHeaders.getHeader('X-Radar-Device-Type')).toEqual('Web');
      expect(request.requestHeaders.getHeader('X-String')).toEqual('string');
      expect(request.requestHeaders.getHeader('X-Test')).toEqual('true');
    });
  });
});
