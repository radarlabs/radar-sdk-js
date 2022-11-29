import Http from '../http';
import Session from '../session'
import Navigator from '../navigator';
import Storage from '../storage';
import Device from '../device';
class Config {
  static async getConfig() {

    const deviceId = Device.getId();
    const sessionId = Session.getId();
    const installId = Storage.getItem(Storage.INSTALL_ID) || deviceId;
    const locationAuthorization = await Navigator.getPermissionsStatus();

    const params = {
      installId,
      sessionId,
      locationAuthorization,
    };

    return Http.request('GET', `config`, params);
  }
}

export default Config;