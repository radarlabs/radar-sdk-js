import Config from './config';

const LOG_LEVELS = {
  none: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
};

// get the numeric level for logLevel option
const getLevel = (): number => {
  // disable logging in tests
  if (typeof window !== 'undefined' && window.RADAR_TEST_ENV) {
    return LOG_LEVELS.none;
  }

  const { logLevel } = Config.get();
  return logLevel ? LOG_LEVELS[logLevel] : LOG_LEVELS.error;
};

/** leveled console logger controlled by SDK config */
class Logger {
  /** log a debug-level message (only when debug mode is enabled) */
  public static debug(message: string, options?: any) {
    if (getLevel() === LOG_LEVELS.debug) {
      console.log(`Radar SDK (debug): ${message.trim()}`, options);
    }
  }

  /** log an info-level message */
  public static info(message: string) {
    if (getLevel() >= LOG_LEVELS.info) {
      console.log(`Radar SDK: ${message.trim()}`);
    }
  }

  /** log a warning-level message */
  public static warn(message: string) {
    if (getLevel() >= LOG_LEVELS.warn) {
      console.warn(`Radar SDK: ${message.trim()}`);
    }
  }

  /** log an error-level message; optional second argument for structured diagnostics (printed as a separate console.error arg) */
  public static error(message: string, data?: unknown) {
    if (getLevel() >= LOG_LEVELS.error) {
      const trimmed = message.trim();
      if (data !== undefined) {
        console.error(`Radar SDK: ${trimmed}`, data);
      } else {
        console.error(`Radar SDK: ${trimmed}`);
      }
    }
  }
}

export default Logger;
