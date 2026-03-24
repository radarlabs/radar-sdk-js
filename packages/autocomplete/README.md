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
<link href="https://js.radar.com/autocomplete/v5.0.0-beta.4/radar-autocomplete.css" rel="stylesheet" />
<script src="https://js.radar.com/v5.0.0-beta.3/radar.min.js"></script>
<script src="https://js.radar.com/autocomplete/v5.0.0-beta.4/radar-autocomplete.min.js"></script>
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

<<<<<<< Updated upstream
| Option | Type | Default | Description |
| ----------------------- | ----------------------- | ------------------ | ------------------------------------------------------------------------------------------------------ |
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
| `ignoreBrowserAutofill` | `boolean` | `true` | Skip autocomplete when the browser bulk-fills the field; resumes after the user types, pastes, or cuts |
| `near` | `Location \| string` | — | Bias results near a location |
| `layers` | `string[]` | — | Filter by geocode layers |
| `countryCode` | `string` | — | Filter results by country |
| `lang` | `string` | — | Language for results |
| `postalCode` | `string` | — | Filter results by postal code |
| `mailable` | `boolean` | — | Only return mailable addresses |
=======
| Option | Type | Default | Description |
| ----------------------- | -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------ |
| `container` | `string \| HTMLElement` | `'autocomplete'` | Container element or ID |
| `onSelection` | `(result) => void` | — | Called when the user selects a result |
| `onResults` | `(results) => void` | — | Called after results are fetched |
| `onRequest` | `(params) => void` | — | Called before each API request |
| `onError` | `(error) => void` | — | Called on fetch errors |
| `onOpen` | `() => void` | — | Called when the results dropdown opens |
| `onClose` | `() => void` | — | Called when the results dropdown closes |
| `shouldOpen` | `(results) => boolean` | — | Return `false` to prevent opening for these results |
| `onKeyDown` | `(event, context) => void` | — | Called on keydown when open; call `event.preventDefault()` to override default behavior |
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
| `inputAutocomplete` | `string` | `'off'` | HTML `autocomplete` on the input; use e.g. `'street-address'` to enable browser address autofill |
| `ignoreBrowserAutofill` | `boolean` | `true` | Skip autocomplete when the browser bulk-fills the field; resumes after the user types, pastes, or cuts |
| `wrapResults` | `boolean` | `false` | Allow result text to wrap (default: single line with ellipsis) |
| `resultItemClassName` | `string` | — | Optional class name(s) added to each result row |
| `resultItemStyle` | `Record<string, string>` | — | Optional inline styles for each result row |
| `markerMarginRight` | `string \| number` | `16px` | Margin between marker icon and label |
| `near` | `Location \| string` | — | Bias results near a location |
| `layers` | `string[]` | — | Filter by geocode layers |
| `countryCode` | `string` | — | Filter results by country |
| `lang` | `string` | — | Language for results |
| `postalCode` | `string` | — | Filter results by postal code |
| `mailable` | `boolean` | — | Only return mailable addresses |

> > > > > > > Stashed changes

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
<<<<<<< Updated upstream
`setMarkerColor()`, `setHideResultsOnBlur()`, `setIgnoreBrowserAutofill()`.
=======
`setMarkerColor()`, `setHideResultsOnBlur()`, `setInputAutocomplete()`, `setWrapResults()`, `setIgnoreBrowserAutofill()`,
`setResultItemClassName()`, `setResultItemStyle()`, `setMarkerMarginRight()`.

### Styling result rows (no deep selectors)

You can style result list items in three ways:

1. **CSS variables** — Set these on the widget wrapper (e.g. `.radar-autocomplete-wrapper`) or a parent to override defaults:

   | Variable                                    | Default              | Description                    |
   | ------------------------------------------- | -------------------- | ------------------------------ |
   | `--radar-autocomplete-result-color`         | `var(--radar-gray6)` | Result text color              |
   | `--radar-autocomplete-result-label-color`   | `var(--radar-gray8)` | Bold label color               |
   | `--radar-autocomplete-result-padding`       | `8px 16px`           | Row padding                    |
   | `--radar-autocomplete-result-font-size`     | `14px`               | Font size                      |
   | `--radar-autocomplete-result-line-height`   | `24px`               | Line height                    |
   | `--radar-autocomplete-result-align-items`   | `center`             | Flex align-items for the row   |
   | `--radar-autocomplete-result-text-align`    | `left`               | Text alignment                 |
   | `--radar-autocomplete-result-white-space`   | `nowrap`             | `nowrap` or `normal` (wrap)    |
   | `--radar-autocomplete-result-overflow`      | `hidden`             | Overflow behavior              |
   | `--radar-autocomplete-result-text-overflow` | `ellipsis`           | Text overflow                  |
   | `--radar-autocomplete-result-hover-bg`      | `var(--radar-gray1)` | Hover background               |
   | `--radar-autocomplete-result-selected-bg`   | `var(--radar-gray2)` | Selected/highlight background  |
   | `--radar-autocomplete-marker-margin-right`  | `16px`               | Space between marker and label |

2. **Config options** — Use `wrapResults: true` to allow long addresses to wrap, `resultItemClassName` to add your own class(es) to each row, `resultItemStyle` for inline styles, and `markerMarginRight` to adjust marker spacing.

3. **Class override** — Pass `resultItemClassName: 'my-result-row'` and style `.my-result-row` in your own CSS.

### Programmatic control

The instance returned by `Radar.ui.autocomplete()` exposes:

- **`close()`** — Close the results dropdown (e.g. from a "Clear" button or after external navigation).

```js
const autocomplete = Radar.ui.autocomplete({ container: 'autocomplete' });
// later:
autocomplete.close();
```

> > > > > > > Stashed changes

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

| Package        | Version          |
| -------------- | ---------------- |
| `radar-sdk-js` | `>=5.0.0-beta.1` |

## 📫 Support

Have questions? We're here to help! Email us at [support@radar.com](mailto:support@radar.com).
