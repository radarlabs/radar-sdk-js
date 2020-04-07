const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import  Http from '../../src/http';
import Navigator from '../../src/navigator';
import STATUS from '../../src/status_codes';

import Search from '../../src/api/search';

describe('Search', () => {
  let httpStub;
  let navigatorStub;

  const latitude = 40.7041895;
  const longitude = -73.9867797;

  const mockRadius = 100;
  const mockChains = ['dunkin', 'sbucks'];
  const mockLimit = 50;
  const mockQuery = 'mock-query';

  beforeEach(() => {
    httpStub = sinon.stub(Http, 'request');

    navigatorStub = sinon.stub(Navigator, 'getCurrentPosition');
  });

  afterEach(() => {
    Http.request.restore();

    Navigator.getCurrentPosition.restore();
  });

  context('searchPlaces', () => {
    let searchStub;

    beforeEach(() => {
      searchStub = sinon.stub(Search, 'searchPlacesNear');
    });

    afterEach(() => {
      Search.searchPlacesNear.restore();
    });

    it('should propagate a navigator error', () => {
      navigatorStub.callsFake((callback) => {
        callback(STATUS.ERROR_LOCATION, {});
      });

      const searchCallback = sinon.spy();
      Search.searchPlaces(
        {
          radius: mockRadius,
          chains: mockChains,
          categories: [],
          groups: [],
          limit: mockLimit,
        },
        searchCallback,
      );

      expect(navigatorStub).to.have.callCount(1);
      expect(searchStub).to.not.be.called;
      expect(searchCallback).to.be.calledWith(STATUS.ERROR_LOCATION);
    });

    it('should return the results of searchPlacesNear', () => {
      navigatorStub.callsFake((callback) => {
        callback(STATUS.SUCCESS, { latitude, longitude });
      });
      searchStub.callsFake(({ near, radius, chains, categories, groups, limit }, callback) => {
        callback(STATUS.SUCCESS, ['matching-places']);
      });

      const searchCallback = sinon.spy();
      Search.searchPlaces(
        {
          radius: mockRadius,
          chains: mockChains,
          categories: [],
          groups: [],
          limit: mockLimit,
        },
        searchCallback,
      );

      expect(navigatorStub).to.have.callCount(1);
      expect(searchStub).to.be.calledWith(
        {
          near: { latitude, longitude },
          radius: mockRadius,
          chains: mockChains,
          categories: [],
          groups: [],
          limit: mockLimit,
        }
      );
      expect(searchCallback).to.be.calledWith(STATUS.SUCCESS, ['matching-places']);
    });
  });

  context('searchPlacesNear', () => {
    it('should return the error from the http request', () => {
      const httpRequestSpy = sinon.spy((method, path, body, callback) => {
        callback('http error');
      });
      httpStub.callsFake(httpRequestSpy);

      const searchCallback = sinon.spy();
      Search.searchPlacesNear(
        {
          near: { latitude, longitude },
          radius: mockRadius,
          chains: mockChains,
          categories: [],
          groups: [],
          limit: mockLimit,
        },
        searchCallback,
      );

      expect(searchCallback).to.be.calledWith('http error');
    });

    it('should succeed', () => {
      const httpRequestSpy = sinon.spy((method, path, body, callback) => {
        callback(STATUS.SUCCESS, { places: ['matching-places'] });
      });
      httpStub.callsFake(httpRequestSpy);

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
        searchCallback,
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

      expect(searchCallback).to.be.calledWith(STATUS.SUCCESS, ['matching-places']);
    });
  });

  context('searchGeofences', () => {
    let searchStub;

    beforeEach(() => {
      searchStub = sinon.stub(Search, 'searchGeofencesNear');
    });

    afterEach(() => {
      Search.searchGeofencesNear.restore();
    });

    it('should propagate a navigator error', () => {
      navigatorStub.callsFake((callback) => {
        callback(STATUS.ERROR_LOCATION, {});
      });

      const searchCallback = sinon.spy();
      Search.searchGeofences(
        {
          radius: mockRadius,
          tags: [],
          limit: mockLimit,
        },
        searchCallback,
      );

      expect(navigatorStub).to.have.callCount(1);
      expect(searchStub).to.not.be.called;
      expect(searchCallback).to.be.calledWith(STATUS.ERROR_LOCATION);
    });

    it('should return the results of searchGeofencesNear', () => {
      navigatorStub.callsFake((callback) => {
        callback(STATUS.SUCCESS, { latitude, longitude });
      });
      searchStub.callsFake(({ near, radius, tags, limit }, callback) => {
        callback(STATUS.SUCCESS, ['matching-geofences']);
      });

      const searchCallback = sinon.spy();
      Search.searchGeofences(
        {
          radius: mockRadius,
          tags: [],
          limit: mockLimit,
        },
        searchCallback,
      );

      expect(navigatorStub).to.have.callCount(1);
      expect(searchStub).to.be.calledWith(
        {
          near: { latitude, longitude },
          radius: mockRadius,
          tags: [],
          limit: mockLimit,
        }
      );
    });
  });

  context('searchGeofencesNear', () => {
    it('should return the error form the http request', () => {
      const httpRequestSpy = sinon.spy((method, path, body, callback) => {
        callback('http error');
      });
      httpStub.callsFake(httpRequestSpy);

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
        searchCallback,
      );

      expect(searchCallback).to.be.calledWith('http error');
    });

    it('should succeed', () => {
      const httpRequestSpy = sinon.spy((method, path, body, callback) => {
        callback(STATUS.SUCCESS, { geofences: ['matching-geofences'] });
      });
      httpStub.callsFake(httpRequestSpy);

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
        searchCallback,
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

      expect(searchCallback).to.be.calledWith(STATUS.SUCCESS, ['matching-geofences']);
    });
  });

  context('autocomplete', () => {
    let searchStub;

    beforeEach(() => {
      searchStub = sinon.stub(Search, 'autocompleteNear');
    });

    afterEach(() => {
      Search.autocompleteNear.restore();
    });

    it('should propagate a navigator error', () => {
      navigatorStub.callsFake((callback) => {
        callback(STATUS.ERROR_LOCATION, {});
      });

      const searchCallback = sinon.spy();
      Search.autocomplete(
        {
          query: mockQuery,
          limit: mockLimit,
        },
        searchCallback
      );

      expect(navigatorStub).to.have.callCount(1);
      expect(searchStub).to.not.be.called;
      expect(searchCallback).to.be.calledWith(STATUS.ERROR_LOCATION);
    });

    it('should return the results of autocompleteNear', () => {
      navigatorStub.callsFake((callback) => {
        callback(STATUS.SUCCESS, { latitude, longitude });
      });
      searchStub.callsFake(({ query, near, limit }, callback) => {
        callback(STATUS.SUCCESS, ['matching-addresses']);
      });

      const searchCallback = sinon.spy();
      Search.autocomplete(
        {
          query: mockQuery,
          limit: mockLimit,
        },
        searchCallback,
      );

      expect(navigatorStub).to.have.callCount(1);
      expect(searchStub).to.be.calledWith(
        {
          query: mockQuery,
          near: { latitude, longitude },
          limit: mockLimit,
        }
      );
      expect(searchCallback).to.be.calledWith(STATUS.SUCCESS, ['matching-addresses']);
    });
  });

  context('autocompleteNear', () => {
    it('should return the error from the http request', () => {
      const httpRequestSpy = sinon.spy((method, path, body, callback) => {
        callback('http error');
      });
      httpStub.callsFake(httpRequestSpy);

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
        searchCallback,
      );

      expect(searchCallback).to.be.calledWith('http error');
    });

    it('should succeed', () => {
      const httpRequestSpy = sinon.spy((method, path, body, callback) => {
        callback(STATUS.SUCCESS, { addresses: ['matching-addresses'] });
      });
      httpStub.callsFake(httpRequestSpy);

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
        searchCallback,
      );

      const [method, path, body] = httpRequestSpy.getCall(0).args;
      expect(method).to.equal('GET');
      expect(path).to.equal('v1/search/autocomplete');
      expect(body).to.deep.equal({
        query: mockQuery,
        near: `${latitude},${longitude}`,
        limit: mockLimit,
      });

      expect(searchCallback).to.be.calledWith(STATUS.SUCCESS, ['matching-addresses']);
    });
  });
});
