const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import * as Http from '../../src/http';
import Navigator from '../../src/navigator';
import STATUS from '../../src/status_codes';

import Routing from '../../src/api/routing';

describe('Routing', () => {
  let httpStub;
  let navigatorStub;

  const latitude = 40.7041895;
  const longitude = -73.9867797;
  const origin = {
    latitude,
    longitude,
  }
  const destination = {
    latitude: 40.7032123,
    longitude: -73.9936137,
  };
  const mockModes = ['foot', 'bike', 'car'];
  const mockUnits = 'imperial';

  beforeEach(() => {
    httpStub = sinon.stub(Http, 'request');

    navigatorStub = sinon.stub(Navigator, 'getCurrentPosition');
  });

  afterEach(() => {
    Http.request.restore();

    Navigator.getCurrentPosition.restore();
  });

  context('getDistanceToDestination', () => {
    let routingStub;

    beforeEach(() => {
      routingStub = sinon.stub(Routing, 'getDistanceWithOrigin');
    });

    afterEach(() => {
      Routing.getDistanceWithOrigin.restore();
    });

    it('should propagate a navigator error', () => {
      navigatorStub.callsFake((callback) => {
        callback(STATUS.ERROR_LOCATION, {});
      });

      const routingCallback = sinon.spy();
      Routing.getDistanceToDestination(
        {
          destination,
          modes: mockModes,
          units: mockUnits,
        },
        routingCallback,
      );

      expect(navigatorStub).to.have.callCount(1);
      expect(routingStub).to.not.be.called;
      expect(routingCallback).to.be.calledWith(STATUS.ERROR_LOCATION);
    });

    it('should return the results of getDistanceWithOrigin', () => {
      navigatorStub.callsFake((callback) => {
        callback(STATUS.SUCCESS, { latitude, longitude });
      });
      routingStub.callsFake(({ origin, destination, modes, units }, callback) => {
        callback(STATUS.SUCCESS, ['matching-routes']);
      });

      const routingCallback = sinon.spy();
      Routing.getDistanceToDestination(
        {
          destination,
          modes: mockModes,
          units: mockUnits,
        },
        routingCallback,
      );

      expect(navigatorStub).to.have.callCount(1);
      expect(routingStub).to.be.calledWith(
        {
          origin: { latitude, longitude },
          destination,
          modes: mockModes,
          units: mockUnits,
        }
      );
      expect(routingCallback).to.be.calledWith(STATUS.SUCCESS, ['matching-routes']);
    });
  });

  context('getDistanceWithOrigin', () => {
    it('should return the error from the http request', () => {
      const httpRequestSpy = sinon.spy((method, path, body, jsonKey, callback) => {
        callback('http error');
      });
      httpStub.callsFake(httpRequestSpy);

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
      httpStub.callsFake(httpRequestSpy);

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
