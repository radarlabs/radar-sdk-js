const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import * as Cookie from '../../src/cookie';
import * as Device from '../../src/device';
import * as Http from '../../src/http';
import SDK_VERSION from '../../src/version';
import STATUS from '../../src/status_codes';

import Track from '../../src/api/track';

describe('Track', () => {
  let getCookieStub;

  const userId = 'user-id';
  const description = 'description';
  const deviceId = 'device-id';

  const latitude = 40.7041895;
  const longitude = -73.9867797;
  const accuracy = 5;

  beforeEach(() => {
    getCookieStub = sinon.stub(Cookie, 'getCookie');
    sinon.stub(Device, 'getId').returns(deviceId);

    getCookieStub.withArgs(Cookie.USER_ID).returns(userId);
    getCookieStub.withArgs(Cookie.DESCRIPTION).returns(description);
  });

  afterEach(() => {
    Cookie.getCookie.restore();
    Device.getId.restore();

    Http.request.restore();
  });

  context('trackOnceWithLocation', () => {
    it('should throw a server error if invalid JSON is returned in the response', () => {
      const jsonErrorResponse = '"invalid_json": true}';
      const httpRequestSpy = sinon.spy((method, path, body, jsonKey, callback) => {
        callback(STATUS.SUCCESS, jsonErrorResponse);
      });
      sinon.stub(Http, 'request').callsFake(httpRequestSpy);

      const trackCallback = sinon.spy();
      Track.trackOnceWithLocation({ latitude, longitude, accuracy }, trackCallback);

      expect(trackCallback).to.be.calledWith(STATUS.ERROR_SERVER);
    });

    it('should return the error from the http request', () => {
      const httpRequestSpy = sinon.spy((method, path, body, jsonKey, callback) => {
        callback('http error');
      });
      sinon.stub(Http, 'request').callsFake(httpRequestSpy);

      const trackCallback = sinon.spy();
      Track.trackOnceWithLocation({ latitude, longitude, accuracy }, trackCallback);

      expect(trackCallback).to.be.calledWith('http error');
    });

    it('should succeed', () => {
      const jsonSuccessResponse = '{"user":"user-data","events":"matching-events"}';
      const httpRequestSpy = sinon.spy((method, path, body, jsonKey, callback) => {
        callback(STATUS.SUCCESS, jsonSuccessResponse);
      });
      sinon.stub(Http, 'request').callsFake(httpRequestSpy);

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
