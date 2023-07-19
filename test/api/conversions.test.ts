import Radar from '../../src';
import Conversions from '../../src/api/conversions';
import Config from '../../src/config';
import { RadarOptions } from '../../src/types';
import { getResponseWithDebug, mockRequest } from '../utils';

describe('Events', () => {
  const baseEventResponse = { event: {} };

  let options: RadarOptions = {};

  const name = 'opened_app';
  const metadata = { 'source': 'organic' };
  const conversionEventData = { name, metadata };

  const revenue = 10;
  const revenueConversionEventData = { name, metadata, revenue };

  beforeEach(() => {
    Radar.initialize('prj_test_pk_123');
    options = Config.get();
  });

  afterEach(() => {
    Radar.clear();
  });

  describe('events', () => {
    it('should return an event', async () => {
      mockRequest(200, baseEventResponse);

      const response = await Conversions.logConversion(conversionEventData);

      const validateResponse = getResponseWithDebug(options.debug, response, baseEventResponse);
      expect(response).toEqual(validateResponse);
    });

    it('should return a revenue event', async () => {
      mockRequest(200, baseEventResponse);

      const response = await Conversions.logConversion(revenueConversionEventData)
      const validateResponse = getResponseWithDebug(options.debug, response, baseEventResponse);
      expect(response).toEqual(validateResponse);
    });
  });
});
