import type { StatePack } from './ga';

export const state = 'IL';

export const ilPack: StatePack = {
  state,
  schemaVersion: 1,
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
