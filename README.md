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
* <a href="https://radar.com/demo/js">Geofencing</a>
* <a href="https://radar.com/demo/api">Maps APIs</a>
* <a href="https://radar.com/documentation/maps/maps">Maps UI</a>
* <a href="https://radar.com/documentation/maps/autocomplete">Autocomplete UI</a>

## 🚀 Installation and Usage

### With npm

> **Note:** The Radar JS SDK has a peer dependency on [maplibre-gl-js](https://github.com/maplibre/maplibre-gl-js).

Add the `radar-sdk-js` and `maplibre-gl` packages
```bash
# with npm
npm install --save radar-sdk-js maplibre-gl

# with yarn
yarn add radar-sdk-js maplibre-gl
```

Then import as an ES Module in your project
```js
import Radar from 'radar-sdk-js';
import 'radar-sdk-js/dist/radar.css'

// initialize with your test or live publishable key
Radar.initialize('prj_test_pk_...', { /* options */ });
```

### In your html

> The MapLibre dependency is not necessary to install when using installation with the script tag.

Add the following script in your `html` file
```html
<script src="https://js.radar.com/v4.5.8/radar.min.js"></script>
```

Then initialize the Radar SDK
```html
<script type="text/javascript">
  Radar.initialize('prj_test_pk_...', { /* options */ });
</script>
```

## Quickstart

### Create a map
To create a map, first initialize the Radar SDK with your publishable key. Then specify the HTML element where you want to render the map, by providing the element's ID, or the element object itself.
```html
<html>
  <head>
    <link href="https://js.radar.com/v4.5.8/radar.css" rel="stylesheet">
    <script src="https://js.radar.com/v4.5.8/radar.min.js"></script>
  </head>

  <body>
    <div id="map" style="width: 100%; height: 500px;" />

    <script type="text/javascript">
      Radar.initialize('<RADAR_PUBLISHABLE_KEY>');

      const map = Radar.ui.map({
        container: 'map', // OR document.getElementById('map')
      });
    </script>
  </body>
</html>
```
> Remember to provide a `width` and `height` on the element the map is being rendered to

### Create an autocomplete input
To create an autocomplete input, first initialize the Radar SDK with your publishable key. Then specify the HTML element where you want to render the input.

```html
<html>
  <head>
    <link href="https://js.radar.com/v4.5.8/radar.css" rel="stylesheet">
    <script src="https://js.radar.com/v4.5.8/radar.min.js"></script>
  </head>

  <body>
    <div id="autocomplete"/>

    <script type="text/javascript">
      // initialize Radar SDK
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
To power [geofencing](https://radar.com/documentation/geofencing/overview) experiences on the web, use the [Track API](https://radar.com/documentation/api#track) to grab the user's current location for geofence and event detection.

```html
<html>
  <head>
    <link href="https://js.radar.com/v4.5.8/radar.css" rel="stylesheet">
    <script src="https://js.radar.com/v4.5.8/radar.min.js"></script>
  </head>

  <body>
    <script>
      Radar.initialize('<RADAR_PUBLISHABLE_KEY>');

      Radar.trackOnce({ userId: 'example-user-id' })
        .then(({ location, user, events }) => {
          // do something with user location or events
        });
    </script>
  </body>
</html>
```

See more examples and usage in the Radar web SDK documentation [here](https://radar.com/documentation/sdk/web).


## 🔗 Other links
* [Contributing](https://github.com/radarlabs/radar-sdk-js/blob/v4-beta/CONTRIBUTING.md)
* [Migrating from 3.x to 4.x](https://github.com/radarlabs/radar-sdk-js/blob/v4-beta/MIGRATION.md)

## 📫 Support

Have questions? We're here to help! Email us at [support@radar.com](mailto:support@radar.com).
