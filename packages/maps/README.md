# @radarlabs/plugin-maps

Maps UI plugin for [radar-sdk-js](https://www.npmjs.com/package/radar-sdk-js).
Provides `Radar.ui.map()`, `Radar.ui.marker()`, and `Radar.ui.popup()` powered
by [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/).

## Installation

### With npm

```bash
npm install radar-sdk-js @radarlabs/plugin-maps maplibre-gl
```

```js
import Radar from 'radar-sdk-js';
import { createMapsPlugin } from '@radarlabs/plugin-maps';
import '@radarlabs/plugin-maps/dist/radar-maps.css';

Radar.registerPlugin(createMapsPlugin());
Radar.initialize('prj_test_pk_...');
```

### With a script tag

Load the core SDK first, then the maps plugin. The CDN bundle auto-registers
with the core SDK.

```html
<link href="https://js.radar.com/maps/v5.0.0-beta.4/radar-maps.css" rel="stylesheet" />
<script src="https://js.radar.com/v5.0.0-beta.3/radar.min.js"></script>
<script src="https://js.radar.com/maps/v5.0.0-beta.4/radar-maps.min.js"></script>
```

## Usage

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

#### Map options

`RadarMapOptions` extends
[`maplibregl.MapOptions`](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapOptions/)
with these additions:

| Option             | Type      | Default | Description                  |
| ------------------ | --------- | ------- | ---------------------------- |
| `language`         | `string`  | —       | Language code for map labels |
| `showZoomControls` | `boolean` | `true`  | Show zoom in/out buttons     |

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

#### Marker options

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

### Manage markers on a map

`RadarMap` provides helpers for working with markers:

```js
map.getMarkers();
map.fitToMarkers();
map.clearMarkers();
```

### Add GeoJSON features

Draw polygons, lines, and encoded polylines on the map:

```js
map.addPolygon(geojsonFeature, {
  paint: {
    'fill-color': '#000257',
    'fill-opacity': 0.3,
  },
});

map.addLine(lineFeature, {
  paint: {
    'line-color': '#000257',
    'line-width': 2,
  },
});

map.addPolyline(encodedPolyline, { precision: 6 });

map.fitToFeatures();
map.clearFeatures();
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

## Support

Have questions? We're here to help! Email us at [support@radar.com](mailto:support@radar.com).
