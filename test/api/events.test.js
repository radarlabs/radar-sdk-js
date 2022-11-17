const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import Http from '../../src/http';
import STATUS from '../../src/status';

import Events from '../../src/api/events';

describe('Events', () => {
    let httpStub;

    const eventResponse = { meta: {}, event: {} };

    beforeEach(() => {
        httpStub = sinon.stub(Http, 'request');
    });

    const customEventType = 'app_open';
    const customEventMetadata = {'source':'organic'};
    const customEventData = {customEventType, customEventMetadata}

    afterEach(() => {
    Http.request.restore();
    });

    context('events', () => {
        it('should return an event', () => {
          httpStub.resolves(eventResponse);
    
          return Events.sendEvent({ customEventData })
            .then((response) => {
              expect(response).to.equal(eventResponse);
            });
        });
    });
});
