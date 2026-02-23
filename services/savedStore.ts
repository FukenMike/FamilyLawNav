// We'll lazily require AsyncStorage because web bundler can't resolve
// the native-only package.  For web, fall back to window.localStorage.

const STORAGE_KEY = 'savedAuthorities';

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

async function readAll(): Promise<string[]> {
  try {
    const storage: any = await getStorage();
    const raw = await storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch (e) {
    console.warn('savedStore read failed', e);
    return [];
  }
}

async function writeAll(ids: string[]): Promise<void> {
  try {
    const storage: any = await getStorage();
    await storage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (e) {
    console.warn('savedStore write failed', e);
  }
}

export async function getSavedIds(): Promise<string[]> {
  return await readAll();
}

export async function isSaved(id: string): Promise<boolean> {
  const arr = await readAll();
  return arr.includes(id);
}

export async function save(id: string): Promise<void> {
  const arr = await readAll();
  if (!arr.includes(id)) {
    arr.push(id);
    await writeAll(arr);
  }
}

export async function unsave(id: string): Promise<void> {
  let arr = await readAll();
  if (arr.includes(id)) {
    arr = arr.filter(x => x !== id);
    await writeAll(arr);
  }
}

// toggles saved state, returns new state
export async function toggle(id: string): Promise<boolean> {
  const current = await isSaved(id);
  if (current) {
    await unsave(id);
    return false;
  } else {
    await save(id);
    return true;
  }
}
