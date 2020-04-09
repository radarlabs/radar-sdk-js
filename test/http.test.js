const { expect } = require('chai');
const sinon = require('sinon');

import Cookie from '../src/cookie';
import SDK_VERSION from '../src/version';
import ERROR from '../src/error_codes';

import Http from '../src/http';

describe('Http', () => {
  let getCookieStub;

  let request;

  const publishableKey = 'mock-publishable-key';

  beforeEach(() => {
    global.XMLHttpRequest = sinon.useFakeXMLHttpRequest();

    global.XMLHttpRequest.onCreate = (xhrRequest) => {
      request = xhrRequest;
    };

    getCookieStub = sinon.stub(Cookie, 'getCookie');
  });

  afterEach(() => {
    global.XMLHttpRequest.restore();
    Cookie.getCookie.restore();
  });

  context('PUT request', () => {

    let httpRequest;

    beforeEach(() => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);
      httpRequest = Http.request('PUT', 'v1/users/userId', {});
    });

    it('should call callback with api response on success', async () => {
      setTimeout(() => {
        request.respond(200, {}, '{"success":true}');
      });

      const response = await httpRequest;

      expect(response).to.deep.equal({ success: true });
    });

    it('should respond with unauthorized status', async () => {
      setTimeout(() => {
        request.respond(401);
      });

      try {
        await httpRequest;
      } catch (e) {
        expect(e.message).to.equal(ERROR.UNAUTHORIZED);
      }
    });

    it('should respond with rate limit error status', async () => {
      setTimeout(() => {
        request.respond(429);
      });

      try {
        await httpRequest;
      } catch (e) {
        expect(e.message).to.equal(ERROR.RATE_LIMIT);
      }
    });

    it('should respond with server error status on 500', async () => {
      setTimeout(() => {
        request.respond(500);
      });

      try {
        await httpRequest;
      } catch (e) {
        expect(e.message).to.equal(ERROR.SERVER);
      }
    });

    it('should respond with server error status on request error', async () => {
      setTimeout(() => {
        request.onerror();
      });

      try {
        await httpRequest;
      } catch (e) {
        expect(e.message).to.equal(ERROR.SERVER);
      }
    });

    it('should respond with network error status on timeout', async () => {
      setTimeout(() => {
        request.timeout();
      });

      try {
        await httpRequest;
      } catch (e) {
        expect(e.message).to.equal(ERROR.NETWORK);
      }
    });
  });

  context('GET request', () => {
    const data = { query: '20 Jay Street' };
    const getResponse = '{ "meta": { "code": 200 }, "addresses": [{ "latitude": 40.7039, "longitude": -73.9867 }] }';

    it('should return a publishable key error if not set', async () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(null);

      try {
        await Http.request('GET', 'v1/geocode/forward', { query: '20 Jay Street' });
      } catch (e) {
        expect(e.message).to.equal(ERROR.PUBLISHABLE_KEY);
      }
    });

    it('should always include Device-Type and SDK-Version headers', async () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const httpRequest = Http.request('GET', 'v1/geocode/ip', {});

      setTimeout(() => {
        request.respond(200, {}, getResponse);
      });

      const response = await httpRequest;

      expect(request.requestHeaders['X-Radar-Device-Type'], 'Web');
      expect(request.requestHeaders['X-Radar-SDK-Version'], SDK_VERSION);

      expect(response.meta.code).to.equal(200);
    });

    it('should inject GET parameters into the url querystring', async () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const httpRequest = Http.request('GET', 'v1/geocode/forward', data);

      setTimeout(() => {
        request.respond(200, {}, getResponse);
      });

      const response = await httpRequest;

      const urlencodedData = encodeURIComponent(`query=${data.query}`);
      expect(request.url).to.contain(`?${urlencodedData}`);

      expect(response.meta.code).to.equal(200);
    });

    it('should return a server error on invalid JSON', async () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const httpRequest = Http.request('GET', 'v1/geocode/forward', { query: '20 Jay Street' });

      setTimeout(() => {
        const jsonErrorResponse = '"invalid_json": true}';
        request.respond(200, {}, jsonErrorResponse);
      });

      try {
        await httpRequest;
      } catch (e) {
        expect(e.message).to.equal(ERROR.SERVER);
      }
    });
  });
});
