import type { RadarError } from './errors';
import type { RadarOptions } from './types';

/** global SDK configuration singleton */
class Config {
  /** current SDK options */
  static options: RadarOptions;
  /** registered error callback, if any */
  static errorCallback: ((error: RadarError) => void) | null = null;

  /** default option values applied during initialization */
  static defaultOptions = {
    live: false,
    logLevel: 'error',
    host: 'https://api.radar.io',
    version: 'v1',
    debug: false,
  };

  /** store SDK options (called by Radar.initialize) */
  public static setup(options: RadarOptions = {}) {
    Config.options = options;
  }

  /** get the current SDK options */
  public static get(): RadarOptions {
    return Config.options || {};
  }

  /** clear all SDK options and error callback */
  public static clear() {
    Config.options = {};
    Config.errorCallback = null;
  }

  /** register a callback invoked on SDK errors */
  public static onError(callback: (error: RadarError) => void) {
    Config.errorCallback = callback;
  }

  /** dispatch an error to the registered callback */
  public static sendError(error: any) {
    if (Config.errorCallback && error) {
      Config.errorCallback(error);
    }
  }
}

export default Config;
