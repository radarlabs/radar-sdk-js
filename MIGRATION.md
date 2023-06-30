## Migrating from 3.x to 4.x

Radar JS SDK 4.0 is a complete re-write of the existing SDK in Typescript, with exposed bindings to all functions and objects. It's also written to take advantage of modern JS best pracices such as ES Modules, and using `async/await` for Promise-based functions.

In addition, 4.0 also introduces Radar UI Kits. These are out-of-the-box components that allow you to easily create web-based experiences that leverage Radar apis, including Maps and Autocomplete inputs, with more to come in future releases.

Follow the instructions below for installing the latest version, and any updates to previous implementations.

### Setup and installation

The Radar JS SDK now has a dependency on [maplibre-gl-js](https://github.com/maplibre/maplibre-gl-js) to power Radar Maps functionality. This is included as a `peerDependency` in the project, so if you're installing the Radar SDK as an ES Module, you'll need to install MapLibre as an additional package.
```bash
npm install --save radar-sdk-js maplibre-gl-js@2.4.0
```

### Initialization

Calls to initialize the Radar SDK have not changed, except there are now additional configuration options that can be set upon initialization.
```js
Radar.initialize('<RADAR_PUBLISHABLE_KEY>', {
  logLevel: 'info',        // none | info | warn | error
  desiredAccuracy: 'high', // high | medium | low
  cacheLocationMinutes: 5, // don't re-prompt for location permissions for 5 minutes
  locationTimeout: 10000,  // timeout fetching device location after 10s
  debug: false,            // include additional console logging of debug info
});
```

`Radar.initialize` needs to be called with a publishableKey before any other functions are called.

### Async / await

Version 3.0 of the SDK was mostly callback based, whereas 4.0 is now Promise based. Each function that performs an async action will return a `Promise`, or throw an `Error` in the case of a failure.

Example change:
```js
// previous version
Radar.trackOnce(function(err, result) {
  if (!err) {
    // do something with result.location, result.events, result.user
  }
});


// updated with async/await
try {
  const { location, events, user } = await Radar.trackOnce();
  // do something with location, events, user

} catch (err) {
  // handle error
}

// OR

// updated with Promises
Radar.trackOnce()
  .then(({ location, events, user }) => {
    // do something with location, events, user
  })
  .catch((err) => {
    // handle error
  });
```

### Error handling

As mentioned in the async/await examples above, errors are now `thrown` objects to be handled instead of strings returned with the response. As such, Errors now contain more helpful debugging info including:
* Strack trace of where error occured
* More descriptive error messages (`err.message`)
* HTTP Error codes (`err.code`)
* API response details about what failed (`err.response`)
