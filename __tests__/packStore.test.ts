/* eslint-env jest */

// Tests for services/packStore.ts — cache, TTL, seed fallback, forceRemote behavior

// Ensure Platform.OS is 'web' for tests so packStore uses localStorage
jest.mock('react-native', () => ({ Platform: { OS: 'web' } }));

beforeEach(() => {
  jest.resetModules();
  if (typeof window !== 'undefined' && window.localStorage) window.localStorage.clear();
  // ensure no remote base URL by default
  delete process.env.EXPO_PUBLIC_PACKS_BASE_URL;
  // reset fetch mock
  // @ts-ignore
  global.fetch = undefined;
});

test('getCachedPack returns none when nothing cached', async () => {
  const { getCachedPack } = require('@/services/packStore');
  const res = await getCachedPack('ZZ');
  expect(res.pack).toBeNull();
  expect(res.status.source).toBe('none');
});

test('getPack falls back to seeded GA pack when no remote and no cache', async () => {
  const { getPack } = require('@/services/packStore');
  const res = await getPack('GA');
  expect(res.pack).not.toBeNull();
  expect(res.pack.state).toBe('GA');
  expect(res.status.source).toBe('seed');
  expect(typeof res.status.packVersion).toBe('string');
});

test('getPack caches seed pack and getCachedPack returns cache (not stale)', async () => {
  const { getPack, getCachedPack, clearCachedPack } = require('@/services/packStore');
  await clearCachedPack('GA');
  const r1 = await getPack('GA');
  expect(r1.status.source).toBe('seed');
  const cached = await getCachedPack('GA');
  expect(cached.pack).not.toBeNull();
  expect(cached.status.source).toBe('cache');
  expect(cached.status.isStale).toBe(false);
});

test('getCachedPack marks stale when older than TTL and getPack returns stale cache when no remote', async () => {
  const { getPack, getCachedPack, PACK_CACHE_TTL_MS } = require('@/services/packStore');
  const r = await getPack('GA');
  expect(r.status.source).toBe('seed');

  const key = `packStore_pack_GA_${r.status.packVersion}`;
  const raw = window.localStorage.getItem(key);
  expect(raw).not.toBeNull();
  const payload = JSON.parse(raw as string);

  // set cachedAt to older than TTL
  payload.cachedAt = new Date(Date.now() - PACK_CACHE_TTL_MS - 1000).toISOString();
  window.localStorage.setItem(key, JSON.stringify(payload));

  const cached = await getCachedPack('GA');
  expect(cached.status.isStale).toBe(true);

  // getPack should return the stale cache (no remote URL present)
  const packRes = await getPack('GA');
  expect(packRes.status.source).toBe('cache');
  expect(packRes.status.isStale).toBe(true);
});

test('forceRemote attempts fetch when EXPO_PUBLIC_PACKS_BASE_URL is set and caches remote result', async () => {
  process.env.EXPO_PUBLIC_PACKS_BASE_URL = 'http://example.test';
  jest.resetModules();
  jest.mock('react-native', () => ({ Platform: { OS: 'web' } }));

  // mock fetch to return a manifest for MANIFEST_URL and a pack for PACK_URL
  // differentiate by URL
  // @ts-ignore
  global.fetch = jest.fn((url: string) => {
    if (typeof url === 'string' && url.endsWith('/manifest.json')) {
      return Promise.resolve({ ok: true, json: async () => ({ schemaVersion: 1, generatedAt: new Date().toISOString(), states: [{ state: 'GA', packVersion: 'remote-1', lastVerifiedAt: null, available: true }] }) });
    }
    return Promise.resolve({ ok: true, json: async () => ({ state: 'GA', schemaVersion: 1, packVersion: 'remote-1' }) });
  });

  const { getPack, getCachedPack } = require('@/services/packStore');
  const res = await getPack('GA', { forceRemote: true });
  // @ts-ignore
  expect(global.fetch).toHaveBeenCalled();
  expect(res.status.source).toBe('remote');
  expect(res.status.packVersion).toBe('remote-1');

  const cached = await getCachedPack('GA');
  expect(cached.status.packVersion).toBe('remote-1');
});
