## Migrating from 4.x to 5.x

Radar JS SDK 5.0 introduces a plugin architecture that separates UI components
(Maps, Autocomplete) from the core SDK. The core package (`radar-sdk-js`) is
now a lightweight API-only library. Maps, Autocomplete, and Fraud
functionality are provided by standalone plugins that you install and register
separately.

This guide covers all breaking changes and how to update your code.

### Installation

The core SDK no longer depends on `maplibre-gl`. If you only use the Radar API
(geocoding, tracking, search, routing), install the core SDK alone:

```bash
npm install radar-sdk-js
```

If you use Maps or Autocomplete UI, install the corresponding plugins:

```bash
# maps (requires maplibre-gl as a peer dep)
npm install @radarlabs/plugin-maps maplibre-gl

# autocomplete
npm install @radarlabs/plugin-autocomplete
```

### Plugin registration

In v4, `Radar.ui.map()` and `Radar.ui.autocomplete()` were built into the core
SDK. In v5, you must register plugins before using `Radar.ui`:

```js
// v4
import Radar from 'radar-sdk-js';
import 'radar-sdk-js/dist/radar.css';

Radar.initialize('prj_test_pk_...');
const map = Radar.ui.map({ container: 'map' });

// v5
import Radar from 'radar-sdk-js';
import { createMapsPlugin } from '@radarlabs/plugin-maps';
import '@radarlabs/plugin-maps/dist/radar-maps.css';

Radar.registerPlugin(createMapsPlugin());
Radar.initialize('prj_test_pk_...');
const map = Radar.ui.map({ container: 'map' });
```

The `Radar.ui` namespace is only available after a plugin that provides it
has been registered. Calling `Radar.ui.map()` without the maps plugin
registered is a runtime error.

### CDN usage

In v4, a single script and CSS file provided everything:

```html
<!-- v4 -->
<link href="https://js.radar.com/v4.5.8/radar.css" rel="stylesheet" />
<script src="https://js.radar.com/v4.5.8/radar.min.js"></script>
```

In v5, the core SDK script tag no longer includes UI components. Load
plugins as separate scripts after the core SDK. CDN plugin bundles
auto-register with the core SDK when loaded:

```html
<!-- v5 -->
<script src="https://js.radar.com/v5.0.0-beta.3/radar.min.js"></script>

<!-- maps plugin (auto-registers) -->
<link href="https://js.radar.com/maps/v5.0.0-beta.4/radar-maps.css" rel="stylesheet" />
<script src="https://js.radar.com/maps/v5.0.0-beta.4/radar-maps.min.js"></script>

<!-- autocomplete plugin (auto-registers) -->
<link href="https://js.radar.com/autocomplete/v5.0.0-beta.4/radar-autocomplete.css" rel="stylesheet" />
<script src="https://js.radar.com/autocomplete/v5.0.0-beta.4/radar-autocomplete.min.js"></script>

<!-- fraud plugin (auto-registers) -->
<script src="https://js.radar.com/fraud/v5.0.0-beta.1/radar-fraud.min.js"></script>
```

### CSS imports

In v4, a single `radar.css` file bundled all styles for maps, markers,
autocomplete, and popups.

In v5, each plugin ships its own CSS. Import only the styles you need:

```js
// v4
import 'radar-sdk-js/dist/radar.css';

// v5
import '@radarlabs/plugin-maps/dist/radar-maps.css';
import '@radarlabs/plugin-autocomplete/dist/radar-autocomplete.css';
```

The core SDK no longer ships a CSS file.

### Fraud API

The Fraud API methods have moved to a separate plugin. If you use any of
the following methods, install and register the Fraud plugin:

- `Radar.trackVerified()`
- `Radar.startTrackingVerified()`
- `Radar.stopTrackingVerified()`
- `Radar.getVerifiedLocationToken()`
- `Radar.clearVerifiedLocationToken()`
- `Radar.setExpectedJurisdiction()`
- `Radar.onTokenUpdated()`

```js
// v4
Radar.initialize('prj_test_pk_...');
Radar.trackVerified();

// v5 (preferred — namespaced under Radar.fraud)
import { createFraudPlugin } from '@radarlabs/fraud-plugin';
Radar.registerPlugin(createFraudPlugin());
Radar.initialize('prj_test_pk_...');
const { token, user, events } = await Radar.fraud.trackVerified();

// v5 (backwards-compat shim — still works but deprecated)
Radar.trackVerified();
```

### Error exports

`RadarError` and all error subclasses are now exported directly from the
main entry point:

```js
// v4 — errors were not easily importable
try {
  await Radar.trackOnce();
} catch (err) {
  console.log(err.status); // 'ERROR_LOCATION'
}

// v5 — import error classes for instanceof checks
import { RadarError } from 'radar-sdk-js';

try {
  await Radar.trackOnce();
} catch (err) {
  if (err instanceof RadarError) {
    console.log(err.status);
  }
}
```

The following error classes are available:

| Class                       | Status code             |
| --------------------------- | ----------------------- |
| `RadarPublishableKeyError`  | `ERROR_PUBLISHABLE_KEY` |
| `RadarLocationError`        | `ERROR_LOCATION`        |
| `RadarPermissionsError`     | `ERROR_PERMISSIONS`     |
| `RadarBadRequestError`      | 400                     |
| `RadarUnauthorizedError`    | 401                     |
| `RadarPaymentRequiredError` | 402                     |
| `RadarForbiddenError`       | 403                     |
| `RadarNotFoundError`        | 404                     |
| `RadarRateLimitError`       | 429                     |
| `RadarServerError`          | 500                     |
| `RadarNetworkError`         | timeout                 |

### Type exports

All types are now re-exported from the main entry point. Import them
directly instead of reaching into internal paths:

```ts
import type { RadarTrackParams, RadarTrackResponse, RadarAddress, RadarOptions } from 'radar-sdk-js';
```

Plugin types for building custom plugins are available from the `plugin`
subpath:

```ts
import type { RadarPlugin, RadarPluginContext } from 'radar-sdk-js/plugin';
```

### Summary of breaking changes

| Change                 | v4                    | v5                                          |
| ---------------------- | --------------------- | ------------------------------------------- |
| Maps UI                | Built into core       | `@radarlabs/plugin-maps`                    |
| Autocomplete UI        | Built into core       | `@radarlabs/plugin-autocomplete`            |
| Fraud/Verify API       | Built into core       | `@radarlabs/fraud-plugin` (`Radar.fraud.*`) |
| `maplibre-gl` peer dep | Required by core      | Required by maps plugin only                |
| CSS                    | Single `radar.css`    | Per-plugin CSS files                        |
| CDN scripts            | Single `radar.min.js` | Core + plugin scripts                       |
| Error classes          | Not exported          | Exported from `radar-sdk-js`                |
| Plugin system          | N/A                   | `Radar.registerPlugin()`                    |
