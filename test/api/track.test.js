const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import Cookie from '../../src/cookie';
import Device from '../../src/device';
import Http from '../../src/http';
import Navigator from '../../src/navigator';
import ERROR from '../../src/error_codes';

import Track from '../../src/api/track';

import { latitude, longitude } from '../common';

describe('Track', () => {
  let getCookieStub;
  let httpStub;
  let navigatorStub;

  const accuracy = 5;
  const userId = 'user-id';
  const description = 'description';
  const deviceId = 'device-id';

  const location = { latitude, longitude, accuracy };

  const trackResponse = { meta: {}, user: {}, events: {}, location };

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
    describe('location permissions denied', () => {
      it('should propagate the navigator error', () => {
        navigatorStub.rejects(ERROR.PERMISSIONS);

        return Track.trackOnce()
          .catch((err) => {
            expect(err.toString()).to.eq(ERROR.PERMISSIONS);
            expect(httpStub).to.have.callCount(0);
          });
      });
    });

    describe('location permissions approved', () => {
      it('should return a track response', () => {
        navigatorStub.resolves(location);
        httpStub.resolves({ meta: {}, user: {}, events: {} });

        return Track.trackOnce()
          .then((response) => {
            expect(response).to.deep.equal(trackResponse);
          });
        });
    });
  });
});
