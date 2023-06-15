import Radar from '../src/index';
import Track from '../src/api/track';

import { RadarTrackResponse } from '../src/types';
import { nycOffice, enableLocation, mockRequest } from './utils';

describe('Track', () => {
  describe('trackOnce', () => {
    describe('SDK not initialized', () => {
      beforeEach(() => {
        enableLocation(nycOffice);
      });

      it('should throw a publishableKey error', async () => {
        try {
          await Track.trackOnce({});
          throw new Error('Test did not throw expected error.');
        } catch (err: any) {
          expect(err.name).toEqual('RadarPublishableKeyError');
          expect(err.message).toEqual('publishableKey not set.');
          expect(err.status).toEqual('ERROR_PUBLISHABLE_KEY');
        }
      });
    });

    describe('Location permissions denied', () => {
      beforeEach(() => {
        Radar.initialize('prj_test_pk_123');
      });

      afterEach(() => {
        Radar.clear();
      });

      it('should throw a permissions denied error', async () => {
        try {
          await Track.trackOnce({});
          throw new Error('Test did not throw expected error.');
        } catch (err: any) {
          expect(err.name).toEqual('RadarLocationPermissionsError');
          expect(err.message).toEqual('Permission denied.');
          expect(err.status).toEqual('ERROR_LOCATION');
        }
      });
    });

    describe('Location permissions approved', () => {
      let mockResponse: RadarTrackResponse = {
        user: {
          _id: 'test123',
          userId: 'track-user',
        },
        events: [
          {
            _id: 'event123',
            live: false,
            type: 'user.entered_geofence',
            confidence: 3,
          },
        ],
      };

      beforeEach(() => {
        Radar.initialize('prj_test_pk_123');
        enableLocation(nycOffice);
        mockRequest(200, mockResponse);
      });

      afterEach(() => {
        Radar.clear();
      });

      it('should call track with the users location and get a response', async () => {
        const trackRes = await Track.trackOnce({
          userId: 'test-user',
          tripOptions: {
            externalId: 'test-trip',
            mode: 'car',
          },
        });
        expect(trackRes.user).toEqual(mockResponse.user);
        expect(trackRes.events).toEqual(mockResponse.events);
        expect(trackRes.location).toEqual(nycOffice);
      });
    });
  });
});
