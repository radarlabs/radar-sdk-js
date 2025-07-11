import { RadarError } from './errors';
import type { RadarOptions } from './types';

let errorCallback: ((error: RadarError) => void) | null = null;

class Config {
  static options: RadarOptions;

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
  }

  public static onError(callback: (error: RadarError) => void) {
    errorCallback = callback;
  }

  public static sendError(error: any) {
    if (errorCallback && error) {
      errorCallback(error);
    }
  }
}

export default Config
