const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import Storage from '../src/storage';
import Session from '../src/session';

describe('Session', () => {
    describe('getSessionId', () => {
        context('sessionId has not been set', () => {
            before(() => {
              sinon.stub(Storage, 'getSessionItem');
              sinon.stub(Storage, 'setSessionItem');
            });
      
            after(() => {
              Storage.getSessionItem.restore();
              Storage.setSessionItem.restore();
            });
      
            it('should generate a new sessionId in storage, and return the value', () => {
              const sessionId = Session.getId();
      
              expect(Storage.setSessionItem).to.have.been.called;
              expect(Storage.setSessionItem).to.have.been.calledWith(Storage.SESSION_ID, sessionId);
            });
        });

        context('sessionId has already been set', () => {
            const time = Date.now();
            const sessionId = Math.round(time/1000).toString();
      
            before(() => {
              sinon.stub(Storage, 'getSessionItem').callsFake(() => {
                return sessionId;
              });
              sinon.stub(Date, "now").returns(time);
            });
      
            after(() => {
              Storage.getSessionItem.restore();
              Date.now.restore();
            });
      
            it('should return the sessionId from storage', () => {
              expect(Session.getId()).to.equal(sessionId);
            });
          });
    });
})