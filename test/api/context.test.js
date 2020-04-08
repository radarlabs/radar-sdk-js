const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import { latitude, longitude } from '../common';

import Http from '../../src/http';
import Navigator from '../../src/navigator';
import ERROR from '../../src/error_codes';

import Context from '../../src/api/context';

describe('Context', () => {
  let httpStub;
  let navigatorStub;

  const contextResponse = { meta: {}, context: {} };

  beforeEach(() => {
    navigatorStub = sinon.stub(Navigator, 'getCurrentPosition');
    httpStub = sinon.stub(Http, 'request');
  });

  afterEach(() => {
    Navigator.getCurrentPosition.restore();
    Http.request.restore();
  });

  context('getContext', () => {
    describe('location permissions denied', () => {
      it('should throw a navigation error', () => {
        navigatorStub.rejects(ERROR.PERMISSIONS);

        return Context.getContext()
          .catch((err) => {
            expect(err.toString()).to.eq(ERROR.PERMISSIONS);
            expect(httpStub).to.have.callCount(0);
          });
      });
    });

    describe('location permissions approved', () => {
      it('should return a context response', () => {
        navigatorStub.resolves({ latitude, longitude });
        httpStub.resolves(contextResponse);

        return Context.getContext()
          .then((response) => {
            expect(response).to.equal(contextResponse);

            expect(navigatorStub).to.have.callCount(1);
            expect(httpStub).to.have.callCount(1);
          });
      });
    });
  });
});
