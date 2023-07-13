import packageJSON from '../package.json';
import packageLockJSON from '../package-lock.json';
import VERSION from '../src/version';

const RELEASE_TAG = process.env.GITHUB_REF_NAME;

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
      if (RELEASE_TAG) {
        expect(RELEASE_TAG.startsWith('v')).toEqual(true);
      }
    });

    it('should match version in ./src/version.ts', () => {
      if (RELEASE_TAG) {
        expect(RELEASE_TAG.slice(1)).toEqual(VERSION);
      }
    });

    it('should match version in package.json', () => {
      if (RELEASE_TAG) {
        expect(RELEASE_TAG.slice(1)).toEqual(packageJSON.version);
      }
    });

    it('should match version in package-lock.json', () => {
      if (RELEASE_TAG) {
        expect(RELEASE_TAG.slice(1)).toEqual(packageLockJSON.version);
      }
    });
  });
});
