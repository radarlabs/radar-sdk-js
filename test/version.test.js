const chai = require('chai');

const { expect } = chai;

import packageJSON from '../package.json';
import packageLockJSON from '../package-lock.json';
import VERSION from '../src/version';

describe('VERSION', () => {
  it('should match version in package.json', () => {
    expect(VERSION).to.eq(packageJSON.version);
  });

  it('should match version in package-lock.json', () => {
    expect(VERSION).to.eq(packageLockJSON.version);
  });
});
