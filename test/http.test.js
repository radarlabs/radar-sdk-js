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

  const successResponse = '{ "meta": { "code": 200 } }';

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

  context('http requests', () => {

    let httpRequest;

    beforeEach(() => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);
      httpRequest = Http.request('PUT', 'v1/users/userId', { valid: true, invalid: undefined });
    });

    describe('success', () => {
      it('should return api response on success', async () => {
        setTimeout(() => {
          request.respond(200, {}, successResponse);
        });

        const response = await httpRequest;

        expect(response.meta.code).to.equal(200);
      });

      it('should always include Device-Type and SDK-Version headers', async () => {
        setTimeout(() => {
          request.respond(200, {}, successResponse);
        });

        const response = await httpRequest;

        expect(request.requestHeaders['X-Radar-Device-Type'], 'Web');
        expect(request.requestHeaders['X-Radar-SDK-Version'], SDK_VERSION);

        expect(response.meta.code).to.equal(200);
      });

      it('should filter out undefined values in data', async () => {
        setTimeout(() => {
          request.respond(200, {}, successResponse);
        });

        await httpRequest;

        expect(request.requestBody).to.equal('{"valid":true}');
      });
    });

    describe('error', () => {
      it('should return api error', async () => {
        setTimeout(() => {
          request.respond(401, {}, '{"meta":{"code":401,"message":"unauthorized"}}');
        });

        const response = await httpRequest;

        expect(response.meta.code).to.equal(401);
        expect(response.meta.message).to.equal('unauthorized');
      });
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

    it('should return a publishable key error if not set', async () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(null);

      try {
        await Http.request('PUT', 'v1/users/userId', {});
      } catch (e) {
        expect(e.message).to.equal(ERROR.PUBLISHABLE_KEY);
      }
    });

    it('should return a server error on invalid JSON', async () => {
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

  context('GET request', () => {
    const data = { query: '20 Jay Street' };

    it('should inject GET parameters into the url querystring', async () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const httpRequest = Http.request('GET', 'v1/geocode/forward', data);

      setTimeout(() => {
        request.respond(200, {}, successResponse);
      });

      const response = await httpRequest;

      const urlencodedData = `query=${encodeURIComponent(data.query)}`;
      expect(request.url).to.contain(`?${urlencodedData}`);

      expect(response.meta.code).to.equal(200);
    });

    it('should not append querystring of no params', async () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const httpRequest = Http.request('GET', 'v1/geocode/forward', {});

      setTimeout(() => {
        request.respond(200, {}, successResponse);
      });

      const response = await httpRequest;

      expect(request.url).to.not.contain('?');
      expect(response.meta.code).to.equal(200);
    });
  });
});
