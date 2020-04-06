const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import * as Cookie from '../../src/cookie';
import * as Device from '../../src/device';
import * as Http from '../../src/http';
import Navigator from '../../src/navigator';
import SDK_VERSION from '../../src/version';
import STATUS from '../../src/status_codes';

import Track from '../../src/api/track';

describe('Track', () => {
  let getCookieStub;
  let httpStub;
  let navigatorStub;

  const userId = 'user-id';
  const description = 'description';
  const deviceId = 'device-id';

  const latitude = 40.7041895;
  const longitude = -73.9867797;
  const accuracy = 5;

  beforeEach(() => {
    getCookieStub = sinon.stub(Cookie, 'getCookie');
    httpStub = sinon.stub(Http, 'request');
    navigatorStub = sinon.stub(Navigator, 'getCurrentPosition');
    sinon.stub(Device, 'getId').returns(deviceId);

    getCookieStub.withArgs(Cookie.USER_ID).returns(userId);
    getCookieStub.withArgs(Cookie.DESCRIPTION).returns(description);
  });

  afterEach(() => {
    Cookie.getCookie.restore();
    Http.request.restore();
    Navigator.getCurrentPosition.restore();
    Device.getId.restore();
  });

  context('trackOnce', () => {
    let trackStub;

    beforeEach(() => {
      trackStub = sinon.stub(Track, 'trackOnceWithLocation');
    });

    afterEach(() => {
      Track.trackOnceWithLocation.restore();
    });

    it('should propagate a navigator error', () => {
      navigatorStub.callsFake((callback) => {
        callback(STATUS.ERROR_LOCATION, {});
      });

      const trackCallback = sinon.spy();
      Track.trackOnce(trackCallback);

      expect(navigatorStub).to.have.callCount(1);
      expect(trackStub).to.not.be.called;
      expect(trackCallback).to.be.calledWith(STATUS.ERROR_LOCATION);
    });

    it('should return the results of trackOnceWithLocation', () => {
      navigatorStub.callsFake((callback) => {
        callback(STATUS.SUCCESS, { latitude, longitude, accuracy });
      });
      trackStub.callsFake(({ latitude, longitude, accuracy }, callback) => {
        callback(STATUS.SUCCESS, { latitude, longitude, accuracy }, 'user-data', 'matching-events');
      });

      const trackCallback = sinon.spy();
      Track.trackOnce(trackCallback);

      expect(navigatorStub).to.have.callCount(1);
      expect(trackStub).to.be.calledWith({ latitude, longitude, accuracy });
      expect(trackCallback).to.be.calledWith(
        STATUS.SUCCESS,
        { latitude, longitude, accuracy },
        'user-data',
        'matching-events'
      );
    });
  });

  context('trackOnceWithLocation', () => {
    it('should return the error from the http request', () => {
      const httpRequestSpy = sinon.spy((method, path, body, callback) => {
        callback('http error');
      });
      httpStub.callsFake(httpRequestSpy);

      const trackCallback = sinon.spy();
      Track.trackOnceWithLocation({ latitude, longitude, accuracy }, trackCallback);

      expect(trackCallback).to.be.calledWith('http error');
    });

    it('should succeed', () => {
      const jsonSuccessResponse = {"user":"user-data","events":"matching-events"};
      const httpRequestSpy = sinon.spy((method, path, body, callback) => {
        callback(STATUS.SUCCESS, jsonSuccessResponse);
      });
      httpStub.callsFake(httpRequestSpy);

      const trackCallback = sinon.spy();
      Track.trackOnceWithLocation({ latitude, longitude, accuracy }, trackCallback);

      const [method, path, body] = httpRequestSpy.getCall(0).args;
      expect(method).to.equal('PUT');
      expect(path).to.equal('v1/users/user-id');
      expect(body).to.deep.equal({
        accuracy,
        description,
        deviceId,
        deviceType: 'Web',
        foreground: true,
        latitude,
        longitude,
        sdkVersion: SDK_VERSION,
        stopped: true,
        userId,
      });

      expect(trackCallback).to.be.calledWith(
        STATUS.SUCCESS,
        { latitude, longitude, accuracy },
        'user-data',
        'matching-events'
      );
    });
  });
});
