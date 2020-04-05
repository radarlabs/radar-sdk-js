import * as Http from '../http';
import Navigator from '../navigator';

// consts
import STATUS from '../status_codes';

class Context {
  static getContext(callback) {
    Navigator.getCurrentPosition((status, { latitude, longitude }) => {
      if (status !== STATUS.SUCCESS) {
        callback(status);
        return;
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

    const httpCallback = (status, response) => {
      callback(status, response);
      return;
    }

    Http.request(method, path, queryParams, 'context', httpCallback);
  }
}

export default Context;
