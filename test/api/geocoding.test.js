const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import  Http from '../../src/http';
import Navigator from '../../src/navigator';
import STATUS from '../../src/status_codes';

import Geocoding from '../../src/api/geocoding';

describe('Geocoding', () => {
  let httpStub;
  let navigatorStub;

  const latitude = 40.7041895;
  const longitude = -73.9867797;

  const mockQuery = '20 Jay Street';

  beforeEach(() => {
    navigatorStub = sinon.stub(Navigator, 'getCurrentPosition');

    httpStub = sinon.stub(Http, 'request');
  });

  afterEach(() => {
    Navigator.getCurrentPosition.restore();

    Http.request.restore();
  });

  context('geocode', () => {
    it('should return the error from the http request', () => {
      const httpRequestSpy = sinon.spy((method, path, body, callback) => {
        callback('http error');
      });
      httpStub.callsFake(httpRequestSpy);

      const geocodeCallback = sinon.spy();
      Geocoding.geocode({ query: mockQuery }, geocodeCallback);

      expect(geocodeCallback).to.be.calledWith('http error');
    });

    it('should succeed', () => {
      const httpRequestSpy = sinon.spy((method, path, body, callback) => {
        callback(STATUS.SUCCESS, { addresses: ['matching-addresses'] });
      });
      httpStub.callsFake(httpRequestSpy);

      const geocodeCallback = sinon.spy();
      Geocoding.geocode({ query: mockQuery }, geocodeCallback);

      const [method, path, body] = httpRequestSpy.getCall(0).args;
      expect(method).to.equal('GET');
      expect(path).to.equal('v1/geocode/forward');
      expect(body).to.deep.equal({
        query: mockQuery,
      });

      expect(geocodeCallback).to.be.calledWith(STATUS.SUCCESS, ['matching-addresses']);
    });
  });

  context('reverseGeocode', () => {
    let geocodeStub;

    beforeEach(() => {
      geocodeStub = sinon.stub(Geocoding, 'reverseGeocodeLocation');
    });

    afterEach(() => {
      Geocoding.reverseGeocodeLocation.restore();
    });

    it('should propagate the navigator error', () => {
      navigatorStub.callsFake((callback) => {
        callback(STATUS.ERROR_LOCATION, {});
      });

      const geocodeCallback = sinon.spy();
      Geocoding.reverseGeocode(geocodeCallback);

      expect(navigatorStub).to.have.callCount(1);
      expect(geocodeStub).to.not.be.called;
      expect(geocodeCallback).to.be.calledWith(STATUS.ERROR_LOCATION);
    });

    it('should return the results of reverseGeocodeLocation', () => {
      navigatorStub.callsFake((callback) => {
        callback(STATUS.SUCCESS, { latitude, longitude });
      });
      geocodeStub.callsFake(({ latitude, longitude }, callback) => {
        callback(STATUS.SUCCESS, ['matching-addresses']);
      });

      const geocodeCallback = sinon.spy();
      Geocoding.reverseGeocode(geocodeCallback);

      expect(navigatorStub).to.have.callCount(1);
      expect(geocodeStub).to.be.calledWith({ latitude, longitude });
      expect(geocodeCallback).to.be.calledWith(STATUS.SUCCESS, ['matching-addresses']);
    });
  });

  context('reverseGeocodeLocation', () => {
    it('should return the error from the http request', () => {
      const httpRequestSpy = sinon.spy((method, path, body, callback) => {
        callback('http error');
      });
      httpStub.callsFake(httpRequestSpy);

      const geocodeCallback = sinon.spy();
      Geocoding.reverseGeocodeLocation({ latitude, longitude }, geocodeCallback);

      expect(geocodeCallback).to.be.calledWith('http error');
    });

    it('should succeed', () => {
      const httpRequestSpy = sinon.spy((method, path, body, callback) => {
        callback(STATUS.SUCCESS, { addresses: ['matching-addresses'] });
      });
      httpStub.callsFake(httpRequestSpy);

      const geocodeCallback = sinon.spy();
      Geocoding.reverseGeocodeLocation({ latitude, longitude }, geocodeCallback);

      const [method, path, body] = httpRequestSpy.getCall(0).args;
      expect(method).to.equal('GET');
      expect(path).to.equal('v1/geocode/reverse');
      expect(body).to.deep.equal({
        coordinates: `${latitude},${longitude}`,
      });

      expect(geocodeCallback).to.be.calledWith(STATUS.SUCCESS, ['matching-addresses']);
    });
  });

  context('ipGeocode', () => {
    it('should return the error from the http request', () => {
      const httpRequestSpy = sinon.spy((method, path, body, callback) => {
        callback('http error');
      });
      httpStub.callsFake(httpRequestSpy);

      const geocodeCallback = sinon.spy();
      Geocoding.ipGeocode(geocodeCallback);

      expect(geocodeCallback).to.be.calledWith('http error');
    });

    it('should succeed', () =>{
      const httpRequestSpy = sinon.spy((method, path, body, callback) => {
        callback(STATUS.SUCCESS, { address: 'matching-address' });
      });
      httpStub.callsFake(httpRequestSpy);

      const geocodeCallback = sinon.spy();
      Geocoding.ipGeocode(geocodeCallback);

      const [method, path] = httpRequestSpy.getCall(0).args;
      expect(method).to.equal('GET');
      expect(path).to.equal('v1/geocode/ip');

      expect(geocodeCallback).to.be.calledWith(STATUS.SUCCESS, 'matching-address');
    });
  });
});
