const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import * as Cookie from '../../src/cookie';
import * as Http from '../../src/http';
import STATUS from '../../src/status_codes';

import Routing from '../../src/api/routing';

describe('Routing', () => {
  let getCookieStub;

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
    getCookieStub = sinon.stub(Cookie, 'getCookie');
  });

  afterEach(() => {
    Cookie.getCookie.restore();

    Http.request.restore();
  });

  context('getDistanceWithOrigin', () => {
    it('should throw a server error if invalid JSON is returned in the response', () => {
      const jsonErrorResponse = '"invalid_json": true}';
      const httpRequestSpy = sinon.spy((method, url, body, onSuccess, onError) => {
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
    });

    it('should return the error from the http request', () => {
      const httpRequestSpy = sinon.spy((method, url, body, onSuccess, onError) => {
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
    });

    it('should succeed', () => {
      const jsonSuccessResponse = '{"routes":["matching-routes"]}';
      const httpRequestSpy = sinon.spy((method, url, body, onSuccess, onError) => {
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

      const [method, url, body] = httpRequestSpy.getCall(0).args;
      expect(method).to.equal('GET');
      expect(url).to.equal('https://api.radar.io/v1/route/distance');
      expect(body).to.deep.equal({
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        modes: mockModes.join(','),
        units: mockUnits,
      });
    });
  });
});
