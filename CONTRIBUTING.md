# Contributing

## Setup

This project is a monorepo managed with [npm workspaces](https://docs.npmjs.com/cli/v10/using-npm/workspaces). The core SDK lives at the root, and UI plugins live in `packages/`.

```
radar-sdk-js/
├── src/                  # core SDK source
├── packages/
│   ├── maps/             # @radarlabs/plugin-maps
│   └── autocomplete/     # @radarlabs/plugin-autocomplete
├── demo/                 # local demo app
└── test/                 # core SDK tests
```

Clone the repository and install all dependencies (including workspaces):

```bash
git clone git@github.com:radarlabs/radar-sdk-js.git

cd radar-sdk-js

npm install
```

## Building

```bash
npm run build                # core SDK → dist/ (ESM) + cdn/ (IIFE)
npm run build:maps           # maps plugin only
npm run build:autocomplete   # autocomplete plugin only
npm run build:all            # core + all plugins
```

## Type checking

```bash
npm run typecheck            # runs tsc --noEmit on root + all workspaces
```

## Tests

Run the core SDK tests with a single run or in watch mode:

```bash
npm run test

npm run test:watch
```

## Demo app

The easiest way to develop in a browser is to start the [demo app](https://radarlabs.github.io/radar-sdk-js) locally. It serves the core SDK and plugins as locally built script tags. Code changes to `src/` are recompiled automatically (refresh the browser to pick them up).

```bash
npm run demo
```

This starts the demo on [http://localhost:9001](http://localhost:9001). The demo uses express and [handlebars](https://handlebarsjs.com/) for rendering views.

> **Note:** The demo server looks for plugin CDN builds in sibling directories (`../radar-sdk-js-maps/cdn`, etc.). Make sure the plugin repos are checked out alongside this repo, or build the workspace plugins with `npm run build:all` first.

> **Note:** Adding new view templates requires a server restart.

## `npm link`

To use a local build of the SDK in an ES Module project, use [npm link](https://docs.npmjs.com/cli/v8/commands/npm-link):

```bash
# in /radar-sdk-js
npm run build
npm link
```

Then in your project:

```bash
npm link radar-sdk-js
```

To link a plugin as well:

```bash
# in /radar-sdk-js
npm run build:maps
cd packages/maps && npm link

# in your project
npm link @radarlabs/plugin-maps
```

> **Note:** Make sure you're using the same Node.js and npm installation in both projects, especially if you're using a version manager like `nvm` or `n`.

To unlink:

```bash
# from your project first
npm unlink --no-save radar-sdk-js

# then from the SDK repo
npm unlink radar-sdk-js
```

## Versions

### Core SDK

The core SDK version is tracked in three places that must stay in sync: `src/version.ts`, `package.json`, and `package-lock.json`. Use the built-in script to bump all three:

```bash
npm run bump-version            # increments the minor version
npm run bump-version 5.1.0      # sets an explicit version
```

### Plugins

Each plugin tracks its version in `packages/<name>/package.json` and `packages/<name>/src/version.ts`. Use the plugin bump script:

```bash
npm run bump-plugin-version maps                  # increment minor
npm run bump-plugin-version maps 1.0.0     # explicit version
npm run bump-plugin-version autocomplete 1.0.0-beta.1
```

## Releases

_This only applies to authorized contributors._

New releases are managed via [GitHub Releases](https://github.com/radarlabs/radar-sdk-js/releases). Creating a release triggers a GitHub Actions workflow that:

- Runs tests
- Builds artifacts
- Publishes to [npm](https://www.npmjs.com/package/radar-sdk-js)
- Deploys CDN script tags
- Builds GitHub Pages for the demo site

Plugins have their own release workflows triggered by tags prefixed with the plugin name (for example, `maps-v1.0.0`, `autocomplete-v1.0.0`).

> **Note:** All release versions should be prefixed with `v` (for example, `v5.0.0`).

### Beta release

Beta versions should be suffixed with `-beta.<number>`:

```bash
npm run bump-version 5.0.1-beta.1
```

Mark beta releases as a **pre-release** in GitHub Releases.

### Production release

Production releases should not have a `-beta` suffix and should be set as the **latest** release.
