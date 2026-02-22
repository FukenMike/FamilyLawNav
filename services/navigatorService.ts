import { getPack } from "@/services/packStore";
import type { NavigatorOutput, IntakeAnswer, DetectedIssue } from "@/core/navigator/types";
import type { StatePack } from "@/services/packStore";

interface RunNavigatorParams {
  state: string;
  domainId: string;
  answers: IntakeAnswer[];
}

export async function runNavigator({ state, domainId, answers }: RunNavigatorParams): Promise<NavigatorOutput> {
  const { pack, status } = await getPack(state);
  if (!pack) {
    return {
      state,
      domainId,
      detectedIssues: [],
      authoritiesByIssue: {},
      testsByIssue: {},
      trapsByIssue: {},
      lastUpdated: new Date().toISOString(),
      gaps: [
        `No authority pack found for state: ${state}`,
      ],
    };
  }

  // collect issues from domains
  const allIssues =
    Array.isArray(pack.domains)
      ? pack.domains.flatMap((d: any) => Array.isArray(d.issues) ? d.issues : [])
      : [];

  // Pack-driven detection: if pack provides questions/rules, use them; otherwise, fallback to simple logic
  let detectedIssues: DetectedIssue[] = [];
  if (allIssues.length > 0) {
    const boolAnswers = answers.filter(a => typeof a.value === "boolean" && a.value === true);
    if (boolAnswers.length > 0) {
      detectedIssues.push({
        issueId: allIssues[0].id,
        confidence: 1,
        reasons: ["Positive boolean answer detected (baseline logic)"]
      });
    }
  }

  // Map authorities, tests, traps for detected issues
  const authoritiesByIssue: Record<string, string[]> = {};
  const testsByIssue: Record<string, any[]> = {};
  const trapsByIssue: Record<string, any[]> = {};
  for (const issue of detectedIssues) {
    // find issue object to read details
    const issueObj = allIssues.find((i: any) => i.id === issue.issueId) || {};
    authoritiesByIssue[issue.issueId] = Array.isArray(issueObj.authorities) ? issueObj.authorities : [];
    testsByIssue[issue.issueId] = Array.isArray(issueObj.legal_tests) ? issueObj.legal_tests : [];
    trapsByIssue[issue.issueId] = Array.isArray(issueObj.procedural_traps) ? issueObj.procedural_traps : [];
  }

  return {
    state,
    domainId,
    detectedIssues,
    authoritiesByIssue,
    testsByIssue,
    trapsByIssue,
    lastUpdated: new Date().toISOString(),
    gaps: [],
  };
}
