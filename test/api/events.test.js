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

  context('logConversion', () => {
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

  context('sendEvent', () => {
    it('should send custom event', () => {
      return Events.sendEvent({ ...conversionEventData, name: 'unused', type: 'my_custom_event' })
        .then(() => {
          const [requestMethod, endpoint, args] = httpStub.lastCall.args;

          expect(requestMethod).to.equal('POST');
          expect(endpoint).to.equal('events');

          expect(args.type).to.equal('my_custom_event');
          expect(args.name).to.equal(undefined); // should not be sent in request
        });
    });
  });
});
