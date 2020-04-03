const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import * as Cookie from '../../src/cookie';
import * as Http from '../../src/http';
import STATUS from '../../src/status_codes';

import Context from '../../src/api/context';

describe('Context', () => {
  const latitude = 40.7041895;
  const longitude = -73.9867797;

  afterEach(() => {
    Http.request.restore();
  });

  context('getContextForLocation', () => {
    it('should throw a server error if invalid JSON is returned in the response', () => {
      const jsonErrorResponse = '"invalid_json": true}';
      const httpRequestSpy = sinon.spy((method, path, body, onSuccess, onError) => {
        onSuccess(jsonErrorResponse);
      });
      sinon.stub(Http, 'request').callsFake(httpRequestSpy);

      const contextCallback = sinon.spy();
      Context.getContextForLocation({ latitude, longitude }, contextCallback);

      expect(contextCallback).to.be.calledWith(STATUS.ERROR_SERVER);
    });

    it('should return the error from the http request', () => {
      const httpRequestSpy = sinon.spy((method, path, body, onSuccess, onError) => {
        onError('http error');
      });
      sinon.stub(Http, 'request').callsFake(httpRequestSpy);

      const contextCallback = sinon.spy();
      Context.getContextForLocation({ latitude, longitude }, contextCallback);

      expect(contextCallback).to.be.calledWith('http error');
    });

    it('should succeed', () => {
      const jsonSuccessResponse = '{"context":"matching-context"}'
      const httpRequestSpy = sinon.spy((method, path, body, onSuccess, onError) => {
        onSuccess(jsonSuccessResponse);
      });
      sinon.stub(Http, 'request').callsFake(httpRequestSpy);

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
