var SDK_VERSION = '1.0.0-beta2';
var HOST_COOKIE = 'radar-host';
var DEVICE_ID_COOKIE = 'radar-deviceId';
var PUBLISHABLE_KEY_COOKIE = 'radar-publishableKey';
var PLACES_PROVIDER_COOKIE = 'radar-placesProvider';
var USER_ID_COOKIE = 'radar-userId';
var DESCRIPTION_COOKIE = 'radar-description';

var _Radar = {
  _getCookie: function(key) {
    if (!document || !document.cookie) {
      return null;
    }
    var prefix = key + '=';
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i];
      var index = cookie.indexOf(prefix);
      if (index != -1) {
        return cookie.substring(prefix.length + 1);
      }
    }
    return null;
  },
  _setCookie: function(key, value) {
    if (!document || !document.cookie) {
      return;
    }
    if (typeof value != 'string') {
      return;
    }
    var date = new Date();
    date.setFullYear(date.getFullYear() + 10);
    expires = 'expires=' + date.toGMTString();
    document.cookie = key + '=' + value + ';path=/;' + expires;
  },
  _deleteCookie: function(key) {
    if (!document || !document.cookie) {
      return;
    }
    document.cookie = key + '=;expires=Thu, 01-Jan-1970 00:00:01 GMT;path=/';
  },
  _request: function(method, url, body, headers, successCallback, errCallback) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    for (var header in headers) {
      xhr.setRequestHeader(header, headers[header]);
    }
    xhr.onload = function() {
      if (xhr.status == 200) {
        successCallback(xhr.response);
      } else if (xhr.status == 401) {
        errCallback(this.STATUS.ERROR_UNAUTHORIZED);
      } else if (xhr.status == 429) {
        errCallback(this.STATUS.ERROR_RATE_LIMIT);
      } else {
        errCallback(this.STATUS.ERROR_SERVER);
      }
    }.bind(this);
    xhr.onerror = function() {
      errCallback(this.STATUS.ERROR_SERVER);
    }.bind(this);
    xhr.timeout = function() {
      errCallback(this.STATUS.ERROR_NETWORK);
    }.bind(this);
    xhr.send(JSON.stringify(body));
  },
  _getDeviceId: function() {
    var deviceId = this._getCookie(DEVICE_ID_COOKIE);
    if (deviceId) {
      return deviceId;
    }
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    this._setCookie(DEVICE_ID_COOKIE, uuid, true)
    return uuid;
  },
  _setHost: function(host) {
    this._setCookie(HOST_COOKIE, host, true)
  },
  STATUS: {
    SUCCESS: 'SUCCESS',
    ERROR_PUBLISHABLE_KEY: 'ERROR_PUBLISHABLE_KEY',
    ERROR_PERMISSIONS: 'ERROR_PERMISSIONS',
    ERROR_LOCATION: 'ERROR_LOCATION',
    ERROR_NETWORK: 'ERROR_NETWORK',
    ERROR_UNAUTHORIZED: 'ERROR_UNAUTHORIZED',
    ERROR_RATE_LIMIT: 'ERROR_RATE_LIMIT',
    ERROR_SERVER: 'ERROR_SERVER'
  },
  PLACES_PROVIDER: {
    FACEBOOK: 'facebook',
    NONE: 'none'
  },
  initialize: function(publishableKey) {
    this._setCookie(PUBLISHABLE_KEY_COOKIE, publishableKey);
  },
  setPlacesProvider: function(placesProvider) {
    if (placesProvider !== this.PLACES_PROVIDER.FACEBOOK) {
      placesProvider = this.PLACES_PROVIDER.NONE;
    }
    this._setCookie(PLACES_PROVIDER_COOKIE, placesProvider);
  },
  setUserId: function(userId) {
    if (!userId) {
      this._deleteCookie(USER_ID_COOKIE);
      return;
    }
    if (typeof userId != 'string') {
      userId = String(userId);
    }
    userId = userId.trim();
    if (userId.length === 0 || userId.length > 256) {
      this._deleteCookie(USER_ID_COOKIE);
      return;
    }
    this._setCookie(USER_ID_COOKIE, userId);
  },
  setDescription: function(description) {
    if (!description) {
      this._deleteCookie(DESCRIPTION_COOKIE);
      return;
    }
    if (typeof description != 'string') {
      description = String(description);
    }
    description = description.trim();
    if (description.length === 0 || description.length > 256) {
      this._deleteCookie(DESCRIPTION_COOKIE);
      return;
    }
    this._setCookie(DESCRIPTION_COOKIE, description);
  },
  trackOnce: function(callback) {
    var publishableKey = this._getCookie(PUBLISHABLE_KEY_COOKIE);
    if (!publishableKey) {
      if (callback) {
        callback(this.STATUS.ERROR_PUBLISHABLE_KEY);
      }
      return;
    }
    if (!navigator || !navigator.geolocation) {
      if (callback) {
        callback(this.STATUS.ERROR_LOCATION);
      }
      return;
    }
    navigator.geolocation.getCurrentPosition(function(position) {
      if (!position || !position.coords) {
        if (callback) {
          callback(this.STATUS.ERROR_LOCATION);
        }
        return;
      }
      var deviceId = this._getDeviceId();
      var placesProvider = this._getCookie(PLACES_PROVIDER_COOKIE);
      var userId = this._getCookie(USER_ID_COOKIE);
      var description = this._getCookie(DESCRIPTION_COOKIE);
      var method = 'PUT';
      var _id = userId || deviceId;
      var host = this._getCookie(HOST_COOKIE) || 'https://api.radar.io';
      var url = host + '/v1/users/' + _id;
      var body = {
        longitude: position.coords.longitude,
        latitude: position.coords.latitude,
        accuracy: position.coords.accuracy,
        foreground: true,
        stopped: true,
        deviceId: deviceId,
        userId: userId,
        description: description,
        deviceType: 'Web',
        userAgent: navigator.userAgent,
        placesProvider: placesProvider,
        sdkVersion: SDK_VERSION
      };
      var headers = {
        Authorization: publishableKey
      };
      this._request(method, url, body, headers, function(res) {
        try {
          res = JSON.parse(res);
          callback(this.STATUS.SUCCESS, position.coords, res.user, res.events);
        } catch (err) {
          callback(this.STATUS.ERROR_SERVER);
        }
      }.bind(this), function(err) {
        if (callback) {
          callback(err);
        }
      });
    }.bind(this), function(err) {
      if (callback) {
        if (err && err.code) {
          if (err.code === 1) {
            callback(this.STATUS.ERROR_PERMISSIONS);
          } else {
            callback(this.STATUS.ERROR_LOCATION);
          }
        }
      }
    }.bind(this));
  }
};

window.Radar = _Radar;

if (typeof exports === 'object') {
  module.exports = _Radar;
}
