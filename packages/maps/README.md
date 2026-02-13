<p align="center">
  <img src="https://raw.githubusercontent.com/radarlabs/radar-sdk-js/master/assets/logo.svg">
</p>

<h4 align="center">
  <a href="https://radar.com">Website</a> |
  <a href="https://radar.com/blog">Blog</a> |
  <a href="https://radar.com/documentation">Documentation</a> |
  <a href="mailto:support@radar.com">Support</a>
</h4>

<p align="center">
  <a href="https://www.npmjs.com/package/@radarlabs/plugin-maps"><img src="https://img.shields.io/npm/v/@radarlabs/plugin-maps.svg" alt="npm"></a>
</p>

<p align="center">
  Maps UI plugin for <a href="https://github.com/radarlabs/radar-sdk-js">radar-sdk-js</a>. Provides <code>Radar.ui.map()</code>, <code>Radar.ui.marker()</code>, and <code>Radar.ui.popup()</code> powered by <a href="https://maplibre.org/maplibre-gl-js/docs/">MapLibre GL JS</a>.
</p>

## 🚀 Installation and Usage

### With npm

```bash
# with npm
npm install @radarlabs/plugin-maps radar-sdk-js maplibre-gl

# with yarn
yarn add @radarlabs/plugin-maps radar-sdk-js maplibre-gl
```

Then import and initialize:

```js
import Radar from 'radar-sdk-js';
import { createMapsPlugin } from '@radarlabs/plugin-maps';
import '@radarlabs/plugin-maps/dist/radar-maps.css';

Radar.registerPlugin(createMapsPlugin());
Radar.initialize('prj_test_pk_...');
```

### With a script tag

Include after the core SDK:

```html
<link href="https://js.radar.com/maps/v5.0.0-beta.4/radar-maps.css" rel="stylesheet" />
<script src="https://js.radar.com/v5.0.0-beta.3/radar.min.js"></script>
<script src="https://js.radar.com/maps/v5.0.0-beta.4/radar-maps.min.js"></script>
```

The CDN bundle auto-registers with the core SDK when loaded.

## Quickstart

### Create a map

`Radar.ui.map()` returns a `RadarMap` instance, which extends
[`maplibregl.Map`](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/).

```js
const map = Radar.ui.map({
  container: 'map',
  style: 'radar-default-v1', // radar-default-v1 | radar-light-v1 | radar-dark-v1
  center: [-73.991, 40.735],
  zoom: 14,
});
```

Built-in Radar styles (`radar-default-v1`, `radar-light-v1`, `radar-dark-v1`)
are resolved automatically. You can also pass a [custom style](https://docs.radar.com/maps/maps#custom-styles) id.

### Add markers

`Radar.ui.marker()` returns a `RadarMarker` instance, which extends
[`maplibregl.Marker`](https://maplibre.org/maplibre-gl-js/docs/API/classes/Marker/).

```js
const marker = Radar.ui
  .marker({
    color: '#000257',
    popup: {
      text: 'Radar HQ',
    },
  })
  .setLngLat([-73.991, 40.735])
  .addTo(map);
```

### Create a popup

`Radar.ui.popup()` returns a `maplibregl.Popup` instance:

```js
const popup = Radar.ui
  .popup({
    text: 'Hello world',
  })
  .setLngLat([-73.991, 40.735])
  .addTo(map);
```

## API

### Map options

`RadarMapOptions` extends
[`maplibregl.MapOptions`](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapOptions/)
with these additions:

| Option             | Type      | Default | Description                  |
| ------------------ | --------- | ------- | ---------------------------- |
| `language`         | `string`  | —       | Language code for map labels |
| `showZoomControls` | `boolean` | `true`  | Show zoom in/out buttons     |

### Marker options

| Option   | Type                | Default     | Description                    |
| -------- | ------------------- | ----------- | ------------------------------ |
| `color`  | `string`            | `'#000257'` | Marker fill color              |
| `marker` | `string`            | —           | Radar-hosted marker image name |
| `url`    | `string`            | —           | Custom marker image URL        |
| `width`  | `number \| string`  | —           | Marker image width             |
| `height` | `number \| string`  | —           | Marker image height            |
| `popup`  | `RadarPopupOptions` | —           | Popup to display on click      |

All standard
[`maplibregl.MarkerOptions`](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MarkerOptions/)
are also supported (for example, `element`, `scale`, `draggable`).

### Map helpers

`RadarMap` provides helpers for working with markers and GeoJSON features:

```js
// markers
map.getMarkers();
map.fitToMarkers();
map.clearMarkers();

// GeoJSON features
map.addPolygon(geojsonFeature, { paint: { 'fill-color': '#000257', 'fill-opacity': 0.3 } });
map.addLine(lineFeature, { paint: { 'line-color': '#000257', 'line-width': 2 } });
map.addPolyline(encodedPolyline, { precision: 6 });
map.fitToFeatures();
map.clearFeatures();
```

### Access MapLibre GL JS directly

The underlying MapLibre GL JS module is available at `Radar.ui.maplibregl`:

```js
const bounds = new Radar.ui.maplibregl.LngLatBounds(sw, ne);
```

## Peer dependencies

| Package        | Version                                      |
| -------------- | -------------------------------------------- |
| `radar-sdk-js` | `>=5.0.0-beta.1`                             |
| `maplibre-gl`  | `^2.4.0 \|\| ^3.0.0 \|\| ^4.0.0 \|\| ^5.0.1` |

## 📫 Support

Have questions? We're here to help! Email us at [support@radar.com](mailto:support@radar.com).
