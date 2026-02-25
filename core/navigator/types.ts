export interface Domain {
  id: string;
  label: string;
}

export interface Issue {
  id: string;
  domainId: string;
  label: string;
  description?: string;
}

export interface LegalTest {
  id: string;
  issueId: string;
  label: string;
  burdenOfProof?: string;
  standardOfReview?: string;
  description?: string;
}

export interface TestItem {
  id: string;
  testId: string;
  label: string;
  required: boolean;
  notes?: string;
}

export interface ResearchTarget {
  label: string;
  url: string;
  keywords: string[];
  notes?: string;
}

export interface IssueReasoning {
  why: string;
  rulePath: string[];
  nextSteps: string[];
  researchTargets: ResearchTarget[];
}

export type IntakeQuestionType = "boolean" | "single" | "multi" | "text";

export interface IntakeQuestion {
  id: string;
  domainId: string;
  prompt: string;
  type: IntakeQuestionType;
  options?: string[];
}

export interface IntakeAnswer {
  questionId: string;
  value: any;
}

export interface DetectedIssue {
  issueId: string;
  confidence: number; // 0-1
  reasons: string[];
}

export interface IssueAuthorityLink {
  issueId: string;
  authorityCitation: string;
  note?: string;
  rankOverride?: string;
}

export type ProceduralTrapSeverity = "low" | "med" | "high";

export interface ProceduralTrap {
  id: string;
  issueId: string;
  label: string;
  description: string;
  severity: ProceduralTrapSeverity;
}

export interface NavigatorOutput {
  state: string;
  domainId: string;
  detectedIssues: DetectedIssue[];
  authoritiesByIssue: Record<string, string[]>;
  testsByIssue: Record<string, LegalTest[]>;
  trapsByIssue: Record<string, ProceduralTrap[]>;
  lastUpdated?: string;
  gaps?: string[];
  reasoningByIssue?: Record<string, IssueReasoning>;
  researchSeeds?: {
    official_code?: string;
    judiciary_rules?: string;
    judiciary_forms?: string;
    opinions_search?: string;
    legal_aid_portal?: string;
  };
}
