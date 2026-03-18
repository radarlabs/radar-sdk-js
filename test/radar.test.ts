import ConfigAPI from '../src/api/config';
import ContextAPI from '../src/api/context';
import Geocoding from '../src/api/geocoding';
import RoutingAPI from '../src/api/routing';
import SearchAPI from '../src/api/search';
import TrackAPI from '../src/api/track';
import Config from '../src/config';
import Radar from '../src/index';
import Navigator from '../src/navigator';
import Storage from '../src/storage';
import SDK_VERSION from '../src/version';
import { latitude, longitude } from './common';

import type {
  NavigatorPosition,
  RadarAddress,
  RadarAutocompleteResponse,
  RadarContextResponse,
  RadarEvent,
  RadarGeocodeResponse,
  RadarIPGeocodeResponse,
  RadarRouteResponse,
  RadarSearchGeofencesResponse,
  RadarSearchPlacesResponse,
  RadarTrackResponse,
  RadarTravelMode,
  RadarUser,
} from '../src/types';

describe('Radar', () => {
  const accuracy = 5;

  const user: RadarUser = {
    _id: 'test123',
    userId: 'track-user',
  };
  const events: RadarEvent[] = [
    {
      _id: 'event123',
      live: false,
      type: 'user.entered_geofence',
      confidence: 3,
    },
  ];

  // search
  const radius = 100;
  const chains = ['dunkin', 'sbucks'];
  const categories = ['coffee-shop'];
  const groups = ['airport'];
  const tags = ['geofence-tags'];
  const limit = 50;

  // geocoding
  const query = 'mock-query';
  const addresses: RadarAddress[] = [{ geometry: { type: 'Point', coordinates: [0, 0] }, latitude, longitude }];

  // routing
  const destination = {
    latitude: 40.7032123,
    longitude: -73.9936137,
  };
  const modes: RadarTravelMode[] = ['foot', 'bike', 'car'];
  const units = 'imperial';

  describe('initialize', () => {
    beforeEach(() => {
      window.RADAR_TEST_ENV = false;
    });

    afterEach(() => {
      window.RADAR_TEST_ENV = true;
      jest.restoreAllMocks();
    });

    describe('no key is provided', () => {
      it('should throw RadarPublishableKeyError', () => {
        let err;
        try {
          Radar.initialize('');
          throw new Error('Should not succeed.');
        } catch (caught: any) {
          err = caught;
        } finally {
          expect(err).toBeDefined();
          expect(err.name).toEqual('RadarPublishableKeyError');
          expect(err.message).toEqual('Publishable key or authToken required in initialization.');
        }
      });
    });

    describe('secret key is provided', () => {
      it('should throw RadarPublishableKeyError', () => {
        let err;
        try {
          Radar.initialize('_my_test_sk_123');
          throw new Error('Should not succeed.');
        } catch (caught: any) {
          err = caught;
        } finally {
          expect(err).toBeDefined();
          expect(err.name).toEqual('RadarPublishableKeyError');
          expect(err.message).toEqual('Secret keys are not allowed. Please use your Radar publishable key.');
        }
      });
    });

    describe('test publishableKey is provided', () => {
      it('should initialize SDK in a test environment', () => {
        jest.spyOn(ConfigAPI, 'getConfig');
        Radar.initialize('_my_test_pk_123');
        const options = Config.get();
        expect(options.publishableKey).toEqual('_my_test_pk_123');
        expect(options.live).toEqual(false);
        expect(ConfigAPI.getConfig).toHaveBeenCalledTimes(1);
      });
    });

    describe('live publishableKey is provided', () => {
      it('should initialize SDK in a live environment', () => {
        jest.spyOn(ConfigAPI, 'getConfig');
        Radar.initialize('_my_live_pk_123');
        const options = Config.get();
        expect(options.publishableKey).toEqual('_my_live_pk_123');
        expect(options.live).toEqual(true);
        expect(ConfigAPI.getConfig).toHaveBeenCalledTimes(1);
      });
    });

    describe('authToken initialization', () => {
      it('should initialize SDK with authToken (defaults to non-debug)', () => {
        Radar.initialize({ authToken: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.abc123' });
        const options = Config.get();
        expect(options.authToken).toEqual('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.abc123');
        expect(options.debug).toEqual(false);
        expect(options.logLevel).toEqual('error');
        expect(options.live).toEqual(false);
        expect(options.publishableKey).toBeUndefined();
      });

      it('should initialize SDK with authToken and debug: true', () => {
        Radar.initialize({ authToken: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.abc123', debug: true });
        const options = Config.get();
        expect(options.authToken).toEqual('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.abc123');
        expect(options.debug).toEqual(true);
        expect(options.logLevel).toEqual('debug');
      });

      it('should throw when both authToken and publishableKey provided via options', () => {
        let err: any;
        try {
          // @ts-expect-error testing runtime guard for invalid combination
          Radar.initialize({
            authToken: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.abc123',
            publishableKey: '_my_test_pk_123',
          });
          throw new Error('Should not succeed.');
        } catch (caught: any) {
          err = caught;
        } finally {
          expect(err).toBeDefined();
          expect(err.name).toEqual('RadarPublishableKeyError');
          expect(err.message).toEqual('Token and publishableKey are mutually exclusive.');
        }
      });

      it('should throw when both authToken and publishableKey provided via string + options', () => {
        let err: any;
        try {
          Radar.initialize('_my_test_pk_123', { authToken: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.abc123' });
          throw new Error('Should not succeed.');
        } catch (caught: any) {
          err = caught;
        } finally {
          expect(err).toBeDefined();
          expect(err.name).toEqual('RadarPublishableKeyError');
          expect(err.message).toEqual('Token and publishableKey are mutually exclusive.');
        }
      });

      it('should throw on invalid authToken format', () => {
        let err: any;
        try {
          Radar.initialize({ authToken: 'not-a-jwt' });
          throw new Error('Should not succeed.');
        } catch (caught: any) {
          err = caught;
        } finally {
          expect(err).toBeDefined();
          expect(err.name).toEqual('RadarPublishableKeyError');
          expect(err.message).toEqual('Invalid authToken format. Expected a JWT.');
        }
      });

      it('should throw on authToken with empty segments', () => {
        let err: any;
        try {
          Radar.initialize({ authToken: 'a..b' });
          throw new Error('Should not succeed.');
        } catch (caught: any) {
          err = caught;
        } finally {
          expect(err).toBeDefined();
          expect(err.name).toEqual('RadarPublishableKeyError');
          expect(err.message).toEqual('Invalid authToken format. Expected a JWT.');
        }
      });

      it('should support initialize({ publishableKey }) object form', () => {
        jest.spyOn(ConfigAPI, 'getConfig');
        Radar.initialize({ publishableKey: '_my_test_pk_123' });
        const options = Config.get();
        expect(options.publishableKey).toEqual('_my_test_pk_123');
        expect(options.live).toEqual(false);
      });

      it('should throw when options object has neither authToken nor publishableKey', () => {
        let err: any;
        try {
          // @ts-expect-error testing runtime guard for missing credentials
          Radar.initialize({});
          throw new Error('Should not succeed.');
        } catch (caught: any) {
          err = caught;
        } finally {
          expect(err).toBeDefined();
          expect(err.name).toEqual('RadarPublishableKeyError');
          expect(err.message).toEqual('Publishable key or authToken required in initialization.');
        }
      });

      it('should clear authToken state via Radar.clear()', () => {
        Radar.initialize({ authToken: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.abc123' });
        Radar.clear();
        const options = Config.get();
        expect(options.authToken).toBeUndefined();
      });
    });
  });

  describe('clear', () => {
    it('should clear any saved options', () => {
      Radar.initialize('_my_live_pk_123');
      let options = Config.get();
      expect(options.publishableKey).toEqual('_my_live_pk_123');
      expect(options.live).toEqual(true);

      Radar.clear();
      options = Config.get();
      expect(options.publishableKey).toBeUndefined();
      expect(options.live).toBeUndefined();
    });
  });

  describe('VERSION', () => {
    it('should return sdk version', () => {
      expect(Radar.VERSION).toEqual(SDK_VERSION);
    });
  });

  describe('setUserId', () => {
    describe('no userId given', () => {
      it('should delete userId from storage', () => {
        jest.spyOn(Storage, 'removeItem');
        Radar.setUserId();
        expect(Storage.removeItem).toHaveBeenCalledWith(Storage.USER_ID);
        expect(Storage.getItem(Storage.USER_ID)).toBeNull();
      });
    });

    describe('userId given', () => {
      it('should save userId in storage', () => {
        jest.spyOn(Storage, 'setItem');
        const userId = 'abc123';
        Radar.setUserId(userId);
        expect(Storage.setItem).toHaveBeenCalledWith(Storage.USER_ID, userId);
        expect(Storage.getItem(Storage.USER_ID)).toEqual('abc123');
      });
    });
  });

  describe('setDescription', () => {
    describe('no description given', () => {
      it('should delete description from storage', () => {
        jest.spyOn(Storage, 'removeItem');
        Radar.setDescription();
        expect(Storage.removeItem).toHaveBeenCalledWith(Storage.DESCRIPTION);
        expect(Storage.getItem(Storage.DESCRIPTION)).toBeNull();
      });
    });

    describe('description given', () => {
      it('should save description in storage', () => {
        jest.spyOn(Storage, 'setItem');
        const description = 'abc123';
        Radar.setDescription(description);
        expect(Storage.setItem).toHaveBeenCalledWith(Storage.DESCRIPTION, description);
        expect(Storage.getItem(Storage.DESCRIPTION)).toEqual('abc123');
      });
    });
  });

  describe('setMetadata', () => {
    describe('no metadata given', () => {
      it('should delete metadata from storage', () => {
        jest.spyOn(Storage, 'removeItem');
        Radar.setMetadata();
        expect(Storage.removeItem).toHaveBeenCalledWith(Storage.METADATA);
        expect(Storage.getItem(Storage.METADATA)).toBeNull();
      });
    });

    describe('metadata given', () => {
      it('should save metadata in storage', () => {
        jest.spyOn(Storage, 'setItem');
        const metadata = { meta: 'mock-metadata' };
        Radar.setMetadata(metadata);
        expect(Storage.setItem).toHaveBeenCalledWith(Storage.METADATA, JSON.stringify(metadata));
        expect(Storage.getItem(Storage.METADATA)).toEqual(JSON.stringify(metadata));
      });
    });
  });

  describe('getLocation', () => {
    let navigatorStub: jest.SpyInstance<Promise<NavigatorPosition>>;

    beforeEach(() => {
      navigatorStub = jest.spyOn(Navigator, 'getCurrentPosition');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should propagate the err if not successful', async () => {
      navigatorStub.mockRejectedValue('ERROR_LOCATION');

      let err;
      try {
        await Radar.getLocation();
      } catch (caught: any) {
        err = caught;
      } finally {
        expect(err).toEqual('ERROR_LOCATION');
      }
    });

    it('should succeed', async () => {
      navigatorStub.mockResolvedValue({ latitude, longitude, accuracy });

      const response = await Radar.getLocation();
      expect(response.latitude).toEqual(latitude);
      expect(response.longitude).toEqual(longitude);
      expect(response.accuracy).toEqual(accuracy);
    });
  });

  describe('trackOnce', () => {
    let trackStub: jest.SpyInstance<Promise<RadarTrackResponse>>;

    beforeEach(() => {
      trackStub = jest.spyOn(TrackAPI, 'trackOnce');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should call trackOnce if the first arg is a callback', async () => {
      trackStub.mockResolvedValue({
        location: { latitude, longitude, accuracy },
        user,
        events,
      });

      const response = await Radar.trackOnce();
      expect(response.location).toEqual({ latitude, longitude, accuracy });
      expect(response.user).toEqual(user);
      expect(response.events).toEqual(events);
    });

    it('should call trackOnce if the first arg is a location object', async () => {
      trackStub.mockResolvedValue({
        location: { latitude, longitude, accuracy },
        user,
        events,
      });

      const response = await Radar.trackOnce({ latitude, longitude, accuracy });
      expect(response.location).toEqual({ latitude, longitude, accuracy });
      expect(response.user).toEqual(user);
      expect(response.events).toEqual(events);
    });

    it('should not throw an error if no callback given', async () => {
      trackStub.mockResolvedValue({
        location: { latitude, longitude, accuracy },
        user,
        events,
      });

      void (await Radar.trackOnce());
    });
  });

  describe('getContext', () => {
    let contextStub: jest.SpyInstance<Promise<RadarContextResponse>>;

    beforeEach(() => {
      contextStub = jest.spyOn(ContextAPI, 'getContext');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should call getContext if the first arg is a callback', async () => {
      contextStub.mockResolvedValue({});
      // TODO(jasonl): replace as any with the proper typing after typing is fixed
      const response = await Radar.getContext({} as any);
      expect(response).toEqual({});
    });

    it('should call getContext if the first arg is a location', async () => {
      contextStub.mockResolvedValue({});
      const response = await Radar.getContext({ latitude, longitude });
      expect(response).toEqual({});
    });
  });

  describe('searchPlaces', () => {
    let searchStub: jest.SpyInstance<Promise<RadarSearchPlacesResponse>>;

    beforeEach(() => {
      searchStub = jest.spyOn(SearchAPI, 'searchPlaces');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should call searchPlaces', async () => {
      searchStub.mockResolvedValue({ places: [] });

      const response = await Radar.searchPlaces({ radius, chains, categories, groups, limit });
      expect(response.places).toEqual([]);
    });
  });

  describe('searchGeofences', () => {
    let searchStub: jest.SpyInstance<Promise<RadarSearchGeofencesResponse>>;

    beforeEach(() => {
      searchStub = jest.spyOn(SearchAPI, 'searchGeofences');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should call searchGeofences', async () => {
      searchStub.mockResolvedValue({ geofences: [] });

      const response = await Radar.searchGeofences({ radius, tags, limit });
      expect(response.geofences).toEqual([]);
    });
  });

  describe('autocomplete', () => {
    let searchStub: jest.SpyInstance<Promise<RadarAutocompleteResponse>>;

    beforeEach(() => {
      searchStub = jest.spyOn(SearchAPI, 'autocomplete');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should call autocomplete', async () => {
      searchStub.mockResolvedValue({ addresses });

      const response = await Radar.autocomplete({ query, limit });
      expect(response.addresses).toEqual(addresses);
    });
  });

  describe('forwardGeocode', () => {
    let geocodeStub: jest.SpyInstance<Promise<RadarGeocodeResponse>>;

    beforeEach(() => {
      geocodeStub = jest.spyOn(Geocoding, 'forwardGeocode');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should call forward geocode', async () => {
      geocodeStub.mockResolvedValue({ addresses });

      const response = await Radar.forwardGeocode({ query });
      expect(response.addresses).toEqual(addresses);
    });
  });

  describe('reverseGeocode', () => {
    let geocodeStub: jest.SpyInstance<Promise<RadarGeocodeResponse>>;

    beforeEach(() => {
      geocodeStub = jest.spyOn(Geocoding, 'reverseGeocode');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should call reverseGeocode if arg is empty object', async () => {
      geocodeStub.mockResolvedValue({ addresses: [] });

      const response = await Radar.reverseGeocode({});
      expect(response.addresses).toEqual([]);
    });

    it('should call reverseGeocodeLocation if the first arg is a location object', async () => {
      geocodeStub.mockResolvedValue({ addresses: [] });

      const response = await Radar.reverseGeocode({ latitude, longitude });
      expect(response.addresses).toEqual([]);
    });
  });

  describe('ipGeocode', () => {
    let geocodeStub: jest.SpyInstance<Promise<RadarIPGeocodeResponse>>;

    beforeEach(() => {
      geocodeStub = jest.spyOn(Geocoding, 'ipGeocode');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should call ipGeocode if the first arg is a callback', async () => {
      geocodeStub.mockResolvedValue({ ip: 'matching-ip' });

      const response = await Radar.ipGeocode();
      expect(response.ip).toEqual('matching-ip');
    });
  });

  describe('getDistance', () => {
    let routingStub: jest.SpyInstance<Promise<RadarRouteResponse>>;

    beforeEach(() => {
      routingStub = jest.spyOn(RoutingAPI, 'distance');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should call getDistanceToDestination', async () => {
      routingStub.mockResolvedValue({ routes: { geodesic: {} } });

      const response = await Radar.distance({ destination, modes, units });
      expect(response.routes).toEqual({ geodesic: {} });
    });
  });
});
