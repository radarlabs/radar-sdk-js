const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import Storage from '../src/storage';
import Device from '../src/device';

describe('Device', () => {
  describe('getId', () => {
    context('deviceId has not been set', () => {

      before(() => {
        sinon.stub(Storage, 'getItem');
        sinon.stub(Storage, 'setItem');
      });

      after(() => {
        Storage.getItem.restore();
        Storage.setItem.restore();
      });

      it('should generate a new deviceId in storage, and return the value', () => {
        const deviceId = Device.getId();

        expect(Storage.setItem).to.have.been.called;
        expect(Storage.setItem).to.have.been.calledWith(Storage.DEVICE_ID, deviceId);
      });
    });

    context('deviceId has already been set', () => {
      const deviceId = "abc-123";

      before(() => {
        sinon.stub(Storage, 'getItem').callsFake(() => {
          return deviceId;
        });
      });

      after(() => {
        Storage.getItem.restore();
      });

      it('should return the deviceId stored saved in the storage', () => {
        expect(Device.getId()).to.equal(deviceId);
      });
    });
  });
});
