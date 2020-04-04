const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import * as Http from '../../src/http';
import STATUS from '../../src/status_codes';

import Routing from '../../src/api/routing';

describe('Routing', () => {
  const origin = {
    latitude: 40.7041895,
    longitude: -73.9867797,
  }
  const destinationLat = 40.7032123;
  const destinationLng = -73.9936137;
  const destination = `${destinationLat},${destinationLng}`;
  const mockModes = ['foot', 'bike', 'car'];
  const mockUnits = 'imperial';

  afterEach(() => {
    Http.request.restore();
  });

  context('getDistanceWithOrigin', () => {
    it('should return the error from the http request', () => {
      const httpRequestSpy = sinon.spy((method, path, body, jsonKey, callback) => {
        callback('http error');
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
      const httpRequestSpy = sinon.spy((method, path, body, jsonKey, callback) => {
        callback(STATUS.SUCCESS, ['matching-routes']);
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

      const [method, path, body] = httpRequestSpy.getCall(0).args;
      expect(method).to.equal('GET');
      expect(path).to.equal('v1/route/distance');
      expect(body).to.deep.equal({
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        modes: mockModes.join(','),
        units: mockUnits,
      });

      expect(routingCallback).to.be.calledWith(STATUS.SUCCESS, ['matching-routes']);
    });
  });
});
