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

  const allIssues: any[] = Array.isArray(pack.domains)
    ? pack.domains.flatMap(d => Array.isArray(d.issues) ? d.issues : [])
    : [];

  const detectedIssues: DetectedIssue[] = [];
  const reasonsMap: Record<string,string[]> = {};

  // helper to score issues by keywords
  const scoreIssue = (issue: any, keyword: string): number => {
    const id = issue.id.toLowerCase();
    return id.includes(keyword) ? 1 : 0;
  };

  // determine scoring from answers
  let emergencyScore = 0, modScore = 0, initScore = 0;
  answers.forEach(a => {
    const q = a.questionId.toLowerCase();
    const v = String(a.value).toLowerCase();
    if (q.includes('q3') || v.includes('emergency')) emergencyScore += 1;
    if (v.includes('material change') || v.includes('modification')) modScore += 1;
    if (v.includes('initial') || v.includes('seeking initial')) initScore += 1;
  });

  // apply detection rules across issues
  allIssues.forEach(issue => {
    let score = 0;
    if (emergencyScore && issue.id.toLowerCase().includes('emergency')) score += emergencyScore * 2;
    if (modScore && issue.id.toLowerCase().includes('modification')) score += modScore * 1.5;
    if (initScore && issue.id.toLowerCase().includes('initial')) score += initScore;
    if (score > 0) {
      detectedIssues.push({ issueId: issue.id, confidence: Math.min(1, score / 3), reasons: [] });
    }
  });

  // sort by confidence and keep top2
  detectedIssues.sort((a,b)=>b.confidence-a.confidence);
  const topIssues = detectedIssues.slice(0,2);

  // prepare output containers
  const authoritiesByIssue: Record<string,string[]> = {};
  const testsByIssue: Record<string, any[]> = {};
  const trapsByIssue: Record<string, any[]> = {};
  const reasoningByIssue: Record<string, any> = {};

  topIssues.forEach(issue => {
    const issueObj = allIssues.find(i=>i.id===issue.issueId) || {};
    const auths = Array.isArray(issueObj.authorities) ? issueObj.authorities : [];
    const tests = Array.isArray(issueObj.legal_tests) ? issueObj.legal_tests : [];
    const traps = Array.isArray(issueObj.procedural_traps) ? issueObj.procedural_traps : [];
    authoritiesByIssue[issue.issueId] = auths;
    testsByIssue[issue.issueId] = tests;
    trapsByIssue[issue.issueId] = traps;

    // reasoning why
    const whyParts: string[] = [];
    whyParts.push(issueObj.label || issue.issueId);
    if (tests.length) whyParts.push(`contains ${tests.length} legal test(s)`);
    if (traps.length) whyParts.push(`contains ${traps.length} procedural trap(s)`);
    if (auths.length) whyParts.push(`has ${auths.length} authorities`);
    const whyText = whyParts.join('; ');

    // rulePath
    const rulePath = [
      `Domain: ${issueObj.domainId||'?'}`,
      `Issue: ${issue.issueId}`,
      `Tests: ${tests.length}`,
      `Traps: ${traps.length}`,
      `Authorities: ${auths.length}`,
    ];

    // nextSteps
    const nextSteps: string[] = [];
    if (tests.length) nextSteps.push('collect facts for test items / factors');
    if (traps.length) nextSteps.push('avoid service/notice/venue issues');
    if (auths.length) nextSteps.push('open and cite authorities');

    // research targets
    const researchTargets: ResearchTarget[] = [];
    const src = pack.jurisdiction_sources || {} as Record<string,string>;
    const fields: Array<keyof typeof src> = ['official_code','judiciary_rules','judiciary_forms','opinions_search','legal_aid_portal'];
    fields.forEach(field=>{
      if (src[field]) {
        researchTargets.push({ label: field, url: src[field], keywords: [], notes: '' });
      } else {
        researchTargets.push({ label: field, url: '', keywords: [], notes: 'missing in pack' });
      }
    });
    // domain-specific keywords
    const domainKeywords: Record<string,string[]> = {
      custody:['custody','visitation','parenting plan','best interest','modification','relocation','emergency'],
      support:['child support','guidelines','income','deviation','arrears','contempt','modification'],
      dependency:['dependency','juvenile court','shelter care','reasonable efforts','case plan','TPR','termination of parental rights'],
    };
    const kws = domainKeywords[issueObj.domainId]||[];
    researchTargets.forEach((rt)=> { rt.keywords = kws; });

    reasoningByIssue[issue.issueId] = {
      why: whyText,
      rulePath,
      nextSteps,
      researchTargets,
    };
  });

  const output: NavigatorOutput = {
    state: pack.state,
    domainId,
    detectedIssues: topIssues,
    authoritiesByIssue,
    testsByIssue,
    trapsByIssue,
    lastUpdated: new Date().toISOString(),
    gaps: [],
    reasoningByIssue,
    researchSeeds: pack.jurisdiction_sources || {},
  };
  return output;
}

