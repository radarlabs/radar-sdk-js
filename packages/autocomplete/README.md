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
  <a href="https://www.npmjs.com/package/@radarlabs/plugin-autocomplete"><img src="https://img.shields.io/npm/v/@radarlabs/plugin-autocomplete.svg" alt="npm"></a>
</p>

<p align="center">
  Autocomplete UI plugin for <a href="https://github.com/radarlabs/radar-sdk-js">radar-sdk-js</a>. Provides a drop-in <code>Radar.ui.autocomplete()</code> widget with search-as-you-type address results powered by the <a href="https://radar.com/documentation/api#autocomplete">Radar Autocomplete API</a>.
</p>

## 🚀 Installation and Usage

### With npm

```bash
# with npm
npm install @radarlabs/plugin-autocomplete radar-sdk-js

# with yarn
yarn add @radarlabs/plugin-autocomplete radar-sdk-js
```

Then import and initialize:

```js
import Radar from 'radar-sdk-js';
import { createAutocompletePlugin } from '@radarlabs/plugin-autocomplete';
import '@radarlabs/plugin-autocomplete/dist/radar-autocomplete.css';

Radar.registerPlugin(createAutocompletePlugin());
Radar.initialize('prj_test_pk_...');
```

### With a script tag

Include after the core SDK:

```html
<link href="https://js.radar.com/autocomplete/v1.0.0/radar-autocomplete.css" rel="stylesheet" />
<script src="https://js.radar.com/v5.0.0/radar.min.js"></script>
<script src="https://js.radar.com/autocomplete/v1.0.0/radar-autocomplete.min.js"></script>
```

The CDN bundle auto-registers with the core SDK when loaded.

## Quickstart

### Create an autocomplete input

Pass a container element ID (or an `HTMLElement` reference) to render the widget:

```js
Radar.ui.autocomplete({
  container: 'autocomplete',
  onSelection: (result) => {
    console.log(result);
  },
});
```

You can also pass an existing `<input>` element as the container. In that
case, the widget attaches the results dropdown to the input instead of
creating a new one.

## API

### Options

| Option              | Type                    | Default            | Description                               |
| ------------------- | ----------------------- | ------------------ | ----------------------------------------- |
| `container`         | `string \| HTMLElement` | `'autocomplete'`   | Container element or ID                   |
| `onSelection`       | `(result) => void`      | —                  | Called when the user selects a result     |
| `onResults`         | `(results) => void`     | —                  | Called after results are fetched          |
| `onRequest`         | `(params) => void`      | —                  | Called before each API request            |
| `onError`           | `(error) => void`       | —                  | Called on fetch errors                    |
| `placeholder`       | `string`                | `'Search address'` | Input placeholder text                    |
| `minCharacters`     | `number`                | `3`                | Minimum characters before searching       |
| `debounceMS`        | `number`                | `200`              | Debounce delay in milliseconds            |
| `limit`             | `number`                | `8`                | Maximum number of results                 |
| `responsive`        | `boolean`               | `true`             | Use 100% width (with optional `maxWidth`) |
| `width`             | `string \| number`      | `400`              | Fixed width, or max-width if responsive   |
| `maxHeight`         | `string \| number`      | —                  | Max height for the results dropdown       |
| `disabled`          | `boolean`               | `false`            | Disable the input                         |
| `showMarkers`       | `boolean`               | `true`             | Show marker icons next to results         |
| `markerColor`       | `string`                | `'#ACBDC8'`        | Color of result marker icons              |
| `hideResultsOnBlur` | `boolean`               | `true`             | Close results when input loses focus      |
| `near`              | `Location \| string`    | —                  | Bias results near a location              |
| `layers`            | `string[]`              | —                  | Filter by geocode layers                  |
| `countryCode`       | `string`                | —                  | Filter results by country                 |
| `lang`              | `string`                | —                  | Language for results                      |
| `postalCode`        | `string`                | —                  | Filter results by postal code             |
| `mailable`          | `boolean`               | —                  | Only return mailable addresses            |

### Chainable setters

All setters return the `AutocompleteUI` instance for chaining:

```js
autocomplete
  .setNear({ latitude: 40.735, longitude: -73.991 })
  .setPlaceholder('Enter an address')
  .setMinCharacters(2)
  .setLimit(5)
  .setWidth('500px')
  .setResponsive(true);
```

Available setters: `setNear()`, `setPlaceholder()`, `setDisabled()`,
`setResponsive()`, `setWidth()`, `setMaxHeight()`, `setMinCharacters()`,
`setLimit()`, `setLang()`, `setPostalCode()`, `setShowMarkers()`,
`setMarkerColor()`, `setHideResultsOnBlur()`.

### Remove the widget

Call `remove()` to clean up the widget and its DOM elements:

```js
autocomplete.remove();
```

## Accessibility

The autocomplete widget includes ARIA attributes for screen readers:

- `role="combobox"` on the input
- `role="listbox"` on the results list
- `aria-live="polite"` for dynamic result announcements
- Keyboard navigation with Arrow keys, Tab, Enter, and Escape

## Peer dependencies

| Package        | Version  |
| -------------- | -------- |
| `radar-sdk-js` | `^5.0.0` |

## 📫 Support

Have questions? We're here to help! Email us at [support@radar.com](mailto:support@radar.com).
