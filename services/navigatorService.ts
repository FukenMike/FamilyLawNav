import { getAuthorityPackProvider } from "@/config/runtime";
import type { NavigatorOutput, IntakeAnswer, DetectedIssue } from "@/core/navigator/types";
import type { StatePack } from "@/services/packStore";

interface RunNavigatorParams {
  state: string;
  domainId: string;
  answers: IntakeAnswer[];
}

export async function runNavigator({ state, domainId, answers }: RunNavigatorParams): Promise<NavigatorOutput> {
  const authorityPackProvider = getAuthorityPackProvider();
  const pack: StatePack | null = await authorityPackProvider.getStatePack(state);
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

  // Pack-driven detection: if pack provides questions/rules, use them; otherwise, fallback to simple logic
  let detectedIssues: DetectedIssue[] = [];
  if (pack && pack.issues && pack.issues.length > 0) {
    // Example: flag first issue if any boolean answer is true (baseline logic)
    const boolAnswers = answers.filter(a => typeof a.value === "boolean" && a.value === true);
    if (boolAnswers.length > 0) {
      detectedIssues.push({
        issueId: pack.issues[0].id,
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
    authoritiesByIssue[issue.issueId] = pack.authoritiesByIssue[issue.issueId] || [];
    testsByIssue[issue.issueId] = pack.legalTests.filter((t: any) => t.issueId === issue.issueId);
    trapsByIssue[issue.issueId] = pack.traps.filter((t: any) => t.issueId === issue.issueId);
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
