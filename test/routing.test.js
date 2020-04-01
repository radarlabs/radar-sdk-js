const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import * as Cookie from '../src/cookie';
import * as Http from '../src/http';
import STATUS from '../src/status_codes';

import Routing from '../src/routing';

describe('Routing', () => {
  let getCookieStub;

  const publishableKey = 'mock-publishable-key';

  const origin = {
    latitude: 40.7041895,
    longitude: -73.9867797,
  }
  const destinationLat = 40.7032123;
  const destinationLng = -73.9936137;
  const destination = `${destinationLat},${destinationLng}`;
  const mockModes = ['foot', 'bike', 'car'];
  const mockUnits = 'imperial';

  beforeEach(() => {
    sinon.stub(Cookie, 'deleteCookie');
    sinon.stub(Cookie, 'setCookie');
    getCookieStub = sinon.stub(Cookie, 'getCookie');
  });

  afterEach(() => {
    Cookie.deleteCookie.restore();
    Cookie.setCookie.restore();
    Cookie.getCookie.restore();
  });

  context('getDistanceWithOrigin', () => {
    it('should return a publishable key error if not set', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(null);

      const routingCallback = sinon.spy();
      Routing.getDistanceWithOrigin(
        {
          origin,
          destination,
          modes: mockModes,
          units: mockUnits,
        },
        routingCallback,
      );

      expect(routingCallback).to.be.calledWith(STATUS.ERROR_PUBLISHABLE_KEY);
    });

    it('should throw a server error if invalid JSON is returned in the response', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const jsonErrorResponse = '"invalid_json": true}';
      const httpRequestSpy = sinon.spy((method, url, body, headers, onSuccess, onError) => {
        onSuccess(jsonErrorResponse);
      });
      sinon.stub(Http, 'request').callsFake(httpRequestSpy);

      const routingCallback = sinon.spy();
      Routing.getDistanceWithOrigin(
        {
          origin,
          destination,
          modes: mockModes,
          units: mockUnits,
        },
        routingCallback,
      );

      expect(routingCallback).to.be.calledWith(STATUS.ERROR_SERVER);

      Http.request.restore();
    });

    it('should return the error from the http request', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const httpRequestSpy = sinon.spy((method, url, body, headers, onSuccess, onError) => {
        onError('http error');
      });
      sinon.stub(Http, 'request').callsFake(httpRequestSpy);

      const routingCallback = sinon.spy();
      Routing.getDistanceWithOrigin(
        {
          origin,
          destination,
          modes: mockModes,
          units: mockUnits,
        },
        routingCallback,
      );

      expect(routingCallback).to.be.calledWith('http error');

      Http.request.restore();
    });

    it('should succeed', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const jsonSuccessResponse = '{"routes":["matching-routes"]}';
      const httpRequestSpy = sinon.spy((method, url, body, headers, onSuccess, onError) => {
        onSuccess(jsonSuccessResponse);
      });
      sinon.stub(Http, 'request').callsFake(httpRequestSpy);

      const routingCallback = sinon.spy();
      Routing.getDistanceWithOrigin(
        {
          origin,
          destination,
          modes: mockModes,
          units: mockUnits,
        },
        routingCallback,
      );

      const [method, url, body, headers] = httpRequestSpy.getCall(0).args;
      expect(method).to.equal('GET');
      expect(url).to.equal('https://api.radar.io/v1/route/distance');
      expect(headers).to.deep.equal({
        Authorization: publishableKey,
      });
      expect(body).to.deep.equal({
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        modes: mockModes.join(','),
        units: mockUnits,
      });

      Http.request.restore();
    });
  });
});
