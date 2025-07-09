import type {RadarOptions, RadarTrackVerifiedResponse} from './types';
import { RadarError } from './errors';

class Config {
  static options: RadarOptions;
  static errorCallback: ((err: RadarError) => void) | null = null;

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

  public static setOnErrorCallback(callback:(error: RadarError) => void){
    Config.errorCallback = callback;
  }

  public static getOnErrorCallback(){
    return Config.errorCallback;
  }
}

export default Config
