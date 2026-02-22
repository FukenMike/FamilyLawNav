import type { StatePack } from '@/services/packStore';

export const state = 'NV';

export const nvPack: StatePack = {
  state,
  schemaVersion: "1",
  packVersion: 'baseline-2026-02-20',
  jurisdictions_sources: { code: '', rules: '', opinions: '' },
  domains: [],
  issues: [],
  authoritiesByIssue: {},
  authorities: {},
  legalTests: [],
  testItems: [],
  traps: [],
};
