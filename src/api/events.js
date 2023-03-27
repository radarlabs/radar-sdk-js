import Http from '../http';
import Storage from '../storage';
import Device from '../device';

class Events {
  static async logConversion(eventData={}) {
    let { name, metadata, createdAt, revenue } = eventData;

    const deviceId = Device.getId();
    const userId = Storage.getItem(Storage.USER_ID);
    const installId = Storage.getItem(Storage.INSTALL_ID);

    if (revenue) {
      metadata = { ...metadata, revenue };
    }

    return Http.request('POST', 'events', { type: name, metadata, deviceId, userId, installId, createdAt })
  }
}

export default Events;
