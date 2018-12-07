const chai = require('chai');

const { expect } = chai;

import packageJSON from '../package.json';
import VERSION from '../src/version';

describe('VERSION', () => {
  it('should match version in package.json', () => {
    expect(VERSION).to.eq(packageJSON.version);
  });
});
