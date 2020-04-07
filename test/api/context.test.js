const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import  Http from '../../src/http';
import Navigator from '../../src/navigator';
import STATUS from '../../src/status_codes';

import Context from '../../src/api/context';

describe('Context', () => {
  let httpStub;
  let navigatorStub;

  const latitude = 40.7041895;
  const longitude = -73.9867797;

  beforeEach(() => {
    httpStub = sinon.stub(Http, 'request');

    navigatorStub = sinon.stub(Navigator, 'getCurrentPosition');
  });

  afterEach(() => {
    Http.request.restore();

    Navigator.getCurrentPosition.restore();
  });

  context('getContext', () => {
    let contextStub;

    beforeEach(() => {
      contextStub = sinon.stub(Context, 'getContextForLocation');
    });

    afterEach(() => {
      Context.getContextForLocation.restore();
    });

    it('should propagate a navigator error', () => {
      navigatorStub.callsFake((callback) => {
        callback(STATUS.ERROR_LOCATION, {});
      });

      const contextCallback = sinon.spy();
      Context.getContext(contextCallback);

      expect(navigatorStub).to.have.callCount(1);
      expect(contextStub).to.not.be.called;
      expect(contextCallback).to.be.calledWith(STATUS.ERROR_LOCATION);
    });

    it('should return the results of getContextForLocation', () => {
      navigatorStub.callsFake((callback) => {
        callback(STATUS.SUCCESS, { latitude, longitude });
      });
      contextStub.callsFake(({ latitude, longitude }, callback) => {
        callback(STATUS.SUCCESS, 'matching-context');
      });

      const contextCallback = sinon.spy();
      Context.getContext(contextCallback);

      expect(navigatorStub).to.have.callCount(1);
      expect(contextStub).to.be.calledWith({ latitude, longitude });
      expect(contextCallback).to.be.calledWith(STATUS.SUCCESS, 'matching-context');
    });
  });

  context('getContextForLocation', () => {
    it('should return the error from the http request', () => {
      const httpRequestSpy = sinon.spy((method, path, body, callback) => {
        callback('http error');
      });
      httpStub.callsFake(httpRequestSpy);

      const contextCallback = sinon.spy();
      Context.getContextForLocation({ latitude, longitude }, contextCallback);

      expect(contextCallback).to.be.calledWith('http error');
    });

    it('should propagate a successful response', () => {
      const httpRequestSpy = sinon.spy((method, path, body, callback) => {
        callback(STATUS.SUCCESS, { context: 'matching-context' });
      });
      httpStub.callsFake(httpRequestSpy);

      const contextCallback = sinon.spy();
      Context.getContextForLocation({ latitude, longitude }, contextCallback);

      const [method, path, body] = httpRequestSpy.getCall(0).args;
      expect(method).to.equal('GET');
      expect(path).to.equal('v1/context');
      expect(body).to.deep.equal({
        coordinates: `${latitude},${longitude}`,
      });

      expect(contextCallback).to.be.calledWith(STATUS.SUCCESS, 'matching-context');
    });
  });
});
