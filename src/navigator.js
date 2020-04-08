import ERROR from './error_codes';

class Navigator {
  static getCurrentPosition() {
    return new Promise((resolve, reject) => {

      if (!navigator || !navigator.geolocation) {
        return reject(ERROR.LOCATION);
      }

      navigator.geolocation.getCurrentPosition(
        // success callback
        (position) => {
          if (!position || !position.coords) {
            return reject(ERROR.LOCATION);
          }

          const { latitude, longitude, accuracy } = position.coords;

          return resolve({ latitude, longitude, accuracy });
        },
        // error callback
        (err) => {
          if (err && err.code) {
            if (err.code === 1) {
              return reject(ERROR.PERMISSIONS);
            }
          }
          return reject(ERROR.LOCATION);
        }
      );
    });
  }
}

export default Navigator;
