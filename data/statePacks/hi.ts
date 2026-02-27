import type { StatePack } from "@/services/packStore";
import { Domain, Issue, LegalTest, TestItem, ProceduralTrap } from "@/core/navigator/types";

export const state = "HI";

export const domains: Domain[] = [
  { id: "custody", label: "Custody" },
  { id: "support", label: "Support" },
  { id: "dependency", label: "Dependency" },
];

export const issues: Issue[] = [
  { id: "custody_initial", domainId: "custody", label: "Initial Custody Determination" },
  { id: "custody_modification", domainId: "custody", label: "Custody Modification" },
  { id: "emergency_custody", domainId: "custody", label: "Emergency Custody" },
];

export const authoritiesByIssue: Record<string, string[]> = {
  custody_initial: ["Statute 1", "Case 1"],
  custody_modification: ["Statute 1", "Case 2"],
  emergency_custody: ["Statute 2"],
};

export const legalTests: LegalTest[] = [
  {
    id: "test_custody_initial",
    issueId: "custody_initial",
    label: "Best Interest of the Child",
    description: "Court considers all relevant factors to determine best interest.",
  },
  {
    id: "test_custody_modification",
    issueId: "custody_modification",
    label: "Material Change in Circumstances",
    description: "Parent seeking modification must show material change.",
  },
  {
    id: "test_emergency_custody",
    issueId: "emergency_custody",
    label: "Immediate Harm",
    description: "Immediate risk of harm to child justifies emergency action.",
  },
];

export const testItems: TestItem[] = [
  { id: "item1", testId: "test_custody_initial", label: "Child's wishes considered", required: false },
  { id: "item2", testId: "test_custody_initial", label: "Parental fitness", required: true },
  { id: "item3", testId: "test_custody_initial", label: "History of abuse", required: true },
  { id: "item4", testId: "test_custody_modification", label: "Material change proven", required: true },
  { id: "item5", testId: "test_custody_modification", label: "Change affects child welfare", required: true },
  { id: "item6", testId: "test_emergency_custody", label: "Evidence of immediate harm", required: true },
];

export const traps: ProceduralTrap[] = [
  { id: "trap1", issueId: "custody_initial", label: "Notice/Hearing Timing", description: "Proper notice and hearing required.", severity: "med" },
  { id: "trap2", issueId: "custody_modification", label: "Venue/Jurisdiction", description: "Correct court must be used.", severity: "high" },
  { id: "trap3", issueId: "emergency_custody", label: "Service Requirements", description: "All parties must be served.", severity: "high" },
];

export const authorities: Record<string, {
  kind: "statute" | "case";
  title?: string;
  rank?: "binding" | "persuasive" | "secondary";
  courtScope?: string;
  sources?: string[];
}> = {
  "Statute 1": {
    kind: "statute",
    title: "Sample Statute 1",
    rank: "binding",
    sources: ["https://example.com/statute1"]
  },
  "Statute 2": {
    kind: "statute",
    title: "Sample Statute 2",
    rank: "binding",
    sources: ["https://example.com/statute2"]
  },
  "Case 1": {
    kind: "case",
    title: "Sample Case 1",
    rank: "binding",
    courtScope: "Supreme Court",
    sources: ["https://example.com/case1"]
  },
  "Case 2": {
    kind: "case",
    title: "Sample Case 2",
    rank: "binding",
    courtScope: "Supreme Court",
    sources: ["https://example.com/case2"]
  },
};

export const xxPack: StatePack = {
  state,
  schemaVersion: "1",
  packVersion: 'seed-HI-2026-02-27',
  jurisdictions_sources: {
    code: 'https://example.com/code',
    rules: '',
    opinions: '',
  },
  domains,
  issues,
  authoritiesByIssue,
  authorities,
  legalTests,
  testItems,
  traps,
};
