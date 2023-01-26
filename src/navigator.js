import STATUS from './status';
import Storage from './storage';

class Navigator {
  static getCurrentPosition() {
    return new Promise((resolve, reject) => {

      if (!navigator || !navigator.geolocation) {
        return reject(STATUS.ERROR_LOCATION);
      }

      let locationTimeToLive = parseFloat(Storage.getItem(Storage.LOCATION_TIME_TO_LIVE))
      let cachedTimeString = Storage.getItem(Storage.LAST_LOCATION_TIME)
      debugger;
      if(locationTimeToLive && cachedTimeString){
        let cachedTime = parseInt(cachedTimeString)
        if(Date.now() < cachedTime + locationTimeToLive * 60 * 1000){
          let latitude = Storage.getItem(Storage.LATITUDE)
          let longitude = Storage.getItem(Storage.LONGITUDE)
          let accuracy = Storage.getItem(Storage.ACCURACY)
          if(latitude && longitude && accuracy){
            return resolve({ latitude, longitude, accuracy });
          }
        }
      }

      navigator.geolocation.getCurrentPosition(
        // success callback
        (position) => {
          if (!position || !position.coords) {
            return reject(STATUS.ERROR_LOCATION);
          }

          const { latitude, longitude, accuracy } = position.coords;

          Storage.setItem(Storage.LAST_LOCATION_TIME, Date.now())
          Storage.setItem(Storage.LATITUDE, latitude)
          Storage.setItem(Storage.LONGITUDE, longitude)
          Storage.setItem(Storage.ACCURACY, accuracy)

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
