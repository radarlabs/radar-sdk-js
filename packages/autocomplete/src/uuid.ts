/**
 * generate a random v4 UUID
 *
 * NOTE(binhrobles): mirrors the generator private to the core SDK's device.ts, rather than
 * being shared through RadarPluginContext. The plugin is versioned separately, so widening
 * the published plugin contract for a 12-line crypto shim is the more expensive trade.
 *
 * @returns a newly generated UUID
 */
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // fallback for older browsers
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // variant 10

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export default generateUUID;
