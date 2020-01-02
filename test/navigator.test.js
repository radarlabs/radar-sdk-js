const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import getCurrentPosition from '../src/navigator';
import STATUS from '../src/status_codes';

describe('Navigator', () => {
  afterEach(() => {
    global.navigator = undefined;
  });

  it('should report a location error if geolocation is not available', () => {
    global.navigator = {};

    const callback = sinon.spy();
    getCurrentPosition(callback);

    expect(callback).to.be.calledWith(STATUS.ERROR_LOCATION);
  });

  it('should report a location error if position coordinates are not available', () => {
    const geolocation = {
      getCurrentPosition: (onSuccess) => {
        onSuccess(null);
      },
    };
    global.navigator = { geolocation };

    const callback = sinon.spy();
    getCurrentPosition(callback);

    expect(callback).to.be.calledWith(STATUS.ERROR_LOCATION);
  });

  it('should report a permissions error if the user denies location permissions', () => {
    const geolocation = {
      getCurrentPosition: (onSuccess, onError) => {
        onError({ code: 1 });
      },
    };
    global.navigator = { geolocation };

    const callback = sinon.spy();
    getCurrentPosition(callback);

    expect(callback).to.be.calledWith(STATUS.ERROR_PERMISSIONS);
  });

  it('should report a location error if the device errors out fetching location', () => {
    const geolocation = {
      getCurrentPosition: (onSuccess, onError) => {
        onError({ code: 2 });
      },
    };
    global.navigator = { geolocation };

    const callback = sinon.spy();
    getCurrentPosition(callback);

    expect(callback).to.be.calledWith(STATUS.ERROR_LOCATION);
  });

  it('should succeed', () => {
    const latitude = 40.7041895;
    const longitude = -73.9867797;
    const accuracy = 1;
    const position = {
      coords: { accuracy, latitude, longitude },
    };

    const geolocation = {
      getCurrentPosition: (onSuccess) => {
        onSuccess(position);
      },
    };
    global.navigator = { geolocation };

    const callback = sinon.spy();
    getCurrentPosition(callback);
    expect(callback).to.be.calledWith(STATUS.SUCCESS, position.coords);
  });
});
