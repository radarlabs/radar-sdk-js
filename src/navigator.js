import STATUS from './status';

class Navigator {
  static getCurrentPosition() {
    return new Promise((resolve, reject) => {

      if (!navigator || !navigator.geolocation) {
        return reject(STATUS.ERROR_LOCATION);
      }

      navigator.geolocation.getCurrentPosition(
        // success callback
        (position) => {
          if (!position || !position.coords) {
            return reject(STATUS.ERROR_LOCATION);
          }

          const { latitude, longitude, accuracy } = position.coords;

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

  static getPermissionsStatus() {
    return new Promise((resolve, reject) => {
      if (!navigator || !navigator.permissions) {
        return reject(STATUS.ERROR_PERMISSIONS);
      }
      navigator.permissions.query({ name: 'geolocation' })
        .then((permissionsStatus) => {
          let locationAuthorization = "NOT_DETERMINED";
          switch(permissionsStatus.state) {
            case "granted":  
              locationAuthorization = "GRANTED_FOREGROUND"
              break;
            case "denied":  
              locationAuthorization = "DENIED"
              break;
            case "prompt":
              locationAuthorization = "NOT_DETERMINED";
              break;
            default:
              break;
          }
          return resolve(locationAuthorization)
          // return locationAuthorization;
        })
    })
  }
}

export default Navigator;
