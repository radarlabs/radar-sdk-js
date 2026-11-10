import Track from '../../src/api/track';
import Radar from '../../src/index';
import { nycOffice, enableLocation, mockRequest } from '../utils';

import type { RadarTrackResponse } from '../../src/types';

describe('Track', () => {
  describe('trackOnce', () => {
    const mockResponse: RadarTrackResponse = {
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

    describe('SDK not initialized', () => {
      beforeEach(() => {
        enableLocation(nycOffice);
      });

      it('should throw a publishableKey error', async () => {
        let err;
        try {
          await Track.trackOnce({});
          throw new Error('Test did not throw expected error.');
        } catch (caught: any) {
          err = caught;
        } finally {
          expect(err).toBeDefined();
          expect(err.name).toEqual('RadarPublishableKeyError');
          expect(err.message).toEqual('publishableKey or authToken not set.');
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
        let err;
        try {
          await Track.trackOnce({});
          throw new Error('Test did not throw expected error.');
        } catch (caught: any) {
          err = caught;
        } finally {
          expect(err).toBeDefined();
          expect(err.name).toEqual('RadarPermissionsError');
          expect(err.message).toEqual('Location permissions denied.');
          expect(err.status).toEqual('ERROR_PERMISSIONS');
        }
      });
    });

    describe('Location permissions approved', () => {
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

      it('keeps public Track metadata and nearby results', async () => {
        const publicFields = {
          meta: { code: 200, requestId: 'track-request' },
          nearbyGeofences: [{ _id: 'nearby-geofence', type: 'circle', geometryRadius: 100 }],
          nearbyBeaconRegions: [{ uuid: 'beacon-uuid', metadata: '{}', major: '1' }],
          inAppMessages: [
            { title: { text: 'Nearby', color: '#000000' }, body: { text: 'Welcome', color: '#000000' }, metadata: {} },
          ],
          locationMetadata: { activityType: 'walking' },
        };
        mockRequest(200, { ...mockResponse, ...publicFields });
        expect(await Track.trackOnce({ userId: 'test-user' })).toMatchObject(publicFields);
      });
    });

    describe('Position overrides provided', () => {
      const positionSpy = jest.fn();

      beforeEach(() => {
        Radar.initialize('prj_test_pk_123', { desiredAccuracy: 'high' });
        enableLocation(nycOffice, positionSpy);
        mockRequest(200, mockResponse);
      });

      afterEach(() => {
        Radar.clear();
      });

      it('it should use the position overrides provided to trackOnce', async () => {
        await Track.trackOnce({
          userId: 'test-user',
          tripOptions: {
            externalId: 'test-trip',
            mode: 'car',
          },
          desiredAccuracy: 'low',
        });
        expect(positionSpy).toHaveBeenCalled();
        const positionArgs = positionSpy.mock.calls[0][0];
        expect(positionArgs.enableHighAccuracy).toEqual(false);
      });
    });
  });
});
