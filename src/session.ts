import Storage from './storage';

const SESSION_TIMEOUT_SECS = 300; // 5 mins

const isValid = (sessionId: string): boolean => {
  const now = Math.trunc(Date.now() / 1000);
  const session = Number.parseInt(sessionId);
  const diff = Math.abs(now - session);
  return diff < SESSION_TIMEOUT_SECS;
}

class Session {
  static getSessionId() {
    const sessionId = Storage.getItem(Storage.SESSION_ID);

    // reuse session if still within 5 min threshold
    if (sessionId && isValid(sessionId)) {
      return sessionId;
    }

    // create new session if does not already exist or expired
    const newSessionId = Math.trunc(Date.now() / 1000).toString(); // unix ts in seconds
    Storage.setItem(Storage.SESSION_ID, newSessionId);
    return newSessionId;
  }
}

export default Session;
