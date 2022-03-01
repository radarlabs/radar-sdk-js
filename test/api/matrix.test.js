const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import { latitude, longitude } from '../common';

import Http from '../../src/http';
import Navigator from '../../src/navigator';
import STATUS from '../../src/status';

import Matrix from '../../src/api/matrix';

describe('Matrix', () => {
  let httpStub;
  let navigatorStub;

  const origin = '40.73237,-73.94884';

  const destination = '40.70390,-73.98690|40.73237,-73.94884';

  const mode = 'car';
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

  context('getMatrixDistances', () => {
    describe('location permissions denied', () => {
      it('should throw a navigation error', () => {
        navigatorStub.rejects(STATUS.ERROR_PERMISSIONS);

        return Matrix.getMatrixDistances()
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

          return Matrix.getMatrixDistances()
            .then((response) => {
              expect(response).to.equal(routingResponse);
            });
        });
      });

      describe('all args given', () => {
        it('should return a routing response', () => {
          navigatorStub.resolves(origin);
          httpStub.resolves(routingResponse);

          return Matrix.getMatrixDistances({ destination, mode, units })
            .then((response) => {
              expect(response).to.equal(routingResponse);
            });
        });
      });
    });
  });
});
