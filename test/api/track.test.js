const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import SessionStorage from '../../src/sessionStorage';
import Device from '../../src/device';
import Http from '../../src/http';
import Navigator from '../../src/navigator';
import STATUS from '../../src/status';

import Track from '../../src/api/track';

import { latitude, longitude } from '../common';

describe('Track', () => {
  let getSessionStorageStub;
  let httpStub;
  let navigatorStub;

  const accuracy = 5;
  const userId = 'user-id';
  const description = 'description';
  const deviceId = 'device-id';
  const metadata = {};

  const location = { latitude, longitude, accuracy };

  const trackResponse = { meta: {}, user: {}, events: {}, location };

  beforeEach(() => {
    getSessionStorageStub = sinon.stub(SessionStorage, 'getSessionStorage');
    httpStub = sinon.stub(Http, 'request');
    navigatorStub = sinon.stub(Navigator, 'getCurrentPosition');
    sinon.stub(Device, 'getId').returns(deviceId);

    getSessionStorageStub.withArgs(SessionStorage.USER_ID).returns(userId);
    getSessionStorageStub.withArgs(SessionStorage.DESCRIPTION).returns(description);
    getSessionStorageStub.withArgs(SessionStorage.BASE_API_PATH).returns(null);
  });

  afterEach(() => {
    SessionStorage.getSessionStorage.restore();
    Http.request.restore();
    Navigator.getCurrentPosition.restore();
    Device.getId.restore();
  });

  context('trackOnce', () => {
    describe('location permissions denied', () => {
      it('should propagate the navigator error', () => {
        navigatorStub.rejects(STATUS.ERROR_PERMISSIONS);

        return Track.trackOnce()
          .catch((err) => {
            expect(err.toString()).to.eq(STATUS.ERROR_PERMISSIONS);
            expect(httpStub).to.have.callCount(0);
          });
      });
    });

    describe('location permissions approved', () => {
      it('should return a track response with metadata', () => {
        navigatorStub.resolves(location);
        getSessionStorageStub.withArgs(SessionStorage.METADATA).returns(JSON.stringify(metadata));
        httpStub.resolves({ meta: {}, user: {}, events: {} });

        return Track.trackOnce()
          .then((response) => {
            expect(response).to.deep.equal(trackResponse);
          });
        });

      it('should return a track response without metadata', () => {
        navigatorStub.resolves(location);
        getSessionStorageStub.withArgs(SessionStorage.METADATA).returns(null);
        httpStub.resolves({ meta: {}, user: {}, events: {} });

        return Track.trackOnce()
          .then((response) => {
            expect(response).to.deep.equal(trackResponse);
          });
        });
    });

    describe('tripOptions set', () => {
      it('should include tripOptions in track request', () => {
        const tripOptions = {
          externalId: 'trip-options-test-1',
          destinationGeofenceTag: 'store',
          destinationGefocenExternalId: '123',
          mode: 'car',
        }
        navigatorStub.resolves(location);
        getSessionStorageStub.withArgs(SessionStorage.TRIP_OPTIONS).returns(JSON.stringify(tripOptions));
        httpStub.resolves({ meta: {}, user: {}, events: {} });

        return Track.trackOnce()
          .then((response) => {
            expect(response).to.deep.equal(trackResponse);
            const trackArgs = httpStub.getCall(0).args;
            expect(trackArgs[0]).to.equal('POST');
            expect(trackArgs[1]).to.equal('v1/track');
            expect(trackArgs[2].tripOptions).to.deep.equal(tripOptions);
          });
        });
    });
  });
});
