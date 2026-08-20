import generateUUID from '../src/uuid';

describe('generateUUID', () => {
  it('should return a v4 UUID', () => {
    expect(generateUUID()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('should return a different UUID on each call', () => {
    expect(generateUUID()).not.toEqual(generateUUID());
  });
});
