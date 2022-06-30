const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import SessionStorage from '../src/sessionStorage';
import Device from '../src/device';

describe('Device', () => {
  describe('getId', () => {
    context('deviceId has not been set', () => {

      before(() => {
        sinon.stub(SessionStorage, 'getSessionStorage');
        sinon.stub(SessionStorage, 'setSessionStorage');
      });

      after(() => {
        SessionStorage.getSessionStorage.restore();
        SessionStorage.setSessionStorage.restore();
      });

      it('should generate a new deviceId in sessionStorage, and return the value', () => {
        const deviceId = Device.getId();

        expect(SessionStorage.setSessionStorage).to.have.been.called;
        expect(SessionStorage.setSessionStorage).to.have.been.calledWith(SessionStorage.DEVICE_ID, deviceId);
      });
    });

    context('deviceId has already been set', () => {
      const deviceId = "abc-123";

      before(() => {
        sinon.stub(SessionStorage, 'getSessionStorage').callsFake(() => {
          return deviceId;
        });
      });

      after(() => {
        SessionStorage.getSessionStorage.restore();
      });

      it('should return the deviceId stored saved in the sessionStorage', () => {
        expect(Device.getId()).to.equal(deviceId);
      });
    });
  });
});
