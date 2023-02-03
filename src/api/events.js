import Http from '../http';
import Storage from '../storage';
import Device from '../device';

class Events {
  static async sendEvent(eventData={}) {
    const { type, metadata, createdAt } = eventData;

    const deviceId = Device.getId();
    const userId = Storage.getItem(Storage.USER_ID);

    return Http.request('POST', 'events', { type, metadata, deviceId, userId, createdAt })
  }
}

export default Events;
