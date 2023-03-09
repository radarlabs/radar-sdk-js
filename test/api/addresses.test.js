const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import Http from '../../src/http';

import Addresses from '../../src/api/addresses';

describe('Addresses', () => {
  let httpStub;

  const country = 'US';
  const state = 'NY';
  const city = 'New York';
  const number = '841';
  const postalCode = '10010';
  const street = 'Broadway';
  const unit = '7';

  const autocompleteResponse = { meta: {}, address: {} };

  beforeEach(() => {
    httpStub = sinon.stub(Http, 'request');
  });

  afterEach(() => {
    Http.request.restore();
  });

  context('validateAddress', () => {
    describe('params are not provided', () => {
      it('should have undefined params and return an autocomplete response', () => {
        httpStub.resolves(autocompleteResponse);

        return Addresses.validateAddress({ number, street })
          .then((response) => {
            expect(Http.request).to.have.been.calledWith('GET', 'addresses/validate', { country: undefined, state: undefined, city: undefined, number: '841', postalCode: undefined, street: 'Broadway', unit: undefined});
            expect(response).to.equal(autocompleteResponse);
          });
      });
    });

    describe('params are provided', () => {
      it('should return an autocomplete response', () => {
        httpStub.resolves(autocompleteResponse);

        const options = {
          country,
          state,
          city,
          number,
          postalCode,
          street,
          unit
        }

        return Addresses.validateAddress(options)
          .then((response) => {
            expect(Http.request).to.have.been.calledWith('GET', 'addresses/validate', { country: 'US', state: 'NY', city: 'New York', number: '841', postalCode: '10010', street: 'Broadway', unit: '7'});
            expect(response).to.equal(autocompleteResponse);
          });
      });
    });
  });
});
