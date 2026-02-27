// We'll lazily require AsyncStorage because web bundler can't resolve
// the native-only package.  For web, fall back to window.localStorage.

const STORAGE_KEY = 'savedAuthorities';

export type SavedItem = { id: string; state: string };

async function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return {
      getItem: async (k: string) => window.localStorage.getItem(k),
      setItem: async (k: string, v: string) => window.localStorage.setItem(k, v),
    } as any;
  }
  try {
    // dynamic import so bundler doesn't try to resolve on web
    // @ts-ignore // module may not exist in web environment
    const m = await import('@react-native-async-storage/async-storage');
    return m.default || m;
  } catch (e) {
    console.warn('AsyncStorage import failed', e);
    return {
      getItem: async () => null,
      setItem: async () => {},
    } as any;
  }
}

// Read raw storage and migrate old string[] format to SavedItem[] if needed
async function readRaw(): Promise<any> {
  try {
    const storage: any = await getStorage();
    const raw = await storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('savedStore read failed', e);
    return null;
  }
}

async function readAll(): Promise<SavedItem[]> {
  const raw = await readRaw();
  if (!raw) return [];
  if (Array.isArray(raw)) {
    // migration: old storage might be string[]
    if (raw.every(r => typeof r === 'string')) {
      const migrated: SavedItem[] = (raw as string[]).map(id => ({ id, state: '' }));
      await writeAll(migrated);
      return migrated;
    }
    // assume already SavedItem[]
    return raw as SavedItem[];
  }
  return [];
}

async function writeAll(items: SavedItem[]): Promise<void> {
  try {
    const storage: any = await getStorage();
    await storage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('savedStore write failed', e);
  }
}

export async function list(): Promise<SavedItem[]> {
  return await readAll();
}

export async function isSaved(id: string): Promise<boolean> {
  const arr = await readAll();
  return arr.some(x => x.id === id);
}

export async function save(id: string, state: string): Promise<void> {
  const arr = await readAll();
  if (!arr.some(x => x.id === id)) {
    arr.push({ id, state });
    await writeAll(arr);
  }
}

export async function unsave(id: string): Promise<void> {
  let arr = await readAll();
  if (arr.some(x => x.id === id)) {
    arr = arr.filter(x => x.id !== id);
    await writeAll(arr);
  }
}

// toggles saved state, returns new state
export async function toggle(id: string, state: string): Promise<boolean> {
  const current = await isSaved(id);
  if (current) {
    await unsave(id);
    return false;
  } else {
    await save(id, state);
    return true;
  }
}
