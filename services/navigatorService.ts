import type { NavigatorOutput, IntakeAnswer, DetectedIssue, ResearchTarget } from "@/core/navigator/types";
import type { StatePackV1 } from "@/core/packs/statePackV1";

interface RunNavigatorWithPackParams {
  pack: StatePackV1;
  domainId: string;
  answers: IntakeAnswer[];
}

export async function runNavigatorWithPack({ pack, domainId, answers }: RunNavigatorWithPackParams): Promise<NavigatorOutput> {
  if (!pack) {
    return {
      state: '',
      domainId,
      detectedIssues: [],
      authoritiesByIssue: {},
      testsByIssue: {},
      trapsByIssue: {},
      lastUpdated: new Date().toISOString(),
      gaps: [`No authority pack provided`],
    };
  }

  // flatten all issues across domains for convenience
  const allIssues: any[] = Array.isArray(pack.domains)
    ? pack.domains.flatMap(d => Array.isArray(d.issues) ? d.issues : [])
    : [];

  // normalize research seeds from pack.jurisdiction_sources
  let researchSeeds: NavigatorOutput['researchSeeds'] | undefined;
  if (pack.jurisdiction_sources && typeof pack.jurisdiction_sources === 'object') {
    const js: Record<string,string> = pack.jurisdiction_sources as any;
    const tmp: any = {};
    if (js.official_code || js.code) tmp.official_code = js.official_code ?? js.code;
    if (js.judiciary_rules || js.rules) tmp.judiciary_rules = js.judiciary_rules ?? js.rules;
    if (js.judiciary_forms || js.forms) tmp.judiciary_forms = js.judiciary_forms ?? js.forms;
    if (js.opinions_search || js.opinions) tmp.opinions_search = js.opinions_search ?? js.opinions;
    if (Object.keys(tmp).length) researchSeeds = tmp;
  }

  // scoring buckets
  const keywordBuckets: Record<string,string[]> = {
    custody: [
      'custody','visitation','parenting','schedule','best interest','relocate','relocation','emergency','ex parte','modify','modification','contempt',
    ],
    support: [
      'child support','guidelines','income','arrears','deviation','modify','modification','contempt','enforcement',
    ],
    dependency: [
      'dependency','dhr','cps','shelter','shelter care','reasonable efforts','isp','permanency','tpr','termination',
    ],
    procedure: [
      'service','notice','motion','hearing','appeal','discovery','evidence',
    ],
  };

  // compile answer text
  const answerText = answers.map(a => String(a.value).toLowerCase()).join(' ');

  // detect emergency/relocate/modify signals
  const hasEmergency = answerText.includes('emergency') || answerText.includes('immediate danger');
  const hasRelocate = answerText.includes('relocate') || answerText.includes('relocation');
  const hasModify = answerText.includes('modify') || answerText.includes('modification') || answerText.includes('change');

  // consider only issues in the requested domain
  const domainIssues = allIssues.filter(i => i.domainId === domainId);

  interface ScoreEntry { issue: any; score: number; reasons: string[]; }
  const scored: ScoreEntry[] = [];

  domainIssues.forEach(issue => {
    let score = 0;
    const reasons: string[] = [];

    // keyword matches in answers
    Object.values(keywordBuckets).flat().forEach(k => {
      if (answerText.includes(k)) {
        score += 1;
        reasons.push(`answer contains '${k}'`);
      }
    });
    // keyword matches in issue id/label
    const iid = String(issue.id).toLowerCase();
    const ilab = String(issue.label || '').toLowerCase();
    Object.values(keywordBuckets).flat().forEach(k => {
      if (iid.includes(k) || ilab.includes(k)) {
        score += 0.5;
        reasons.push(`issue metadata contains '${k}'`);
      }
    });

    // special boosts
    if (hasEmergency && (iid.includes('emergency') || ilab.includes('emergency'))) {
      score += 5;
      reasons.push('emergency signal matched');
    }
    if (hasRelocate && (iid.includes('relocate') || ilab.includes('relocate'))) {
      score += 4;
      reasons.push('relocation signal matched');
    }
    if (hasModify && (iid.includes('modify') || ilab.includes('modify') || ilab.includes('modification'))) {
      score += 3;
      reasons.push('modification signal matched');
    }

    scored.push({ issue, score, reasons });
  });

  // sort by descending score
  scored.sort((a,b)=>b.score - a.score);

  // choose top two; if all zero, fallback to first two with minimal confidence
  let selected: ScoreEntry[] = [];
  if (scored.length === 0) {
    selected = [];
  } else if (scored[0].score === 0) {
    selected = scored.slice(0,2);
  } else {
    selected = scored.slice(0,2);
  }

  const detectedIssues: DetectedIssue[] = selected.map(s => {
    let confidence = s.score > 0 ? Math.min(1, s.score / 5) : 0.1;
    if (confidence === 0) confidence = 0.1;
    return {
      issueId: s.issue.id,
      confidence,
      reasons: s.reasons.length ? s.reasons : ['no signals, default selection'],
    };
  });

  // prepare output containers
  const authoritiesByIssue: Record<string,string[]> = {};
  const testsByIssue: Record<string, any[]> = {};
  const trapsByIssue: Record<string, any[]> = {};
  const reasoningByIssue: Record<string, any> = {};

  detectedIssues.forEach(det => {
    const issue = domainIssues.find(i => i.id === det.issueId) || {};
    const auths: string[] = (pack.authoritiesByIssue && pack.authoritiesByIssue[det.issueId]) || [];
    const tests = Array.isArray(issue.legal_tests) ? issue.legal_tests : [];
    const traps = Array.isArray(issue.procedural_traps) ? issue.procedural_traps : [];

    authoritiesByIssue[det.issueId] = auths;
    testsByIssue[det.issueId] = tests;
    trapsByIssue[det.issueId] = traps;

    const whyText = `${issue.label || det.issueId}`;

    const rulePath = [
      `Domain: ${domainId}`,
      `Issue: ${det.issueId}`,
      `Tests: ${tests.length}`,
      `Traps: ${traps.length}`,
      `Authorities: ${auths.length}`,
    ];

    const nextSteps: string[] = [];
    nextSteps.push('Read the top authorities and save the ones you’ll cite.');
    if (traps.length) {
      const trapLabels = traps.map((t:any)=>t.label).slice(0,2);
      nextSteps.push(`Watch for procedural traps (${trapLabels.join(', ')}).`);
    }
    if (tests.length) {
      nextSteps.push('Gather facts for each factor/test item.');
    }
    if (researchSeeds) {
      nextSteps.push('Verify current text using official code/rules/forms seeds.');
    }

    const researchTargets: ResearchTarget[] = [];
    const categories = [
      { key: 'official_code', label: 'Official code', sourceType: 'official_code' as const },
      { key: 'judiciary_rules', label: 'Court rules', sourceType: 'judiciary_rules' as const },
      { key: 'judiciary_forms', label: 'Forms/Self-help', sourceType: 'judiciary_forms' as const },
      { key: 'opinions_search', label: 'Opinions search', sourceType: 'opinions_search' as const },
    ];
    // gather keywords for this domain/issue
    const bucketKeywords = Object.values(keywordBuckets).flat();
    const issueLabelTokens = String(issue.label || '').toLowerCase().split(/\s+/);

    categories.forEach(cat => {
      const url = researchSeeds ? (researchSeeds as any)[cat.key] : undefined;
      const notes = url ? undefined : 'Missing in pack; add to jurisdiction_sources.';
      researchTargets.push({
        label: cat.label,
        url,
        keywords: [...bucketKeywords, ...issueLabelTokens],
        notes,
        sourceType: cat.sourceType,
      });
    });

    reasoningByIssue[det.issueId] = {
      confidence: det.confidence,
      reasons: det.reasons,
      why: whyText,
      rulePath,
      nextSteps,
      researchTargets,
    };
  });

  const output: NavigatorOutput = {
    state: pack.state,
    domainId,
    detectedIssues,
    authoritiesByIssue,
    testsByIssue,
    trapsByIssue,
    lastUpdated: new Date().toISOString(),
    gaps: [],
    reasoningByIssue,
    researchSeeds,
  };

  return output;
}

