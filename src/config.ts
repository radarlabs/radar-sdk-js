import { RadarError } from './errors';
import type { RadarOptions } from './types';

class Config {
  static options: RadarOptions;
  static errorCallback: ((error: RadarError) => void) | null = null;

  static defaultOptions = {
    live: false,
    logLevel: 'error',
    host: 'https://api.radar.io',
    version: 'v1',
    debug: false,
  };

  public static setup(options: RadarOptions = {}) {
    Config.options = options;
  }

  public static get(): RadarOptions {
    return Config.options || {};
  }

  public static clear() {
    Config.options = {};
    Config.errorCallback = null;
  }

  public static onError(callback: (error: RadarError) => void) {
    Config.errorCallback = callback;
  }

  public static sendError(error: any) {
    if (Config.errorCallback && error) {
      Config.errorCallback(error);
    }
  }
}

export default Config
