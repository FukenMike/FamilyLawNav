// services/adaptPackToV1.ts
// Converts various pack representations into the canonical StatePackV1 shape.

import type { StatePackV1, DomainV1, IssueV1, AuthorityV1 } from "@/core/packs/statePackV1";

function makeDefaultJurisdictions() {
  return {
    official_code: "",
    judiciary_rules: "",
    judiciary_forms: "",
    opinions_search: "",
    legal_aid_portal: "",
  };
}

export function adaptPackToV1(input: any): StatePackV1 {
  // canonicalize legacy root‑level keys before doing anything else
  if (input && typeof input === 'object') {
    if (input.tests && !input.testItems) {
      input.testItems = input.tests;
    }
    if (input.tests && input.testItems) {
      console.warn('pack contains both tests and testItems; using testItems');
    }
    if (input.traps && !input.proceduralTraps) {
      input.proceduralTraps = input.traps;
    }
    if (input.traps && input.proceduralTraps) {
      console.warn('pack contains both traps and proceduralTraps; using proceduralTraps');
    }
    // strip the legacy names entirely
    delete (input as any).tests;
    delete (input as any).traps;
  }

  // already valid object with domains and authorities?
  if (input && typeof input === 'object' && Array.isArray(input.domains) && input.authorities && typeof input.authorities === 'object') {
    // Ensure minimal fields exist
    const out: any = {
      state: String(input.state || ''),
      schemaVersion: '1',
      packVersion: String(input.packVersion || input.pack_version || ''),
      jurisdiction_sources: input.jurisdiction_sources || input.jurisdictions_sources || makeDefaultJurisdictions(),
      domains: input.domains.map((d: any) => ({
        id: String(d.id || ''),
        label: String(d.label || ''),
        status: d.status || 'empty',
        issues: Array.isArray(d.issues)
          ? d.issues.map((i: any) => {
              // normalize legacy field names for tests and traps
              const legalTestsArr =
                Array.isArray(i.legal_tests)
                  ? i.legal_tests
                  : Array.isArray(i.legalTests)
                  ? i.legalTests
                  : Array.isArray(i.tests)
                  ? i.tests
                  : Array.isArray(i.testItems)
                  ? i.testItems
                  : [];
              const trapsArr =
                Array.isArray(i.procedural_traps)
                  ? i.procedural_traps
                  : Array.isArray(i.proceduralTraps)
                  ? i.proceduralTraps
                  : Array.isArray(i.traps)
                  ? i.traps
                  : [];
              return {
                id: String(i.id || ''),
                label: String(i.label || ''),
                summary: i.summary || '',
                authorities: Array.isArray(i.authorities) ? i.authorities : [],
                legal_tests: legalTestsArr,
                procedural_traps: trapsArr,
                forms_and_guides: Array.isArray(i.forms_and_guides) ? i.forms_and_guides : [],
                notes: i.notes || '',
                needs_verification: !!i.needs_verification,
              };
            })
          : [],
      })),
      authorities: input.authorities,
    };
    return out as StatePackV1;
  }

  // legacy array format
  if (Array.isArray(input)) {
    const first = input[0] || {};
    const domains: DomainV1[] = input.map((d: any) => ({
      id: String(d.id || ''),
      label: String(d.label || ''),
      status: d.status || 'empty',
      issues: Array.isArray(d.issues)
        ? d.issues.map((i: any) => ({
            id: String(i.id || ''),
            label: String(i.label || ''),
            summary: i.summary || '',
            authorities: Array.isArray(i.authorities) ? i.authorities : [],
            legal_tests: Array.isArray(i.legal_tests) ? i.legal_tests : [],
            procedural_traps: Array.isArray(i.procedural_traps) ? i.procedural_traps : [],
            forms_and_guides: Array.isArray(i.forms_and_guides) ? i.forms_and_guides : [],
            notes: i.notes || '',
            needs_verification: !!i.needs_verification,
          }))
        : [],
    }));
    return {
      state: String(first.state || '??'),
      schemaVersion: '1',
      packVersion: String(first.packVersion || first.pack_version || 'legacy'),
      jurisdiction_sources: makeDefaultJurisdictions(),
      domains,
      authorities: {},
    } as StatePackV1;
  }

  // fallback: create empty structure
  return {
    state: String(input?.state || ''),
    schemaVersion: '1',
    packVersion: String(input?.packVersion || input?.pack_version || ''),
    jurisdiction_sources: makeDefaultJurisdictions(),
    domains: [],
    authorities: {},
  } as StatePackV1;
}
