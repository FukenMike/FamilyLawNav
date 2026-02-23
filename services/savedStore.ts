// AsyncStorage types sometimes missing in JS-only deps
// @ts-ignore
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'savedAuthorities';

async function readAll(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch (e) {
    console.warn('savedStore read failed', e);
    return [];
  }
}

async function writeAll(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
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
