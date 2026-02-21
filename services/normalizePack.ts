// services/normalizePack.ts
// Helpers to make state packs conform to a minimal schema that the app
// depends on.  Baseline packs and seed packs use slightly different
// field names, so we canonicalize here before the UI consumes them.

export interface NormalizedPack {
  schemaVersion: string;
  quality?: string;
  state: string;
  packVersion: string;
  domains: any[];
  issues: any[];
  intakeQuestions: any[];
  authorities: Record<string, any>;
  authoritiesByIssue: Record<string, string[]>;
  legalTests: any[];
  traps: any[];
  testItems: any[];
  gaps: any[];
  [key: string]: any; // allow extra fields preserved
}

export function normalizePack(p: any): NormalizedPack {
  if (!p || typeof p !== 'object') {
    // nothing to normalize
    return p;
  }

  const normalized: any = { ...p };

  // primitive coercions with sensible defaults per spec
  normalized.schemaVersion = String(p.schemaVersion ?? '1');
  if (p.quality !== undefined) normalized.quality = String(p.quality);
  normalized.state = String(p.state ?? '');
  normalized.packVersion = String(p.packVersion ?? 'unknown');

  // core arrays
  normalized.domains = Array.isArray(p.domains) ? p.domains : [];
  normalized.issues = Array.isArray(p.issues) ? p.issues : [];
  normalized.intakeQuestions = Array.isArray(p.intakeQuestions) ? p.intakeQuestions : [];
  normalized.testItems = Array.isArray(p.testItems) ? p.testItems : [];
  normalized.gaps = Array.isArray(p.gaps) ? p.gaps : [];

  // authorities object
  normalized.authorities = p.authorities && typeof p.authorities === 'object' ? p.authorities : {};

  // authoritiesByIssue mapping
  if (p.authoritiesByIssue && typeof p.authoritiesByIssue === 'object') {
    normalized.authoritiesByIssue = p.authoritiesByIssue;
  } else if (Array.isArray(p.issueAuthorities)) {
    const map: Record<string, string[]> = {};
    p.issueAuthorities.forEach((ia: any) => {
      if (!ia || typeof ia !== 'object') return;
      const issueId = String(ia.issueId || ia.issue || '');
      const citation = String(ia.authorityCitation || ia.citation || '');
      if (!map[issueId]) map[issueId] = [];
      map[issueId].push(citation);
    });
    normalized.authoritiesByIssue = map;
  } else {
    normalized.authoritiesByIssue = {};
  }

  // legalTests from either field
  if (Array.isArray(p.legalTests)) {
    normalized.legalTests = p.legalTests;
  } else if (Array.isArray(p.tests)) {
    normalized.legalTests = p.tests;
  } else {
    normalized.legalTests = [];
  }

  // traps
  if (Array.isArray(p.traps)) {
    normalized.traps = p.traps;
  } else if (Array.isArray(p.proceduralTraps)) {
    normalized.traps = p.proceduralTraps;
  } else {
    normalized.traps = [];
  }

  return normalized as NormalizedPack;
}
