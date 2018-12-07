![Radar](https://raw.githubusercontent.com/radarlabs/react-native-radar/master/logo.png)

[![npm](https://img.shields.io/npm/v/radar-sdk-js.svg)](https://www.npmjs.com/package/radar-sdk-js)
![CircleCI branch](https://img.shields.io/circleci/project/github/radarlabs/radar-sdk-js/master.svg)
[![Codecov](https://img.shields.io/codecov/c/github/radarlabs/radar-sdk-js.svg)](https://codecov.io/gh/radarlabs/radar-sdk-js)



[Radar](https://radar.io) is the location platform for mobile apps.

## Installation

In an HTML page, include the SDK using a `<script>` tag:

```html
<script src="https://js.radar.io/v1.0.0/radar.min.js" integrity="sha384-TFQktvQ2F2ST3MCcepqaOHqwc36jDy7r/gAj7dOvU6VXtJ4m4Dj2hByxZ59d4MjK" crossorigin="anonymous"></script>
```

In a web app, install the package from npm, then import the module:

```bash
npm install --save radar-sdk-js
```

```javascript
import Radar from 'radar-sdk-js';
```

The SDK is less than 10 KB minified.

## Usage

### Initialize SDK

To initialize the SDK, call:

```javascript
Radar.initialize(publishableKey);
```

where `publishableKey` is a string containing your Radar publishable API key.

To get a Radar publishable API key, [sign up for a Radar account](https://radar.io).

### Enable Places

If you are using Places, you must set Facebook as your place data provider.

To set Facebook as your place data provider, call:

```javascript
Radar.setPlacesProvider(Radar.PLACES_PROVIDER.FACEBOOK);
```

To disable Places later, call:

```javascript
Radar.setPlacesProvider(Radar.PLACES_PROVIDER.NONE);
```

Learn more about [Places](https://radar.io/documentation/places).

### Identify user

Until you identify the user, Radar will automatically identify the user by a random UUID "device ID" stored in a cookie.

To identify the user when logged in, call:

```javascript
Radar.setUserId(userId);
```

where `userId` is a stable unique ID string for the user.

To set an optional description for the user, displayed in the dashboard, call:

```javascript
Radar.setDescription(description);
```

where `description` is a string.

You only need to call these functions once, as these settings will be persisted across browser sessions in cookies.

### Foreground tracking

Once you have initialized the SDK, you have identified the user, and the user has granted permissions, you can track the user's location.

The SDK uses the [HTML5 geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/Using_geolocation) to determine the user's location.

To track the user's location, call:

```javascript
Radar.trackOnce(function(status, location, user, events) {
  // do something with status, location, user, events
});
```

`status` will be a string, one of:

- `Radar.STATUS.SUCCESS`: the request succeeded
- `Radar.STATUS.ERROR_PUBLISHABLE_KEY`: the SDK was not initialized
- `Radar.STATUS.ERROR_PERMISSIONS`: the user has not granted location permissions for the website
- `Radar.STATUS.ERROR_LOCATION`: location services were unavailable, or the location request timed out
- `Radar.STATUS.ERROR_NETWORK`: the network was unavailable, or the network connection timed out
- `Radar.STATUS.ERROR_UNAUTHORIZED`: the publishable API key is invalid
- `Radar.STATUS.ERROR_RATE_LIMIT`: exceeded rate limit of 1 request per second per user or 60 requests per hour per user
- `Radar.STATUS.ERROR_SERVER`: an internal server error occurred

## Support

Have questions? We're here to help! Email us at [support@radar.io](mailto:support@radar.io).
