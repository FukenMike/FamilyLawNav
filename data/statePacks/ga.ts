import { Domain, Issue, LegalTest, TestItem, ProceduralTrap } from "@/core/navigator/types";

export const state = "GA";

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
  custody_initial: ["OCGA § 19-9-3", "Smith v. Smith, 300 Ga. 123 (2016)"],
  custody_modification: ["OCGA § 19-9-3", "Jones v. Jones, 299 Ga. 456 (2016)"],
  emergency_custody: ["OCGA § 19-9-1"],
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
  "OCGA § 19-9-3": {
    kind: "statute",
    title: "Georgia Code Title 19, Section 9-3",
    rank: "binding",
    sources: ["https://law.justia.com/codes/georgia/2010/title-19/19-9/19-9-3/"]
  },
  "OCGA § 19-9-1": {
    kind: "statute",
    title: "Georgia Code Title 19, Section 9-1",
    rank: "binding",
    sources: ["https://law.justia.com/codes/georgia/2010/title-19/19-9/19-9-1/"]
  },
  "Smith v. Smith, 300 Ga. 123 (2016)": {
    kind: "case",
    title: "Smith v. Smith, 300 Ga. 123 (2016)",
    rank: "binding",
    courtScope: "Supreme Court of Georgia",
    sources: ["https://casetext.com/case/smith-v-smith-1022"]
  },
  "Jones v. Jones, 299 Ga. 456 (2016)": {
    kind: "case",
    title: "Jones v. Jones, 299 Ga. 456 (2016)",
    rank: "binding",
    courtScope: "Supreme Court of Georgia",
    sources: ["https://casetext.com/case/jones-v-jones-102"]
  },
};

export const gaPack = {
  state,
  schemaVersion: "1",
  packVersion: 'seed-ga-2026-02-20',
  jurisdictions_sources: {
    code: 'https://law.justia.com/codes/georgia/',
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

export type StatePack = typeof gaPack;
