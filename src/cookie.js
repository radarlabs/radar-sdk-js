class Cookie {

  // KEYS
  static get DESCRIPTION() {
    return 'radar-description';
  }
  static get DEVICE_ID() {
    return 'radar-deviceId';
  }
  static get METADATA() {
    return 'radar-metadata';
  }
  static get HOST() {
    return 'radar-host';
  }
  static get PUBLISHABLE_KEY() {
    return 'radar-publishableKey';
  }
  static get USER_ID () {
    return 'radar-userId';
  }
  static get TRIP_OPTIONS () {
    return 'radar-trip-options';
  }
  static get CUSTOM_HEADERS () {
    return 'radar-custom-headers';
  }
  static get TRACK_ENDPOINT () {
    return 'radar-track-endpoint';
  }

  // parse cookie string to return value at {key}
  static getCookie(key) {
    if (!document || document.cookie === undefined) {
      return null;
    }

    const prefix = `${key}=`;
    const cookies = document.cookie.split(';');
    const value = cookies.find(
      (cookie) => cookie.indexOf(prefix) != -1
    );

    return value ? value.trim().substring(prefix.length) : null;
  }

  // set cookie using {key, value}
  static setCookie(key, value) {
    if (!document || !document.cookie === undefined || typeof value !== 'string') {
      return;
    }

    const date = new Date();
    date.setFullYear(date.getFullYear() + 10);

    const expires = `expires=${date.toGMTString()}`;
    const sameSite = 'samesite=strict';
    document.cookie = `${key}=${value};path=/;${sameSite};${expires}`;
  }

  // delete cookie with {key}
  static deleteCookie(key) {
    if (!document || !document.cookie) {
      return;
    }

    document.cookie = `${key}=;expires=Thu, 01-Jan-1970 00:00:01 GMT;path=/`;
  }
}

export default Cookie;
