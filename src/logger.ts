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
  const { logLevel, debug } = Config.get();
  if (debug) {
    return LOG_LEVELS.debug;
  }
  if (logLevel) {
    return LOG_LEVELS[logLevel];
  }
  return 1; // default to error-level logging if not set
}

class Logger {
  public static debug(message: string) {
    if (getLevel() === LOG_LEVELS.debug) {
      console.log(`Radar SDK (debug): ${message.trim()}`);
    }
  }

  public static info(message: string) {
    if (getLevel() >= LOG_LEVELS.info) {
      console.log(`Radar SDK: ${message.trim()}`);
    }
  }

  public static warn(message: string) {
    if (getLevel() >= LOG_LEVELS.warn) {
      console.warn(`Radar SDK: ${message.trim()}`);
    }
  }

  public static error(message: string) {
    if (getLevel() >= LOG_LEVELS.error) {
      console.error(`Radar SDK: ${message.trim()}`);
    }
  }
}

export default Logger;
