# radar-sdk-js

Browser SDK for Radar (location infrastructure). TypeScript, Rollup, Jest.

## Commands

```bash
npm run build          # rollup -c → dist/ (ESM) + cdn/ (IIFE)
npm test               # jest --collect-coverage --runInBand
npm run test:watch     # jest --watch
npm run demo           # build + local demo server
npm run spell-check    # cspell on markdown files
```

## Architecture

```
src/
├── index.ts           # entry point: class Radar extends RadarAPI, adds .ui namespace
├── api.ts             # RadarAPI class — all public SDK methods (track, geocode, search, etc.)
├── api/               # one module per API domain (track, geocoding, routing, search, trips, etc.)
├── ui/                # MapLibre GL wrappers (RadarMap, RadarMarker, RadarPopup, autocomplete)
├── util/              # jwt (HS256 via Web Crypto), polyline, geojson, net, object
├── config.ts          # singleton config (publishable key, host, logLevel, etc.)
├── http.ts            # XHR wrapper with request dedup, auto host+version prefixing
├── storage.ts         # typed localStorage wrapper (radar-* keys)
├── session.ts         # session ID with 5-min timeout
├── device.ts          # UUID v4 install/device ID generation
├── navigator.ts       # geolocation wrapper with caching
├── logger.ts          # tiered logging (none/error/warn/info/debug)
├── errors.ts          # RadarError hierarchy (BadRequest, Unauthorized, RateLimit, etc.)
├── types.ts           # all exported TS types
└── version.ts         # version constant
```

## Build outputs

- **ESM** → `dist/radar.js` (+ sourcemap, + `dist/index.d.ts` types)
- **IIFE full** → `cdn/radar.js`, `cdn/radar.min.js` (includes Maps/UI)
- **IIFE core** → `cdn/radar-core.js`, `cdn/radar-core.min.js` (no Maps, entry: `src/api.ts`)
- `maplibre-gl` is external for ESM, bundled for IIFE

## Testing

- Jest + ts-jest, jsdom environment
- Tests in `test/` mirror `src/` structure; API tests in `test/api/`
- Mock XHR via `mock-xmlhttprequest`; globals in `test/mock-data/globals.js`
- CSS imports mocked via `test/mock-data/styles.js`

## Key patterns

- **Initialization**: `Radar.initialize(publishableKey, options?)` — validates key, rejects secret keys, auto-detects live/test mode
- **API calls**: `Http.request({ method, path, data })` — XHR-based, deduplicates in-flight requests
- **State**: Config singleton + localStorage persistence (user ID, device ID, session, metadata)
- **Errors**: Custom class per HTTP status + domain errors (LocationError, PermissionsError, etc.)
- **UI namespace**: `Radar.ui.map()`, `Radar.ui.marker()`, `Radar.ui.autocomplete()` — factory functions

## Code style

- Strict TypeScript (ES6 target, ES2015 modules)
- No Prettier configured
- JSDoc on public APIs should be short inline: `/** does blah */`
- Husky pre-commit runs cspell on markdown only

## Publishing

- npm package: `radar-sdk-js` (type: module)
- Peer dep: `maplibre-gl ^2.4.0 || ^3.0.0 || ^4.0.0 || ^5.0.1`
- CI releases via GitHub Actions on GitHub Release events
- CDN hosted at `js.radar.com` via S3 upload
