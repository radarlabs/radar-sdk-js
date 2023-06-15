import type { RadarOptions } from './types';

class Config {
  static options: RadarOptions;

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
