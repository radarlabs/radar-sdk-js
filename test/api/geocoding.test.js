const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import { latitude, longitude } from '../common';

import Http from '../../src/http';
import Navigator from '../../src/navigator';
import STATUS from '../../src/status_codes';

import Geocoding from '../../src/api/geocoding';

describe('Geocoding', () => {
  let httpStub;
  let navigatorStub;

  const query = '20 Jay Street';

  const geocodeResponse = { meta: {}, address: {} };

  beforeEach(() => {
    navigatorStub = sinon.stub(Navigator, 'getCurrentPosition');
    httpStub = sinon.stub(Http, 'request');
  });

  afterEach(() => {
    Navigator.getCurrentPosition.restore();
    Http.request.restore();
  });

  context('geocode', () => {
    it('should return an address', () => {
      httpStub.resolves(geocodeResponse);

      return Geocoding.geocode({ query })
        .then((response) => {
          expect(response).to.equal(geocodeResponse);
        });
    });
  });

  context('reverseGeocode', () => {
    describe('location permissions denied', () => {
      it('should propagate the navigator error', () => {
        navigatorStub.rejects(STATUS.ERROR_PERMISSIONS);

        return Geocoding.geocode({ query })
          .catch((err) => {
            expect(err.toString()).to.eq(STATUS.ERROR_PERMISSIONS);
            expect(httpStub).to.have.callCount(0);
          });
      });
    });

    describe('location permissions approved', () => {
      it('should return a geocode response', () => {
        navigatorStub.resolves({ latitude, longitude });
        httpStub.resolves(geocodeResponse);

        return Geocoding.reverseGeocode({ query })
          .then((response) => {
            expect(response).to.equal(geocodeResponse);
          });
        });
    });
  });

  context('ipGeocode', () => {
    it('should return a geocode response', () =>{
      httpStub.resolves(geocodeResponse);

      return Geocoding.ipGeocode()
        .then((response) => {
          expect(response).to.equal(geocodeResponse);
        });
    });
  });
});
