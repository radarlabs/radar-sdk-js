const { expect } = require('chai');
const sinon = require('sinon');

import SDK_VERSION from '../src/version';
import STATUS from '../src/status_codes';
import * as Http from '../src/http';

describe('http', () => {
  describe('request PUT', () => {

    let request;
    let successCallback;
    let errorCallback;

    beforeEach(() => {
      global.XMLHttpRequest = sinon.useFakeXMLHttpRequest();

      global.XMLHttpRequest.onCreate = (xhrRequest) => {
        request = xhrRequest;
      };

      successCallback = sinon.spy();
      errorCallback = sinon.spy();

      Http.request('PUT', 'https://api.radar.io/v1/users/userId', { 'Content-Type': 'application/json' }, { 'Authorization': 'api-key' }, successCallback, errorCallback);
    });

    afterEach(() => {
      global.XMLHttpRequest.restore();
    });

    context('success', () => {
      it('should call callback with api response', () => {
        expect(request).to.not.be.null;
        request.respond(200, {}, '{ success: "true" }');

        expect(successCallback).to.have.been.calledWith('{ success: "true" }');
        expect(errorCallback).to.not.have.been.called;
      });
    });

    context('unauthorized', () => {
      it('should respond with unauthorized status', () => {
        expect(request).to.not.be.null;
        request.respond(401);

        expect(errorCallback).to.have.been.calledWith(STATUS.ERROR_UNAUTHORIZED);
        expect(successCallback).to.not.have.been.called;
      });
    });

    context('rate limit error', () => {
      it('should respond with rate limit error status', () => {
        expect(request).to.not.be.null;
        request.respond(429);

        expect(errorCallback).to.have.been.calledWith(STATUS.ERROR_RATE_LIMIT);
        expect(successCallback).to.not.have.been.called;
      });
    });

    context('server error', () => {
      it('should respond with server error status', () => {
        expect(request).to.not.be.null;
        request.respond(500);

        expect(errorCallback).to.have.been.calledWith(STATUS.ERROR_SERVER);
        expect(successCallback).to.not.have.been.called;
      });
    });

    context('error', () => {
      it('should respond with server error status', () => {
        expect(request).to.not.be.null;
        request.onerror();

        expect(errorCallback).to.have.been.calledWith(STATUS.ERROR_SERVER);
        expect(successCallback).to.not.have.been.called;
      });
    });

    context('timeout', () => {
      it('should respond with network error status', () => {
        expect(request).to.not.be.null;
        request.timeout();

        expect(errorCallback).to.have.been.calledWith(STATUS.ERROR_NETWORK);
        expect(successCallback).to.not.have.been.called;
      });
    });
  });

  describe('request GET', () => {

    let request;
    let successCallback;
    let errorCallback;

    let data;
    let getResponse;

    beforeEach(() => {
      global.XMLHttpRequest = sinon.useFakeXMLHttpRequest();

      global.XMLHttpRequest.onCreate = (xhrRequest) => {
        request = xhrRequest;
      };

      successCallback = sinon.spy();
      errorCallback = sinon.spy();

      data = { query: '20 Jay Street' };
      getResponse = '{ meta: { code: 200 }, addresses: [{ latitude: 40.7039, longitude: -73.9867 }] }';

      Http.request('GET', 'https://api.radar.io/v1/geocode/forward', data, { 'Authorization': 'publishable-key' }, successCallback, errorCallback);
    });

    afterEach(() => {
      global.XMLHttpRequest.restore();
    });

    it('should always include Device-Type and SDK-Version headers', () => {
      expect(request).to.not.be.null;
      request.respond(200, {}, getResponse);

      expect(successCallback).to.be.calledWith(getResponse);
      expect(errorCallback).to.not.be.called;

      expect(request.requestHeaders['X-Radar-Device-Type'], 'Web');
      expect(request.requestHeaders['X-Radar-SDK-Version'], SDK_VERSION);
    });

    it('should inject GET parameters into the url querystring', () => {
      expect(request).to.not.be.null;
      request.respond(200, {}, getResponse);

      expect(successCallback).to.be.calledWith(getResponse);
      expect(errorCallback).to.not.be.called;

      const urlencodedData = encodeURIComponent(`query=${data.query}`);
      expect(request.url).to.contain(`?${urlencodedData}`);
    });
  });
});
