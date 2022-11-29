const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import Config from '../../src/api/config'

describe('Config', () => {

    const installId = '5f8892a5-8050-40db-accc-952985b69e3a';
    const locationAuthorization = 'GRANTED_FOREGROUND'
    const sessionId = Math.round(Date.now()/1000).toString();

    // const deviceConfig = { installId, locationAuthorization, sessionId };

    const configResponse = { meta: {}};

    beforeEach(() => {
        getItemStub = sinon.stub(Storage, 'getItem');
        httpStub = sinon.stub(Http, 'request');
        navigatorStub = sinon.stub(Navigator, 'permissions');
        sinon.stub(Session, 'getId').returns(sessionId);
    
        getItemStub.withArgs(Storage.INSTALL_ID).returns(installId);
        getItemStub.withArgs(Storage.BASE_API_PATH).returns(null);
    });

    afterEach(() => {
        Storage.getItem.restore();
        Http.request.restore();
        Navigator.getCurrentPosition.restore();
        Session.getId.restore();
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