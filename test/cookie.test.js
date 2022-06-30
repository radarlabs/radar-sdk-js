const { expect } = require('chai');
const sinon = require('sinon');
import SessionStorage from '../src/sessionStorage';

describe('SessionStorage', () => {
  describe('getSessionStorage', () => {
    let document;
    // SessionStorage.setSessionStorage('hello', 'world');
    // SessionStorage.setSessionStorage('foo', 'bar');
    // SessionStorage.setSessionStorage('bar', 'baz');
    beforeEach(() => {
      SessionStorage.setSessionStorage('hello', 'world');
      SessionStorage.setSessionStorage('foo', 'bar');
      SessionStorage.setSessionStorage('bar', 'baz');
      document = sinon.spy();
      global.document = document;
    });

    afterEach(() => {
      global.document = undefined;
    });

    it('should return value of sessionStorage from a given key', () => {
      const value = global.document.sessionStorage.getSessionStorage('hello');
      expect(value).to.equal('world');
    });

    it('should return null if key not found', () => {
      const value = global.document.sessionStorage.getSessionStorage('unknown');
      expect(value).to.be.null;
    });

    it('should return null if sessionStorage key is undefined', () => {
      global.document.sessionStorage = undefined;
      const value = global.document.sessionStorage.getSessionStorage('foo');
      expect(value).to.be.null;
    });
  });

  describe('setSessionStorage', () => {

    let document;
    beforeEach(() => {
      document = sinon.spy();
      global.document = document;
    });

    afterEach(() => {
      global.document = undefined;
    });

    it('should write the key and value to the browsers sessionStorage', () => {
      global.document.sessionStorage.setSessionStorage('hello', 'world');

      expect(document.sessionStorage).to.not.be.undefined;
      const value = document.sessionStorage.getSessionStorage('hello');
      expect(value).to.equal('world');
    });

    it('should not set sessionStorage if value is not a string', () => {
      document.sessionStorage.setSessionStorage('foo', { hello: 'world' });
      expect(document.sessionStorage).to.be.undefined;
    });
  });

  describe('deleteSessionStorage', () => {
    let document;
    beforeEach(() => {
      document = sinon.spy();
      document.sessionStorage.setSessionStorage('foo', 'bar');
      global.document = document;
    });

    afterEach(() => {
      global.document = undefined;
    });

    it('should clear session storage', () => {
      document.sessionStorage.clearSessionStorage();
      expect(document.sessionStorage).to.be.undefined;
    });
  });
});
