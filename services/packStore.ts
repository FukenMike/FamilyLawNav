// services/packStore.ts
// Handles fetching, caching, cache-metadata and resilience for manifest + state packs

import { Platform } from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_PACKS_BASE_URL;
const MANIFEST_URL = BASE_URL ? `${BASE_URL}/manifest.json` : null;
const PACK_URL = (state: string) => BASE_URL ? `${BASE_URL}/packs/${state}.json` : null;

// Constants
export const PACK_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Types
export interface Manifest {
  schemaVersion: number;
  generatedAt: string;
  states: Array<{
    state: string;
    packVersion: string | null;
    lastVerifiedAt: string | null;
    available: boolean;
  }>;
}

export type StatePack = any; // Keep generic for now

export type PackSource = 'remote' | 'cache' | 'seed' | 'none';

export type PackStatus = {
  state: string;
  source: PackSource;
  schemaVersion?: number;
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
  schemaVersion?: number;
  packVersion?: string;
  pack: StatePack;
};

// Caching keys
const manifestCacheKey = 'packStore_manifest_v1';
const packCacheKey = (state: string, version: string) => `packStore_pack_${state}_${version}`;

// Platform detection
const isWeb = Platform.OS === 'web';

// Web: localStorage, Native: expo-file-system (if available)
let FileSystem: any = null;
if (!isWeb) {
  try {
    FileSystem = require('expo-file-system');
  } catch {}
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

// Read manifest from remote, but return cached manifest if remote unavailable.
export async function getManifest(opts?: { force?: boolean }): Promise<{ manifest: Manifest | null; status: PackStatus }> {
  const status: PackStatus = { state: 'manifest', source: 'none', lastTriedAt: new Date().toISOString() };
  const cached = await getLocal(manifestCacheKey) as Manifest | null;
  if (!MANIFEST_URL) {
    status.source = cached ? 'cache' : 'none';
    return { manifest: cached, status };
  }
  if (!opts?.force && cached) {
    // return cached while attempting background refresh (do not block callers)
    status.source = 'cache';
  }
  try {
    const resp = await fetch(MANIFEST_URL);
    if (!resp.ok) throw new Error(`Manifest fetch failed: ${resp.status}`);
    const manifest = await resp.json();
    await setLocal(manifestCacheKey, manifest);
    status.source = 'remote';
    return { manifest, status };
  } catch (err: any) {
    status.error = err?.message || String(err);
    status.source = cached ? 'cache' : 'none';
    return { manifest: cached, status };
  }
}

// Return any cached pack for the state (search keys if necessary)
export async function getCachedPack(state: string): Promise<{ pack: StatePack | null; status: PackStatus }> {
  // Try manifest-derived key first
  const manifestCached = await getLocal(manifestCacheKey) as Manifest | null;
  let keysToTry: string[] = [];
  const statusBase: PackStatus = { state, source: 'none', lastTriedAt: new Date().toISOString() };
  const manifestEntry = manifestCached?.states.find(s => s.state === state);
  if (manifestEntry?.packVersion) keysToTry.push(packCacheKey(state, manifestEntry.packVersion));
  // seed fallback
  keysToTry.push(packCacheKey(state, 'seed'));

  // also try to discover any keys in localStorage for this state (web only)
  if (isWeb && typeof window !== 'undefined' && window.localStorage) {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i) || '';
      if (k.startsWith(`packStore_pack_${state}_`) && !keysToTry.includes(k)) keysToTry.push(k);
    }
  }

  for (const k of keysToTry) {
    const payload = await getLocal(k) as CachedPackPayload | null;
    if (payload && payload.pack) {
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
  const manifestCached = await getLocal(manifestCacheKey) as Manifest | null;
  const keys: string[] = [];
  const manifestEntry = manifestCached?.states.find(s => s.state === state);
  if (manifestEntry?.packVersion) keys.push(packCacheKey(state, manifestEntry.packVersion));
  keys.push(packCacheKey(state, 'seed'));
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
  // Start with manifest (if available) but do not fail if manifest missing
  const { manifest } = await getManifest().catch(() => ({ manifest: null }));
  const manifestVersion = manifest?.states.find(s => s.state === state)?.packVersion || null;

  // If forceRemote and no BASE_URL, we should report remote unavailable
  const url = PACK_URL(state);

  // First, if forceRemote requested and remote available, try remote
  const statusBase: PackStatus = { state, source: 'none', lastTriedAt: triedAt };

  if (opts?.forceRemote && url) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Remote fetch failed: ${resp.status}`);
      const pack = await resp.json();
      // validate minimal fields
      const packVersion = pack?.packVersion || manifestVersion || 'remote';
      const payload: CachedPackPayload = { cachedAt: new Date().toISOString(), state, schemaVersion: pack?.schemaVersion, packVersion, pack };
      const key = packCacheKey(state, String(packVersion));
      await setLocal(key, payload);
      const status: PackStatus = { ...statusBase, source: 'remote', packVersion: String(packVersion), schemaVersion: pack?.schemaVersion, lastFetchedAt: payload.cachedAt, cacheKey: key };
      return { pack, status };
    } catch (err: any) {
      const status: PackStatus = { ...statusBase, source: 'none', error: err?.message || String(err), lastTriedAt: triedAt };
      // fall through to cache
      const cached = await getCachedPack(state);
      if (cached.pack) {
        cached.status.error = status.error;
        return cached;
      }
      return { pack: null, status };
    }
  }

  // Try to use cached pack if present and not stale (unless manifest indicates newer version)
  const cached = await getCachedPack(state);
  if (cached.pack) {
    // If manifest says newer version than cached packVersion, try remote (best-effort)
    const cachedVersion = cached.status.packVersion || null;
    const manifestPackVersion = manifestVersion;
    const isStaleByManifest = manifestPackVersion && cachedVersion && manifestPackVersion !== cachedVersion;
    if (!isStaleByManifest && !cached.status.isStale) {
      // return cached copy
      return cached;
    }
    // attempt remote fetch if URL available
    if (url) {
      try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`Remote fetch failed: ${resp.status}`);
        const pack = await resp.json();
        const packVersion = pack?.packVersion || manifestPackVersion || 'remote';
        const payload: CachedPackPayload = { cachedAt: new Date().toISOString(), state, schemaVersion: pack?.schemaVersion, packVersion, pack };
        const key = packCacheKey(state, String(packVersion));
        await setLocal(key, payload);
        const status: PackStatus = { ...statusBase, source: 'remote', packVersion: String(packVersion), schemaVersion: pack?.schemaVersion, lastFetchedAt: payload.cachedAt, cacheKey: key };
        return { pack, status };
      } catch (err: any) {
        // Remote failed; return cached with error info
        cached.status.error = err?.message || String(err);
        return cached;
      }
    }
    // No remote URL: return cached (may be stale)
    return cached;
  }

  // No cached pack: try remote if available
  if (url) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Remote fetch failed: ${resp.status}`);
      const pack = await resp.json();
      const packVersion = pack?.packVersion || manifestVersion || 'remote';
      const payload: CachedPackPayload = { cachedAt: new Date().toISOString(), state, schemaVersion: pack?.schemaVersion, packVersion, pack };
      const key = packCacheKey(state, String(packVersion));
      await setLocal(key, payload);
      const status: PackStatus = { ...statusBase, source: 'remote', packVersion: String(packVersion), schemaVersion: pack?.schemaVersion, lastFetchedAt: payload.cachedAt, cacheKey: key };
      return { pack, status };
    } catch (err: any) {
      const status: PackStatus = { ...statusBase, source: 'none', error: err?.message || String(err) };
      // fall back to seed provider if available
    }
  }

  // Fallback to seeded pack (GA) via Seed provider if available
  try {
    const { SeedAuthorityPackProvider } = require('@/providers/SeedAuthorityPackProvider');
    const seedProv = new SeedAuthorityPackProvider();
    const seedPack = await seedProv.getStatePack(state);
    if (seedPack) {
      const payload: CachedPackPayload = { cachedAt: new Date().toISOString(), state, schemaVersion: seedPack?.schemaVersion, packVersion: seedPack?.packVersion || 'seed', pack: seedPack };
      const key = packCacheKey(state, String(payload.packVersion));
      await setLocal(key, payload);
      const status: PackStatus = { ...statusBase, source: 'seed', packVersion: String(payload.packVersion), schemaVersion: seedPack?.schemaVersion, lastFetchedAt: payload.cachedAt, cacheKey: key };
      return { pack: seedPack, status };
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
