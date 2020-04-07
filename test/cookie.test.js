const { expect } = require('chai');
const sinon = require('sinon');

import  Cookie from '../src/cookie';

describe('Cookie', () => {
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

    it('should return null if cookie is undefined', () => {
      global.document.cookie = undefined;
      const value = Cookie.getCookie('foo');
      expect(value).to.be.null;
    });
  });

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

    it('should not set cookie if value is not a string', () => {
      Cookie.setCookie('foo', { hello: 'world' });
      expect(document.cookie).to.be.undefined;
    });
  });

  describe('deleteCookie', () => {
    const cookie = 'foo=bar;';

    beforeEach(() => {
      global.document = { cookie };
    });

    afterEach(() => {
      global.document = undefined;
    });

    it('should set an expiration date on cookie in the past', () => {
      Cookie.deleteCookie('foo');
      expect(global.document.cookie).to.eq('foo=;expires=Thu, 01-Jan-1970 00:00:01 GMT;path=/');
    });

    it('should not set anything if cookie is undefined', () => {
      global.document.cookie = undefined;
      Cookie.deleteCookie('foo');
      expect(global.document.cookie).to.be.undefined;
    });
  });
});
