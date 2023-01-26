import Storage from '../storage';
import Device from '../device';
import Http from '../http';
import Navigator from '../navigator';

// consts
import SDK_VERSION from '../version';

class Track {
  static async trackOnce(params={}) {
    let { latitude, longitude, accuracy } = params;

    let useCacheLocation = false
    let timeToLive = parseFloat(Storage.getItem(Storage.LOCATION_TIME_TO_LIVE))
    let cachedTimeString = Storage.getItem(Storage.LAST_LOCATION_TIME)

    if(timeToLive && cachedTimeString){
      let cachedTime = parseInt(cachedTimeString)
      useCacheLocation = Date.now() < cachedTime + timeToLive * 60 * 1000 && (!latitude || !longitude)
    }

    if(useCacheLocation){
      latitude = Storage.getItem(Storage.LATITUDE)
      longitude = Storage.getItem(Storage.LONGITUDE)
      accuracy = Storage.getItem(Storage.ACCURACY)
    } else if ((!latitude || !longitude)) {
      const deviceLocation = await Navigator.getCurrentPosition();
      latitude = deviceLocation.latitude;
      longitude = deviceLocation.longitude;
      accuracy = deviceLocation.accuracy;

      Storage.setItem(Storage.LAST_LOCATION_TIME, Date.now())
      Storage.setItem(Storage.LATITUDE, latitude)
      Storage.setItem(Storage.LONGITUDE, longitude)
      Storage.setItem(Storage.ACCURACY, accuracy)
    }

    const deviceId = Device.getId();
    const userId = Storage.getItem(Storage.USER_ID);
    const installId = Storage.getItem(Storage.INSTALL_ID) || deviceId;
    const deviceType = Storage.getItem(Storage.DEVICE_TYPE) || 'Web';
    const description = Storage.getItem(Storage.DESCRIPTION);

    let metadata = Storage.getItem(Storage.METADATA);
    if (metadata) {
      metadata = JSON.parse(metadata);
    }

    let tripOptions = Storage.getItem(Storage.TRIP_OPTIONS);
    if (tripOptions) {
      tripOptions = JSON.parse(tripOptions);
    }

    const body = {
      ...params,
      accuracy,
      description,
      deviceId,
      deviceType,
      foreground: true,
      installId,
      latitude,
      longitude,
      metadata,
      sdkVersion: SDK_VERSION,
      stopped: true,
      userId,
      tripOptions,
    };

    const response = await Http.request('POST', 'track', body);
    response.location = { latitude, longitude, accuracy };

    return response;
  }
}

export default Track;
