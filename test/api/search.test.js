const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import * as Cookie from '../../src/cookie';
import * as Http from '../../src/http';
import STATUS from '../../src/status_codes';

import Search from '../../src/api/search';

describe('Search', () => {
  let getCookieStub;

  const publishableKey = 'mock-publishable-key';

  const latitude = 40.7041895;
  const longitude = -73.9867797;

  const mockRadius = 100;
  const mockChains = ['dunkin', 'sbucks'];
  const mockLimit = 50;
  const mockQuery = 'mock-query';

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

  context('searchPlacesNear', () => {
    it('should return a publishable key error if not set', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(null);

      const searchCallback = sinon.spy();
      Search.searchPlacesNear(
        {
          near: { latitude, longitude },
          radius: mockRadius,
          chains: mockChains,
          categories: [],
          groups: [],
          limit: mockLimit
        },
        searchCallback
      );

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
      Search.searchPlacesNear(
        {
          near: { latitude, longitude },
          radius: mockRadius,
          chains: mockChains,
          categories: [],
          groups: [],
          limit: mockLimit
        },
        searchCallback
      );

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
      Search.searchPlacesNear(
        {
          near: { latitude, longitude },
          radius: mockRadius,
          chains: mockChains,
          categories: [],
          groups: [],
          limit: mockLimit
        },
        searchCallback
      );

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
      Search.searchPlacesNear(
        {
          near: { latitude, longitude },
          radius: mockRadius,
          chains: mockChains,
          categories: [],
          groups: [],
          limit: mockLimit
        },
        searchCallback
      );

      const [method, url, body, headers] = httpRequestSpy.getCall(0).args;
      expect(method).to.equal('GET');
      expect(url).to.equal('https://api.radar.io/v1/search/places');
      expect(headers).to.deep.equal({
        Authorization: publishableKey,
      });
      expect(body).to.deep.equal({
        near: `${latitude},${longitude}`,
        radius: mockRadius,
        chains: mockChains.join(','),
        categories: '',
        groups: '',
        limit: mockLimit,
      });

      expect(searchCallback).to.be.calledWith(STATUS.SUCCESS, 'matching-places');

      Http.request.restore();
    });
  });

  context('searchGeofencesNear', () => {
    it('should return a publishable key error if not set', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(null);

      const searchCallback = sinon.spy();
      Search.searchGeofencesNear(
        {
          near: {
            latitude,
            longitude,
          },
          radius: mockRadius,
          tags: [],
          limit: mockLimit,
        },
        searchCallback
      );

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
      Search.searchGeofencesNear(
        {
          near: {
            latitude,
            longitude,
          },
          radius: mockRadius,
          tags: [],
          limit: mockLimit,
        },
        searchCallback
      );

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
      Search.searchGeofencesNear(
        {
          near: {
            latitude,
            longitude,
          },
          radius: mockRadius,
          tags: [],
          limit: mockLimit,
        },
        searchCallback
      );

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
      Search.searchGeofencesNear(
        {
          near: {
            latitude,
            longitude,
          },
          radius: mockRadius,
          tags: [],
          limit: mockLimit,
        },
        searchCallback
      );

      const [method, url, body, headers] = httpRequestSpy.getCall(0).args;
      expect(method).to.equal('GET');
      expect(url).to.equal('https://api.radar.io/v1/search/geofences');
      expect(headers).to.deep.equal({
        Authorization: publishableKey,
      });
      expect(body).to.deep.equal({
        near: `${latitude},${longitude}`,
        radius: mockRadius,
        tags: '',
        limit: mockLimit,
      });

      expect(searchCallback).to.be.calledWith(STATUS.SUCCESS, 'matching-geofences');

      Http.request.restore();
    });
  });

  context('autocompleteNear', () => {
    it('should return a publishable key error if not set', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(null);

      const searchCallback = sinon.spy();
      Search.autocompleteNear(
        {
          query: mockQuery,
          near: {
            latitude,
            longitude,
          },
          limit: mockLimit,
        },
        searchCallback
      );

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
      Search.autocompleteNear(
        {
          query: mockQuery,
          near: {
            latitude,
            longitude,
          },
          limit: mockLimit,
        },
        searchCallback
      );

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
      Search.autocompleteNear(
        {
          query: mockQuery,
          near: {
            latitude,
            longitude,
          },
          limit: mockLimit,
        },
        searchCallback
      );

      expect(searchCallback).to.be.calledWith('http error');

      Http.request.restore();
    });

    it('should succeed', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const jsonSuccessResponse = '{"addresses":["matching-addresses"]}';
      const httpRequestSpy = sinon.spy((method, url, body, headers, onSuccess, onError) => {
        onSuccess(jsonSuccessResponse);
      });
      sinon.stub(Http, 'request').callsFake(httpRequestSpy);

      const searchCallback = sinon.spy();
      Search.autocompleteNear(
        {
          query: mockQuery,
          near: {
            latitude,
            longitude,
          },
          limit: mockLimit,
        },
        searchCallback
      );

      const [method, url, body, headers] = httpRequestSpy.getCall(0).args;
      expect(method).to.equal('GET');
      expect(url).to.equal('https://api.radar.io/v1/search/autocomplete');
      expect(headers).to.deep.equal({
        Authorization: publishableKey,
      });
      expect(body).to.deep.equal({
        query: mockQuery,
        near: `${latitude},${longitude}`,
        limit: mockLimit,
      });

      Http.request.restore();
    });
  });
});
