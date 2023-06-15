import Storage from '../src/storage';
import Session from '../src/session';

describe('Session', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('session does not exist', () => {
    it('should create a return the new session id', () => {
      jest.spyOn(Storage, 'getItem').mockReturnValue(null);
      const setSpy = jest.spyOn(Storage, 'setItem');

      const sessionId = Session.getSessionId();
      expect(setSpy).toHaveBeenCalledWith(Storage.SESSION_ID, sessionId);
    });
  });

  describe('session exists', () => {
    describe('session is less than 5 minutes old', () => {
      it('should not create a new session', () => {
        const validSessionTS = (Date.now() / 1000);
        jest.spyOn(Storage, 'getItem').mockReturnValue(validSessionTS.toString());
        const setSpy = jest.spyOn(Storage, 'setItem');

        const sessionId = Session.getSessionId();
        expect(setSpy).not.toHaveBeenCalled();
        expect(sessionId).toEqual(validSessionTS.toString());
      });
    });

    describe('session is more than 5 minutes old', () => {
      it('should create a new session', () => {
        const expiredSessionTS = ((Date.now() / 1000) - 600); // 10 mins old
        jest.spyOn(Storage, 'getItem').mockReturnValue(expiredSessionTS.toString());
        const setSpy = jest.spyOn(Storage, 'setItem');

        const sessionId = Session.getSessionId();
        expect(setSpy).toHaveBeenCalledWith(Storage.SESSION_ID, sessionId);
      });
    });
  });
});
