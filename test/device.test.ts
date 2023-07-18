import Storage from '../src/storage';
import Device from '../src/device';

describe('Device', () => {
  let setItemSpy: jest.SpyInstance;
  let getItemSpy: jest.SpyInstance;

  beforeEach(() => {
    setItemSpy = jest.spyOn(Storage, 'setItem');
    getItemSpy = jest.spyOn(Storage, 'getItem');
  });

  afterEach(() => {
    setItemSpy.mockRestore();
    getItemSpy.mockRestore();
  });

  describe('getId', () => {
    describe('deviceId has not been set', () => {
      it('should generate a new deviceId in storage, and return the value', () => {
        Device.getDeviceId();

        expect(Storage.setItem).toHaveBeenCalled();
        expect(Storage.getItem).toHaveBeenCalledWith(Storage.DEVICE_ID);
      });
    });

    describe('deviceId has already been set', () => {
      const deviceId = "abc-123";
      
      it('should return the deviceId stored saved in the storage', () => {
        getItemSpy.mockReturnValue(deviceId);
        expect(Device.getDeviceId()).toEqual(deviceId);
      });
    });
  });
});
