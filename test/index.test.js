const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import Cookie from '../src/cookie';
import Navigator from '../src/navigator';

import Context from '../src/api/context';
import Geocoding from '../src/api/geocoding';
import Routing from '../src/api/routing';
import Search from '../src/api/search';
import Track from '../src/api/track';

import SDK_VERSION from '../src/version';
import STATUS from '../src/status_codes';

import Radar from '../src/index';

import { latitude, longitude } from './common';

describe('Radar', () => {
  const accuracy = 5;

  // search
  const radius = 100;
  const chains = ['dunkin', 'sbucks'];
  const categories = ['coffee-shop'];
  const groups = ['airport'];
  const tags = ['geofence-tags'];
  const limit = 50;

  // geocoding
  const query = 'mock-query';

  // routing
  const destination = {
    latitude: 40.7032123,
    longitude: -73.9936137,
  };
  const modes = ['foot', 'bike', 'car'];
  const units = 'imperial';

  beforeEach(() => {
    sinon.stub(Cookie, 'deleteCookie');
    sinon.stub(Cookie, 'setCookie');
    sinon.stub(Cookie, 'getCookie');
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

  context('getLocation', () => {
    let navigatorStub;

    beforeEach(() => {
      navigatorStub = sinon.stub(Navigator, 'getCurrentPosition');
    });

    afterEach(() => {
      Navigator.getCurrentPosition.restore();
    });

    it('should throw an error if no callback present', () => {
      try {
        Radar.getLocation();
      } catch (e) {
        expect(e.message).to.equal('ERROR_MISSING_CALLBACK');
      }
    });

    it('should propagate the status if not successful', () => {
      navigatorStub.rejects(STATUS.ERROR_LOCATION);

      Radar.getLocation((status) => {
        expect(status).to.equal(STATUS.ERROR_LOCATION);
      });
    });

    it('should succeed', (done) => {
      navigatorStub.resolves({ latitude, longitude, accuracy });

      Radar.getLocation((status, latitude, longitude, accuracy) => {
        expect(status).to.equal(STATUS.SUCCESS);
        expect(latitude).to.equal(latitude);
        expect(longitude).to.equal(longitude);
        expect(accuracy).to.equal(accuracy);
        done();
      });
    });
  });

  context('trackOnce', () => {
    let trackStub;

    beforeEach(() => {
      trackStub = sinon.stub(Track, 'trackOnce');
    });

    afterEach(() => {
      Track.trackOnce.restore();
    });

    it('should throw an error on invalid params', () => {
      try {
        Radar.trackOnce(3);
      } catch (e) {
        expect(e.message).to.equal('ERROR_PARAMETERS');
      }
    });

    it('should throw an error if no callback', () => {
      try {
        Radar.trackOnce();
      } catch (e) {
        expect(e.message).to.equal(STATUS.ERROR_MISSING_CALLBACK);
      }
      try {
        Radar.trackOnce({});
      } catch (e) {
        expect(e.message).to.equal(STATUS.ERROR_MISSING_CALLBACK);
      }
    });

    it('should call trackOnce if the first arg is a callback', (done) => {
      trackStub.resolves({
        location: { latitude, longitude, accuracy },
        user: 'user-data',
        events: 'matching-events',
      });

      Radar.trackOnce((status, location, user, events) => {
        expect(status).to.equal(STATUS.SUCCESS);
        expect(location).to.deep.equal({ latitude, longitude, accuracy });
        expect(user).to.equal('user-data');
        expect(events).to.equal('matching-events');
        done();
      });
    });

    it('should call trackOnceWithLocation if the first arg is a location object', (done) => {
      trackStub.resolves({
        location: { latitude, longitude, accuracy },
        user: 'user-data',
        events: 'matching-events',
      });

      Radar.trackOnce({ latitude, longitude, accuracy }, (status, location, user, events) => {
        expect(status).to.equal(STATUS.SUCCESS);
        expect(location).to.deep.equal({ latitude, longitude, accuracy });
        expect(user).to.equal('user-data');
        expect(events).to.equal('matching-events');
        done();
      });
    });
  });

  context('getContext', () => {
    let contextStub;

    beforeEach(() => {
      contextStub = sinon.stub(Context, 'getContext');
    });

    afterEach(() => {
      Context.getContext.restore();
    });

    it('should throw an error on invalid params', () => {
      try {
        Radar.getContext(3);
      } catch (e) {
        expect(e.message).to.equal('ERROR_PARAMETERS');
      }
    });

    it('should throw an error if no callback provided', () => {
      try {
        Radar.getContext();
      } catch (e) {
        expect(e.message).to.equal(STATUS.ERROR_MISSING_CALLBACK);
      }
      try {
        Radar.getContext({});
      } catch (e) {
        expect(e.message).to.equal(STATUS.ERROR_MISSING_CALLBACK);
      }
    });

    it('should call getContext if the first arg is a callback', (done) => {
      contextStub.resolves({
        context: 'matching-context'
      });

      Radar.getContext((status, context) => {
        expect(status).to.equal(STATUS.SUCCESS);
        expect(context).to.equal('matching-context');
        done();
      });
    });
  });

  context('searchPlaces', () => {
    let searchStub;

    beforeEach(() => {
      searchStub = sinon.stub(Search, 'searchPlaces');
    });

    afterEach(() => {
      Search.searchPlaces.restore();
    });

    it('should throw an error if no callback provided', () => {
      try {
        Radar.searchPlaces({});
      } catch (e) {
        expect(e.message).to.equal('ERROR_MISSING_CALLBACK');
      }
    });

    it('should call searchPlaces', (done) => {
      searchStub.resolves({ places: 'matching-places' });

      Radar.searchPlaces({ radius, chains, categories, groups, limit }, (status, places) => {
        expect(status).to.equal(STATUS.SUCCESS);
        expect(places).to.equal('matching-places');
        done();
      });
    });
  });

  context('searchGeofences', () => {
    let searchStub;

    beforeEach(() => {
      searchStub = sinon.stub(Search, 'searchGeofences');
    });

    afterEach(() => {
      Search.searchGeofences.restore();
    });

    it('should throw an error if no callback provided', () => {
      try {
        Radar.searchGeofences({});
      } catch (e) {
        expect(e.message).to.equal('ERROR_MISSING_CALLBACK');
      }
    });

    it('should call searchGeofences', (done) => {
      searchStub.resolves({ geofences: 'matching-geofences' });

      Radar.searchGeofences({ radius, tags, limit }, (status, geofences) => {
        expect(status).to.equal(STATUS.SUCCESS);
        expect(geofences).to.equal('matching-geofences');
        done();
      });
    });
  });

  context('autocomplete', () => {
    let searchStub;

    beforeEach(() => {
      searchStub = sinon.stub(Search, 'autocomplete');
    });

    afterEach(() => {
      Search.autocomplete.restore();
    });

    it('should throw an error if no callback provided', () => {
      try {
        Radar.autocomplete({});
      } catch (e) {
        expect(e.message).to.equal('ERROR_MISSING_CALLBACK');
      }
    });

    it('should call autocomplete', (done) => {
      searchStub.resolves({ addresses: 'matching-addresses' });

      Radar.autocomplete( { query, limit }, (status, addresses) => {
        expect(status).to.equal(STATUS.SUCCESS);
        expect(addresses).to.equal('matching-addresses');
        done();
      });
    });
  });

  context('geocode', () => {
    let geocodeStub;

    beforeEach(() => {
      geocodeStub = sinon.stub(Geocoding, 'geocode');
    });

    afterEach(() => {
      Geocoding.geocode.restore();
    });

    it('should throw an error if no callback provided', () => {
      try {
        Radar.geocode({ query: query });
      } catch (e) {
        expect(e.message).to.equal('ERROR_MISSING_CALLBACK');
      }
    });

    it('should call geocode', (done) => {
      geocodeStub.resolves({ addresses: 'matching-addresses' });

      Radar.geocode({ query }, (status, addresses) => {
        expect(status).to.equal(STATUS.SUCCESS);
        expect(addresses).to.equal('matching-addresses');
        done();
      });
    });
  });

  context('reverseGeocode', () => {
    let geocodeStub;

    beforeEach(() => {
      geocodeStub = sinon.stub(Geocoding, 'reverseGeocode');
    });

    afterEach(() => {
      Geocoding.reverseGeocode.restore();
    });

    it('should throw an error if invalid arguments', () => {
      try {
        Radar.reverseGeocode();
      } catch (e) {
        expect(e.message).to.equal('ERROR_PARAMETERS');
      }
      try {
        Radar.reverseGeocode(3);
      } catch (e) {
        expect(e.message).to.equal('ERROR_PARAMETERS');
      }
    });

    it('should call reverseGeocode if the first arg is a callback', (done) => {
      geocodeStub.resolves({ addresses: 'matching-addresses' });

      Radar.reverseGeocode((status, addresses) => {
        expect(status).to.equal(STATUS.SUCCESS);
        expect(addresses).to.equal('matching-addresses');
        done();
      });
    });

    it('should call reverseGeocodeLocation if the first arg is a location object', (done) => {
      geocodeStub.resolves({ addresses: 'matching-addresses' });

      Radar.reverseGeocode({ latitude, longitude }, (status, addresses) => {
        expect(status).to.equal(STATUS.SUCCESS);
        expect(addresses).to.equal('matching-addresses');
        done();
      });
    });
  });

  context('ipGeocode', () => {
    let geocodeStub;

    beforeEach(() => {
      geocodeStub = sinon.stub(Geocoding, 'ipGeocode');
    });

    afterEach(() => {
      Geocoding.ipGeocode.restore();
    });

    it('should throw an error if no callback provided', () => {
      try {
        Radar.ipGeocode();
      } catch (e) {
        expect(e.message).to.equal('ERROR_MISSING_CALLBACK');
      }
    });

    it('should call ipGeocode', (done) => {
      geocodeStub.resolves({ address: 'matching-address' });

      Radar.ipGeocode((status, address) => {
        expect(status).to.equal(STATUS.SUCCESS);
        expect(address).to.equal('matching-address');
        done();
      });
    });
  });

  context('getDistance', () => {
    let routingStub;

    beforeEach(() => {
      routingStub = sinon.stub(Routing, 'getDistanceToDestination');
    });

    afterEach(() => {
      Routing.getDistanceToDestination.restore();
    });

    it('should throw an error if no callback provided', () => {
      try {
        Radar.getDistance({});
      } catch (e) {
        expect(e.message).to.equal('ERROR_MISSING_CALLBACK');
      }
    });

    it('should call getDistanceToDestination', (done) => {
      routingStub.resolves({ routes: 'matching-routes' });

      Radar.getDistance({ destination, modes, units }, (status, routes) => {
        expect(status).to.equal(STATUS.SUCCESS);
        expect(routes).to.equal('matching-routes');
        done();
      });
    });
  });
});
