const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import Storage from '../../src/storage';
import Http from '../../src/http';

import Trips from '../../src/api/trips';

import { TRIP_STATUS } from '../../src/tripStatus';

describe('Trips', () => {
  let httpStub;
  let getItemStub;

  const userId = 'user-id';

  beforeEach(() => {
    httpStub = sinon.stub(Http, 'request');
    getItemStub = sinon.stub(Storage, 'getItem');
    getItemStub.withArgs(Storage.BASE_API_PATH).returns(null);
    getItemStub.withArgs(Storage.USER_ID).returns(userId);
  });

  afterEach(() => {
    Http.request.restore();
    Storage.getItem.restore();
  });

  context('startTrip', () => {
    describe('called without tripOptions', () => {
      it('should include tripOptions each set to unknown', () => {
        return Trips.startTrip()
          .then(() => {
            expect(httpStub).to.have.callCount(1);
            expect(httpStub).to.have.been.calledWith('POST', 'trips', {
              userId,
              destinationGeofenceTag: undefined,
              destinationGeofenceExternalId: undefined,
              externalId: undefined,
              metadata: undefined,
              mode: undefined,
              approachingThreshold: undefined,
              scheduledArrivalAt: undefined,
           });
          });
      });
    });

    describe('called with tripOptions', () => {
      it('should include tripOptions', () => {
        const externalId = 'trip-abc-123';
        const scheduledArrivalAt = new Date();
        const tripOptions = {
          externalId,
          destinationGeofenceTag: 'store',
          destinationGeofenceExternalId: '123',
          mode: 'car',
          metadata: { car: 'red jeep' },
          approachingThreshold: 3,
          scheduledArrivalAt,
        };

        return Trips.startTrip(tripOptions)
          .then(() => {
            expect(httpStub).to.have.callCount(1);
            expect(httpStub).to.have.been.calledWith('POST', 'trips', {
              userId,
              ...tripOptions,
              scheduledArrivalAt: scheduledArrivalAt.toJSON(),
           });
          });
      });
    });

    describe('called with userId set', () => {
      it('should include userId', () => {
        const externalId = 'trip-abc-123';
        const scheduledArrivalAt = new Date();
        const tripOptions = {
          externalId,
          destinationGeofenceTag: 'store',
          destinationGeofenceExternalId: '123',
          mode: 'car',
          metadata: { car: 'red jeep' },
          approachingThreshold: 3,
          scheduledArrivalAt,
        };

        return Trips.startTrip(tripOptions)
          .then(() => {
            expect(httpStub).to.have.callCount(1);
            expect(httpStub).to.have.been.calledWith('POST', 'trips', {
              userId,
              ...tripOptions,
              scheduledArrivalAt: scheduledArrivalAt.toJSON(),
           });
          });
      });
    });

    describe('called with userId not set', () => {
      it('should have userId set to undefined', () => {
        getItemStub.withArgs(Storage.USER_ID).returns(undefined);

        const externalId = 'trip-abc-123';
        const scheduledArrivalAt = new Date();
        const tripOptions = {
          externalId,
          destinationGeofenceTag: 'store',
          destinationGeofenceExternalId: '123',
          mode: 'car',
          metadata: { car: 'red jeep' },
          approachingThreshold: 3,
          scheduledArrivalAt,
        };

        return Trips.startTrip(tripOptions)
          .then(() => {
            expect(httpStub).to.have.callCount(1);
            expect(httpStub).to.have.been.calledWith('POST', 'trips', {
              userId: undefined,
              ...tripOptions,
              scheduledArrivalAt: scheduledArrivalAt.toJSON(),
           });
          });
      });
    });

    describe('called with an invalid date for scheduledArrivalAt', () => {
      it('should have scheduledArrivalAt set to undefined', () => {
        const externalId = 'trip-abc-123';
        const scheduledArrivalAt = '123456';
        const tripOptions = {
          userId,
          externalId,
          destinationGeofenceTag: 'store',
          destinationGeofenceExternalId: '123',
          mode: 'car',
          metadata: { car: 'red jeep' },
          approachingThreshold: 3,
          scheduledArrivalAt,
        };

        return Trips.startTrip(tripOptions)
          .then(() => {
            expect(httpStub).to.have.callCount(1);
            expect(httpStub).to.have.been.calledWith('POST', 'trips', {
              ...tripOptions,
              scheduledArrivalAt: undefined,
           });
          });
      });
    });
  });

  context('updateTrip', () => {
    describe('called without status', () => {
      it('should include status unknown', () => {
        const externalId = 'trip-abc-123';
        const scheduledArrivalAt = new Date();
        const tripOptions = {
          externalId,
          destinationGeofenceTag: 'store',
          destinationGeofenceExternalId: '123',
          mode: 'car',
          approachingThreshold: 3,
          scheduledArrivalAt,
        };

        return Trips.updateTrip(tripOptions)
          .then(() => {
            expect(httpStub).to.have.callCount(1);
            expect(httpStub).to.have.been.calledWith('PATCH', `trips/${externalId}/update`, {
              userId,
              destinationGeofenceTag: 'store',
              destinationGeofenceExternalId: '123',
              externalId,
              metadata: undefined,
              mode: 'car',
              status: TRIP_STATUS.UNKNOWN,
              approachingThreshold: 3,
              scheduledArrivalAt: scheduledArrivalAt.toJSON(),
           });
          });
      });
    });

    describe('called with status', () => {
      it('should include status', () => {
        const externalId = 'trip-abc-123';
        const scheduledArrivalAt = new Date();
        const tripOptions = {
          externalId,
          destinationGeofenceTag: 'store',
          destinationGeofenceExternalId: '123',
          mode: 'car',
          metadata: { car: 'red jeep' },
          approachingThreshold: 3,
          scheduledArrivalAt,
        };

        const status = TRIP_STATUS.STARTED;

        return Trips.updateTrip(tripOptions, status)
          .then(() => {
            expect(httpStub).to.have.callCount(1);
            expect(httpStub).to.have.been.calledWith('PATCH', `trips/${externalId}/update`, {
              userId,
              destinationGeofenceTag: 'store',
              destinationGeofenceExternalId: '123',
              externalId,
              metadata: { car: 'red jeep' },
              mode: 'car',
              status: TRIP_STATUS.STARTED,
              approachingThreshold: 3,
              scheduledArrivalAt: scheduledArrivalAt.toJSON(),
           });
          });
      });
    });

    describe('called with userId set', () => {
      it('should include userId', () => {
        const externalId = 'trip-abc-123';
        const scheduledArrivalAt = new Date();
        const tripOptions = {
          externalId,
          destinationGeofenceTag: 'store',
          destinationGeofenceExternalId: '123',
          mode: 'car',
          metadata: { car: 'red jeep' },
          approachingThreshold: 3,
          scheduledArrivalAt,
        };

        const status = TRIP_STATUS.STARTED;

        return Trips.updateTrip(tripOptions, status)
          .then(() => {
            expect(httpStub).to.have.callCount(1);
            expect(httpStub).to.have.been.calledWith('PATCH', `trips/${externalId}/update`, {
              ...tripOptions,
              userId,
              status: TRIP_STATUS.STARTED,
              scheduledArrivalAt: scheduledArrivalAt.toJSON(),
           });
          });
      });
    });

    describe('called with userId not set', () => {
      it('should have userId set to undefined', () => {
        getItemStub.withArgs(Storage.USER_ID).returns(undefined);

        const externalId = 'trip-abc-123';
        const scheduledArrivalAt = new Date();
        const tripOptions = {
          externalId,
          destinationGeofenceTag: 'store',
          destinationGeofenceExternalId: '123',
          mode: 'car',
          metadata: { car: 'red jeep' },
          approachingThreshold: 3,
          scheduledArrivalAt,
        };

        const status = TRIP_STATUS.STARTED;

        return Trips.updateTrip(tripOptions, status)
          .then(() => {
            expect(httpStub).to.have.callCount(1);
            expect(httpStub).to.have.been.calledWith('PATCH', `trips/${externalId}/update`, {
              ...tripOptions,
              userId: undefined,
              status: TRIP_STATUS.STARTED,
              scheduledArrivalAt: scheduledArrivalAt.toJSON(),
           });
          });
      });
    });

    describe('called with an invalid date for scheduledArrivalAt', () => {
      it('should have scheduledArrivalAt set to undefined', () => {
        const externalId = 'trip-abc-123';
        const scheduledArrivalAt = '123456';
        const tripOptions = {
          userId,
          externalId,
          destinationGeofenceTag: 'store',
          destinationGeofenceExternalId: '123',
          mode: 'car',
          metadata: { car: 'red jeep' },
          approachingThreshold: 3,
          scheduledArrivalAt,
        };

        const status = TRIP_STATUS.STARTED;

        return Trips.updateTrip(tripOptions, status)
          .then(() => {
            expect(httpStub).to.have.callCount(1);
            expect(httpStub).to.have.been.calledWith('PATCH', `trips/${externalId}/update`, {
              ...tripOptions,
              status: TRIP_STATUS.STARTED,
              scheduledArrivalAt: undefined,
           });
          });
      });
    });
  });
});