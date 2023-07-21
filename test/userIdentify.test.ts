import Radar from '../src/index';
import Storage from '../src/storage';

describe('Test the user identification functions', () => {
  describe('setUserId', () => {
    describe('userId is given', () => {
      it('should set userId in local-storage', () => {
        Radar.setUserId('test-user-id');
        const userId = Storage.getItem(Storage.USER_ID);
        expect(userId).toEqual('test-user-id');
      });
    });
    describe('userId is not given', () => {
      it('should clear userId from local-storage', () => {
        Radar.setUserId();
        const userId = Storage.getItem(Storage.USER_ID);
        expect(userId).toEqual(null);
      });
    });
  });

  describe('setDescription', () => {
    describe('description is given', () => {
      it('should set description in local-storage', () => {
        Radar.setDescription('test-user-description');
        const description = Storage.getItem(Storage.DESCRIPTION);
        expect(description).toEqual('test-user-description');
      });
    });
    describe('description is not given', () => {
      it('should clear description from local-storage', () => {
        Radar.setDescription();
        const description = Storage.getItem(Storage.DESCRIPTION);
        expect(description).toEqual(null);
      });
    });
  });

  describe('setMetadata', () => {
    describe('metadata is given', () => {
      it('should set stringified metadata in local-storage', () => {
        Radar.setMetadata({ metadata: true });
        const metadata = Storage.getItem(Storage.METADATA);
        expect(metadata).toEqual(JSON.stringify({"metadata": true}));
      });
    });
    describe('metadata is not given', () => {
      it('should clear metadata from local-storage', () => {
        Radar.setMetadata();
        const metadata = Storage.getItem(Storage.METADATA);
        expect(metadata).toEqual(null);
      });
    });
  });
});
