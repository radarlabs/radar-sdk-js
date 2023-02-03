import STATUS from './status';
import Storage from './storage';

class Navigator {
  static getCurrentPosition() {
    return new Promise((resolve, reject) => {

      if (!navigator || !navigator.geolocation) {
        return reject(STATUS.ERROR_LOCATION);
      }

      const cacheLocationMinutes = parseFloat(Storage.getItem(Storage.CACHE_LOCATION_MINUTES));
      if (cacheLocationMinutes) {
        try {
          const lastLocation = JSON.parse(Storage.getItem(Storage.LAST_LOCATION));
          if (lastLocation) {
            const { latitude, longitude, accuracy } = lastLocation;
            if (Date.now() < parseInt(lastLocation.expiresAt)) {            // check expiration stuff goes here
              if (latitude && longitude && accuracy) {
                return resolve({ latitude, longitude, accuracy });
              }
            }
          }
        } catch (e) {
          console.warn('Radar SDK: could not load cached location.');
        }
      }

      navigator.geolocation.getCurrentPosition(
        // success callback
        (position) => {
          if (!position || !position.coords) {
            return reject(STATUS.ERROR_LOCATION);
          }

          const { latitude, longitude, accuracy } = position.coords;

          if (cacheLocationMinutes) {
            const updatedAt = Date.now();
            const expiresAt = updatedAt + (cacheLocationMinutes * 60 * 1000); // convert to ms

            const lastLocation = { latitude, longitude, accuracy, updatedAt, expiresAt };
            Storage.setItem(Storage.LAST_LOCATION, JSON.stringify(lastLocation));
          }

          return resolve({ latitude, longitude, accuracy });
        },
        // error callback
        (err) => {
          if (err && err.code && err.code === 1) {
            return reject(STATUS.ERROR_PERMISSIONS);
          }
          return reject(STATUS.ERROR_LOCATION);
        }
      );
    });
  }
}

export default Navigator;
