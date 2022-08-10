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

  beforeEach(() => {
    httpStub = sinon.stub(Http, 'request');
    getItemStub = sinon.stub(Storage, 'getItem');
    getItemStub.withArgs(Storage.BASE_API_PATH).returns(null);
  });

  afterEach(() => {
    Http.request.restore();
    Storage.getItem.restore();
  });

  context('updateTrip', () => {
    describe('called without status', () => {
      it('should include status unknown', () => {

        const externalId = 'trip-abc-123';
        const tripOptions = {
          externalId,
          destinationGeofenceTag: 'store',
          destinationGeofenceExternalId: '123',
          mode: 'car',
          approachingThreshold: 3,
        };

        return Trips.updateTrip(tripOptions)
          .then(() => {
            expect(httpStub).to.have.callCount(1);
            expect(httpStub).to.have.been.calledWith('PATCH', `v1/trips/${externalId}`, {
              destinationGeofenceTag: 'store',
              destinationGeofenceExternalId: '123',
              externalId,
              metadata: undefined,
              mode: 'car',
              status: TRIP_STATUS.UNKNOWN,
              approachingThreshold: 3,
           });
          });
      });
    });

    describe('called with status', () => {
      it('should include status', () => {

        const externalId = 'trip-abc-123';
        const tripOptions = {
          externalId,
          destinationGeofenceTag: 'store',
          destinationGeofenceExternalId: '123',
          mode: 'car',
          metadata: { car: 'red jeep' },
          approachingThreshold: 3,
        };

        const status = TRIP_STATUS.STARTED;

        return Trips.updateTrip(tripOptions, status)
          .then(() => {
            expect(httpStub).to.have.callCount(1);
            expect(httpStub).to.have.been.calledWith('PATCH', `v1/trips/${externalId}`, {
              destinationGeofenceTag: 'store',
              destinationGeofenceExternalId: '123',
              externalId,
              metadata: { car: 'red jeep' },
              mode: 'car',
              status: TRIP_STATUS.STARTED,
              approachingThreshold: 3,
           });
          });
      });
    });
  });
});
