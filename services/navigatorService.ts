import { authorityPackProvider } from "@/config/runtime";
import type { NavigatorOutput, IntakeAnswer, DetectedIssue } from "@/core/navigator/types";
import type { StatePack } from "@/data/statePacks/ga";

interface RunNavigatorParams {
  state: string;
  domainId: string;
  answers: IntakeAnswer[];
}

export async function runNavigator({ state, domainId, answers }: RunNavigatorParams): Promise<NavigatorOutput> {
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

  // Simple rule-based detection for GA seed pack
  const detectedIssues: DetectedIssue[] = [];
  if (state.toUpperCase() === "GA" && domainId === "custody") {
    // Example: if any answer is true, flag the first issue
    const boolAnswers = answers.filter(a => typeof a.value === "boolean" && a.value === true);
    if (boolAnswers.length > 0) {
      detectedIssues.push({
        issueId: "custody_initial",
        confidence: 1,
        reasons: ["Positive boolean answer detected (seed logic)"]
      });
    }
  }

  // Map authorities, tests, traps for detected issues
  const authoritiesByIssue: Record<string, string[]> = {};
  const testsByIssue: Record<string, any[]> = {};
  const trapsByIssue: Record<string, any[]> = {};
  for (const issue of detectedIssues) {
    authoritiesByIssue[issue.issueId] = pack.authoritiesByIssue[issue.issueId] || [];
    testsByIssue[issue.issueId] = pack.legalTests.filter(t => t.issueId === issue.issueId);
    trapsByIssue[issue.issueId] = pack.traps.filter(t => t.issueId === issue.issueId);
  }

  return {
    state,
    domainId,
    detectedIssues,
    authoritiesByIssue,
    testsByIssue,
    trapsByIssue,
    lastUpdated: new Date().toISOString(),
  };
}
