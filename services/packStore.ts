// services/packStore.ts
// Handles fetching, caching, cache-metadata and resilience for manifest + state packs


import { statePacks } from '@/data/statePacks';

export type StatePack = any;

export type PackStatus = {
  state: string;
  source: 'local' | 'none';
  error?: string;
};

function validateStatePack(p: any): { ok: boolean; error?: string } {
  if (!p || typeof p !== 'object')
    return { ok: false, error: 'pack not object' };
  if (typeof p.state !== 'string')
    return { ok: false, error: 'state missing or not string' };
  if (!Array.isArray(p.domains))
    return { ok: false, error: 'domains not array' };
  if (!Array.isArray(p.issues))
    return { ok: false, error: 'issues not array' };
  if (!p.authoritiesByIssue || typeof p.authoritiesByIssue !== 'object')
    return { ok: false, error: 'authoritiesByIssue missing or not object' };
  if (!p.authorities || typeof p.authorities !== 'object')
    return { ok: false, error: 'authorities missing or not object' };
  return { ok: true };
}

export async function getPack(state: string): Promise<{ pack: StatePack | null; status: PackStatus }> {
  const triedAt = new Date().toISOString();
  const statusBase: PackStatus = { state, source: 'none' };
  const pack = statePacks[state as keyof typeof statePacks];
  if (!pack) {
    return { pack: null, status: { ...statusBase, error: `Pack for ${state} not found.` } };
  }
  const v = validateStatePack(pack);
  if (!v.ok) {
    return { pack: null, status: { ...statusBase, error: `Pack for ${state} invalid: ${v.error}` } };
  }
  return { pack, status: { state, source: 'local' } };
}

import { useState, useEffect, useCallback } from 'react';

export function usePack(state: string) {
  const [pack, setPack] = useState<StatePack | null>(null);
  const [status, setStatus] = useState<PackStatus>({ state, source: 'none' });

  const load = useCallback(async () => {
    const res = await getPack(state);
    setPack(res.pack);
    setStatus(res.status);
    return res;
  }, [state]);

  useEffect(() => {
    setPack(null);
    setStatus({ state, source: 'none' });
    load();
  }, [state, load]);

  return { pack, status, refresh: () => load() };
}
