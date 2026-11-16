import { spawnSync } from 'node:child_process';
import path from 'node:path';

// The ESM-only MapLibre package runs in Node, with its actual event implementation.
test.each([
  'pending-polygon',
  'pending-line',
  'reused-id-listeners',
  'pending-id-reuse',
  'remove-twice',
  'style-readiness',
  'style-already-ready',
  'tiles-pending-after-style-load',
  'ready-after-tile-error',
  'removed-during-dispatch',
  'removed-cursor-during-dispatch',
  'removed-hovered-cursor',
  'overlapping-cursor-owners',
  'external-cursor-change',
  'preserved-features',
])('map feature lifecycle: %s', (scenario) => {
  const result = spawnSync(process.execPath, [path.join(__dirname, 'fixtures/feature-lifecycle.mjs'), scenario], {
    encoding: 'utf8',
    timeout: 15000,
  });
  expect(result.error).toBeUndefined();
  expect({ status: result.status, stderr: result.stderr }).toEqual({ status: 0, stderr: '' });
});
