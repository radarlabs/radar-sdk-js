<p align="center">
  <img src="assets/logo.svg">
</p>

<h4 align="center">
  <a href="https://radar.com">Website</a> |
  <a href="https://radar.com/blog">Blog</a> |
  <a href="https://radar.com/documentation">Documentation</a> |
  <a href="mailto:support@radar.com">Support</a>
</h4>

<p align="center">
  <a href="https://www.npmjs.com/package/radar-sdk-js"><img src="https://img.shields.io/npm/v/radar-sdk-js.svg" alt="npm"></a>
  <a href="https://app.circleci.com/pipelines/github/radarlabs/radar-sdk-js"><img src="https://img.shields.io/circleci/project/github/radarlabs/radar-sdk-js/master.svg" alt="CircleCI branch"></a>
  <a href="http://npm-stat.com/charts.html?package=radar-sdk-js"><img src="https://img.shields.io/npm/dm/radar-sdk-js.svg?style=flat-square" alt="NPM downloads"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache%202-blue" alt="License"></a>
</p>

<p align="center">
  ⚡ Use Radar SDKs and APIs to add location context to your apps with just a few lines of code. ⚡
</p>

🔥 Try it! 🔥

- <a href="https://radar.com/demo/js">Geofencing</a>
- <a href="https://radar.com/demo/api">Maps APIs</a>
- <a href="https://radar.com/documentation/maps/maps">Maps UI</a>
- <a href="https://radar.com/documentation/maps/autocomplete">Autocomplete UI</a>

## 🚀 Installation and Usage

### With npm

Install the core SDK:

```bash
# with npm
npm install radar-sdk-js

# with yarn
yarn add radar-sdk-js
```

Then import and initialize:

```js
import Radar from 'radar-sdk-js';

// initialize with your test or live publishable key
Radar.initialize('prj_test_pk_...', {
  /* options */
});
```

### With a script tag

Add the following to your HTML:

```html
<script src="https://js.radar.com/v5.0.0/radar.min.js"></script>

<script>
  Radar.initialize('prj_test_pk_...', {
    /* options */
  });
</script>
```

## Adding plugins

In v5 the Maps, Autocomplete, and Fraud components are separate packages that
you install alongside the core SDK. This keeps the core bundle small if you
only need the API.

### Maps plugin (npm)

```bash
npm install @radarlabs/plugin-maps maplibre-gl
```

```js
import Radar from 'radar-sdk-js';
import { createMapsPlugin } from '@radarlabs/plugin-maps';
import '@radarlabs/plugin-maps/dist/radar-maps.css';

Radar.registerPlugin(createMapsPlugin());
Radar.initialize('prj_test_pk_...');

const map = Radar.ui.map({
  container: 'map',
});
```

### Autocomplete plugin (npm)

```bash
npm install @radarlabs/plugin-autocomplete
```

```js
import Radar from 'radar-sdk-js';
import { createAutocompletePlugin } from '@radarlabs/plugin-autocomplete';
import '@radarlabs/plugin-autocomplete/dist/radar-autocomplete.css';

Radar.registerPlugin(createAutocompletePlugin());
Radar.initialize('prj_test_pk_...');

Radar.ui.autocomplete({
  container: 'autocomplete',
  onSelection: (result) => {
    console.log(result);
  },
});
```

### Fraud plugin (npm)

```bash
npm install @radarlabs/plugin-fraud
```

```js
import Radar from 'radar-sdk-js';
import { createFraudPlugin } from '@radarlabs/plugin-fraud';

Radar.registerPlugin(createFraudPlugin());
Radar.initialize('prj_live_pk_...');

const { token, user, events } = await Radar.fraud.trackVerified();
```

### Plugins via script tag (CDN)

Plugin CDN bundles auto-register with the core SDK when loaded. Load
the core SDK first, then any plugins you need:

```html
<link href="https://js.radar.com/maps/v1.0.0/radar-maps.css" rel="stylesheet" />
<link href="https://js.radar.com/autocomplete/v1.0.0/radar-autocomplete.css" rel="stylesheet" />

<script src="https://js.radar.com/v5.0.0/radar.min.js"></script>
<script src="https://js.radar.com/maps/v1.0.0/radar-maps.min.js"></script>
<script src="https://js.radar.com/autocomplete/v1.0.0/radar-autocomplete.min.js"></script>
<script src="https://js.radar.com/fraud/v1.0.0/radar-fraud.min.js"></script>
```

## Quickstart

### Create a map

Initialize the SDK and the maps plugin, then render a map into an HTML element
by ID or element reference.

```html
<html>
  <head>
    <link href="https://js.radar.com/maps/v1.0.0/radar-maps.css" rel="stylesheet" />
    <script src="https://js.radar.com/v5.0.0/radar.min.js"></script>
    <script src="https://js.radar.com/maps/v1.0.0/radar-maps.min.js"></script>
  </head>

  <body>
    <div id="map" style="width: 100%; height: 500px;" />

    <script>
      Radar.initialize('<RADAR_PUBLISHABLE_KEY>');

      const map = Radar.ui.map({
        container: 'map', // OR document.getElementById('map')
      });
    </script>
  </body>
</html>
```

> Provide a `width` and `height` on the container element for the map to
> render correctly.

### Create an autocomplete input

```html
<html>
  <head>
    <link href="https://js.radar.com/autocomplete/v1.0.0/radar-autocomplete.css" rel="stylesheet" />
    <script src="https://js.radar.com/v5.0.0/radar.min.js"></script>
    <script src="https://js.radar.com/autocomplete/v1.0.0/radar-autocomplete.min.js"></script>
  </head>

  <body>
    <div id="autocomplete" />

    <script>
      Radar.initialize('<RADAR_PUBLISHABLE_KEY>');

      // create autocomplete widget
      Radar.ui.autocomplete({
        container: 'autocomplete', // OR document.getElementById('autocomplete')
        responsive: true,
        width: '600px',
        onSelection: (result) => {
          console.log(result);
        },
      });
    </script>
  </body>
</html>
```

### Geofencing

Use the [Track API](https://radar.com/documentation/api#track) to get the
user's current location for geofence and event detection. No UI plugins
are needed for geofencing.

```html
<html>
  <head>
    <script src="https://js.radar.com/v5.0.0/radar.min.js"></script>
  </head>

  <body>
    <script>
      Radar.initialize('<RADAR_PUBLISHABLE_KEY>');

      Radar.trackOnce({ userId: 'example-user-id' }).then(({ location, user, events }) => {
        // do something with user location or events
      });
    </script>
  </body>
</html>
```

## Packages

| Package                          | npm                                                                                                                                     | Description                                               |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `radar-sdk-js`                   | [![npm](https://img.shields.io/npm/v/radar-sdk-js.svg)](https://www.npmjs.com/package/radar-sdk-js)                                     | Core SDK — tracking, geocoding, search, routing           |
| `@radarlabs/plugin-maps`         | [![npm](https://img.shields.io/npm/v/@radarlabs/plugin-maps.svg)](https://www.npmjs.com/package/@radarlabs/plugin-maps)                 | Maps UI — RadarMap, RadarMarker, RadarPopup (MapLibre GL) |
| `@radarlabs/plugin-autocomplete` | [![npm](https://img.shields.io/npm/v/@radarlabs/plugin-autocomplete.svg)](https://www.npmjs.com/package/@radarlabs/plugin-autocomplete) | Autocomplete UI widget                                    |
| `@radarlabs/plugin-fraud`        | [![npm](https://img.shields.io/npm/v/@radarlabs/plugin-fraud.svg)](https://www.npmjs.com/package/@radarlabs/plugin-fraud)               | Fraud detection — verified tracking, location tokens      |

## Plugin system

Version 5 introduces a plugin architecture. UI components like Maps and
Autocomplete are no longer bundled in the core SDK. Instead, you register
plugins before or after calling `Radar.initialize()`:

```js
import Radar from 'radar-sdk-js';
import { createMapsPlugin } from '@radarlabs/plugin-maps';
import { createAutocompletePlugin } from '@radarlabs/plugin-autocomplete';
import { createFraudPlugin } from '@radarlabs/plugin-fraud';

Radar.registerPlugin(createMapsPlugin());
Radar.registerPlugin(createAutocompletePlugin());
Radar.registerPlugin(createFraudPlugin());
Radar.initialize('prj_test_pk_...');
```

If you're building a custom plugin, import the plugin types from the
`radar-sdk-js/plugin` subpath:

```ts
import type { RadarPlugin, RadarPluginContext } from 'radar-sdk-js/plugin';
```

## 🔗 Other links

- [Contributing](CONTRIBUTING.md)
- [Migrating from 3.x to 4.x](https://github.com/radarlabs/radar-sdk-js/blob/v4-beta/MIGRATION.md)
- [Migrating from 4.x to 5.x](MIGRATION.md)
- [Radar documentation](https://radar.com/documentation/sdk/web)

## 📫 Support

Have questions? We're here to help! Email us at [support@radar.com](mailto:support@radar.com).
