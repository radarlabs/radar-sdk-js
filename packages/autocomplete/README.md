# @radarlabs/autocomplete-ui-plugin

Autocomplete UI plugin for
[radar-sdk-js](https://www.npmjs.com/package/radar-sdk-js). Provides a
drop-in `Radar.ui.autocomplete()` widget with search-as-you-type address
results powered by the
[Radar Autocomplete API](https://radar.com/documentation/api#autocomplete).

## Installation

### With npm

```bash
npm install radar-sdk-js @radarlabs/autocomplete-ui-plugin
```

```js
import Radar from 'radar-sdk-js';
import { createAutocompletePlugin } from '@radarlabs/autocomplete-ui-plugin';
import '@radarlabs/autocomplete-ui-plugin/dist/radar-autocomplete.css';

Radar.registerPlugin(createAutocompletePlugin());
Radar.initialize('prj_test_pk_...');
```

### With a script tag

Load the core SDK first, then the autocomplete plugin. The CDN bundle
auto-registers with the core SDK.

```html
<link href="https://js.radar.com/autocomplete/v5.0.0-beta.4/radar-autocomplete.css" rel="stylesheet">
<script src="https://js.radar.com/v5.0.0-beta.3/radar.min.js"></script>
<script src="https://js.radar.com/autocomplete/v5.0.0-beta.4/radar-autocomplete.min.js"></script>
```

## Usage

### Create an autocomplete input

Pass a container element ID (or an `HTMLElement` reference) to render the
widget:

```js
const autocomplete = Radar.ui.autocomplete({
  container: 'autocomplete',
  onSelection: (result) => {
    console.log(result);
  },
});
```

You can also pass an existing `<input>` element as the container. In that
case, the widget attaches the results dropdown to the input instead of
creating a new one.

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `container` | `string \| HTMLElement` | `'autocomplete'` | Container element or ID |
| `onSelection` | `(result) => void` | — | Called when the user selects a result |
| `onResults` | `(results) => void` | — | Called after results are fetched |
| `onRequest` | `(params) => void` | — | Called before each API request |
| `onError` | `(error) => void` | — | Called on fetch errors |
| `placeholder` | `string` | `'Search address'` | Input placeholder text |
| `minCharacters` | `number` | `3` | Minimum characters before searching |
| `debounceMS` | `number` | `200` | Debounce delay in milliseconds |
| `limit` | `number` | `8` | Maximum number of results |
| `responsive` | `boolean` | `true` | Use 100% width (with optional `maxWidth`) |
| `width` | `string \| number` | `400` | Fixed width, or max-width if responsive |
| `maxHeight` | `string \| number` | — | Max height for the results dropdown |
| `disabled` | `boolean` | `false` | Disable the input |
| `showMarkers` | `boolean` | `true` | Show marker icons next to results |
| `markerColor` | `string` | `'#ACBDC8'` | Color of result marker icons |
| `hideResultsOnBlur` | `boolean` | `true` | Close results when input loses focus |
| `near` | `Location \| string` | — | Bias results near a location |
| `layers` | `string[]` | — | Filter by geocode layers |
| `countryCode` | `string` | — | Filter results by country |
| `lang` | `string` | — | Language for results |
| `postalCode` | `string` | — | Filter results by postal code |
| `mailable` | `boolean` | — | Only return mailable addresses |

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

| Package | Version |
|---------|---------|
| `radar-sdk-js` | `>=5.0.0-beta.1` |

## Support

Have questions? We're here to help! Email us at [support@radar.com](mailto:support@radar.com).
