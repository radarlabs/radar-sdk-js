# Contributing

## Setup
For local development, clone the repository and install all dev dependencies.

```bash
git clone git@github.com:radarlabs/radar-sdk-js.git

cd radar-sdk-js

npm install
```

## Tests
To run tests locally, you can run the test command for a single run, or in `watch` mode.
```bash
npm run test

npm run test:watch
```

## Demo App
The easiest way to develop the SDK in a browser environment, is to start up the [demo app](https://radarlabs.github.io/radar-sdk-js) locally.

This is a small web app that will run on a local server, and serve up the Web SDK as a locally built script tag. Any code changes will be recompiled on-the-fly (will require a browser refresh to take effect).

```bash
npm run demo
```

This will start the demo on [http://localhost:9001](http://localhost:9001). The demo app uses express to serve files, and [handlebars](https://handlebarsjs.com/) for rendering views.

**Note** adding new view templates will require the server to be restarted.

## `npm-link`
If you want to run a local version of the SDK in an ES Module environment, you can use [npm link](https://docs.npmjs.com/cli/v8/commands/npm-link) to use the locally built version in your project.

To setup, first link the local version of the Radar SDK
```
# in /radar-sdk-js
npm run build
npm link
```

Then in your project that has `radar-sdk-js` in its `package.json`
```bash
npm link radar-sdk-js
```
This will point the pakage in your project to use the local version of the SDK.

**Note**: Make sure you're using the node.js & npm installations in both projects, especially if you're using a node manager like `nvm` or `n`.

## Versions
There is a built in utility for managing version increments:
```bash
npm run bump-version
```
This will increment the minor version in the necessary places throughout the codebase. This is required before cutting a new release otherwise tests will fail.

### Releases
_This only applies to authorized contributors_

New releases are managed via [Github Releases](https://github.com/radarlabs/radar-sdk-js/releases). 

Creating a new release will start the Github Workflow for managing the release:
* Run tests
* Build artifacts
* Release on [npm](https://www.npmjs.com/package/radar-sdk-js)
* Deploy new script tags
* Build Github pages for demo site

*Note:* All release version should be prefixed with `v`.

### Beta release
To ship a beta release, the version should be suffixed with `-beta.<version number>`. This can be done with the `bump-version` command.
```bash
npm run bump-version 4.0.1-beta.1
```

Beta versions should also be set as a `pre-release`
[screenshot here]

### Production release
Production releases should not have a `-beta` suffix, and be set as the `latest` release.
[screenshot here]
