import Config from './config';
import Logger from './logger';
import Storage from './storage';
import { RadarLocationError, RadarLocationPermissionsError } from './errors';

import type { LocationAuthorization, NavigatorPosition } from './types';

interface PositionOptionOverrides {
  desiredAccuracy?: string;
}

const DEFAULT_POSITION_OPTIONS: PositionOptions = {
  maximumAge: 0,
  timeout: 1000 * 30, // 30 seconds
  enableHighAccuracy: true,
};

// set "enableHighAccuracy" for navigator only when desiredAccuracy is "high"
const useHighAccuracy = (desiredAccuracy?: string) => (
  Boolean(desiredAccuracy === 'high')
);

class Navigator {
  public static async getCurrentPosition(overrides: PositionOptionOverrides = {}): Promise<NavigatorPosition> {
    return new Promise((resolve, reject) => {
      const options = Config.get();

      if (!navigator || !navigator.geolocation) {
        return reject(new RadarLocationError('navigator.geolocation is not available.'));
      }

      // use cached location if available and options are set
      if (options.cacheLocationMinutes) {
        try {
          const rawCachedLocation = Storage.getItem(Storage.CACHED_LOCATION);
          if (rawCachedLocation) {
            const cachedLocation = JSON.parse(rawCachedLocation);
            const { latitude, longitude, accuracy, expiresAt } = cachedLocation || {};
            if (Date.now() < parseInt(expiresAt)) {
              if (latitude && longitude && accuracy) {
                return resolve({ latitude, longitude, accuracy });
              }
            }
          }
        } catch (e) {
          Logger.warn('could not load cached location.');
        }
      }

      // set options from config
      const positionOptions = Object.assign({}, DEFAULT_POSITION_OPTIONS);
      if (options.locationMaximumAge !== undefined) {
        positionOptions.maximumAge = options.locationMaximumAge;
      }
      if (options.locationTimeout !== undefined) {
        positionOptions.timeout = options.locationTimeout;
      }
      if (options.desiredAccuracy !== undefined) {
        positionOptions.enableHighAccuracy = useHighAccuracy(options.desiredAccuracy);
      }

      // set options from overrides
      if (overrides.desiredAccuracy !== undefined) {
        positionOptions.enableHighAccuracy = useHighAccuracy(overrides.desiredAccuracy);
      }

      Logger.info(`Using geolocation options: ${JSON.stringify(positionOptions)}`);

      // get current location from browser
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!position || !position.coords) {
            return reject(new RadarLocationError('device location return empty coordinates.'));
          }

          const { latitude, longitude, accuracy } = position.coords;

          // cache location if option is set
          if (options.cacheLocationMinutes) {
            const cacheLocationMinutes = Number.parseFloat(options.cacheLocationMinutes as any);
            const updatedAt = Date.now();
            const expiresAt = updatedAt + (cacheLocationMinutes * 60 * 1000); // convert to ms

            const lastLocation = { latitude, longitude, accuracy, updatedAt, expiresAt };
            Storage.setItem(Storage.CACHED_LOCATION, JSON.stringify(lastLocation));
          }

          return resolve({ latitude, longitude, accuracy });
        },
        (err: GeolocationPositionError) => { // location call failed or user did not grant permission
          if (err && err.code === 1) {
            return reject(new RadarLocationPermissionsError('Permission denied.'));
          }
          return reject(new RadarLocationError('Could not determine location.'));
        },
        positionOptions,
      );
    });
  }

  public static async getPermissionStatus(): Promise<LocationAuthorization> {
    return new Promise((resolve, reject) => {
      if (!navigator || !navigator.permissions) {
        return reject(new RadarLocationError('navigator.permissions is not available.'));
      }

      navigator.permissions.query({ name: 'geolocation' }).then((permissionsStatus) => {
        let locationAuthorization: LocationAuthorization = 'NOT_DETERMINED';

        switch(permissionsStatus.state) {
          case 'granted':
            locationAuthorization = 'GRANTED_FOREGROUND'
            break;
          case 'denied':
            locationAuthorization = 'DENIED'
            break;
          case 'prompt':
            locationAuthorization = 'NOT_DETERMINED';
            break;
          default:
            break;
        }

        return resolve(locationAuthorization)
      });
    });
  }
}

export default Navigator;
