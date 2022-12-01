const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import Storage from '../../src/storage';
import Device from '../../src/device';
import Http from '../../src/http';
import Navigator from '../../src/navigator';
import Session from '../../src/session'
import Config from '../../src/api/config'

describe('Config', () => {
  let getItemStub;
  let httpStub;
  let navigatorStub;

  const installId = '5f8892a5-8050-40db-accc-952985b69e3a';
  const locationAuthorization = 'GRANTED_FOREGROUND'
  const deviceId = 'device-id';
  const sessionId = Math.round(Date.now()/1000).toString();

  const configResponse = { meta: {}};

  beforeEach(() => {
      getItemStub = sinon.stub(Storage, 'getItem');
      httpStub = sinon.stub(Http, 'request');
      navigatorStub = sinon.stub(Navigator, 'getPermissionsStatus');
      sinon.stub(Session, 'getId').returns(sessionId);
      sinon.stub(Device, 'getId').returns(deviceId);
      getItemStub.withArgs(Storage.INSTALL_ID).returns(installId);
      getItemStub.withArgs(Storage.BASE_API_PATH).returns(null);
  });

  afterEach(() => {
      Storage.getItem.restore();
      Http.request.restore();
      Navigator.getPermissionsStatus.restore();
      Session.getId.restore();
      Device.getId.restore();
  });

  context('getConfig', () => {
    describe('navigator permissions enabled', () => {
      it('should return a config response', () => {
        navigatorStub.resolves(locationAuthorization);
        httpStub.resolves({ meta: {} });

        return Config.getConfig()
          .then((response) => {
            expect(response).to.deep.equal(configResponse);
          });
        });
    });
  });
});