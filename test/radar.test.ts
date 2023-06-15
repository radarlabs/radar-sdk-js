import Config from '../src/config';
import Radar from '../src/index';
import Storage from '../src/storage';

describe('Radar', () => {
  describe('initialize', () => {
    describe('no key is provided', () => {
      it('should throw RadarPublishableKeyError', () => {
        try {
          Radar.initialize('');
          throw new Error('Should not succeed.');
        } catch (err: any) {
          expect(err.name).toEqual('RadarPublishableKeyError');
          expect(err.message).toEqual('Publishable key required in initialization.');
        }
      });
    });

    describe('secret key is provided', () => {
      it('should throw RadarPublishableKeyError', () => {
        try {
          Radar.initialize('_my_test_sk_123');
          throw new Error('Should not succeed.');
        } catch (err: any) {
          expect(err.name).toEqual('RadarPublishableKeyError');
          expect(err.message).toEqual('Secret keys are not allowed. Please use your Radar publishable key.');
        }
      });
    });

    describe('test publishableKey is provided', () => {
      it('should initialize SDK in a test environment', () => {
        Radar.initialize('_my_test_pk_123');
        const options = Config.get();
        expect(options.publishableKey).toEqual('_my_test_pk_123');
        expect(options.live).toEqual(false);
      });
    });

    describe('live publishableKey is provided', () => {
      it('should initialize SDK in a live environment', () => {
        Radar.initialize('_my_live_pk_123');
        const options = Config.get();
        expect(options.publishableKey).toEqual('_my_live_pk_123');
        expect(options.live).toEqual(true);
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

  describe('user identification setters', () => {
    // userId
    expect(Storage.getItem(Storage.USER_ID)).toBeNull();
    Radar.setUserId('test-user-id');
    expect(Storage.getItem(Storage.USER_ID)).toEqual('test-user-id');

    // description
    expect(Storage.getItem(Storage.DESCRIPTION)).toBeNull();
    Radar.setDescription('test-user-description');
    expect(Storage.getItem(Storage.DESCRIPTION)).toEqual('test-user-description');

    // metadata
    expect(Storage.getItem(Storage.METADATA)).toBeNull();
    Radar.setMetadata({ foo: 'bar' });
    expect(Storage.getItem(Storage.METADATA)).toEqual(JSON.stringify({ foo: 'bar' }));
  });
});
