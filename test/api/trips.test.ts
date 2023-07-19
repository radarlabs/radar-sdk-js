import Http from '../../src/http';

import Trips from '../../src/api/trips';
import Radar from '../../src';
import { RadarTripOptions } from '../../src/types';
import { mockRequest } from '../utils';
import Storage from '../../src/storage';

describe('Trips', () => {
  const userId = 'user-id';

  beforeEach(() => {
    Radar.initialize('prj_test_pk_123');
    Radar.setUserId(userId);
    jest.spyOn(Http, 'request');
  });

  afterEach(() => {
    Radar.clear();
    jest.restoreAllMocks();
  });

  describe('startTrip', () => {

    describe('called without tripOptions', () => {
      it('should include tripOptions each set to unknown', async () => {
        mockRequest(200, {});
        await Trips.startTrip({});

        expect(Http.request).toHaveBeenCalledTimes(1);
        expect(Http.request).toHaveBeenCalledWith({
          method: 'POST',
          path: 'trips',
          data: {
            userId,
            destinationGeofenceTag: undefined,
            destinationGeofenceExternalId: undefined,
            externalId: undefined,
            metadata: undefined,
            mode: undefined,
            approachingThreshold: undefined,
            scheduledArrivalAt: undefined,
          }
        });
      });
    });

    describe('called with tripOptions', () => {
      it('should include tripOptions', async () => {
        const externalId = 'trip-abc-123';
        const scheduledArrivalAt = new Date();
        const tripOptions: RadarTripOptions = {
          externalId,
          destinationGeofenceTag: 'store',
          destinationGeofenceExternalId: '123',
          mode: 'car',
          metadata: { car: 'red jeep' },
          approachingThreshold: 3,
          scheduledArrivalAt,
        };

        mockRequest(200, {});
        await Trips.startTrip(tripOptions);
        expect(Http.request).toHaveBeenCalledTimes(1);
        expect(Http.request).toHaveBeenCalledWith({
          method: 'POST',
          path: 'trips',
          data: {
            userId,
            ...tripOptions,
            scheduledArrivalAt: scheduledArrivalAt.toJSON(),
          }
        });
      });
    });

    describe('called with userId set', () => {
      it('should include userId', async () => {
        const externalId = 'trip-abc-123';
        const scheduledArrivalAt = new Date();
        const tripOptions: RadarTripOptions = {
          externalId,
          destinationGeofenceTag: 'store',
          destinationGeofenceExternalId: '123',
          mode: 'car',
          metadata: { car: 'red jeep' },
          approachingThreshold: 3,
          scheduledArrivalAt,
        };

        mockRequest(200, {});
        await Trips.startTrip(tripOptions)
        expect(Http.request).toHaveBeenCalledTimes(1);
        expect(Http.request).toHaveBeenCalledWith({
          method: 'POST',
          path: 'trips',
          data: {
            userId,
            ...tripOptions,
            scheduledArrivalAt: scheduledArrivalAt.toJSON(),
          }
        });
      });
    });

    describe('called with userId not set', () => {
      it('should have userId set to null', async () => {
        const externalId = 'trip-abc-123';
        const scheduledArrivalAt = new Date();
        const tripOptions: RadarTripOptions = {
          externalId,
          destinationGeofenceTag: 'store',
          destinationGeofenceExternalId: '123',
          mode: 'car',
          metadata: { car: 'red jeep' },
          approachingThreshold: 3,
          scheduledArrivalAt,
        };

        Radar.setUserId();
        mockRequest(200, {});
        await Trips.startTrip(tripOptions)

        expect(Http.request).toHaveBeenCalledTimes(1);
        expect(Http.request).toHaveBeenCalledWith({
          method: 'POST',
          path: 'trips',
          data: {
            userId: null,
            ...tripOptions,
            scheduledArrivalAt: scheduledArrivalAt.toJSON(),
          }
        });
      });
    });

    describe('called with an invalid date for scheduledArrivalAt', () => {
      it('should have scheduledArrivalAt set to undefined', async () => {
        const externalId = 'trip-abc-123';
        const scheduledArrivalAt = '123456';
        const tripOptions: RadarTripOptions = {
          userId,
          externalId,
          destinationGeofenceTag: 'store',
          destinationGeofenceExternalId: '123',
          mode: 'car',
          metadata: { car: 'red jeep' },
          approachingThreshold: 3,
          // @ts-expect-error
          scheduledArrivalAt,
        };

        mockRequest(200, {});
        await Trips.startTrip(tripOptions)
        expect(Http.request).toHaveBeenCalledTimes(1);
        expect(Http.request).toHaveBeenCalledWith({
          method: 'POST',
          path: 'trips',
          data: {
            ...tripOptions,
            scheduledArrivalAt: undefined,
          }
        });
      });
    });
  });

  describe('updateTrip', () => {
    beforeEach(() => {
      jest.spyOn(Http, 'request');
    });

    describe('called without status', () => {
      it('should include status undefined', async () => {
        const externalId = 'trip-abc-123';
        const scheduledArrivalAt = new Date();
        const tripOptions: RadarTripOptions = {
          externalId,
          destinationGeofenceTag: 'store',
          destinationGeofenceExternalId: '123',
          mode: 'car',
          approachingThreshold: 3,
          scheduledArrivalAt,
        };

        mockRequest(200, {});
        await Trips.updateTrip(tripOptions)
        expect(Http.request).toHaveBeenCalledTimes(1);
        expect(Http.request).toHaveBeenCalledWith({
          method: 'PATCH',
          path: `trips/${externalId}/update`,
          data: {
            destinationGeofenceTag: 'store',
            destinationGeofenceExternalId: '123',
            externalId,
            metadata: undefined,
            mode: 'car',
            status: undefined,
            approachingThreshold: 3,
            scheduledArrivalAt: scheduledArrivalAt.toJSON(),
          }
        });
      });
    });

    describe('called with status', () => {
      it('should include status', async () => {
        const externalId = 'trip-abc-123';
        const scheduledArrivalAt = new Date();
        const tripOptions: RadarTripOptions = {
          externalId,
          destinationGeofenceTag: 'store',
          destinationGeofenceExternalId: '123',
          mode: 'car',
          metadata: { car: 'red jeep' },
          approachingThreshold: 3,
          scheduledArrivalAt,
        };

        const status = 'started';

        mockRequest(200, {});
        await Trips.updateTrip(tripOptions, status)
        expect(Http.request).toHaveBeenCalledTimes(1);
        expect(Http.request).toHaveBeenCalledWith({
          method: 'PATCH',
          path: `trips/${externalId}/update`,
          data: {
            destinationGeofenceTag: 'store',
            destinationGeofenceExternalId: '123',
            externalId,
            metadata: { car: 'red jeep' },
            mode: 'car',
            status: 'started',
            approachingThreshold: 3,
            scheduledArrivalAt: scheduledArrivalAt.toJSON(),
          }
        });
      });
    });

    describe('called with an invalid date for scheduledArrivalAt', () => {
      it('should have scheduledArrivalAt set to undefined', async () => {
        const externalId = 'trip-abc-123';
        const scheduledArrivalAt = '123456';
        const tripOptions: RadarTripOptions = {
          externalId,
          destinationGeofenceTag: 'store',
          destinationGeofenceExternalId: '123',
          mode: 'car',
          metadata: { car: 'red jeep' },
          approachingThreshold: 3,
          // @ts-expect-error
          scheduledArrivalAt: scheduledArrivalAt,
        };

        const status = 'started';

        mockRequest(200, {});
        await Trips.updateTrip(tripOptions, status)
        expect(Http.request).toHaveBeenCalledTimes(1);
        expect(Http.request).toHaveBeenCalledWith({
          method: 'PATCH',
          path: `trips/${externalId}/update`,
          data: {
            ...tripOptions,
            status: 'started',
            scheduledArrivalAt: undefined,
          }
        });
      });
    });
  });
});