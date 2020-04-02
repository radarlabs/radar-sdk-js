const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import * as Cookie from '../../src/cookie';
import * as Http from '../../src/http';
import STATUS from '../../src/status_codes';

import Geocoding from '../../src/api/geocoding';

describe('Geocoding', () => {
  let getCookieStub;

  const publishableKey = 'mock-publishable-key';

  const latitude = 40.7041895;
  const longitude = -73.9867797;

  const mockQuery = '20 Jay Street';

  beforeEach(() => {
    sinon.stub(Cookie, 'deleteCookie');
    sinon.stub(Cookie, 'setCookie');
    getCookieStub = sinon.stub(Cookie, 'getCookie');
  });

  afterEach(() => {
    Cookie.deleteCookie.restore();
    Cookie.setCookie.restore();
    Cookie.getCookie.restore();
  });

  context('geocode', () => {
    it('should return a publishable key error if not set', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(null);

      const geocodeCallback = sinon.spy();
      Geocoding.geocode({ query: mockQuery }, geocodeCallback);

      expect(geocodeCallback).to.be.calledWith(STATUS.ERROR_PUBLISHABLE_KEY);
    });

    it('should throw a server error if invalid JSON is returned in the response', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const jsonErrorResponse = '"invalid_json": true}';
      const httpRequestSpy = sinon.spy((method, url, body, headers, onSuccess, onError) => {
        onSuccess(jsonErrorResponse);
      });
      sinon.stub(Http, 'request').callsFake(httpRequestSpy);

      const geocodeCallback = sinon.spy();
      Geocoding.geocode({ query: mockQuery }, geocodeCallback);

      expect(geocodeCallback).to.be.calledWith(STATUS.ERROR_SERVER);

      Http.request.restore();
    });

    it('should return the error from the http request', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const httpRequestSpy = sinon.spy((method, url, body, headers, onSuccess, onError) => {
        onError('http error');
      });
      sinon.stub(Http, 'request').callsFake(httpRequestSpy);

      const geocodeCallback = sinon.spy();
      Geocoding.geocode({ query: mockQuery }, geocodeCallback);

      expect(geocodeCallback).to.be.calledWith('http error');

      Http.request.restore();
    });

    it('should succeed', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const jsonSuccessResponse = '{"addresses":["matching-addresses"]}';
      const httpRequestSpy = sinon.spy((method, url, body, headers, onSuccess, onError) => {
        onSuccess(jsonSuccessResponse);
      });
      sinon.stub(Http, 'request').callsFake(httpRequestSpy);

      const geocodeCallback = sinon.spy();
      Geocoding.geocode({ query: mockQuery }, geocodeCallback);

      const [method, url, body, headers] = httpRequestSpy.getCall(0).args;
      expect(method).to.equal('GET');
      expect(url).to.equal('https://api.radar.io/v1/geocode/forward');
      expect(headers).to.deep.equal({
        Authorization: publishableKey,
      });
      expect(body).to.deep.equal({
        query: mockQuery,
      });

      expect(geocodeCallback).to.be.calledWith(STATUS.SUCCESS, ['matching-addresses']);

      Http.request.restore();
    });
  });

  context('reverseGeocodeLocation', () => {
    it('should return a publishable key error if not set', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(null);

      const geocodeCallback = sinon.spy();
      Geocoding.reverseGeocodeLocation({ latitude, longitude }, geocodeCallback);

      expect(geocodeCallback).to.be.calledWith(STATUS.ERROR_PUBLISHABLE_KEY);
    });

    it('should throw a server error if invalid JSON is returned in the response', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const jsonErrorResponse = '"invalid_json": true}';
      const httpRequestSpy = sinon.spy((method, url, body, headers, onSuccess, onError) => {
        onSuccess(jsonErrorResponse);
      });
      sinon.stub(Http, 'request').callsFake(httpRequestSpy);

      const geocodeCallback = sinon.spy();
      Geocoding.reverseGeocodeLocation({ latitude, longitude }, geocodeCallback);

      expect(geocodeCallback).to.be.calledWith(STATUS.ERROR_SERVER);

      Http.request.restore();
    });

    it('should return the error from the http request', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const httpRequestSpy = sinon.spy((method, url, body, headers, onSuccess, onError) => {
        onError('http error');
      });
      sinon.stub(Http, 'request').callsFake(httpRequestSpy);

      const geocodeCallback = sinon.spy();
      Geocoding.reverseGeocodeLocation({ latitude, longitude }, geocodeCallback);

      expect(geocodeCallback).to.be.calledWith('http error');

      Http.request.restore();
    });

    it('should succeed', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const jsonSuccessResponse = '{"addresses":["matching-addresses"]}';
      const httpRequestSpy = sinon.spy((method, url, body, headers, onSuccess, onError) => {
        onSuccess(jsonSuccessResponse);
      });
      sinon.stub(Http, 'request').callsFake(httpRequestSpy);

      const geocodeCallback = sinon.spy();
      Geocoding.reverseGeocodeLocation({ latitude, longitude }, geocodeCallback);

      const [method, url, body, headers] = httpRequestSpy.getCall(0).args;
      expect(method).to.equal('GET');
      expect(url).to.equal('https://api.radar.io/v1/geocode/reverse');
      expect(headers).to.deep.equal({
        Authorization: publishableKey,
      });
      expect(body).to.deep.equal({
        coordinates: `${latitude},${longitude}`,
      });

      expect(geocodeCallback).to.be.calledWith(STATUS.SUCCESS, ['matching-addresses']);

      Http.request.restore();
    });
  });

  context('ipGeocode', () => {
    it('should return a publishable key error if not set', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(null);

      const geocodeCallback = sinon.spy();
      Geocoding.ipGeocode(geocodeCallback);

      expect(geocodeCallback).to.be.calledWith(STATUS.ERROR_PUBLISHABLE_KEY);
    });

    it('should throw a server error if invalid JSON is returned in the response', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const jsonErrorResponse = '"invalid_json": true}';
      const httpRequestSpy = sinon.spy((method, url, body, headers, onSuccess, onError) => {
        onSuccess(jsonErrorResponse);
      });
      sinon.stub(Http, 'request').callsFake(httpRequestSpy);

      const geocodeCallback = sinon.spy();
      Geocoding.ipGeocode(geocodeCallback);

      expect(geocodeCallback).to.be.calledWith(STATUS.ERROR_SERVER);

      Http.request.restore();
    });

    it('should return the error from the http request', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const httpRequestSpy = sinon.spy((method, url, body, headers, onSuccess, onError) => {
        onError('http error');
      });
      sinon.stub(Http, 'request').callsFake(httpRequestSpy);

      const geocodeCallback = sinon.spy();
      Geocoding.ipGeocode(geocodeCallback);

      expect(geocodeCallback).to.be.calledWith('http error');

      Http.request.restore();
    });

    it('should succeed', () =>{
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const jsonSuccessResponse = '{"country":"matching-country"}';
      const httpRequestSpy = sinon.spy((method, url, body, headers, onSuccess, onError) => {
        onSuccess(jsonSuccessResponse);
      });
      sinon.stub(Http, 'request').callsFake(httpRequestSpy);

      const geocodeCallback = sinon.spy();
      Geocoding.ipGeocode(geocodeCallback);

      const [method, url, body, headers] = httpRequestSpy.getCall(0).args;
      expect(method).to.equal('GET');
      expect(url).to.equal('https://api.radar.io/v1/geocode/ip');
      expect(headers).to.deep.equal({
        Authorization: publishableKey,
      });

      expect(geocodeCallback).to.be.calledWith(STATUS.SUCCESS, 'matching-country');

      Http.request.restore();
    });
  });
});
