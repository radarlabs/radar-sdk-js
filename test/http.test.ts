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

      it('should resolve with an empty object on a 204 with no body', async () => {
        fetchMock.mockResponse(async (req) => {
          if (req.url.includes('/v1/config')) {
            return JSON.stringify({});
          }
          return { body: '', status: 204 };
        });

        const response = await Http.request({ method: 'POST', path: 'search/autocomplete/click' });

        expect(response).toEqual({});
      });

      it('should return the x-radar-request-id header when includeRequestId is set', async () => {
        fetchMock.mockResponse(async (req) => {
          if (req.url.includes('/v1/config')) {
            return JSON.stringify({});
          }
          return {
            body: JSON.stringify(successResponse),
            status: 200,
            headers: { 'x-radar-request-id': '01a01c2e-7512-704c-aa02-81253218d810' },
          };
        });

        const { data, requestId } = await Http.request({ ...httpRequestParams, includeRequestId: true });

        expect(requestId).toEqual('01a01c2e-7512-704c-aa02-81253218d810');
        expect(data.code).toEqual(200);
      });

      it('should not wrap the response when includeRequestId is not set', async () => {
        fetchMock.mockResponse(async (req) => {
          if (req.url.includes('/v1/config')) {
            return JSON.stringify({});
          }
          return {
            body: JSON.stringify(successResponse),
            status: 200,
            headers: { 'x-radar-request-id': '01a01c2e-7512-704c-aa02-81253218d810' },
          };
        });

        const response = await Http.request(httpRequestParams);

        expect(response).toEqual(successResponse);
      });

      it('should require includeRequestId to be the literal true, not a boolean', () => {
        // a call expression, not `const x: boolean = true` -- the latter is narrowed back to
        // the literal `true` by control-flow analysis and would not exercise anything
        const dynamicFlag = (): boolean => true;

        // compile-time assertion only -- never invoked. includeRequestId selects the return
        // shape, so it must be statically known: a boolean variable would leave the caller
        // statically holding the bare body while receiving { data, requestId } at runtime.
        // if the option type ever widens back to `boolean`, the unused @ts-expect-error
        // below becomes a compile error and this suite fails.
        const neverCalled = async () => {
          // @ts-expect-error includeRequestId must be `true`, not `boolean`
          await Http.request({ ...httpRequestParams, includeRequestId: dynamicFlag() });
        };

        expect(neverCalled).toBeInstanceOf(Function);
      });

      it('should pass keepalive through to fetch so requests survive page unload', async () => {
        mockRequest(200, successResponse);

        await Http.request({ ...httpRequestParams, keepalive: true });

        const calls = fetchMock.mock.calls;
        const lastCall = [...calls].reverse().find(([reqUrl]) => !String(reqUrl as string).includes('/v1/config'));

        expect(lastCall?.[1]?.keepalive).toBe(true);
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

      expect(request.url).toContain('?query=841%20Broadway');

      expect(response.code).toEqual(200);
    });

    it('should encode spaces as %20 (RFC 3986), NOT + (application/x-www-form-urlencoded)', async () => {
      mockRequest(200, successResponse);

      await Http.request({ method: 'GET', path: 'geocode/forward', data: { query: 'a b c' } });
      const request = getRequest();

      expect(request.url).toContain('?query=a%20b%20c');
      expect(request.url).not.toContain('+');
    });

    it('should preserve a literal + as %2B', async () => {
      mockRequest(200, successResponse);

      await Http.request({ method: 'GET', path: 'geocode/forward', data: { query: '1+1 = 2' } });
      const request = getRequest();

      expect(request.url).toContain('?query=1%2B1%20%3D%202');
    });

    it('should percent-encode reserved delimiters inside a value', async () => {
      mockRequest(200, successResponse);

      await Http.request({ method: 'GET', path: 'geocode/forward', data: { query: 'a&b=c#d?e/f' } });
      const request = getRequest();

      // & = # ? / inside a value must be encoded so they can't split the query
      expect(request.url).toContain('?query=a%26b%3Dc%23d%3Fe%2Ff');
    });

    it('should percent-encode a literal % as %25', async () => {
      mockRequest(200, successResponse);

      await Http.request({ method: 'GET', path: 'geocode/forward', data: { query: '50%' } });
      const request = getRequest();

      expect(request.url).toContain('?query=50%25');
    });

    it('should UTF-8 percent-encode non-ASCII characters', async () => {
      mockRequest(200, successResponse);

      await Http.request({ method: 'GET', path: 'geocode/forward', data: { query: 'café 北京' } });
      const request = getRequest();

      expect(request.url).toContain('?query=caf%C3%A9%20%E5%8C%97%E4%BA%AC');
    });

    it('should encode parameter names, not just values', async () => {
      mockRequest(200, successResponse);

      await Http.request({ method: 'GET', path: 'geocode/forward', data: { 'a b': 'x' } });
      const request = getRequest();

      expect(request.url).toContain('?a%20b=x');
    });

    it('should leave RFC 3986 unreserved characters unencoded', async () => {
      mockRequest(200, successResponse);

      await Http.request({ method: 'GET', path: 'geocode/forward', data: { query: 'Abc-9_.xZ' } });
      const request = getRequest();

      expect(request.url).toContain('?query=Abc-9_.xZ');
    });

    it('should separate multiple params with a literal & while encoding each value', async () => {
      mockRequest(200, successResponse);

      await Http.request({ method: 'GET', path: 'geocode/forward', data: { query: 'a b', near: '40.1,-74.2' } });
      const request = getRequest();

      expect(request.url).toContain('?query=a%20b&near=40.1%2C-74.2');
    });

    it('should over-encode ~ and leave * literal (both RFC 3986-valid)', async () => {
      mockRequest(200, successResponse);

      await Http.request({ method: 'GET', path: 'geocode/forward', data: { query: 'a~b*c' } });
      const request = getRequest();

      // URLSearchParams over-encodes the unreserved ~ (harmless) and keeps * literal
      expect(request.url).toContain('?query=a%7Eb*c');
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
