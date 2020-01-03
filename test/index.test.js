const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import * as Cookie from '../src/cookie';
import * as Device from '../src/device';
import * as Http from '../src/http';
import Radar from '../src/index';

import PLACES_PROVIDER from '../src/places_providers';
import SDK_VERSION from '../src/version';
import STATUS from '../src/status_codes';

describe('Radar', () => {
  let getCookieStub;

  beforeEach(() => {
    sinon.stub(Cookie, 'deleteCookie');
    sinon.stub(Cookie, 'setCookie');
    getCookieStub = sinon.stub(Cookie, 'getCookie');
  });

  afterEach(() => {
    Cookie.deleteCookie.restore();
    Cookie.getCookie.restore();
    Cookie.setCookie.restore();
  });

  describe('VERSION', () => {
    it('should return sdk version', () => {
      expect(Radar.VERSION).to.eq(SDK_VERSION);
    });
  });

  describe('PLACES_PROVIDER', () => {
    it('should return places providers object', () => {
      expect(Radar.PLACES_PROVIDER).to.eql(PLACES_PROVIDER);
    });
  });

  describe('STATUS', () => {
    it('should return the list of possible status codes', () => {
      expect(Radar.STATUS).to.eql(STATUS);
    });
  });

  describe('initialize', () => {
    context('no publishable key given', () => {
      before(() => {
        sinon.stub(console, 'error');
      });

      after(() => {
        console.error.restore();
      });

      it('should print a warning to the console', () => {
        Radar.initialize();
        expect(console.error).to.be.calledWith('Radar "initialize" was called without a publishable key');
      });
    });

    context('called with publishable key', () => {
      const publishableKey = 'test-key';

      it('should save publishable key to cookie', () => {
        Radar.initialize(publishableKey);
        expect(Cookie.setCookie).to.have.been.calledWith(Cookie.PUBLISHABLE_KEY, publishableKey);
      });
    });
  });

  describe('setHost', () => {
    it('should save the host to cookie', () => {
      const host = 'http://fakehost.com';
      Radar.setHost(host);
      expect(Cookie.setCookie).to.have.been.calledWith(Cookie.HOST, host);
    });
  });

  describe('setPlacesProvider', () => {
    it('should save provider to cookie', () => {
      const provider = 'facebook';
      Radar.setPlacesProvider(provider);
      expect(Cookie.setCookie).to.have.been.calledWith(Cookie.PLACES_PROVIDER, provider);
    });

    it('should set provider to "none" if argument does NOT equal "facebook"', () => {
      Radar.setPlacesProvider("other");
      expect(Cookie.setCookie).to.have.been.calledWith(Cookie.PLACES_PROVIDER, "none");
    });
  });

  describe('setUserId', () => {
    context('no userId given', () => {
      it('should delete userId from cookie', () => {
        Radar.setUserId();
        expect(Cookie.deleteCookie).to.have.been.calledWith(Cookie.USER_ID);
      });
    });

    context('userId invalid', () => {
      describe('userId length is 0', () => {
        it('should delete userId from cookie', () => {
          Radar.setUserId("");
          expect(Cookie.deleteCookie).to.have.been.calledWith(Cookie.USER_ID);
        });
      });

      describe('userId length is > 256', () => {
        it('should delete userId from cookie', () => {
          // generate string of 257 chars
          const userId = [...Array(257)].map(() => 'x').join('');
          Radar.setUserId(userId);
          expect(Cookie.deleteCookie).to.have.been.calledWith(Cookie.USER_ID);
        });
      });
    });

    context('userId given', () => {
      it('should save userId in cookie', () => {
        const userId = 'abc123';
        Radar.setUserId(userId);
        expect(Cookie.setCookie).to.have.been.calledWith(Cookie.USER_ID, userId);
      });
    });
  });

  describe('setDescription', () => {
    context('no description given', () => {
      it('should delete description from cookie', () => {
        Radar.setDescription();
        expect(Cookie.deleteCookie).to.have.been.calledWith(Cookie.DESCRIPTION);
      });
    });

    context('description invalid', () => {
      describe('description length is 0', () => {
        it('should delete description from cookie', () => {
          Radar.setDescription("");
          expect(Cookie.deleteCookie).to.have.been.calledWith(Cookie.DESCRIPTION);
        });
      });

      describe('description length is > 256', () => {
        it('should delete description from cookie', () => {
          // generate string of 257 chars
          const description = [...Array(257)].map(() => 'x').join('');
          Radar.setDescription(description);
          expect(Cookie.deleteCookie).to.have.been.calledWith(Cookie.DESCRIPTION);
        });
      });
    });

    context('description given', () => {
      it('should save description in cookie', () => {
        const description = 'abc123';
        Radar.setDescription(description);
        expect(Cookie.setCookie).to.have.been.calledWith(Cookie.DESCRIPTION, description);
      });
    });
  });

  describe('trackOnce', () => {
    const publishableKey = 'publishable-key';
    const userId = 'user-id';
    const placesProvider = 'facebook';
    const description = 'description';
    const deviceId = 'device-id';

    const latitude = 40.7041895;
    const longitude = -73.9867797;
    const accuracy = 1;
    const position = {
      coords: { accuracy, latitude, longitude },
    };

    let jsonResponse;
    let httpRequestSpy;
    beforeEach(() => {
      jsonResponse = '{"user":"user-data","events":"matching-events"}';
      httpRequestSpy = sinon.spy((method, url, body, headers, onSuccess) => {
        onSuccess(jsonResponse);
      });
    });

    context('publishable key NOT set', () => {
      beforeEach(() => {
        getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(null);
      });

      it('calls callback with ERROR_PUBLISHABLE_KEY', () => {
        const callback = sinon.spy();
        Radar.trackOnce(callback);
        expect(callback).to.have.been.calledWith(STATUS.ERROR_PUBLISHABLE_KEY);
      });
    });

    context('should succeed', () => {
      beforeEach(() => {
        getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);
        getCookieStub.withArgs(Cookie.USER_ID).returns(userId);
        getCookieStub.withArgs(Cookie.PLACES_PROVIDER).returns(placesProvider);
        getCookieStub.withArgs(Cookie.DESCRIPTION).returns(description);
        sinon.stub(Device, 'getId').returns(deviceId);

        const geolocation = {
          getCurrentPosition: (onSuccess) => { onSuccess(position); },
        };

        global.navigator = { geolocation };

        sinon.stub(Http, 'request').callsFake(httpRequestSpy);
      });

      afterEach(() => {
        Device.getId.restore();
        Http.request.restore();
        global.navigator = undefined;
      });

      it('should make http request to api, and call the callback with data', () => {
        const callback = sinon.spy();

        Radar.trackOnce(callback);

        const [method, url, body, headers] = httpRequestSpy.getCall(0).args;
        expect(method).to.equal('PUT');
        expect(url).to.equal('https://api.radar.io/v1/users/user-id');
        expect(headers).to.deep.equal({
          Authorization: publishableKey
        });
        expect(body).to.deep.equal({
          accuracy,
          description,
          deviceId,
          deviceType: 'Web',
          foreground: true,
          latitude,
          longitude,
          placesProvider,
          sdkVersion: SDK_VERSION,
          stopped: true,
          userAgent: undefined,
          userId,
        });

        expect(callback).to.have.been.calledWith(STATUS.SUCCESS, position.coords, 'user-data', 'matching-events');
      });
    });

    context('invalid JSON in success response', () => {
      beforeEach(() => {
        getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

        const geolocation = {
          getCurrentPosition: (onSuccess) => { onSuccess(position); },
        };

        global.navigator = { geolocation };

        jsonResponse = '"invalid_json": true}';
        sinon.stub(Http, 'request').callsFake(httpRequestSpy);
      });

      afterEach(() => {
        Http.request.restore();
        global.navigator = undefined;
      });

      it('should call callback with server error', () => {
        const callback = sinon.spy();

        Radar.trackOnce(callback);

        expect(callback).to.have.been.calledWith(STATUS.ERROR_SERVER);
      });
    });

    context('ajax failure calling api', () => {
      beforeEach(() => {
        getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

        const geolocation = {
          getCurrentPosition: (onSuccess) => { onSuccess(position); },
        };

        global.navigator = { geolocation };

        httpRequestSpy = sinon.spy((method, url, body, headers, onSuccess, onError) => {
          onError('ajax error');
        });

        sinon.stub(Http, 'request').callsFake(httpRequestSpy);
      });

      afterEach(() => {
        Http.request.restore();
        global.navigator = undefined;
      });

      it('should call callback with Http error', () => {
        const callback = sinon.spy();

        Radar.trackOnce(callback);

        expect(callback).to.have.been.calledWith('ajax error');
      });
    });
  });

  describe('search', () => {
    const publishableKey = 'mock-publishable-key';

    const latitude = 40.7041895;
    const longitude = -73.9867797;
    const accuracy = 1;
    const position = {
      coords: { accuracy, latitude, longitude }
    };

    const mockRadius = 100;
    const mockChains = ['dunkin', 'sbucks'];
    const mockLimit = 50;

    context('searchPlacesWithLocation', () => {
      it('should return a publishable key error if not set', () => {
        getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(null);

        const searchCallback = sinon.spy();
        Radar.searchPlacesWithLocation(latitude, longitude, mockRadius, mockChains, [], [], mockLimit, searchCallback);

        expect(searchCallback).to.be.calledWith(STATUS.ERROR_PUBLISHABLE_KEY);
      });

      it('should throw a server error if invalid JSON is returned in the response', () => {
        getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

        const jsonErrorResponse = '"invalid_json": true}';
        const httpRequestSpy = sinon.spy((method, url, body, headers, onSuccess, onError) => {
          onSuccess(jsonErrorResponse);
        });
        sinon.stub(Http, 'request').callsFake(httpRequestSpy);

        const searchCallback = sinon.spy();
        Radar.searchPlacesWithLocation(latitude, longitude, mockRadius, mockChains, [], [], mockLimit, searchCallback);

        expect(searchCallback).to.be.calledWith(STATUS.ERROR_SERVER);

        Http.request.restore();
      });

      it('should return the error from the http request', () => {
        getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

        const httpRequestSpy = sinon.spy((method, url, body, headers, onSuccess, onError) => {
          onError('http error');
        });
        sinon.stub(Http, 'request').callsFake(httpRequestSpy);

        const searchCallback = sinon.spy();
        Radar.searchPlacesWithLocation(latitude, longitude, mockRadius, mockChains, [], [], mockLimit, searchCallback);

        expect(searchCallback).to.be.calledWith('http error');

        Http.request.restore();
      });

      it('should succeed', () => {
        getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

        const jsonSuccessResponse = '{"places":"matching-places"}';
        const httpRequestSpy = sinon.spy((method, url, body, headers, onSuccess, onError) => {
          onSuccess(jsonSuccessResponse);
        });
        sinon.stub(Http, 'request').callsFake(httpRequestSpy);

        const searchCallback = sinon.spy();
        Radar.searchPlacesWithLocation(latitude, longitude, mockRadius, mockChains, [], [], mockLimit, searchCallback);

        const [method, url, body, headers] = httpRequestSpy.getCall(0).args;
        expect(method).to.equal('GET');
        expect(url).to.equal('https://api.radar.io/v1/search/places');
        expect(headers).to.deep.equal({
          Authorization: publishableKey
        });
        expect(body).to.deep.equal({
          latitude,
          longitude,
          radius: mockRadius,
          chains: mockChains.join(','),
          categories: '',
          groups: '',
          limit: mockLimit
        });

        expect(searchCallback).to.be.calledWith(STATUS.SUCCESS, 'matching-places');

        Http.request.restore();
      });
    });

    context('searchGeofencesWithLocation', () => {
      it('should return a publishable key error if not set', () => {
        getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(null);

        const searchCallback = sinon.spy();
        Radar.searchGeofencesWithLocation(latitude, longitude, mockRadius, [], mockLimit, searchCallback);

        expect(searchCallback).to.be.calledWith(STATUS.ERROR_PUBLISHABLE_KEY);
      });

      it('should throw a server error if invalid JSON is returned in the response', () => {
        getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

        const jsonErrorResponse = '"invalid_json": true}';
        const httpRequestSpy = sinon.spy((method, url, body, headers, onSuccess, onError) => {
          onSuccess(jsonErrorResponse);
        });
        sinon.stub(Http, 'request').callsFake(httpRequestSpy);

        const searchCallback = sinon.spy();
        Radar.searchGeofencesWithLocation(latitude, longitude, mockRadius, [], mockLimit, searchCallback);

        expect(searchCallback).to.be.calledWith(STATUS.ERROR_SERVER);

        Http.request.restore();
      });

      it('should return the error form the http request', () => {
        getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

        const httpRequestSpy = sinon.spy((method, url, body, headers, onSuccess, onError) => {
          onError('http error');
        });
        sinon.stub(Http, 'request').callsFake(httpRequestSpy);

        const searchCallback = sinon.spy();
        Radar.searchGeofencesWithLocation(latitude, longitude, mockRadius, [], mockLimit, searchCallback);

        expect(searchCallback).to.be.calledWith('http error');

        Http.request.restore();
      });

      it('should succeed', () => {
        getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

        const jsonSuccessResponse = '{"geofences":"matching-geofences"}';
        const httpRequestSpy = sinon.spy((method, url, body, headers, onSuccess, onError) => {
          onSuccess(jsonSuccessResponse);
        });
        sinon.stub(Http, 'request').callsFake(httpRequestSpy);

        const searchCallback = sinon.spy();
        Radar.searchGeofencesWithLocation(latitude, longitude, mockRadius, [], mockLimit, searchCallback);

        const [method, url, body, headers] = httpRequestSpy.getCall(0).args;
        expect(method).to.equal('GET');
        expect(url).to.equal('https://api.radar.io/v1/search/geofences');
        expect(headers).to.deep.equal({
          Authorization: publishableKey
        });
        expect(body).to.deep.equal({
          latitude,
          longitude,
          radius: mockRadius,
          tags: '',
          limit: mockLimit
        });

        expect(searchCallback).to.be.calledWith(STATUS.SUCCESS, 'matching-geofences');

        Http.request.restore();
      });
    });
  });

  describe('geocoding', () => {
    const publishableKey = 'mock-publishable-key';

    const latitude = 40.7041895;
    const longitude = -73.9867797;

    const ip = '192.0.2.28';

    const mockQuery = '20 Jay Street';

    context('geocode', () => {
      it('should return a publishable key error if not set', () => {
        getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(null);

        const geocodeCallback = sinon.spy();
        Radar.geocode(mockQuery, geocodeCallback);

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
        Radar.geocode(mockQuery, geocodeCallback);

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
        Radar.geocode(mockQuery, geocodeCallback);

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
        Radar.geocode(mockQuery, geocodeCallback);

        const [method, url, body, headers] = httpRequestSpy.getCall(0).args;
        expect(method).to.equal('GET');
        expect(url).to.equal('https://api.radar.io/v1/geocode/forward');
        expect(headers).to.deep.equal({
          Authorization: publishableKey
        });
        expect(body).to.deep.equal({
          query: mockQuery
        });

        expect(geocodeCallback).to.be.calledWith(STATUS.SUCCESS, ['matching-addresses']);

        Http.request.restore();
      });
    });

    context('reverseGeocodeLocation', () => {
      it('should return a publishable key error if not set', () => {
        getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(null);

        const geocodeCallback = sinon.spy();
        Radar.reverseGeocodeLocation(latitude, longitude, geocodeCallback);

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
        Radar.reverseGeocodeLocation(latitude, longitude, geocodeCallback);

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
        Radar.reverseGeocodeLocation(latitude, longitude, geocodeCallback);

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
        Radar.reverseGeocodeLocation(latitude, longitude, geocodeCallback);

        const [method, url, body, headers] = httpRequestSpy.getCall(0).args;
        expect(method).to.equal('GET');
        expect(url).to.equal('https://api.radar.io/v1/geocode/reverse');
        expect(headers).to.deep.equal({
          Authorization: publishableKey
        });
        expect(body).to.deep.equal({
          latitude,
          longitude
        });

        expect(geocodeCallback).to.be.calledWith(STATUS.SUCCESS, ['matching-addresses']);

        Http.request.restore();
      });
    });

    context('geocodeDeviceIP', () => {
      it('should succeed - calling geocodeIP with undefined', () => {
        const geocodeIPSpy = sinon.spy((ip, callback) => {
          callback(STATUS.SUCCESS, { country: 'USA'} );
        });
        sinon.stub(Radar, 'geocodeIP').callsFake(geocodeIPSpy);

        const geocodeCallback = sinon.spy();
        Radar.geocodeDeviceIP(geocodeCallback);

        const [ip] = geocodeIPSpy.getCall(0).args;
        expect(ip).to.be.undefined;

        expect(geocodeCallback).to.be.calledWith(STATUS.SUCCESS, { country: 'USA' });

        Radar.geocodeIP.restore();
      });
    });

    context('geocodeIP', () => {
      it('should return a publishable key error if not set', () => {
        getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(null);

        const geocodeCallback = sinon.spy();
        Radar.geocodeIP(ip, geocodeCallback);

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
        Radar.geocodeIP(ip, geocodeCallback);

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
        Radar.geocodeIP(ip, geocodeCallback);

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
        Radar.geocodeIP(ip, geocodeCallback);

        const [method, url, body, headers] = httpRequestSpy.getCall(0).args;
        expect(method).to.equal('GET');
        expect(url).to.equal('https://api.radar.io/v1/geocode/ip');
        expect(headers).to.deep.equal({
          Authorization: publishableKey
        });
        expect(body).to.deep.equal({
          ip
        });

        expect(geocodeCallback).to.be.calledWith(STATUS.SUCCESS, 'matching-country');

        Http.request.restore();
      });
    });
  });
});
