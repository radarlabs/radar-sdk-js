const { expect } = require('chai');
const sinon = require('sinon');

import * as Cookie from '../src/cookie';

describe('Cookie', () => {
  describe('setCookie', () => {

    let document;
    beforeEach(() => {
      document = sinon.spy();
      global.document = document;
    });

    afterEach(() => {
      global.document = undefined;
    });

    it('should write the key and value to the browsers cookies, and set expiration in future', () => {
      Cookie.setCookie('hello', 'world');

      expect(document.cookie).to.not.be.undefined;

      const [cookie, path, expires] = document.cookie.split(';');
      const [key, value] = cookie.split('=');

      expect(key).to.equal('hello');
      expect(value).to.equal('world');
      expect(path).to.equal('path=/');
      expect(new Date(expires.split('='))).to.be.greaterThan(new Date());
    });
  });

  describe('getCookie', () => {
    const cookie = 'foo=bar;hello=world;bar=baz';

    beforeEach(() => {
      global.document = { cookie };
    });

    afterEach(() => {
      global.document = undefined;
    });

    it('should return value of cookie from a given key', () => {
      const value = Cookie.getCookie('hello');
      expect(value).to.equal('world');
    });

    it('should return null if key not found', () => {
      const value = Cookie.getCookie('unknown');
      expect(value).to.be.null;
    });
  });
});
