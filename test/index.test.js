const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import * as Cookie from '../src/cookie';
import * as Device from '../src/device';
import * as Http from '../src/http';
import Radar from '../src/index';
import SDK_VERSION from '../src/version';
import STATUS from '../src/status_codes';

describe('Radar', () => {
  let getCookieStub;

  beforeEach(() => {
    sinon.stub(Cookie, 'deleteCookie');
    sinon.stub(Cookie, 'setCookie');
    getCookieStub = sinon.stub(Cookie, 'getCookie');
  });

  afterEach(() => {
    Cookie.deleteCookie.restore();
    Cookie.getCookie.restore();
    Cookie.setCookie.restore();
  });

  describe('initialize', () => {
    context('no publishable key given', () => {
      before(() => {
        sinon.stub(console, 'error');
      });

      after(() => {
        console.error.restore();
      });

      it('should print a warning to the console', () => {
        Radar.initialize();
        expect(console.error).to.be.calledWith('Radar "initialize" was called without a publishable key');
      });
    });

    context('called with publishable key', () => {
      const publishableKey = 'test-key';

      it('should save publishable key to cookie', () => {
        Radar.initialize(publishableKey);
        expect(Cookie.setCookie).to.have.been.calledWith(Cookie.PUBLISHABLE_KEY, publishableKey);
      });
    });
  });

  describe('setHost', () => {
    it('should save the host to cookie', () => {
      const host = 'http://fakehost.com';
      Radar.setHost(host);
      expect(Cookie.setCookie).to.have.been.calledWith(Cookie.HOST, host);
    });
  });

  describe('setPlacesProvider', () => {
    it('should save provider to cookie', () => {
      const provider = 'facebook';
      Radar.setPlacesProvider(provider);
      expect(Cookie.setCookie).to.have.been.calledWith(Cookie.PLACES_PROVIDER, provider);
    });

    it('should set provider to "none" if argument does not equal "facebook"', () => {
      Radar.setPlacesProvider("other");
      expect(Cookie.setCookie).to.have.been.calledWith(Cookie.PLACES_PROVIDER, "none");
    });
  });

  describe('setUserId', () => {
    context('no userId given', () => {
      it('should delete userId from cookie', () => {
        Radar.setUserId();
        expect(Cookie.deleteCookie).to.have.been.calledWith(Cookie.USER_ID);
      });
    });

    context('userId invalid', () => {
      describe('userId length is 0', () => {
        it('should delete userId from cookie', () => {
          Radar.setUserId("");
          expect(Cookie.deleteCookie).to.have.been.calledWith(Cookie.USER_ID);
        });
      });

      describe('userId length is > 256', () => {
        it('should delete userId from cookie', () => {
          // generate string of 257 chars
          const userId = [...Array(257)].map(() => 'x').join('');
          Radar.setUserId(userId);
          expect(Cookie.deleteCookie).to.have.been.calledWith(Cookie.USER_ID);
        });
      });
    });

    context('userId given', () => {
      it('should save userId in cookie', () => {
        const userId = 'abc123';
        Radar.setUserId(userId);
        expect(Cookie.setCookie).to.have.been.calledWith(Cookie.USER_ID, userId);
      });
    });
  });

  describe('setDescription', () => {
    context('no description given', () => {
      it('should delete description from cookie', () => {
        Radar.setDescription();
        expect(Cookie.deleteCookie).to.have.been.calledWith(Cookie.DESCRIPTION);
      });
    });

    context('description invalid', () => {
      describe('description length is 0', () => {
        it('should delete description from cookie', () => {
          Radar.setDescription("");
          expect(Cookie.deleteCookie).to.have.been.calledWith(Cookie.DESCRIPTION);
        });
      });

      describe('description length is > 256', () => {
        it('should delete description from cookie', () => {
          // generate string of 257 chars
          const description = [...Array(257)].map(() => 'x').join('');
          Radar.setDescription(description);
          expect(Cookie.deleteCookie).to.have.been.calledWith(Cookie.DESCRIPTION);
        });
      });
    });

    context('description given', () => {
      it('should save description in cookie', () => {
        const description = 'abc123';
        Radar.setDescription(description);
        expect(Cookie.setCookie).to.have.been.calledWith(Cookie.DESCRIPTION, description);
      });
    });
  });

  describe('trackOnce', () => {
    context('publishable key not set', () => {
      beforeEach(() => {
        getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(null);
      });

      it('calls callback with ERROR_PUBLISHABLE_KEY', () => {
        const callback = sinon.spy();
        Radar.trackOnce(callback);
        expect(callback).to.have.been.calledWith(STATUS.ERROR_PUBLISHABLE_KEY);
      });
    });

    context('geolocation not available', () => {
      beforeEach(() => {
        getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns('publishable-key');
        global.navigator = {};
      });

      it('calls callback with ERROR_LOCATION', () => {
        const callback = sinon.spy();
        Radar.trackOnce(callback);
        expect(callback).to.have.been.calledWith(STATUS.ERROR_LOCATION);
      });
    });

    context('geo position not avaialable', () => {
      beforeEach(() => {
        getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns('publishable-key');

        const getCurrentPosition = (onSuccess) => {
          onSuccess(null);
        };

        const geolocation = { getCurrentPosition };
        global.navigator = { geolocation };
      });

      afterEach(() => {
        global.navigator = undefined;
      });

      it('calls callback with ERROR_LOCATION', () => {
        const callback = sinon.spy();
        Radar.trackOnce(callback);
        expect(callback).to.have.been.calledWith(STATUS.ERROR_LOCATION);
      });
    });

    context('geo position is available', () => {
      const publishableKey = 'publishable-key';
      const userId = 'user-id';
      const placesProvider = 'facebook';
      const description = 'description';
      const deviceId = 'device-id';

      const latitude = 40.7041895;
      const longitude = -73.9867797;
      const accuracy = 1;
      const position = {
        coords: { accuracy, latitude, longitude },
      };

      const httpRequestSpy = sinon.spy((method, url, body, headers, onSuccess) => {
        const JsonResponse = '{"user":"user-data","events":"matching-events"}';
        onSuccess(JsonResponse);
      });

      beforeEach(() => {
        getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);
        getCookieStub.withArgs(Cookie.USER_ID).returns(userId);
        getCookieStub.withArgs(Cookie.PLACES_PROVIDER).returns(placesProvider);
        getCookieStub.withArgs(Cookie.DESCRIPTION).returns(description);
        sinon.stub(Device, 'getId').returns(deviceId);

        const geolocation = {
          getCurrentPosition: (onSuccess) => { onSuccess(position); },
        };

        global.navigator = { geolocation };

        sinon.stub(Http, 'request').callsFake(httpRequestSpy);
      });

      it('should make http request to api, and call the callback with data', () => {
        const callback = sinon.spy();

        Radar.trackOnce(callback);

        const [method, url, body, headers] = httpRequestSpy.getCall(0).args;
        expect(method).to.equal('PUT');
        expect(url).to.equal('https://api.radar.io/v1/users/user-id');
        expect(headers).to.deep.equal({ Authorization: 'publishable-key' });
        expect(body).to.deep.equal({
          accuracy,
          description,
          deviceId,
          deviceType: 'Web',
          foreground: true,
          latitude,
          longitude,
          placesProvider,
          sdkVersion: SDK_VERSION,
          stopped: true,
          userAgent: undefined,
          userId,
        });

        expect(callback).to.have.been.calledWith(STATUS.SUCCESS, position.coords, 'user-data', 'matching-events');
      });
    });
  });
});
