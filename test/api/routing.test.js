const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import { latitude, longitude } from '../common';

import Http from '../../src/http';
import Navigator from '../../src/navigator';
import STATUS from '../../src/status';

import Routing from '../../src/api/routing';

describe('Routing', () => {
  let httpStub;
  let navigatorStub;

  const origin = {
    latitude,
    longitude,
  }

  const destination = {
    latitude: 40.7032123,
    longitude: -73.9936137,
  };

  const modes = ['foot', 'bike', 'car'];
  const units = 'imperial';

  const routingResponse = { meta: {}, routes: {} };

  beforeEach(() => {
    navigatorStub = sinon.stub(Navigator, 'getCurrentPosition');
    httpStub = sinon.stub(Http, 'request');
  });

  afterEach(() => {
    Navigator.getCurrentPosition.restore();
    Http.request.restore();
  });

  context('getDistanceToDestination', () => {
    describe('location permissions denied', () => {
      it('should throw a navigation error', () => {
        navigatorStub.rejects(STATUS.ERROR_PERMISSIONS);

        return Routing.getDistanceToDestination()
          .catch((err) => {
            expect(err.toString()).to.eq(STATUS.ERROR_PERMISSIONS);
            expect(httpStub).to.have.callCount(0);
          });
      });
    });

    describe('location permissions approved', () => {
      describe('no args given', () => {
        it('should return a routing response', () => {
          navigatorStub.resolves(origin);
          httpStub.resolves(routingResponse);

          return Routing.getDistanceToDestination()
            .then((response) => {
              expect(response).to.equal(routingResponse);
            });
        });
      });

      describe('all args given', () => {
        it('should return a routing response', () => {
          navigatorStub.resolves(origin);
          httpStub.resolves(routingResponse);

          return Routing.getDistanceToDestination({ destination, modes, units })
            .then((response) => {
              expect(response).to.equal(routingResponse);
            });
        });
      });
    });
  });
});
