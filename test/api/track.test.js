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

  const publishableKey = 'mock-publishable-key';
  const userId = 'user-id';
  const description = 'description';
  const deviceId = 'device-id';

  const latitude = 40.7041895;
  const longitude = -73.9867797;
  const accuracy = 5;

  beforeEach(() => {
    sinon.stub(Cookie, 'deleteCookie');
    sinon.stub(Cookie, 'setCookie');
    getCookieStub = sinon.stub(Cookie, 'getCookie');

    sinon.stub(Device, 'getId').returns(deviceId);
    getCookieStub.withArgs(Cookie.USER_ID).returns(userId);
    getCookieStub.withArgs(Cookie.DESCRIPTION).returns(description);
  });

  afterEach(() => {
    Cookie.deleteCookie.restore();
    Cookie.getCookie.restore();
    Cookie.setCookie.restore();
    Device.getId.restore();
  });

  context('trackOnceWithLocation', () => {
    it('should return a publishable key error if not set', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(null);

      const trackCallback = sinon.spy();
      Track.trackOnceWithLocation({ latitude, longitude, accuracy }, trackCallback);

      expect(trackCallback).to.be.calledWith(STATUS.ERROR_PUBLISHABLE_KEY);
    });

    it('should throw a server error if invalid JSON is returned in the response', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const jsonErrorResponse = '"invalid_json": true}';
      const httpRequestSpy = sinon.spy((method, url, body, headers, onSuccess, onError) => {
        onSuccess(jsonErrorResponse);
      });
      sinon.stub(Http, 'request').callsFake(httpRequestSpy);

      const trackCallback = sinon.spy();
      Track.trackOnceWithLocation({ latitude, longitude, accuracy }, trackCallback);

      expect(trackCallback).to.be.calledWith(STATUS.ERROR_SERVER);

      Http.request.restore();
    });

    it('should return the error from the http request', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const httpRequestSpy = sinon.spy((method, url, body, headers, onSuccess, onError) => {
        onError('http error');
      });
      sinon.stub(Http, 'request').callsFake(httpRequestSpy);

      const trackCallback = sinon.spy();
      Track.trackOnceWithLocation({ latitude, longitude, accuracy }, trackCallback);

      expect(trackCallback).to.be.calledWith('http error');

      Http.request.restore();
    });

    it('should succeed', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const jsonSuccessResponse = '{"user":"user-data","events":"matching-events"}';
      const httpRequestSpy = sinon.spy((method, url, body, headers, onSuccess, onError) => {
        onSuccess(jsonSuccessResponse);
      });
      sinon.stub(Http, 'request').callsFake(httpRequestSpy);

      const trackCallback = sinon.spy();
      Track.trackOnceWithLocation({ latitude, longitude, accuracy }, trackCallback);

      const [method, url, body, headers] = httpRequestSpy.getCall(0).args;
      expect(method).to.equal('PUT');
      expect(url).to.equal('https://api.radar.io/v1/users/user-id');
      expect(headers).to.deep.equal({
        Authorization: publishableKey,
      });
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

      Http.request.restore();
    });
  });
});
