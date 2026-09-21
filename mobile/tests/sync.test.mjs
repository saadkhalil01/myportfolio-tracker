import test from 'node:test';
import assert from 'node:assert/strict';
import { synchronize, SyncConflict } from '../src/lib/sync.mjs';

function remote(cloud) {
  const api = { writes: [], empty: () => ({ portfolios: [] }),
    read: async () => cloud,
    write: async (data, baseVersion) => { api.writes.push({ data, baseVersion }); return 'v2'; },
  };
  return api;
}
const local = { data: { portfolios: [{ id: 'mobile' }] }, dirty: true, baseVersion: 'v1' };

test('a clean device loads the cloud without writing its empty defaults', async () => {
  const api = remote({ data: { portfolios: [{ id: 'web' }] }, version: 'v1' });
  const result = await synchronize({ ...local, dirty: false }, api);
  assert.equal(result.data.portfolios[0].id, 'web');
  assert.equal(api.writes.length, 0);
});

test('pending edits sync only against the loaded cloud version', async () => {
  const api = remote({ data: {}, version: 'v1' });
  const result = await synchronize(local, api);
  assert.deepEqual(api.writes, [{ data: local.data, baseVersion: 'v1' }]);
  assert.equal(result.dirty, false);
  assert.equal(result.baseVersion, 'v2');
});

test('new device and stale offline changes cannot overwrite an existing account', async () => {
  for (const baseVersion of [null, 'older']) {
    const api = remote({ data: {}, version: 'v1' });
    await assert.rejects(synchronize({ ...local, baseVersion }, api), SyncConflict);
    assert.equal(api.writes.length, 0);
    assert.equal(local.dirty, true);
  }
});

test('network failure preserves local changes and never writes', async () => {
  const api = remote(null);
  api.read = async () => { throw new Error('offline'); };
  await assert.rejects(synchronize(local, api), /offline/);
  assert.equal(api.writes.length, 0);
  assert.equal(local.dirty, true);
});

test('concurrent cloud write rejection preserves pending changes', async () => {
  const api = remote({ data: {}, version: 'v1' });
  api.write = async () => { throw new SyncConflict(); };
  await assert.rejects(synchronize(local, api), SyncConflict);
  assert.equal(local.dirty, true);
});

test('explicit cloud reload discards pending local changes without writing', async () => {
  const api = remote({ data: { portfolios: [] }, version: 'other' });
  const result = await synchronize(local, api, { replaceLocal: true });
  assert.deepEqual(result.data, { portfolios: [] });
  assert.equal(result.dirty, false);
  assert.equal(api.writes.length, 0);
});

test('deleted cloud record clears clean caches but conflicts with pending edits', async () => {
  const api = remote(null);
  assert.deepEqual((await synchronize({ ...local, dirty: false }, api)).data, api.empty());
  await assert.rejects(synchronize(local, api), SyncConflict);
});

test('first intentional edit creates a new account record', async () => {
  const api = remote(null);
  const result = await synchronize({ ...local, baseVersion: null }, api);
  assert.equal(api.writes[0].baseVersion, null);
  assert.equal(result.dirty, false);
});
