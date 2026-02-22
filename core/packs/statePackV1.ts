// core/packs/statePackV1.ts
// Canonical state pack schema (version 1) used at runtime by the app.

export interface AuthorityV1 {
  kind: "statute" | "case" | "court_rule" | "form" | "guide";
  title: string;
  rank?: string;
  courtScope?: string;
  source_url?: string;
  retrieved_at?: string;
  effective_date?: string;
  notes?: string;
  needs_verification?: boolean;
}

export interface TrapV1 {
  id: string;
  label: string;
  description?: string;
  severity?: "low" | "med" | "high";
}

export interface LegalTestV1 {
  id: string;
  label: string;
  description?: string;
}

export interface IssueV1 {
  id: string;
  label: string;
  summary?: string;
  authorities: string[];
  legal_tests: LegalTestV1[];
  procedural_traps: TrapV1[];
  forms_and_guides: string[];
  notes?: string;
  needs_verification?: boolean;
}

export interface DomainV1 {
  id: string;
  label: string;
  status: "implemented" | "partial" | "empty";
  issues: IssueV1[];
}

export interface StatePackV1 {
  state: string;
  schemaVersion: "1";
  packVersion: string;
  jurisdiction_sources: {
    official_code: string;
    judiciary_rules: string;
    judiciary_forms: string;
    opinions_search: string;
    legal_aid_portal: string;
  };
  domains: DomainV1[];
  authorities: Record<string, AuthorityV1>;
  [key: string]: any;
}
