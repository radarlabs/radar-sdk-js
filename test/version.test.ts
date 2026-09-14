import fs from 'fs';
import path from 'path';

import packageLockJSON from '../package-lock.json';
import packageJSON from '../package.json';
import VERSION from '../src/version';

const RELEASE_TAG = process.env.GITHUB_REF_NAME;

// plugin releases are tagged "<plugin>-vX.Y.Z" (e.g. "autocomplete-v1.1.1");
// core releases are tagged "vX.Y.Z"
const pluginTagMatch = RELEASE_TAG?.match(/^([a-z][a-z0-9-]*?)-v(\d.*)$/) ?? null;
const PLUGIN_NAME = pluginTagMatch?.[1];
const PLUGIN_VERSION = pluginTagMatch?.[2];
const CORE_RELEASE_TAG = pluginTagMatch ? undefined : RELEASE_TAG;

// the lockfile's inferred literal type can't be indexed with a dynamic key, and
// workspace link entries carry no version field, so widen it once here
const lockPackages = packageLockJSON.packages as Record<string, { version?: string } | undefined>;

describe('VERSION', () => {
  it('should match version in package.json', () => {
    expect(VERSION).toEqual(packageJSON.version);
  });

  it('should match version in package-lock.json', () => {
    expect(VERSION).toEqual(packageLockJSON.version);
  });

  // additional checks if running as part of a core release
  describe('cutting a release', () => {
    it('it should start with a "v"', () => {
      if (CORE_RELEASE_TAG) {
        expect(CORE_RELEASE_TAG.startsWith('v')).toEqual(true);
      }
    });

    it('should match version in ./src/version.ts', () => {
      if (CORE_RELEASE_TAG) {
        expect(CORE_RELEASE_TAG.slice(1)).toEqual(VERSION);
      }
    });

    it('should match version in package.json', () => {
      if (CORE_RELEASE_TAG) {
        expect(CORE_RELEASE_TAG.slice(1)).toEqual(packageJSON.version);
      }
    });

    it('should match version in package-lock.json', () => {
      if (CORE_RELEASE_TAG) {
        expect(CORE_RELEASE_TAG.slice(1)).toEqual(packageLockJSON.version);
      }
    });
  });

  // additional checks if running as part of a plugin release
  describe('cutting a plugin release', () => {
    const pluginDir = PLUGIN_NAME ? path.join(__dirname, '..', 'packages', PLUGIN_NAME) : undefined;

    it('should be a known plugin package', () => {
      if (PLUGIN_NAME && pluginDir) {
        expect(fs.existsSync(path.join(pluginDir, 'package.json'))).toEqual(true);
      }
    });

    it('should match version in the plugin package.json', () => {
      if (PLUGIN_VERSION && pluginDir) {
        const pluginPackageJSON = JSON.parse(fs.readFileSync(path.join(pluginDir, 'package.json'), 'utf8'));
        expect(PLUGIN_VERSION).toEqual(pluginPackageJSON.version);
      }
    });

    it('should match version in the plugin src/version.ts', () => {
      if (PLUGIN_VERSION && pluginDir) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pluginVersion = require(path.join(pluginDir, 'src', 'version.ts')).default;
        expect(PLUGIN_VERSION).toEqual(pluginVersion);
      }
    });

    it('should match version in package-lock.json', () => {
      if (PLUGIN_NAME && PLUGIN_VERSION) {
        expect(PLUGIN_VERSION).toEqual(lockPackages[`packages/${PLUGIN_NAME}`]?.version);
      }
    });
  });
});
