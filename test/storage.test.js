const { expect } = require('chai');
import Storage from '../src/storage';

global.window = {}
import 'mock-local-storage'
window.localStorage = global.localStorage;

describe('Storage', () => {
  describe('getItem', () => {
    beforeEach(() => {
      Storage.setItem('hello','world');
      Storage.setItem('foo', 'bar');
      Storage.setItem('bar', 'baz');
    });

    afterEach(() => {
      Storage.clear();
    });

    it('should return value of localStorage from a given key', () => {
      expect(Storage.getItem('hello'), 'world');
    });

    it('should return null if key not found', () => {
      expect(Storage.getItem('baz')).to.be.null;
    });

    it('should return null if localStorage key is undefined', () => {
      Storage.clear();
      expect(Storage.getItem('foo')).to.be.null;
    });
  });

  describe('setItem', () => {

    afterEach(() => {
      Storage.clear();
    });

    it('should write the key and value to the browsers localStorage', () => {
      Storage.setItem('hello', 'world');
      expect(Storage.getItem('hello')).to.equal('world');
      const fake = Storage.getItem('nonexistant');
      expect(fake).to.be.null;
    });
  });

  describe('clear & removeItem', () => {
    beforeEach(() => {
      Storage.setItem('hello', 'world');
    });

    it('should delete local Storage', () => {
      expect(Storage.getItem('hello')).to.equal('world');
      Storage.removeItem('hello');
      expect(Storage.getItem('hello')).to.be.null;
    })

    it('should clear local storage', () => {
      expect(Storage.getItem('hello')).to.equal('world');
      Storage.clear();
      expect(Storage.getItem('hello')).to.be.null;
    });
  });

});
