const { expect } = require('chai');
import Storage from '../src/storage';

global.window = {}
import 'mock-local-storage'
window.localStorage = global.localStorage;
window.sessionStorage = global.sessionStorage;

describe('Storage', () => {
  describe('getItem', () => {
    beforeEach(() => {
      Storage.setItem('hello','world');
      Storage.setItem('foo', 'bar');
    });

    afterEach(() => {
      Storage.clear();
    });

    it('should return value of localStorage from a given key', () => {
      expect(Storage.getItem('hello'), 'world');
    });

    it('should return null if key not found', () => {
      expect(Storage.getItem('bar'), null);
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
    });

    it('should return null if the value provided is null', () => {
      Storage.setItem('hello', null);
      const unset = Storage.getItem('hello');
      expect(unset).to.be.null;
    });
  });

  describe('SessionStorage', () => {
    describe('getSessionItem', () => {
      beforeEach(() => {
        Storage.setSessionItem('hello','world');
        Storage.setSessionItem('foo', 'bar');
      });
  
      afterEach(() => {
        Storage.clearSessionStorage();
      });
  
      it('should return value of sessionStorage from a given key', () => {
        expect(Storage.getSessionItem('hello'), 'world');
      });
  
      it('should return null if key not found', () => {
        expect(Storage.getSessionItem('bar'), null);
      });
  
      it('should return null if sessionStorage key is undefined', () => {
        Storage.clearSessionStorage();
        expect(Storage.getSessionItem('foo')).to.be.null;
      });
    });
  
    describe('setSessionItem', () => {
  
      afterEach(() => {
        Storage.clearSessionStorage();
      });
  
      it('should write the key and value to the browsers sessionStorage', () => {
        Storage.setSessionItem('hello', 'world');
        expect(Storage.getSessionItem('hello')).to.equal('world');
      });

      it('should return null if the value provided is null', () => {
        Storage.setSessionItem('hello', null);
        const unset = Storage.getSessionItem('hello');
        expect(unset).to.be.null;
      });
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

  describe('clearSessionStorage', () => {
    beforeEach(() => {
      Storage.setSessionItem('hello', 'world');
    });

    it('should clear local Storage', () => {
      expect(Storage.getSessionItem('hello')).to.equal('world');
      Storage.clearSessionStorage();
      expect(Storage.getSessionItem('hello')).to.be.null;
    })
  });
});
