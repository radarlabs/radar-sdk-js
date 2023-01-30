import STATUS from './status';
import Storage from './storage';

class Navigator {
  static getCurrentPosition() {
    return new Promise((resolve, reject) => {

      if (!navigator || !navigator.geolocation) {
        return reject(STATUS.ERROR_LOCATION);
      }

      let locationTimeToLive = parseFloat(Storage.getItem(Storage.LOCATION_TIME_TO_LIVE));

      if (locationTimeToLive) {
        try {
          const lastLocation = JSON.parse(Storage.getItem(Storage.LAST_LOCATION));
          const { latitude, longitude, accuracy, updatedAt } = lastLocation;

          if(Date.now() < updatedAt + locationTimeToLive * 60 * 1000){
            // check expiration stuff goes here
            if(latitude && longitude && accuracy){
              return resolve({ latitude, longitude, accuracy });
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

          if (locationTimeToLive) {
            const lastLocation = { latitude, longitude, accuracy, updatedAt: Date.now() };
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
