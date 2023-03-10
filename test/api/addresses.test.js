const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import Http from '../../src/http';

import Addresses from '../../src/api/addresses';

describe('Addresses', () => {
  let httpStub;

  const countryCode = 'US';
  const stateCode = 'NY';
  const city = 'New York';
  const postalCode = '10010';
  const number = '841';
  const street = 'Broadway';
  const unit = '7';
  const addressLabel = '841 Broadway Unit 7';

  const validateResponse = { meta: {}, address: {}, result: {} };

  beforeEach(() => {
    httpStub = sinon.stub(Http, 'request');
  });

  afterEach(() => {
    Http.request.restore();
  });

  context('validateAddress', () => {
    describe('params are not provided', () => {
      it('should have undefined params and return an autocomplete response', () => {
        httpStub.resolves(validateResponse);

        return Addresses.validateAddress({ number, street })
          .then((response) => {
            expect(Http.request).to.have.been.calledWith('GET', 'addresses/validate', { countryCode: undefined, stateCode: undefined, city: undefined, number: '841', postalCode: undefined, street: 'Broadway', unit: undefined, addressLabel: undefined });
            expect(response).to.equal(validateResponse);
          });
      });
    });

    describe('params are provided', () => {
      it('number, street, unit provided should return an autocomplete response', () => {
        httpStub.resolves(validateResponse);

        const options = {
          countryCode,
          stateCode,
          city,
          number,
          postalCode,
          street,
          unit,
          // addressLabel,
        }

        return Addresses.validateAddress(options)
          .then((response) => {
            expect(Http.request).to.have.been.calledWith('GET', 'addresses/validate', { countryCode: 'US', stateCode: 'NY', city: 'New York', postalCode: '10010', number: '841', street: 'Broadway', unit: '7', addressLabel: undefined});
            expect(response).to.equal(validateResponse);
          });
      });
    });

    it('addressLabel provided should return an autocomplete response', () => {
      httpStub.resolves(validateResponse);

      const options = {
        countryCode,
        stateCode,
        city,
        postalCode,
        // number,
        // street,
        // unit,
        addressLabel,
      }

      return Addresses.validateAddress(options)
        .then((response) => {
          expect(Http.request).to.have.been.calledWith('GET', 'addresses/validate', { countryCode: 'US', stateCode: 'NY', city: 'New York',  postalCode: '10010', addressLabel: '841 Broadway Unit 7', number: undefined, street: undefined, unit: undefined });
          expect(response).to.equal(validateResponse);
        });
    });
  });
});
