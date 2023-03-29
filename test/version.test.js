const chai = require('chai');

const { expect } = chai;

import packageJSON from '../package.json';
import packageLockJSON from '../package-lock.json';
import VERSION from '../src/version';

const RELEASE_TAG = process.env.GITHUB_REF;

describe('VERSION', () => {
  it('should match version in package.json', () => {
    expect(VERSION).to.eq(packageJSON.version);
  });

  it('should match version in package-lock.json', () => {
    expect(VERSION).to.eq(packageLockJSON.version);
  });

  // additional checks if running as part of a release
  if (RELEASE_TAG) {
    it('it should start with a "v"', () => {
      expect(RELEASE_TAG.startsWith('v')).to.eq(true);
    });

    it('should match version in ./src/version.js', () => {
      expect(RELEASE_TAG.slice(1)).to.eq(VERSION);
    });

    it('should match version in package.json', () => {
      expect(RELEASE_TAG.slice(1)).to.eq(packageJSON.version);
    });

    it('should match version in package-lock.json', () => {
      expect(RELEASE_TAG.slice(1)).to.eq(packageLockJSON.version);
    });
  }
});
