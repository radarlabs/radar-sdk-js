import Radar from '../src';
import Config from '../src/config';
import SDK_VERSION from '../src/version';

describe('Config', () => {
  describe('getDefaultHeaders', () => {
    afterEach(() => {
      Radar.clear();
    });

    it('should return raw publishableKey in Authorization header', () => {
      Radar.initialize('prj_test_pk_123');
      const headers = Config.getDefaultHeaders();
      expect(headers['Authorization']).toEqual('prj_test_pk_123');
    });

    it('should return Bearer authToken in Authorization header', () => {
      const token = 'eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.abc123';
      Radar.initialize({ authToken: token });
      const headers = Config.getDefaultHeaders();
      expect(headers['Authorization']).toEqual(`Bearer ${token}`);
    });

    it('should always include Device-Type and SDK-Version', () => {
      Radar.initialize('prj_test_pk_123');
      const headers = Config.getDefaultHeaders();
      expect(headers['X-Radar-Device-Type']).toEqual('Web');
      expect(headers['X-Radar-SDK-Version']).toEqual(SDK_VERSION);
    });

    it('should merge getRequestHeaders', () => {
      Radar.initialize('prj_test_pk_123', { getRequestHeaders: () => ({ 'X-Custom': 'val' }) });
      const headers = Config.getDefaultHeaders();
      expect(headers['X-Custom']).toEqual('val');
    });

    it('should not include Content-Type', () => {
      Radar.initialize('prj_test_pk_123');
      const headers = Config.getDefaultHeaders();
      expect(headers['Content-Type']).toBeUndefined();
    });
  });
});
