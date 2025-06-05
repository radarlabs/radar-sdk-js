import type { RadarOptions } from './types';

class Config {
  static options: RadarOptions;
  static initialized: boolean = false;

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

  public static setInitialized() {
    Config.initialized = true;
  }

  public static isInitialized(): boolean {
    return Config.initialized;
  }

  public static get(): RadarOptions {
    return Config.options || {};
  }

  public static clear() {
    Config.options = {};
  }
}

export default Config
