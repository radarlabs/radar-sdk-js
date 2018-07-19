const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import * as Cookie from '../src/cookie';
import * as Device from '../src/device';

describe('Device', () => {
  describe('getId', () => {
    context('deviceId has not been set', () => {

      before(() => {
        sinon.stub(Cookie, 'getCookie');
        sinon.stub(Cookie, 'setCookie');
      });

      after(() => {
        Cookie.getCookie.restore();
        Cookie.setCookie.restore();
      });

      it('should generate a new deviceId in cookie, and return the value', () => {
        const deviceId = Device.getId();

        expect(Cookie.setCookie).to.have.been.called;
        expect(Cookie.setCookie).to.have.been.calledWith(Cookie.DEVICE_ID, deviceId);
      });
    });

    context('deviceId has already been set', () => {
      const deviceId = "abc-123";

      before(() => {
        sinon.stub(Cookie, 'getCookie').callsFake(() => {
          return deviceId;
        });
      });

      after(() => {
        Cookie.getCookie.restore();
      });

      it('should return the deviceId stored saved in the cookie', () => {
        expect(Device.getId()).to.equal(deviceId);
      });
    });
  });
});
