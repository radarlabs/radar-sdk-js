import type { RadarOptions } from './types';

class Config {
  static options: RadarOptions;

  static defaultOptions = {
    live: false,
    logLevel: 'error',
    // host: 'https://api.radar-staging.com',
    host: 'http://localhost:8081',
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
}

export default Config
