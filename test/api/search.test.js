const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import * as Http from '../../src/http';
import STATUS from '../../src/status_codes';

import Search from '../../src/api/search';

describe('Search', () => {
  const latitude = 40.7041895;
  const longitude = -73.9867797;

  const mockRadius = 100;
  const mockChains = ['dunkin', 'sbucks'];
  const mockLimit = 50;
  const mockQuery = 'mock-query';

  afterEach(() => {
    Http.request.restore();
  });

  context('searchPlacesNear', () => {
    it('should throw a server error if invalid JSON is returned in the response', () => {
      const jsonErrorResponse = '"invalid_json": true}';
      const httpRequestSpy = sinon.spy((method, path, body, onSuccess, onError) => {
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
    });

    it('should return the error from the http request', () => {
      const httpRequestSpy = sinon.spy((method, path, body, onSuccess, onError) => {
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
    });

    it('should succeed', () => {
      const jsonSuccessResponse = '{"places":"matching-places"}';
      const httpRequestSpy = sinon.spy((method, path, body, onSuccess, onError) => {
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

      const [method, path, body] = httpRequestSpy.getCall(0).args;
      expect(method).to.equal('GET');
      expect(path).to.equal('v1/search/places');
      expect(body).to.deep.equal({
        near: `${latitude},${longitude}`,
        radius: mockRadius,
        chains: mockChains.join(','),
        categories: '',
        groups: '',
        limit: mockLimit,
      });

      expect(searchCallback).to.be.calledWith(STATUS.SUCCESS, 'matching-places');
    });
  });

  context('searchGeofencesNear', () => {
    it('should throw a server error if invalid JSON is returned in the response', () => {
      const jsonErrorResponse = '"invalid_json": true}';
      const httpRequestSpy = sinon.spy((method, path, body, onSuccess, onError) => {
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
    });

    it('should return the error form the http request', () => {
      const httpRequestSpy = sinon.spy((method, path, body, onSuccess, onError) => {
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
    });

    it('should succeed', () => {
      const jsonSuccessResponse = '{"geofences":"matching-geofences"}';
      const httpRequestSpy = sinon.spy((method, path, body, onSuccess, onError) => {
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

      const [method, path, body] = httpRequestSpy.getCall(0).args;
      expect(method).to.equal('GET');
      expect(path).to.equal('v1/search/geofences');
      expect(body).to.deep.equal({
        near: `${latitude},${longitude}`,
        radius: mockRadius,
        tags: '',
        limit: mockLimit,
      });

      expect(searchCallback).to.be.calledWith(STATUS.SUCCESS, 'matching-geofences');
    });
  });

  context('autocompleteNear', () => {
    it('should throw a server error if invalid JSON is returned in the response', () => {
      const jsonErrorResponse = '"invalid_json": true}';
      const httpRequestSpy = sinon.spy((method, path, body, onSuccess, onError) => {
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
    });

    it('should return the error from the http request', () => {
      const httpRequestSpy = sinon.spy((method, path, body, onSuccess, onError) => {
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
    });

    it('should succeed', () => {
      const jsonSuccessResponse = '{"addresses":["matching-addresses"]}';
      const httpRequestSpy = sinon.spy((method, path, body, onSuccess, onError) => {
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

      const [method, path, body] = httpRequestSpy.getCall(0).args;
      expect(method).to.equal('GET');
      expect(path).to.equal('v1/search/autocomplete');
      expect(body).to.deep.equal({
        query: mockQuery,
        near: `${latitude},${longitude}`,
        limit: mockLimit,
      });
    });
  });
});
