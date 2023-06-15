import Config from './config';
import Logger from './logger';
import Storage from './storage';
import { RadarLocationError, RadarLocationPermissionsError } from './errors';

import type { LocationAuthorization, NavigatorPosition } from './types';

// https://developer.mozilla.org/en-US/docs/Web/API/GeolocationPositionError
const PERMISSION_ERROR_MESSAGES: any = {
  1: 'Permission denied.',
  2: 'Position unavailable.',
  3: 'Timeout.',
};

const DEFAULT_LOCATION_OPTIONS = {
  maximumAge: 0,
  timeout: 1000 * 30, // 30 seconds
  enableHighAccuracy: true,
};

class Navigator {
  public static async getCurrentPosition(): Promise<NavigatorPosition> {
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
        (err) => { // location call failed or user did not grant permission
          if (err && err.code) {
            const message = PERMISSION_ERROR_MESSAGES[err.code.toString()] || 'unknown';
            return reject(new RadarLocationPermissionsError(message));
          }
          return reject(new RadarLocationError('Could not determine location.'));
        },
        DEFAULT_LOCATION_OPTIONS,
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
