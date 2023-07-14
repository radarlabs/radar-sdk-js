import Radar from '../../src';
import Conversions from '../../src/api/conversions';
import Config from '../../src/config';
import { mockRequest } from '../utils';

describe('Events', () => {
  const eventResponse = { event: {} };
  const debugEventResponse = { event: {}, response: eventResponse };
  let validateEventResponse = eventResponse;

  const name = 'opened_app';
  const metadata = { 'source': 'organic' };
  const conversionEventData = { name, metadata };

  const revenue = 10;
  const revenueConversionEventData = { name, metadata, revenue };

  beforeAll(() => {
    Radar.initialize('prj_test_pk_123');
    const options = Config.get();
    validateEventResponse = options.debug ? debugEventResponse : eventResponse;
  });

  afterAll(() => {
    Radar.clear();
  });

  describe('events', () => {
    it('should return an event', async () => {
      mockRequest(200, eventResponse);

      const response = await Conversions.logConversion(conversionEventData)
      expect(response).toEqual(validateEventResponse);
    });

    it('should return a revenue event', async () => {
      mockRequest(200, eventResponse);

      const response = await Conversions.logConversion(revenueConversionEventData)
      expect(response).toEqual(validateEventResponse);
    });
  });
});
