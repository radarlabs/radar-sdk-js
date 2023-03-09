const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import Http from '../../src/http';
import Navigator from '../../src/navigator';
import STATUS from '../../src/status';

import Search from '../../src/api/search';

import { latitude, longitude } from '../common';

describe('Search', () => {
  let httpStub;
  let navigatorStub;

  const radius = 100;
  const chains = ['dunkin', 'sbucks'];
  const categories = ['coffee-shop'];
  const groups = ['airport'];
  const tags = ['geofence-tag'];
  const metadata = {'geofence-metadata-key': 'geofence-metadata-value'};
  const layers = ['venue', 'address'];
  const countryCode = 'US';
  const limit = 50;
  const query = 'mock-query';

  const placesResponse = { meta: {}, places: {} };
  const geofencesResponse = { meta: {}, geofences: {} };
  const autocompleteResponse = { meta: {}, addresses: {} };

  beforeEach(() => {
    navigatorStub = sinon.stub(Navigator, 'getCurrentPosition');
    httpStub = sinon.stub(Http, 'request');
  });

  afterEach(() => {
    Navigator.getCurrentPosition.restore();
    Http.request.restore();
  });

  context('searchPlaces', () => {
    describe('location permissions denied', () => {
      it('should propagate the navigator error', () => {
        navigatorStub.rejects(STATUS.ERROR_PERMISSIONS);

        return Search.searchPlaces()
          .catch((err) => {
            expect(err.toString()).to.eq(STATUS.ERROR_PERMISSIONS);
            expect(httpStub).to.have.callCount(0);
          });
      });
    });

    describe('location permissions approved', () => {
      it('should return a placeSearch response', () => {
        navigatorStub.resolves({ latitude, longitude });
        httpStub.resolves(placesResponse);

        return Search.searchPlaces()
          .then((response) => {
            expect(response).to.equal(placesResponse);
          });
      });
    });

    describe('location is given', () => {
      it('should return a placeSearch response', () => {
        httpStub.resolves(placesResponse);

        const near = { latitude, longitude };

        return Search.searchPlaces({ near, radius, chains, categories, groups, limit })
          .then((response) => {
            expect(response).to.equal(placesResponse);
          });
      });
    });
  });

  context('searchGeofences', () => {
    describe('location permissions denied', () => {
      it('should propagate the navigator error', () => {
        navigatorStub.rejects(STATUS.ERROR_PERMISSIONS);

        return Search.searchGeofences()
          .catch((err) => {
            expect(err.toString()).to.eq(STATUS.ERROR_PERMISSIONS);
            expect(httpStub).to.have.callCount(0);
          });
      });
    });

    describe('location permissions approved', () => {
      it('should return a geofenceSearch response', () => {
        navigatorStub.resolves({ latitude, longitude });
        httpStub.resolves(geofencesResponse);

        return Search.searchGeofences()
          .then((response) => {
            expect(response).to.equal(geofencesResponse);
          });
      });
    });

    describe('location is given', () => {
      it('should return a geofenceSearch response', () => {
        httpStub.resolves(geofencesResponse);

        const near = { latitude, longitude };

        return Search.searchGeofences({ near, radius, chains, tags, metadata, limit })
          .then((response) => {
            expect(response).to.equal(geofencesResponse);
          });
      });
    });
  });

  context('autocomplete', () => {
    describe('params are not provided', () => {
      it('should have undefined params and return an autocomplete response', () => {
        httpStub.resolves(autocompleteResponse);

        return Search.autocomplete({ query })
          .then((response) => {
            expect(Http.request).to.have.been.calledWith('GET', 'search/autocomplete', { query: 'mock-query', near: undefined, limit: undefined, layers: undefined, country: undefined, countryCode: undefined, expandUnits: undefined });
            expect(response).to.equal(autocompleteResponse);
          });
      });
    });

    describe('params are provided', () => {
      it('should return an autocomplete response', () => {
        httpStub.resolves(autocompleteResponse);

        const near = { latitude, longitude };

        return Search.autocomplete({ near, query, limit, layers, countryCode })
          .then((response) => {
            expect(Http.request).to.have.been.calledWith('GET', 'search/autocomplete', { query: 'mock-query', near: `${latitude},${longitude}`, limit: 50, layers: ['venue', 'address'], countryCode, country: undefined, expandUnits: undefined });
            expect(response).to.equal(autocompleteResponse);
          });
      });

      it('should return an autocomplete response, with expandUnits', () => {
        httpStub.resolves(autocompleteResponse);

        const near = { latitude, longitude };
        const expandUnits = true;

        return Search.autocomplete({ near, query, limit, layers, countryCode, expandUnits })
          .then((response) => {
            expect(Http.request).to.have.been.calledWith('GET', 'search/autocomplete', { query: 'mock-query', near: `${latitude},${longitude}`, limit: 50, layers: ['venue', 'address'], countryCode, country: undefined, expandUnits: true });
            expect(response).to.equal(autocompleteResponse);
          });
      });
    });
  });
});
