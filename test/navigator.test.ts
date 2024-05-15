import Config from '../src/config';
import Storage from '../src/storage';
import Navigator from '../src/navigator';

import { nycOffice, enableLocation } from './utils';

describe('Navigator', () => {
  describe('getCurrentPosition', () => {
    describe('location permissions denied', () => {
      it('should throw a RadarPermissionsError', async () => {
        try {
          await Navigator.getCurrentPosition();
          throw new Error('Response should not succeed.');
        } catch (err: any) {
          expect(err.name).toEqual('RadarPermissionsError');
          expect(err.message).toEqual('Location permissions denied.');
          expect(err.status).toEqual('ERROR_PERMISSIONS');
        }
      });
    });

    describe('location permissions approved', () => {
      beforeEach(() => {
        enableLocation(nycOffice);
      });

      it('should return a position', async () => {
        const position = await Navigator.getCurrentPosition();
        expect(position.latitude).toEqual(nycOffice.latitude);
        expect(position.longitude).toEqual(nycOffice.longitude);
        expect(position.accuracy).toEqual(nycOffice.accuracy);
      });
    });
  });

  describe('cacheLocationMinutes', () => {
    beforeEach(() => {
      Config.setup({ cacheLocationMinutes: 1 });
      enableLocation(nycOffice);
    });

    afterAll(() => {
      Config.setup();
      jest.restoreAllMocks();
    });

    it('should cache and re-use the location if set', async () => {
      await Navigator.getCurrentPosition();

      // check location was cached
      const cachedLocation = Storage.getJSON(Storage.CACHED_LOCATION);
      expect(cachedLocation.latitude).toEqual(nycOffice.latitude);
      expect(cachedLocation.longitude).toEqual(nycOffice.longitude);

      // check chached version was returned and getCurrentPosition not called
      const spy = jest.spyOn(window.navigator.geolocation, 'getCurrentPosition');
      const cachedResponse = await Navigator.getCurrentPosition();
      expect(spy).not.toHaveBeenCalled();
      expect(cachedResponse.latitude).toEqual(nycOffice.latitude);
      expect(cachedResponse.longitude).toEqual(nycOffice.longitude);
    });
  });
});
