import * as Http from '../http';
import Navigator from '../navigator';

// consts
import STATUS from '../status_codes';

class Context {
  static getContext(callback) {
    Navigator.getCurrentPosition((status, { latitude, longitude }) => {
      if (status !== STATUS.SUCCESS) {
        callback(status);
      }

      this.getContextForLocation({ latitude, longitude },
        (status, context) => {
          callback(status, context);
          return;
        }
      )
    });
  }

  static getContextForLocation({ latitude, longitude }, callback) {
    const queryParams = {
      coordinates: `${latitude},${longitude}`,
    };

    const path = `v1/context`;
    const method = 'GET';

    const onSuccess = (response) => {
      try {
        response = JSON.parse(response);

        callback(STATUS.SUCCESS, response.context);
      } catch (e) {
        callback(STATUS.ERROR_SERVER);
      }
    };

    const onError = (error) => {
      callback(error);
    };

    Http.request(method, path, queryParams, onSuccess, onError);
  }
}

export default Context;
