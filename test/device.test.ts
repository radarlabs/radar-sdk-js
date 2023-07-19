import Storage from '../src/storage';
import Device from '../src/device';

describe('Device', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getId', () => {
    describe('deviceId has not been set', () => {
      it('should generate a new deviceId in storage, and return the value', () => {
        jest.spyOn(Storage, 'setItem');
        jest.spyOn(Storage, 'getItem');

        Device.getDeviceId();

        expect(Storage.setItem).toHaveBeenCalled();
        expect(Storage.getItem).toHaveBeenCalledWith(Storage.DEVICE_ID);
      });
    });

    describe('deviceId has already been set', () => {
      const deviceId = "abc-123";
      
      it('should return the deviceId stored saved in the storage', () => {
        jest.spyOn(Storage, 'getItem').mockReturnValue(deviceId);
        expect(Device.getDeviceId()).toEqual(deviceId);
      });
    });
  });
});
