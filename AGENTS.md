## Commands

```bash
npm run build                          # core SDK → dist/ (ESM) + cdn/ (IIFE)
npm run build:all                      # core + all plugins
npm run build:maps                     # maps plugin only
npm run build:autocomplete             # autocomplete plugin only
npm test                               # jest --collect-coverage --runInBand
npm run test:watch                     # jest --watch
npx jest test/api/geocoding.test.ts    # run a single test file
npm run lint                           # oxlint --type-aware --type-check
npm run fmt                            # oxfmt
npm run typecheck                      # tsc --noEmit (root + all workspaces)
npm run demo                           # build + local demo server
```

## Monorepo layout

npm workspaces with core SDK at root and plugins in `packages/`:

| Package                 | npm name                         | Notes                                                    |
| ----------------------- | -------------------------------- | -------------------------------------------------------- |
| root                    | `radar-sdk-js`                   | Core SDK — API methods, HTTP, config, storage, errors    |
| `packages/maps`         | `@radarlabs/plugin-maps`         | MapLibre GL wrappers (RadarMap, RadarMarker, RadarPopup) |
| `packages/autocomplete` | `@radarlabs/plugin-autocomplete` | Autocomplete UI widget                                   |

Plugins declare `radar-sdk-js` as a peer dep (`^5.0.0`) and use `"radar-sdk-js": "file:../../"` in devDeps for local linking.

## Architecture

**Core class hierarchy** — `src/api.ts` defines the `Radar` class with all static API methods (track, geocode, search, etc.) and the plugin system. `src/index.ts` re-exports it (no subclassing). `src/iife-entry.ts` extends it to attach `RadarError` as a static property for CDN access.

**Plugin system** — `Radar.registerPlugin(plugin)` installs plugins by calling `plugin.install(ctx)` with a `RadarPluginContext` that exposes core internals (Config, Http, Storage, Device, Session, Logger, Navigator, all API modules, errors). Plugin types are defined in `src/plugin.ts` (types-only, no runtime code). Published as `radar-sdk-js/plugin` subpath export for plugin authors to import types from.

**IIFE CDN plugins** use an auto-register pattern: the IIFE bundle checks for `window.Radar.registerPlugin` and self-registers.

## Build outputs

- **ESM**: `src/index.ts` → `dist/radar.js` (+ sourcemap + `dist/index.d.ts`)
- **IIFE**: `src/iife-entry.ts` → `cdn/radar.js`, `cdn/radar.min.js`
- **Plugin types**: `src/plugin.ts` → `dist/plugin.js` + `dist/plugin.d.ts`
- Each plugin has its own rollup config producing ESM + IIFE + CSS

`maplibre-gl` is external for ESM builds but bundled into IIFE builds.

## Testing

- Jest + ts-jest, jsdom environment
- Tests in `test/` mirror `src/` structure; API tests in `test/api/`
- Mock fetch via `jest-fetch-mock`; globals in `test/mock-data/globals.ts`
- CSS imports mocked via `test/mock-data/styles.js`
- `(window as any).RADAR_TEST_ENV = true` is set in globals to skip ConfigAPI.getConfig calls

## Version tracking

Version is tracked in 3 places that must stay in sync:

1. `src/version.ts` — default export string
2. `package.json` — `version` field
3. `package-lock.json` — both top-level `version` and `packages[""].version`

`test/version.test.ts` asserts all three match. Use `npm run bump-version` to update.

## Key patterns

- **All Radar methods are static** — no instances, singleton config
- **State**: `Config` singleton + `Storage` (typed localStorage with `radar-*` keys)
- **HTTP**: `Http.request({ method, path, data })` — fetch-based, deduplicates in-flight requests via AbortController
- **Errors**: `RadarError` hierarchy with a custom class per HTTP status (BadRequest, Unauthorized, RateLimit, etc.)
- **Initialization**: `Radar.initialize(options)` — accepts `{ publishableKey }` or `{ token }`, validates credentials, auto-detects live/test mode

## Code style

- Strict TypeScript (ES2020 target, ESNext modules, bundler module resolution)
- Shared compiler options in `tsconfig.base.json`, root + each plugin extends it
- JSDoc on public APIs
