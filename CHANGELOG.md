### BREAKING CHANGES

- **Plugin architecture:** Maps, Autocomplete, and Fraud UI components
  are no longer bundled in the core SDK. Install and register them as
  separate plugins.
- **New packages:**
  - `@radarlabs/plugin-maps` — MapLibre GL wrappers (RadarMap,
    RadarMarker, RadarPopup)
  - `@radarlabs/plugin-autocomplete` — Autocomplete UI widget
  - `@radarlabs/plugin-fraud` — Fraud/Verify API
- **`Radar.ui` namespace requires plugin registration.** Calling
  `Radar.ui.map()` without `@radarlabs/plugin-maps` registered throws
  a runtime error.
- **Fraud API moved to plugin.** `Radar.trackVerified()`,
  `Radar.startTrackingVerified()`, related verify/fraud logic, and utils moved to the
  fraud plugin. now live under `Radar.fraud.*` via `@radarlabs/plugin-fraud`. Legacy top-level
  shims are deprecated.
- **CSS split per plugin.** The single `radar.css` file is replaced by
  `@radarlabs/plugin-maps/dist/radar-maps.css` and
  `@radarlabs/plugin-autocomplete/dist/radar-autocomplete.css`. The
  core SDK no longer ships CSS.
- **CDN usage.** A single `<script>` tag no longer provides everything.
  Load the core SDK first, then plugin scripts that auto-register.
- **`maplibre-gl` peer dependency removed from core.** Only
  `@radarlabs/plugin-maps` requires it.
- **Removed `src/api/verify.ts`.**
- See [MIGRATION.md](./MIGRATION.md) for a step-by-step upgrade guide
  from 4.x to 5.x.

### Features

- **Plugin system.** `Radar.registerPlugin(plugin)` installs plugins
  that receive a `RadarPluginContext` with access to core internals
  (Config, Http, Storage, Device, Session, Logger, Navigator, and all
  API modules).
- **Plugin types subpath export.** Plugin authors can import
  `RadarPlugin` and `RadarPluginContext` from `radar-sdk-js/plugin`.
- **Exported error classes.** `RadarError` and all subclasses
  (`RadarBadRequestError`, `RadarUnauthorizedError`,
  `RadarPaymentRequiredError`, `RadarForbiddenError`,
  `RadarNotFoundError`, `RadarRateLimitError`, `RadarServerError`,
  `RadarNetworkError`, `RadarUnknownError`, `RadarPublishableKeyError`,
  `RadarLocationError`, `RadarPermissionsError`) are exported from the
  main entry point for `instanceof` checks.
- **All types re-exported.** Import `RadarTrackParams`,
  `RadarTrackResponse`, `RadarAddress`, `RadarOptions`, and all other
  types directly from `radar-sdk-js`.

### Improvements

- **Rewritten HTTP client.** `src/http.ts` now uses `fetch` rather than
  `XMLHttpRequest`, with improved error handling and request cancellation.
- **AbortController race condition fix.** Resolved duplicate request
  deduplication edge case in the HTTP client.
- **Autocomplete race condition fix.** Fixed timing issue in
  autocomplete UI plugin.
- **RadarMap memory leak fix.** Fixed memory leak that left detached elements.
- **Various type fixes.** Fixed `RadarResponseMatrix` type, `Location` type, added types to Autocomplete UI results.
