import packageLockJSON from '../package-lock.json';
import packageJSON from '../package.json';
import VERSION from '../src/version';

const RELEASE_TAG = process.env.GITHUB_REF_NAME;

// plugin releases are tagged "<plugin>-vX.Y.Z" (e.g. "autocomplete-v1.1.1") and
// version-checked by scripts/check-plugin-tag.cjs in the publish workflow; the
// release assertions below only apply to core "vX.Y.Z" tags
const isPluginTag = Boolean(RELEASE_TAG && /^[a-z][a-z0-9-]*-v\d/.test(RELEASE_TAG));
const CORE_RELEASE_TAG = isPluginTag ? undefined : RELEASE_TAG;

describe('VERSION', () => {
  it('should match version in package.json', () => {
    expect(VERSION).toEqual(packageJSON.version);
  });

  it('should match version in package-lock.json', () => {
    expect(VERSION).toEqual(packageLockJSON.version);
  });

  // additional checks if running as part of a release
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
});
