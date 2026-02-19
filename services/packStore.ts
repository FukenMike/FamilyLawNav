// services/packStore.ts
// Handles fetching and caching of state packs and manifest

import { Platform } from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_PACKS_BASE_URL;
const MANIFEST_URL = BASE_URL ? `${BASE_URL}/manifest.json` : null;
const PACK_URL = (state: string) => BASE_URL ? `${BASE_URL}/packs/${state}.json` : null;

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

export type StatePack = any; // Use actual type if available

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

export async function fetchManifest(): Promise<Manifest | null> {
  if (!MANIFEST_URL) return null;
  // Try cache first
  const cached = await getLocal(manifestCacheKey);
  try {
    const resp = await fetch(MANIFEST_URL);
    if (!resp.ok) throw new Error('Manifest fetch failed');
    const manifest = await resp.json();
    await setLocal(manifestCacheKey, manifest);
    return manifest;
  } catch {
    return cached;
  }
}

export async function fetchPack(state: string): Promise<StatePack | null> {
  const manifest = await fetchManifest();
  let version = manifest?.states.find(s => s.state === state)?.packVersion || 'seed';
  const key = packCacheKey(state, version);
  // Try cache first
  const cached = await getLocal(key);
  // If manifest unavailable, try direct fetch
  const url = PACK_URL(state);
  if (!url) return cached;
  let shouldFetch = true;
  if (cached && manifest && version !== 'seed') {
    // If cached version matches manifest, skip fetch
    shouldFetch = false;
  }
  if (shouldFetch) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Pack fetch failed');
      const pack = await resp.json();
      await setLocal(key, pack);
      return pack;
    } catch {
      // Fallback to cache
      return cached;
    }
  }
  return cached;
}
