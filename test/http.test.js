const { expect } = require('chai');
const sinon = require('sinon');

import  Cookie from '../src/cookie';
import SDK_VERSION from '../src/version';
import STATUS from '../src/status_codes';

import  Http from '../src/http';

describe('http', () => {
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
    it('should call callback with api response on success', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const httpCallback = sinon.spy();
      Http.request('PUT', 'v1/users/userId', {}, httpCallback);

      expect(request).to.not.be.null;
      request.respond(200, {}, '{"success":true}');

      expect(httpCallback).to.have.been.calledWith(STATUS.SUCCESS, { success: true });
    });

    it('should respond with unauthorized status', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const httpCallback = sinon.spy();
      Http.request('PUT', 'v1/users/userId', {}, httpCallback);

      expect(request).to.not.be.null;
      request.respond(401);

      expect(httpCallback).to.have.been.calledWith(STATUS.ERROR_UNAUTHORIZED);
    });

    it('should respond with rate limit error status', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const httpCallback = sinon.spy();
      Http.request('PUT', 'v1/users/userId', {}, httpCallback);

      expect(request).to.not.be.null;
      request.respond(429);

      expect(httpCallback).to.have.been.calledWith(STATUS.ERROR_RATE_LIMIT);
    });

    it('should respond with server error status on 500', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const httpCallback = sinon.spy();
      Http.request('PUT', 'v1/users/userId', {}, httpCallback);

      expect(request).to.not.be.null;
      request.respond(500);

      expect(httpCallback).to.have.been.calledWith(STATUS.ERROR_SERVER);
    });

    it('should respond with server error status on request error', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const httpCallback = sinon.spy();
      Http.request('PUT', 'v1/users/userId', {}, httpCallback);

      expect(request).to.not.be.null;
      request.onerror();

      expect(httpCallback).to.have.been.calledWith(STATUS.ERROR_SERVER);
    });

    it('should respond with network error status on timeout', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const httpCallback = sinon.spy();
      Http.request('PUT', 'v1/users/userId', {}, httpCallback);

      expect(request).to.not.be.null;
      request.timeout();

      expect(httpCallback).to.have.been.calledWith(STATUS.ERROR_NETWORK);
    });
  });

  context('GET request', () => {
    const data = { query: '20 Jay Street' };
    const getResponse = '{ "meta": { "code": 200 }, "addresses": [{ "latitude": 40.7039, "longitude": -73.9867 }] }';

    it('should return a publishable key error if not set', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(null);

      const httpCallback = sinon.spy();
      Http.request('GET', 'v1/geocode/forward', { query: '20 Jay Street' }, httpCallback);

      expect(httpCallback).to.be.calledWith(STATUS.ERROR_PUBLISHABLE_KEY);
    });

    it('should always include Device-Type and SDK-Version headers', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const httpCallback = sinon.spy();
      Http.request('GET', 'v1/geocode/ip', {}, httpCallback);

      expect(request).to.not.be.null;
      request.respond(200, {}, getResponse);

      expect(httpCallback).to.be.calledWith(STATUS.SUCCESS, JSON.parse(getResponse));

      expect(request.requestHeaders['X-Radar-Device-Type'], 'Web');
      expect(request.requestHeaders['X-Radar-SDK-Version'], SDK_VERSION);
    });

    it('should inject GET parameters into the url querystring', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const httpCallback = sinon.spy();
      Http.request('GET', 'v1/geocode/forward', data, httpCallback);

      expect(request).to.not.be.null;
      request.respond(200, {}, getResponse);

      expect(httpCallback).to.be.calledWith(STATUS.SUCCESS, JSON.parse(getResponse));

      const urlencodedData = encodeURIComponent(`query=${data.query}`);
      expect(request.url).to.contain(`?${urlencodedData}`);
    });

    it('should return a server error on invalid JSON', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const httpCallback = sinon.spy();
      Http.request('GET', 'v1/geocode/forward', { query: '20 Jay Street' }, httpCallback);

      const jsonErrorResponse = '"invalid_json": true}';
      expect(request).to.not.be.null;
      request.respond(200, {}, jsonErrorResponse);

      expect(httpCallback).to.be.calledWith(STATUS.ERROR_SERVER);
    });
  });
});
