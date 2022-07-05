const { expect } = require('chai');
const sinon = require('sinon');
import SessionStorage from '../src/sessionStorage';

global.window = {}
import 'mock-local-storage'
window.sessionStorage = global.sessionStorage;


describe('SessionStorage', () => {
  describe('getSessionStorage', () => {
    beforeEach(() => {
      sessionStorage.setItem('hello','world');
      sessionStorage.setItem('foo', 'bar');
      sessionStorage.setItem('bar', 'baz');
    });

    afterEach(() => {
      sessionStorage.clear();
    });

    it('should return value of sessionStorage from a given key', () => {
      expect(SessionStorage.getSessionStorage('hello'), 'world');
    });

    it('should return null if key not found', () => {
      expect(SessionStorage.getSessionStorage('foo'), 'bar');
    });

    it('should return null if sessionStorage key is undefined', () => {
      window.sessionStorage = undefined;
      expect(SessionStorage.getSessionStorage('foo')).to.be.null;
    });
  });

  describe('setSessionStorage', () => {

    afterEach(() => {
      sessionStorage.clear();
    });

    it('should write the key and value to the browsers sessionStorage', () => {
      SessionStorage.setSessionStorage('hello','world');
      expect(sessionStorage.getItem('hello')).to.equal('world');
    });

    it('should not set sessionStorage if value is not a string', () => {
      SessionStorage.setSessionStorage('foo', { hello: 'world' });
      expect(sessionStorage.getItem('foo')).to.be.null;
    });
  });

  describe('clear/deleteSessionStorage', () => {
    afterEach(() => {
      sessionStorage.setItem('hello','world');
    });

    it('should delete session Storage', () => {
      SessionStorage.deleteSessionStorage('hello');
      expect(sessionStorage.getItem('hello')).to.be.null;
    })

    it('should clear session storage', () => {
      SessionStorage.clearSessionStorage();
      expect(window.sessionStorage).to.be.undefined;
    });
  });
});
