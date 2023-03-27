const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import Http from '../../src/http';

import Events from '../../src/api/events';

describe('Events', () => {
    let httpStub;

    const eventResponse = { meta: {}, event: {} };

    beforeEach(() => {
        httpStub = sinon.stub(Http, 'request');
    });

    const name = 'opened_app';
    const metadata = {'source':'organic'};
    const conversionEventData = { name, metadata };

    const revenue = 10;
    const revenueConversionEventData = { name, metadata, revenue };

    afterEach(() => {
        Http.request.restore();
    });

    context('events', () => {
        it('should return an event', () => {
          httpStub.resolves(eventResponse);
    
          return Events.logConversion({ conversionEventData })
            .then((response) => {
              expect(response).to.equal(eventResponse);
            });
        });

        it('should return a revenue event', () => {
            httpStub.resolves(eventResponse);
      
            return Events.logConversion({ revenueConversionEventData })
              .then((response) => {
                expect(response).to.equal(eventResponse);
              });
          });
    });
});
