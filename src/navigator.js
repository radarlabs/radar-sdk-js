// consts
import STATUS from './status_codes';

class Navigator {
  static getCurrentPosition(callback) {
    if (!navigator || !navigator.geolocation) {
      callback(STATUS.ERROR_LOCATION);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      // success callback
      (position) => {
        if (!position || !position.coords) {
          callback(STATUS.ERROR_LOCATION);
          return;
        }

        const { accuracy, latitude, longitude } = position.coords;

        callback(STATUS.SUCCESS, { accuracy, latitude, longitude });
        return;
      },
      // error callback
      (err) => {
        if (err && err.code) {
          if (err.code === 1) {
            callback(STATUS.ERROR_PERMISSIONS);
          } else {
            callback(STATUS.ERROR_LOCATION);
          }
          return;
        }
      }
    )
  }
}

export default Navigator;
