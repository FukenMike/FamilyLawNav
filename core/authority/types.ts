export type AuthorityKind = "statute" | "rule" | "case";
export type AuthorityRank = "binding" | "persuasive" | "secondary";

export interface Authority {
  id: string;
  kind: AuthorityKind;
  citation: string;
  title: string;
  jurisdictionState: string;
  courtScope?: string;
  rank: AuthorityRank;
  createdAt?: string;
}

export interface AuthoritySource {
  authorityId: string;
  url: string;
  sourceType: string;
  isOfficial?: boolean;
}

export interface AuthorityVersion {
  authorityId: string;
  versionId: string;
  effectiveStart?: string;
  effectiveEnd?: string;
  retrievedAt: string;
  text: string;
  textHash: string;
}

export interface VerificationEvent {
  id: string;
  authorityId: string;
  verifiedAt: string;
  result: "ok" | "changed" | "broken_link";
  notes?: string;
  sourceUrl?: string;
}
