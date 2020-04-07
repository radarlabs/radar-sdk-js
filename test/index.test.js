const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import  Cookie from '../src/cookie';
import Navigator from '../src/navigator';

import Context from '../src/api/context';
import Geocoding from '../src/api/geocoding';
import Routing from '../src/api/routing';
import Search from '../src/api/search';
import Track from '../src/api/track';

import SDK_VERSION from '../src/version';
import STATUS from '../src/status_codes';

import Radar from '../src/index';

describe('Radar', () => {
  let getCookieStub;

  const latitude = 40.7041895;
  const longitude = -73.9867797;
  const accuracy = 5;

  // search
  const mockRadius = 100;
  const mockChains = ['dunkin', 'sbucks'];
  const mockLimit = 50;

  // geocoding
  const mockQuery = 'mock-query';

  // routing
  const destination = {
    latitude: 40.7032123,
    longitude: -73.9936137,
  };
  const mockModes = ['foot', 'bike', 'car'];
  const mockUnits = 'imperial';

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

    const latitude = 40.7041895;
    const longitude = -73.9867797;
    const accuracy = 5;

    beforeEach(() => {
      navigatorStub = sinon.stub(Navigator, 'getCurrentPosition');
    });

    afterEach(() => {
      Navigator.getCurrentPosition.restore();
    });

    it('should throw an error if no callback present', () => {
      let e;
      try {
        Radar.getLocation();
      } catch (_e) {
        e = _e;
      }

      expect(navigatorStub).to.not.be.called;
      expect(e.message).to.equal('ERROR_PARAMETERS');
    });

    it('should propagate the status if not successful', () => {
      navigatorStub.callsFake((callback) => {
        callback(STATUS.ERROR_LOCATION, {});
      });

      const locationCallback = sinon.spy();
      Radar.getLocation(locationCallback);

      expect(navigatorStub).to.have.callCount(1);
      expect(locationCallback).to.be.calledWith(STATUS.ERROR_LOCATION);
    });

    it('should succeed', () => {
      navigatorStub.callsFake((callback) => {
        callback(STATUS.SUCCESS, { latitude, longitude, accuracy });
      });

      const locationCallback = sinon.spy();
      Radar.getLocation(locationCallback);

      expect(navigatorStub).to.have.callCount(1);
      expect(locationCallback).to.be.calledWith(STATUS.SUCCESS, {
        latitude: 40.7041895,
        longitude: -73.9867797,
        accuracy: 5,
      });
    });
  });

  context('trackOnce', () => {
    let trackStub;
    let trackLocationStub;

    beforeEach(() => {
      trackStub = sinon.stub(Track, 'trackOnce');
      trackLocationStub = sinon.stub(Track, 'trackOnceWithLocation');
    });

    afterEach(() => {
      Track.trackOnce.restore();
      Track.trackOnceWithLocation.restore();
    });

    it('should throw an error on invalid params', () => {
      let e;
      try {
        Radar.trackOnce(3);
      } catch (_e) {
        e = _e;
      }

      expect(trackStub).to.not.be.called;
      expect(trackLocationStub).to.not.be.called;
      expect(e.message).to.equal('ERROR_PARAMETERS');
    });

    it('should call trackOnce with no args', () => {
      trackStub.callsFake((callback) => {
        callback(STATUS.SUCCESS, { latitude, longitude, accuracy }, 'user-data', 'matching-events');
      });

      Radar.trackOnce();

      expect(trackStub).to.have.callCount(1);
      expect(trackLocationStub).to.not.be.called;
    });

    it('should call trackOnce if the first arg is a callback', () => {
      trackStub.callsFake((callback) => {
        callback(STATUS.SUCCESS, { latitude, longitude, accuracy }, 'user-data', 'matching-events');
      });

      const trackCallback = sinon.spy();
      Radar.trackOnce(trackCallback);

      expect(trackStub).to.have.callCount(1);
      expect(trackLocationStub).to.not.be.called;
      expect(trackCallback).to.be.calledWith(
        STATUS.SUCCESS,
        { latitude, longitude, accuracy },
        'user-data',
        'matching-events'
      );
    });

    it('should call trackOnceWithLocation if the first arg is a location object', () => {
      trackLocationStub.callsFake(({ latitude, longitude, accuracy }, callback) => {
        callback(STATUS.SUCCESS, { latitude, longitude, accuracy }, 'user-data', 'matching-events');
      });

      const trackCallback = sinon.spy();
      Radar.trackOnce({ latitude, longitude, accuracy }, trackCallback);

      expect(trackStub).to.not.be.called;
      expect(trackLocationStub).to.have.callCount(1);
      expect(trackCallback).to.be.calledWith(
        STATUS.SUCCESS,
        { latitude, longitude, accuracy },
        'user-data',
        'matching-events'
      );
    });
  });

  context('getContext', () => {
    let contextStub;
    let contextLocationStub;

    beforeEach(() => {
      contextStub = sinon.stub(Context, 'getContext');
      contextLocationStub = sinon.stub(Context, 'getContextForLocation');
    });

    afterEach(() => {
      Context.getContext.restore();
      Context.getContextForLocation.restore();
    });

    it('should throw an error if no callback provided', () => {
      let e;
      try {
        Radar.getContext();
      } catch (_e) {
        e = _e;
      }

      expect(contextStub).to.not.be.called;
      expect(contextLocationStub).to.not.be.called;
      expect(e.message).to.equal('ERROR_PARAMETERS');
    });

    it('should call getContext if the first arg is a callback', () => {
      contextStub.callsFake((callback) => {
        callback(STATUS.SUCCESS, 'matching-context');
      });

      const contextCallback = sinon.spy();
      Radar.getContext(contextCallback);

      expect(contextStub).to.have.callCount(1);
      expect(contextLocationStub).to.not.be.called;
      expect(contextCallback).to.be.calledWith(STATUS.SUCCESS, 'matching-context');
    });

    it('should call getContextWithLocation if the first arg is a location object', () => {
      contextLocationStub.callsFake(({ latitude, longitude }, callback) => {
        callback(STATUS.SUCCESS, 'matching-context');
      });

      const contextCallback = sinon.spy();
      Radar.getContext({ latitude, longitude }, contextCallback);

      expect(contextStub).to.not.be.called;
      expect(contextLocationStub).to.have.callCount(1);
      expect(contextCallback).to.be.calledWith(STATUS.SUCCESS, 'matching-context');
    });
  });

  context('searchPlaces', () => {
    let searchStub;
    let searchNearStub;

    beforeEach(() => {
      searchStub = sinon.stub(Search, 'searchPlaces');
      searchNearStub = sinon.stub(Search, 'searchPlacesNear');
    });

    afterEach(() => {
      Search.searchPlaces.restore();
      Search.searchPlacesNear.restore();
    });

    it('should throw an error if no callback provided', () => {
      let e;
      try {
        Radar.searchPlaces({
          radius: mockRadius,
          chains: mockChains,
          categories: [],
          groups: [],
          limit: mockLimit,
        });
      } catch (_e) {
        e = _e;
      }

      expect(searchStub).to.not.be.called;
      expect(searchNearStub).to.not.be.called;
      expect(e.message).to.equal('ERROR_PARAMETERS');
    });

    it('should call searchPlaces if near is not provided', () => {
      searchStub.callsFake(({ radius, chains, categories, groups, limit }, callback) => {
        callback(STATUS.SUCCESS, ['matching-places']);
      });

      const searchCallback = sinon.spy();
      Radar.searchPlaces(
        {
          radius: mockRadius,
          chains: mockChains,
          categories: [],
          groups: [],
          limit: mockLimit,
        },
        searchCallback,
      );

      expect(searchStub).to.have.callCount(1);
      expect(searchNearStub).to.not.be.called;
      expect(searchCallback).to.be.calledWith(STATUS.SUCCESS, ['matching-places']);
    });

    it('should call searchPlacesNear if near is provided', () => {
      searchNearStub.callsFake(({ near, radius, chains, categories, groups, limit}, callback) => {
        callback(STATUS.SUCCESS, ['matching-places']);
      });

      const searchCallback = sinon.spy();
      Radar.searchPlaces(
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

      expect(searchStub).to.not.be.called;
      expect(searchNearStub).to.have.callCount(1);
      expect(searchCallback).to.be.calledWith(STATUS.SUCCESS, ['matching-places']);
    });
  });

  context('searchGeofences', () => {
    let searchStub;
    let searchNearStub;

    beforeEach(() => {
      searchStub = sinon.stub(Search, 'searchGeofences');
      searchNearStub = sinon.stub(Search, 'searchGeofencesNear');
    });

    afterEach(() => {
      Search.searchGeofences.restore();
      Search.searchGeofencesNear.restore();
    });

    it('should throw an error if no callback provided', () => {
      let e;
      try {
        Radar.searchGeofences({
          radius: mockRadius,
          tags: [],
          limit: mockLimit,
        });
      } catch (_e) {
        e = _e;
      }

      expect(searchStub).to.not.be.called;
      expect(searchNearStub).to.not.be.called;
      expect(e.message).to.equal('ERROR_PARAMETERS');
    });

    it('should call searchGeofences if near is not provided', () => {
      searchStub.callsFake(({ radius, tags, limit }, callback) => {
        callback(STATUS.SUCCESS, ['matching-geofences']);
      });

      const searchCallback = sinon.spy();
      Radar.searchGeofences(
        {
          radius: mockRadius,
          tags: [],
          limit: mockLimit,
        },
        searchCallback,
      );

      expect(searchStub).to.have.callCount(1);
      expect(searchNearStub).to.not.be.called;
      expect(searchCallback).to.be.calledWith(STATUS.SUCCESS, ['matching-geofences']);
    });

    it('should call searchGeofencesNear if near is provided', () => {
      searchNearStub.callsFake(({ near, radius, tags, limit }, callback) => {
        callback(STATUS.SUCCESS, ['matching-geofences']);
      });

      const searchCallback = sinon.spy();
      Radar.searchGeofences(
        {
          near: { latitude, longitude },
          radius: mockRadius,
          tags: [],
          limit: mockLimit,
        },
        searchCallback,
      );

      expect(searchStub).to.not.be.called;
      expect(searchNearStub).to.have.callCount(1);
      expect(searchCallback).to.be.calledWith(STATUS.SUCCESS, ['matching-geofences']);
    });
  });

  context('autocomplete', () => {
    let searchStub;
    let searchNearStub;

    beforeEach(() => {
      searchStub = sinon.stub(Search, 'autocomplete');
      searchNearStub = sinon.stub(Search, 'autocompleteNear');
    });

    afterEach(() => {
      Search.autocomplete.restore();
      Search.autocompleteNear.restore();
    });

    it('should throw an error if no callback provided', () => {
      let e;
      try {
        Radar.autocomplete({
          query: mockQuery,
          limit: mockLimit,
        });
      } catch (_e) {
        e = _e;
      }

      expect(searchStub).to.not.be.called;
      expect(searchNearStub).to.not.be.called;
      expect(e.message).to.equal('ERROR_PARAMETERS');
    });

    it('should call autocomplete if near is not provided', () => {
      searchStub.callsFake(({ query, limit }, callback) => {
        callback(STATUS.SUCCESS, ['matching-addresses']);
      });

      const searchCallback = sinon.spy();
      Radar.autocomplete(
        {
          query: mockQuery,
          limit: mockLimit,
        },
        searchCallback,
      );

      expect(searchStub).to.have.callCount(1);
      expect(searchNearStub).to.not.be.called;
      expect(searchCallback).to.be.calledWith(STATUS.SUCCESS, ['matching-addresses']);
    });

    it('should call autocompleteNear if near is provided', () => {
      searchNearStub.callsFake(({ query, near, limit }, callback) => {
        callback(STATUS.SUCCESS, ['matching-addresses']);
      });

      const searchCallback = sinon.spy();
      Radar.autocomplete(
        {
          query: mockQuery,
          near: { latitude, longitude },
          limit: mockLimit,
        },
        searchCallback,
      );

      expect(searchStub).to.not.be.called;
      expect(searchNearStub).to.have.callCount(1);
      expect(searchCallback).to.be.calledWith(STATUS.SUCCESS, ['matching-addresses']);
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
      let e;
      try {
        Radar.geocode({ query: mockQuery });
      } catch (_e) {
        e = _e;
      }

      expect(geocodeStub).to.not.be.called;
      expect(e.message).to.equal('ERROR_PARAMETERS');
    });

    it('should call geocode on success', () => {
      geocodeStub.callsFake(({ query }, callback) => {
        callback(STATUS.SUCCESS, ['matching-addresses']);
      });

      const geocodeCallback = sinon.spy();
      Radar.geocode({ query: mockQuery }, geocodeCallback);

      expect(geocodeStub).to.have.callCount(1);
      expect(geocodeCallback).to.be.calledWith(STATUS.SUCCESS, ['matching-addresses']);
    });
  });

  context('reverseGeocode', () => {
    let geocodeStub;
    let geocodeLocationStub;

    beforeEach(() => {
      geocodeStub = sinon.stub(Geocoding, 'reverseGeocode');
      geocodeLocationStub = sinon.stub(Geocoding, 'reverseGeocodeLocation');
    });

    afterEach(() => {
      Geocoding.reverseGeocode.restore();
      Geocoding.reverseGeocodeLocation.restore();
    });

    it('should throw an error if no callback provided', () => {
      let e;
      try {
        Radar.reverseGeocode();
      } catch (_e) {
        e = _e;
      }

      expect(geocodeStub).to.not.be.called;
      expect(geocodeLocationStub).to.not.be.called;
      expect(e.message).to.equal('ERROR_PARAMETERS');
    });

    it('should call reverseGeocode if the first arg is a callback', () => {
      geocodeStub.callsFake((callback) => {
        callback(STATUS.SUCCESS, ['matching-addresses']);
      });

      const geocodeCallback = sinon.spy();
      Radar.reverseGeocode(geocodeCallback);

      expect(geocodeStub).to.have.callCount(1);
      expect(geocodeLocationStub).to.not.be.called;
      expect(geocodeCallback).to.be.calledWith(STATUS.SUCCESS, ['matching-addresses']);
    });

    it('should call reverseGeocodeLocation if the first arg is a location object', () => {
      geocodeLocationStub.callsFake(({ latitude, longitude }, callback) => {
        callback(STATUS.SUCCESS, ['matching-addresses']);
      });

      const geocodeCallback = sinon.spy();
      Radar.reverseGeocode({ latitude, longitude }, geocodeCallback);

      expect(geocodeStub).to.not.be.called;
      expect(geocodeLocationStub).to.have.callCount(1);
      expect(geocodeCallback).to.be.calledWith(STATUS.SUCCESS, ['matching-addresses']);
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
      let e;
      try {
        Radar.ipGeocode();
      } catch (_e) {
        e = _e;
      }

      expect(geocodeStub).to.not.be.called;
      expect(e.message).to.equal('ERROR_PARAMETERS');
    });

    it('should call ipGeocode on success', () => {
      geocodeStub.callsFake((callback) => {
        callback(STATUS.SUCCESS, 'matching-address');
      });

      const geocodeCallback = sinon.spy();
      Radar.ipGeocode(geocodeCallback);

      expect(geocodeStub).to.have.callCount(1);
      expect(geocodeCallback).to.be.calledWith(STATUS.SUCCESS, 'matching-address');
    });
  });

  context('getDistance', () => {
    let routingStub;
    let routingOriginStub;

    beforeEach(() => {
      routingStub = sinon.stub(Routing, 'getDistanceToDestination');
      routingOriginStub = sinon.stub(Routing, 'getDistanceWithOrigin');
    });

    afterEach(() => {
      Routing.getDistanceToDestination.restore();
      Routing.getDistanceWithOrigin.restore();
    });

    it('should throw an error if no callback provided', () => {
      let e;
      try {
        Radar.getDistance({
          destination,
          modes: mockModes,
          units: mockUnits,
        });
      } catch (_e) {
        e = _e;
      }

      expect(routingStub).to.not.be.called;
      expect(routingOriginStub).to.not.be.called;
      expect(e.message).to.equal('ERROR_PARAMETERS');
    });

    it('should call getDistanceToDestination if near is not provided', () => {
      routingStub.callsFake(({ destination, modes, units }, callback) => {
        callback(STATUS.SUCCESS, ['matching-routes']);
      });

      const routingCallback = sinon.spy();
      Radar.getDistance(
        {
          destination,
          modes: mockModes,
          units: mockUnits,
        },
        routingCallback,
      );

      expect(routingStub).to.have.callCount(1);
      expect(routingOriginStub).to.not.be.called;
      expect(routingCallback).to.be.calledWith(STATUS.SUCCESS, ['matching-routes']);
    });

    it('should call getDistanceWithOrigin if near is provided', () => {
      routingOriginStub.callsFake(({ origin, destination, modes, units }, callback) => {
        callback(STATUS.SUCCESS, ['matching-routes']);
      });

      const routingCallback = sinon.spy();
      Radar.getDistance(
        {
          origin: { latitude, longitude },
          destination,
          modes: mockModes,
          units: mockUnits,
        },
        routingCallback,
      );

      expect(routingStub).to.not.be.called;
      expect(routingOriginStub).to.have.callCount(1);
      expect(routingCallback).to.be.calledWith(STATUS.SUCCESS, ['matching-routes']);
    });
  });
});
