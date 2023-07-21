import Storage from '../src/storage';


describe('Storage', () => {
  afterAll(() => {
    Storage.clear();
  });

  describe('getItem', () => {
    beforeEach(() => {
      Storage.setItem('hello', 'world');
      Storage.setItem('foo', 'bar');
      Storage.setItem('bar', 'baz');
    });

    afterEach(() => {
      Storage.clear();
    });

    it('should return value of localStorage from a given key', () => {
      expect(Storage.getItem('hello')).toEqual('world');
    });

    it('should return null if key not found', () => {
      expect(Storage.getItem('baz')).toBeNull();
    });

    it('should return null if localStorage key is undefined', () => {
      Storage.clear();
      expect(Storage.getItem('foo')).toBeNull();
    });
  });

  describe('setItem', () => {

    afterEach(() => {
      Storage.clear();
    });

    it('should write the key and value to the browsers localStorage', () => {
      Storage.setItem('hello', 'world');
      expect(Storage.getItem('hello')).toEqual('world');
      const fake = Storage.getItem('nonexistant');
      expect(fake).toBeNull();
    });
  });

  describe('clear & removeItem', () => {
    beforeEach(() => {
      Storage.setItem('hello', 'world');
    });

    it('should delete local Storage', () => {
      expect(Storage.getItem('hello')).toEqual('world');
      Storage.removeItem('hello');
      expect(Storage.getItem('hello')).toBeNull();
    })

    it('should clear local storage', () => {
      expect(Storage.getItem('hello')).toEqual('world');
      Storage.clear();
      expect(Storage.getItem('hello')).toBeNull();
    });
  });
});
