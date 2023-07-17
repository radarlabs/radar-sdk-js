import Http from '../../src/http';
import Radar from '../../src/index';
import Config from '../../src/config';

import Addresses from '../../src/api/addresses';

import { getResponseWithDebug, mockRequest } from '../utils';
import { RadarOptions } from '../../src/types';

describe('Addresses', () => {
  const countryCode = 'US';
  const stateCode = 'NY';
  const city = 'New York';
  const postalCode = '10010';
  const number = '841';
  const street = 'Broadway';
  const unit = '7';
  const addressLabel = '841 Broadway Unit 7';

  const baseValidateResponse: { [key: string]: any } = { address: {}, result: {} };

  let radarOptions: RadarOptions = {};

  const httpRequest = { method: 'GET', path: 'addresses/validate' };

  beforeAll(() => {
    Radar.initialize('prj_test_pk_123');
    radarOptions = Config.get();
  });

  afterAll(() => {
    Radar.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('validateAddress', () => {
    describe('params are not provided', () => {
      it('should have undefined params and return an autocomplete response', async () => {
        const httpSpy = jest.spyOn(Http, 'request');
        mockRequest(200, baseValidateResponse)

        const response = await Addresses.validateAddress({ number, street } as any);

        const validateResponse = getResponseWithDebug(radarOptions.debug, baseValidateResponse, baseValidateResponse);

        expect(httpSpy).toHaveBeenCalledWith({ ...httpRequest, data: { countryCode: undefined, stateCode: undefined, city: undefined, number: '841', postalCode: undefined, street: 'Broadway', unit: undefined, addressLabel: undefined } });
        expect(response).toEqual(validateResponse);
      });
    });

    describe('params are provided', () => {
      it('number, street, unit provided should return an autocomplete response', async () => {
        const httpSpy = jest.spyOn(Http, 'request');
        mockRequest(200, baseValidateResponse)

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

        const response = await Addresses.validateAddress(options);

        const validateResponse = getResponseWithDebug(radarOptions.debug, baseValidateResponse, baseValidateResponse);

        expect(httpSpy).toHaveBeenCalledWith({ ...httpRequest, data: { countryCode: 'US', stateCode: 'NY', city: 'New York', postalCode: '10010', number: '841', street: 'Broadway', unit: '7', addressLabel: undefined } });
        expect(response).toEqual(validateResponse);
      }, 10000);
    });

    it('addressLabel provided should return an autocomplete response', async () => {
      const httpSpy = jest.spyOn(Http, 'request');
      mockRequest(200, baseValidateResponse)

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

      const response = await Addresses.validateAddress(options);

      const validateResponse = getResponseWithDebug(radarOptions.debug, baseValidateResponse, baseValidateResponse);

      expect(httpSpy).toHaveBeenCalledWith({ ...httpRequest, data: { countryCode: 'US', stateCode: 'NY', city: 'New York', postalCode: '10010', addressLabel: '841 Broadway Unit 7', number: undefined, street: undefined, unit: undefined } });
      expect(response).toEqual(validateResponse);
    });
  });
});
