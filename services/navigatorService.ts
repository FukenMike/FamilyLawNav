import type { NavigatorOutput, IntakeAnswer, DetectedIssue } from "@/core/navigator/types";
import type { StatePackV1 } from "@/core/packs/statePackV1";

interface RunNavigatorWithPackParams {
  pack: StatePackV1;
  domainId: string;
  answers: IntakeAnswer[];
}

export async function runNavigatorWithPack({ pack, domainId, answers }: RunNavigatorWithPackParams): Promise<NavigatorOutput> {
  // same logic as previous runNavigator but using provided pack
  if (!pack) {
    return {
      state: '',
      domainId,
      detectedIssues: [],
      authoritiesByIssue: {},
      testsByIssue: {},
      trapsByIssue: {},
      lastUpdated: new Date().toISOString(),
      gaps: [
        `No authority pack provided`,
      ],
    };
  }

  const allIssues =
    Array.isArray(pack.domains)
      ? pack.domains.flatMap((d: any) => Array.isArray(d.issues) ? d.issues : [])
      : [];

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

  const authoritiesByIssue: Record<string, string[]> = {};
  const testsByIssue: Record<string, any[]> = {};
  const trapsByIssue: Record<string, any[]> = {};
  for (const issue of detectedIssues) {
    const issueObj = allIssues.find((i: any) => i.id === issue.issueId) || {};
    authoritiesByIssue[issue.issueId] = Array.isArray(issueObj.authorities) ? issueObj.authorities : [];
    testsByIssue[issue.issueId] = Array.isArray(issueObj.legal_tests) ? issueObj.legal_tests : [];
    trapsByIssue[issue.issueId] = Array.isArray(issueObj.procedural_traps) ? issueObj.procedural_traps : [];
  }

  return {
    state: pack.state,
    domainId,
    detectedIssues,
    authoritiesByIssue,
    testsByIssue,
    trapsByIssue,
    lastUpdated: new Date().toISOString(),
    gaps: [],
  };
}

