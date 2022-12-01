const chai = require('chai');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import Navigator from '../src/navigator';
import STATUS from '../src/status';

describe('Navigator', () => {
  describe('getCurrentPosition', () => {
    afterEach(() => {
      global.navigator = undefined;
    });

    it('should report a location error if geolocation is not available', () => {
      global.navigator = {};

      return Navigator.getCurrentPosition()
        .catch((e) => {
          expect(e).to.equal(STATUS.ERROR_LOCATION);
        });
    });

    it('should report a location error if position coordinates are not available', () => {
      const geolocation = {
        getCurrentPosition: (onSuccess) => {
          onSuccess(null);
        },
      };
      global.navigator = { geolocation };

      return Navigator.getCurrentPosition()
        .catch((e) => {
          expect(e).to.equal(STATUS.ERROR_LOCATION);
        });
    });

    it('should report a permissions error if the user denies location permissions', () => {
      const geolocation = {
        getCurrentPosition: (onSuccess, onError) => {
          onError({ code: 1 });
        },
      };
      global.navigator = { geolocation };

      return Navigator.getCurrentPosition()
        .catch((e) => {
          expect(e).to.equal(STATUS.ERROR_PERMISSIONS);
        });
    });

    it('should report a location error if the device errors out fetching location', () => {
      const geolocation = {
        getCurrentPosition: (onSuccess, onError) => {
          onError({ code: 2 });
        },
      };
      global.navigator = { geolocation };

      return Navigator.getCurrentPosition()
        .catch((e) => {
          expect(e).to.equal(STATUS.ERROR_LOCATION);
        });
    });

    it('should succeed to get a position', () => {
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

      return Navigator.getCurrentPosition()
        .then((location) => {
          expect(location.latitude).to.equal(latitude);
          expect(location.longitude).to.equal(longitude);
          expect(location.accuracy).to.equal(accuracy);
        });
    });
  });
  describe('getPermissionsStatus', () => {

    afterEach(() => {
      global.navigator = undefined;
    });

    it('should succeed to return permissions authorization if navigator permissions are available', () => {
      const locationAuthorizationStatus = "GRANTED_FOREGROUND";

      const permissions = {
        query: () => Promise.resolve({state:"granted"}),
      }

      // global.navigator = {};

      global.navigator = { permissions };

      return Navigator.getPermissionsStatus()
      .then((locationAuthorization) => {
        expect(locationAuthorization).to.equal(locationAuthorizationStatus);
      });
    });

    it('should report a permissions error if navigator permissions are not available', () => {
      
      global.navigator = {};

      return Navigator.getPermissionsStatus()
        .catch((e) => {
          expect(e).to.equal(STATUS.ERROR_PERMISSIONS);
        });
    });
  });
});
