// services/packStore.ts
// Handles fetching, caching, cache-metadata and resilience for manifest + state packs

import { Platform } from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_PACKS_BASE_URL;
const MANIFEST_URL = BASE_URL ? `${BASE_URL}/manifest.json` : null;
const PACK_URL = (state: string) => BASE_URL ? `${BASE_URL}/packs/${state}.json` : null;

// Constants
export const PACK_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const MANIFEST_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// Types
// manifest provides version information for each state; schemaVersion tracks the manifest format
export interface Manifest {
  schemaVersion: string;
  packs: Record<
    string,
    {
      packVersion: string;
      sha256?: string;
    }
  >;
}

export type StatePack = any; // generic, validation will ensure required fields

export type PackSource = 'remote' | 'cache' | 'seed' | 'none';

export type PackStatus = {
  state: string;
  source: PackSource;
  schemaVersion?: string;
  packVersion?: string;
  lastFetchedAt?: string; // ISO
  lastTriedAt?: string; // ISO
  error?: string;
  isStale?: boolean;
  cacheKey?: string;
};

// Cache payload format for packs
type CachedPackPayload = {
  cachedAt: string; // ISO
  state: string;
  schemaVersion?: string;
  packVersion?: string;
  pack: StatePack;
};

// Caching keys
const manifestCacheKey = 'packStore_manifest_v1';
// include schema version and pack version so that different schema versions never collide
const packCacheKey = (state: string, schemaVersion: string, packVersion: string) => `packStore_pack_${state}_${schemaVersion}_${packVersion}`;

// Platform detection
const isWeb = Platform.OS === 'web';

// Web: localStorage, Native: expo-file-system (if available)
let FileSystem: any = null;
if (!isWeb) {
  try {
    FileSystem = require('expo-file-system');
  } catch {}
}

// simple debug helper
function debug(...args: any[]) {
  if (typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production') {
    console.log('[packStore]', ...args);
  }
}

// In-memory fallback
const memoryCache: Record<string, any> = {};

// Helpers
async function getLocal(key: string): Promise<any | null> {
  if (isWeb && typeof window !== 'undefined' && window.localStorage) {
    const val = window.localStorage.getItem(key);
    if (!val) return null;
    try { return JSON.parse(val); } catch { return null; }
  }
  if (FileSystem) {
    const path = FileSystem.documentDirectory + key + '.json';
    try {
      const val = await FileSystem.readAsStringAsync(path);
      return JSON.parse(val);
    } catch { return null; }
  }
  return memoryCache[key] || null;
}

async function setLocal(key: string, value: any): Promise<void> {
  if (isWeb && typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(key, JSON.stringify(value));
    return;
  }
  if (FileSystem) {
    const path = FileSystem.documentDirectory + key + '.json';
    await FileSystem.writeAsStringAsync(path, JSON.stringify(value));
    return;
  }
  memoryCache[key] = value;
}

async function removeLocal(key: string): Promise<void> {
  if (isWeb && typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(key);
    return;
  }
  if (FileSystem) {
    const path = FileSystem.documentDirectory + key + '.json';
    try { await FileSystem.deleteAsync(path); } catch {}
    return;
  }
  delete memoryCache[key];
}

// simple validators returning result object
function validateManifest(x: any): { ok: boolean; error?: string } {
  if (!x || typeof x !== 'object') return { ok: false, error: 'manifest not object' };
  if (typeof x.schemaVersion !== 'string') return { ok: false, error: 'schemaVersion missing or not string' };
  if (!x.packs || typeof x.packs !== 'object') return { ok: false, error: 'packs missing or not object' };
  for (const state of Object.keys(x.packs)) {
    const entry = x.packs[state];
    if (!entry || typeof entry.packVersion !== 'string') return { ok: false, error: `invalid pack entry for ${state}` };
    if (entry.sha256 && typeof entry.sha256 !== 'string') return { ok: false, error: `invalid sha256 for ${state}` };
  }
  return { ok: true };
}

function validateStatePack(p: any): { ok: boolean; error?: string } {
  if (!p || typeof p !== 'object') return { ok: false, error: 'pack not object' };
  if (typeof p.schemaVersion !== 'string') return { ok: false, error: 'schemaVersion missing or not string' };
  if (p.quality && typeof p.quality !== 'string') return { ok: false, error: 'quality invalid' };
  if (typeof p.state !== 'string') return { ok: false, error: 'state missing or not string' };
  if (typeof p.packVersion !== 'string') return { ok: false, error: 'packVersion missing or not string' };
  if (!Array.isArray(p.domains)) return { ok: false, error: 'domains not array' };
  if (!Array.isArray(p.issues)) return { ok: false, error: 'issues not array' };
  if (!p.authorities || typeof p.authorities !== 'object') return { ok: false, error: 'authorities missing or not object' };
  return { ok: true };
}

// Read manifest from remote, but return cached manifest if remote unavailable.  Maintain TTL.
export async function getManifest(opts?: { force?: boolean }): Promise<{ manifest: Manifest | null; status: PackStatus }> {
  const status: PackStatus = { state: 'manifest', source: 'none', lastTriedAt: new Date().toISOString() };
  // fetch cached wrapper {manifest,cachedAt}
  const cachedWrapper = await getLocal(manifestCacheKey) as { manifest: Manifest; cachedAt: string } | null;
  let manifest: Manifest | null = cachedWrapper?.manifest ?? null;
  const now = Date.now();
  const age = cachedWrapper ? now - Date.parse(cachedWrapper.cachedAt) : Infinity;
  const expired = age > MANIFEST_CACHE_TTL_MS;
  if (cachedWrapper) {
    status.source = 'cache';
    if (expired) status.isStale = true;
  }
  if ((opts?.force || expired) && MANIFEST_URL) {
    try {
      const resp = await fetch(MANIFEST_URL);
      if (!resp.ok) throw new Error(`Manifest fetch failed: ${resp.status}`);
      const candidate = await resp.json();
      const v = validateManifest(candidate);
      if (!v.ok) throw new Error(v.error || 'Manifest validation failed');
      manifest = candidate;
      await setLocal(manifestCacheKey, { manifest: candidate, cachedAt: new Date().toISOString() });
      status.source = 'remote';
      status.schemaVersion = candidate.schemaVersion;
    } catch (err: any) {
      status.error = err?.message || String(err);
      // keep previous manifest if any
      if (!manifest) status.source = 'none';
    }
  }
  return { manifest, status };
}

// Return any cached pack for the state (search keys if necessary)
export async function getCachedPack(state: string): Promise<{ pack: StatePack | null; status: PackStatus }> {
  const statusBase: PackStatus = { state, source: 'none', lastTriedAt: new Date().toISOString() };
  // gather keys that might contain this state
  const keys: string[] = [];
  if (isWeb && typeof window !== 'undefined' && window.localStorage) {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i) || '';
      if (k.startsWith(`packStore_pack_${state}_`)) keys.push(k);
    }
  }
  // also try manifest entry
  const { manifest } = await getManifest().catch(() => ({ manifest: null }));
  const manifestVersion = manifest?.packs?.[state]?.packVersion;
  if (manifestVersion) {
    const key = packCacheKey(state, manifest.schemaVersion, manifestVersion);
    if (!keys.includes(key)) keys.unshift(key);
  }
  // finally include a generic seed key (schema unknown)
  keys.push(packCacheKey(state, 'unknown', 'seed'));

  for (const k of keys) {
    const payload = await getLocal(k) as CachedPackPayload | null;
    if (payload && payload.pack) {
      const v = validateStatePack(payload.pack);
      if (!v.ok) {
        debug('cached pack validation failed', state, v.error);
        continue;
      }
      const now = Date.now();
      const cachedAtMs = Date.parse(payload.cachedAt || '') || 0;
      const age = now - cachedAtMs;
      const isStale = age > PACK_CACHE_TTL_MS;
      const status: PackStatus = {
        state,
        source: 'cache',
        schemaVersion: payload.schemaVersion,
        packVersion: payload.packVersion,
        lastFetchedAt: payload.cachedAt,
        lastTriedAt: new Date().toISOString(),
        isStale,
        cacheKey: k,
      };
      return { pack: payload.pack, status };
    }
  }
  return { pack: null, status: statusBase };
}

export async function clearCachedPack(state: string): Promise<void> {
  // Remove any cached entries for this state (web localStorage scan + known keys)
  const manifestCached = await getLocal(manifestCacheKey) as { manifest: Manifest } | null;
  const keys: string[] = [];
  const manifestVersion = manifestCached?.manifest?.packs?.[state]?.packVersion;
  const manifestSchema = manifestCached?.manifest?.schemaVersion;
  if (manifestVersion && manifestSchema) keys.push(packCacheKey(state, manifestSchema, manifestVersion));
  keys.push(packCacheKey(state, 'unknown', 'seed'));
  if (isWeb && typeof window !== 'undefined' && window.localStorage) {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i) || '';
      if (k.startsWith(`packStore_pack_${state}_`)) keys.push(k);
    }
  }
  for (const k of keys) {
    await removeLocal(k);
  }
}

// Main pack loader with resilient fallbacks and status metadata
export async function getPack(state: string, opts?: { forceRemote?: boolean }): Promise<{ pack: StatePack | null; status: PackStatus }> {
  const triedAt = new Date().toISOString();
  const statusBase: PackStatus = { state, source: 'none', lastTriedAt: triedAt };

  // manifest might inform version checks
  let { manifest } = await getManifest().catch(() => ({ manifest: null }));
  const manifestPackVersion = manifest?.packs?.[state]?.packVersion;
  const manifestSchema = manifest?.schemaVersion;

  // helper to attempt remote fetch
  const tryRemote = async (): Promise<{ pack: StatePack | null; status: PackStatus } | null> => {
    const url = PACK_URL(state);
    if (!url) return null;
    // fetch fresh manifest too
    const manresp = await getManifest({ force: true });
    if (manresp.manifest) manifest = manresp.manifest; // update outer
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Remote fetch failed: ${resp.status}`);
      const pack = await resp.json();
      const v = validateStatePack(pack);
      if (!v.ok) throw new Error(v.error || 'Remote pack failed validation');
      const schemaVersion = String(pack.schemaVersion);
      const packVersion = String(pack.packVersion || manifestPackVersion || 'remote');
      const payload: CachedPackPayload = { cachedAt: new Date().toISOString(), state, schemaVersion, packVersion, pack };
      const key = packCacheKey(state, schemaVersion, packVersion);
      await setLocal(key, payload);
      const status: PackStatus = { ...statusBase, source: 'remote', packVersion, schemaVersion, lastFetchedAt: payload.cachedAt, cacheKey: key };
      debug('remote success', status);
      return { pack, status };
    } catch (err: any) {
      debug('remote failure', state, err.message);
      return { pack: null, status: { ...statusBase, source: 'none', error: err.message || String(err) } };
    }
  };

  // start with cache
  const cached = await getCachedPack(state);
  if (cached.pack) {
    const isFreshCache = !cached.status.isStale && cached.status.packVersion === manifestPackVersion;
    if (isFreshCache) {
      debug('using fresh cache for', state);
      return cached;
    }
    // attempt remote if cache stale or manifest version newer
    const remote = await tryRemote();
    if (remote && remote.pack) return remote;
    // remote failed, return cached (stale)
    cached.status.isStale = true;
    return cached;
  }

  // no cache, try remote
  const remoteOnly = await tryRemote();
  if (remoteOnly && remoteOnly.pack) return remoteOnly;

  // fallback to seed
  try {
    const { SeedAuthorityPackProvider } = require('@/providers/SeedAuthorityPackProvider');
    const seedProv = new SeedAuthorityPackProvider();
    const seedPack = await seedProv.getStatePack(state);
    if (seedPack) {
      const v2 = validateStatePack(seedPack);
      if (!v2.ok) {
        debug('seed pack validation failed', state, v2.error);
      } else {
        const schemaVersion = String(seedPack.schemaVersion || 'unknown');
        const packVersion = String(seedPack.packVersion || 'seed');
        const payload: CachedPackPayload = { cachedAt: new Date().toISOString(), state, schemaVersion, packVersion, pack: seedPack };
        const key = packCacheKey(state, schemaVersion, packVersion);
        await setLocal(key, payload);
        const status: PackStatus = { ...statusBase, source: 'seed', packVersion, schemaVersion, lastFetchedAt: payload.cachedAt, cacheKey: key };
        debug('seed fallback', status);
        return { pack: seedPack, status };
      }
    }
  } catch (e) {
    // ignore
  }

  return { pack: null, status: { ...statusBase, source: 'none' } };
}

// Backward-compatible helpers (legacy API)
export async function fetchManifest(): Promise<Manifest | null> {
  const res = await getManifest();
  return res.manifest;
}

export async function fetchPack(state: string): Promise<StatePack | null> {
  const res = await getPack(state);
  return res.pack;
}
