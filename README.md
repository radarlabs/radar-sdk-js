<p align="center">
  <img src="assets/logo.svg">
</p>

<h4 align="center">
  <a href="https://radar.com">Website</a> |
  <a href="https://radar.com/blog">Blog</a> |
  <a href="https://radar.com/documentation">Documentation</a> |
  <a href="https://radar.com/documentation/faq">FAQ</a> |
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
* <a href="Https://radar.com/demo/api">Maps APIs</a>

## ✨ Features (TODO)
* Feature 1
* Feature 2
* Typescript!
* etc...

## 🚀 Installation and Usage

**With npm:** <br />

> **Note:** The Radar JS SDK has a peer depdendency on [maplibre-gl-js](https://github.com/maplibre/maplibre-gl-js).

Add the `radar-sdk-js` and `maplibre-gl-js` package
```bash
# with npm
npm install --save radar-sdk-js maplibre-gl-js@2.4.0

# with yarn
yarn add radar-sdk-js maplibre-gl-js@2.4.0
```

Then import as an ES Module in your project
```js
import Radar from 'radar-sdk-js';

// initialize with your test or live publishable key
Radar.initialize('prj_test_pk_...', { /* options */ });
```

**In your html:** <br />

> The MapLibre dependency is not necessary to install when using installation with the script tag.

Add the following script in your `html` file
```html
<script src="https://js.radar.com/v4.0.0-beta.1/radar.min.js"></script>
```

Then initialize the Radar SDK
```html
<script type="text/javascript">
  Radar.initialize('prj_test_pk_...', { /* options */ });
</script>
```

## Quickstart
TODO

See more examples and usage in the Radar web SDK documentation [here](https://radar.com/documentation/sdk/web).


## 🔗 Other links
* [Contributing](#)
* [Migrating from 3.x to 4.x](#)

## 📫 Support

Have questions? We're here to help! Email us at [support@radar.com](mailto:support@radar.com).
