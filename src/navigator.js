import STATUS from './status_codes';

export function getCurrentPosition(callback) {
  if (!navigator || !navigator.geolocation) {
    if (callback) {
      callback(STATUS.ERROR_LOCATION);
    }
    return;
  }

  navigator.geolocation.getCurrentPosition(
      // success callback
      (position) => {
        if (!position || !position.coords) {
          if (callback) {
            callback(STATUS.ERROR_LOCATION);
          }
          return;
        }

        const { accuracy, latitude, longitude } = position.coords;

        callback(STATUS.SUCCESS, { accuracy, latitude, longitude });
      },
      // error callback
      (err) => {
        if (callback && err && err.code) {
          if (err.code === 1) {
            callback(STATUS.ERROR_PERMISSIONS);
          } else {
            callback(STATUS.ERROR_LOCATION);
          }
        }
      }
  )
}
