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
import STATUS from '../src/status';

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

    context('description given', () => {
      it('should save description in cookie', () => {
        const description = 'abc123';
        Radar.setDescription(description);
        expect(Cookie.setCookie).to.have.been.calledWith(Cookie.DESCRIPTION, description);
      });
    });
  });

  describe('setMetadata', () => {
    context('no metadata given', () => {
      it('should delete metadata from cookie', () => {
        Radar.setMetadata();
        expect(Cookie.deleteCookie).to.be.calledWith(Cookie.METADATA);
      });
    });

    context('metadata given', () => {
      it('should save metadata in cookie', () => {
        const metadata = { meta: 'mock-metadata' };
        Radar.setMetadata(metadata);
        expect(Cookie.setCookie).to.be.calledWith(Cookie.METADATA, JSON.stringify(metadata));
      });
    });
  });

  context('api errors', () => {
      let trackStub;

      beforeEach(() => {
        trackStub = sinon.stub(Track, 'trackOnce');
      });

      afterEach(() => {
        Track.trackOnce.restore();
      });

    describe('Radar error', () => {
      it('should return the error enum and empty object', (done) => {
        trackStub.returns(Promise.reject(STATUS.ERROR_LOCATION));

        Radar.trackOnce((err, obj) => {
          expect(err).to.equal(STATUS.ERROR_LOCATION);
          expect(obj).to.deep.equal({});
          done();
        });
      });
    });

    describe('Http Error', () => {
      it('should return the error enum and response object', (done) => {
        const response = { meta: { code: 400 } };
        trackStub.returns(Promise.reject({ httpError: STATUS.ERROR_BAD_REQUEST, response }));

        Radar.trackOnce((err, obj, res) => {
          expect(err).to.equal(STATUS.ERROR_BAD_REQUEST);
          expect(obj).to.deep.equal({});
          expect(res).to.deep.equal(response);
          done();
        });
      });
    });

    describe('Unknown', () => {
      it('should return the unknown error and empty object', (done) => {
        trackStub.returns(Promise.reject({ error: 'invalid error' }));

        Radar.trackOnce((err, obj) => {
          expect(err).to.equal(STATUS.ERROR_UNKNOWN);
          expect(obj).to.deep.equal({});
          done();
        });
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

    it('should propagate the err if not successful', (done) => {
      navigatorStub.returns(Promise.reject(STATUS.ERROR_LOCATION));

      Radar.getLocation((err) => {
        expect(err).to.equal(STATUS.ERROR_LOCATION);
        done();
      });
    });

    it('should succeed', (done) => {
      navigatorStub.resolves({ latitude, longitude, accuracy });

      Radar.getLocation((err, { latitude, longitude, accuracy }) => {
        expect(err).to.equal(null);
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

    it('should call trackOnce if the first arg is a callback', (done) => {
      trackStub.resolves({
        location: { latitude, longitude, accuracy },
        user: 'user-data',
        events: 'matching-events',
      });

      Radar.trackOnce((err, { location, user, events }) => {
        expect(err).to.equal(null);
        expect(location).to.deep.equal({ latitude, longitude, accuracy });
        expect(user).to.equal('user-data');
        expect(events).to.equal('matching-events');
        done();
      });
    });

    it('should call trackOnce if the first arg is a location object', (done) => {
      trackStub.resolves({
        location: { latitude, longitude, accuracy },
        user: 'user-data',
        events: 'matching-events',
      });

      Radar.trackOnce({ latitude, longitude, accuracy }, (err, { location, user, events }) => {
        expect(err).to.equal(null);
        expect(location).to.deep.equal({ latitude, longitude, accuracy });
        expect(user).to.equal('user-data');
        expect(events).to.equal('matching-events');
        done();
      });
    });

    it('should not throw an error if no callback given', () => {
      trackStub.resolves({
        location: { latitude, longitude, accuracy },
        user: 'user-data',
        events: 'matching-events',
      });

      Radar.trackOnce();
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

    it('should call getContext if the first arg is a callback', (done) => {
      contextStub.resolves({
        context: 'matching-context'
      });

      Radar.getContext((err, { context }) => {
        expect(err).to.equal(null);
        expect(context).to.equal('matching-context');
        done();
      });
    });

    it('should call getContext if the first arg is a location', (done) => {
      contextStub.resolves({
        context: 'matching-context'
      });

      Radar.getContext({ latitude, longitude }, (err, { context }) => {
        expect(err).to.equal(null);
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

    it('should call searchPlaces', (done) => {
      searchStub.resolves({ places: 'matching-places' });

      Radar.searchPlaces({ radius, chains, categories, groups, limit }, (err, { places }) => {
        expect(err).to.equal(null);
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

    it('should call searchGeofences', (done) => {
      searchStub.resolves({ geofences: 'matching-geofences' });

      Radar.searchGeofences({ radius, tags, limit }, (err, { geofences }) => {
        expect(err).to.equal(null);
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

    it('should call autocomplete', (done) => {
      searchStub.resolves({ addresses: 'matching-addresses' });

      Radar.autocomplete( { query, limit }, (err, { addresses }) => {
        expect(err).to.equal(null);
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

    it('should call geocode', (done) => {
      geocodeStub.resolves({ addresses: 'matching-addresses' });

      Radar.geocode({ query }, (err, { addresses }) => {
        expect(err).to.equal(null);
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

    it('should call reverseGeocode if the first arg is a callback', (done) => {
      geocodeStub.resolves({ addresses: 'matching-addresses' });

      Radar.reverseGeocode((err, { addresses }) => {
        expect(err).to.equal(null);
        expect(addresses).to.equal('matching-addresses');
        done();
      });
    });

    it('should call reverseGeocodeLocation if the first arg is a location object', (done) => {
      geocodeStub.resolves({ addresses: 'matching-addresses' });

      Radar.reverseGeocode({ latitude, longitude }, (err, { addresses }) => {
        expect(err).to.equal(null);
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

    it('should call ipGeocode if the first arg is a callback', (done) => {
      geocodeStub.resolves({ address: 'matching-address' });

      Radar.ipGeocode((err, { address }) => {
        expect(err).to.equal(null);
        expect(address).to.equal('matching-address');
        done();
      });
    });

    it('should call ipGeocode is the first arg is an object', (done) => {
      geocodeStub.resolves({ address: 'matching-address' });

      Radar.ipGeocode({ ip: 'mock-ip-address' }, (err, { address }) => {
        expect(err).to.equal(null);
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

    it('should call getDistanceToDestination', (done) => {
      routingStub.resolves({ routes: 'matching-routes' });

      Radar.getDistance({ destination, modes, units }, (err, { routes }) => {
        expect(err).to.equal(null);
        expect(routes).to.equal('matching-routes');
        done();
      });
    });
  });
});
