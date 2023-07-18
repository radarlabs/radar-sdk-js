import Storage from '../src/storage';
import Session from '../src/session';

describe('Session', () => {
  let getItemSpy: jest.SpyInstance;
  let setItemSpy: jest.SpyInstance;

  beforeEach(() => {
    getItemSpy = jest.spyOn(Storage, 'getItem');
    setItemSpy = jest.spyOn(Storage, 'setItem');
  });

  afterEach(() => {
    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
  });

  describe('session does not exist', () => {
    it('should create a return the new session id', () => {
      getItemSpy.mockReturnValue(null);

      const sessionId = Session.getSessionId();
      expect(Storage.setItem).toHaveBeenCalledWith(Storage.SESSION_ID, sessionId);
    });
  });

  describe('session exists', () => {
    describe('session is less than 5 minutes old', () => {
      it('should not create a new session', () => {
        const validSessionTS = (Date.now() / 1000);
        getItemSpy.mockReturnValue(validSessionTS.toString());

        const sessionId = Session.getSessionId();
        expect(Storage.setItem).not.toHaveBeenCalled();
        expect(sessionId).toEqual(validSessionTS.toString());
      });
    });

    describe('session is more than 5 minutes old', () => {
      it('should create a new session', () => {
        const expiredSessionTS = ((Date.now() / 1000) - 600); // 10 mins old
        getItemSpy.mockReturnValue(expiredSessionTS.toString());

        const sessionId = Session.getSessionId();
        expect(Storage.setItem).toHaveBeenCalledWith(Storage.SESSION_ID, sessionId);
      });
    });
  });
});
