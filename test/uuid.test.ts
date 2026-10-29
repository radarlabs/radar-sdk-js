import generateUUID from '../src/uuid';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('generateUUID', () => {
  it('should return a v4 UUID', () => {
    expect(generateUUID()).toMatch(UUID_PATTERN);
  });

  it('should return a different UUID on each call', () => {
    expect(generateUUID()).not.toEqual(generateUUID());
  });

  describe('when crypto.randomUUID is available', () => {
    const stubbed = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

    beforeEach(() => {
      Object.defineProperty(crypto, 'randomUUID', {
        value: () => stubbed,
        configurable: true,
        writable: true,
      });
    });

    afterEach(() => {
      delete (crypto as { randomUUID?: unknown }).randomUUID;
    });

    it('should delegate to it rather than the fallback', () => {
      expect(generateUUID()).toEqual(stubbed);
    });
  });

  describe('when crypto.randomUUID is unavailable', () => {
    // insecure origins and older browsers expose getRandomValues but not randomUUID
    it('should fall back to getRandomValues', () => {
      expect('randomUUID' in crypto).toBe(false);
      expect(generateUUID()).toMatch(UUID_PATTERN);
    });

    it('should still return a different UUID on each call', () => {
      expect(generateUUID()).not.toEqual(generateUUID());
    });
  });
});
