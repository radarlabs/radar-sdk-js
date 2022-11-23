import Storage from './storage';

class Session {
    static getId() {
        // use existing sessionId if present
        const sessionId = Storage.getItem(Storage.SESSION_ID);
        if (sessionId) {
          return sessionId;
        }
        const newSessionId = Math.round(Date.now()/1000).toString();
        Storage.setSessionItem(Storage.SESSION_ID, newSessionId);
        return newSessionId
    }
}

export default Session;