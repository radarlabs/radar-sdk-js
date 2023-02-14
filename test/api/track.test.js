const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import Storage from '../../src/storage';
import Device from '../../src/device';
import Http from '../../src/http';
import Navigator from '../../src/navigator';
import STATUS from '../../src/status';

import Track from '../../src/api/track';

import { latitude, longitude } from '../common';

describe('Track', () => {
  let getItemStub;
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
    getItemStub = sinon.stub(Storage, 'getItem');
    httpStub = sinon.stub(Http, 'request');
    navigatorStub = sinon.stub(Navigator, 'getCurrentPosition');
    sinon.stub(Device, 'getId').returns(deviceId);

    getItemStub.withArgs(Storage.USER_ID).returns(userId);
    getItemStub.withArgs(Storage.DESCRIPTION).returns(description);
    getItemStub.withArgs(Storage.BASE_API_PATH).returns(null);
  });

  afterEach(() => {
    Storage.getItem.restore();
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
        getItemStub.withArgs(Storage.METADATA).returns(JSON.stringify(metadata));
        httpStub.resolves({ meta: {}, user: {}, events: {} });

        return Track.trackOnce()
          .then((response) => {
            expect(response).to.deep.equal(trackResponse);
          });
        });

      it('should return a track response without metadata', () => {
        navigatorStub.resolves(location);
        getItemStub.withArgs(Storage.METADATA).returns(null);
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
          approachingThreshold: 3,
        };
        navigatorStub.resolves(location);
        getItemStub.withArgs(Storage.TRIP_OPTIONS).returns(JSON.stringify(tripOptions));
        httpStub.resolves({ meta: {}, user: {}, events: {} });

        return Track.trackOnce()
          .then((response) => {
            expect(response).to.deep.equal(trackResponse);
            const trackArgs = httpStub.getCall(0).args;
            expect(trackArgs[0]).to.equal('POST');
            expect(trackArgs[1]).to.equal('track');
            expect(trackArgs[2].tripOptions).to.deep.equal({ ...tripOptions, version: '2' });
          });
        });
    });
  });
});
