/* eslint-env node */
const path = require('path');
// no TypeScript loader or runtime dependency on data/statePacks.  sources/*
// are the authoritative ingestion mechanism.
// allowed family-law domains
const ALLOWED_DOMAINS = new Set([
  'divorce',
  'property_division',
  'alimony',
  'custody',
  'visitation',
  'relocation',
  'support',
  'modification',
  'paternity',
  'guardianship',
  'adoption',
  'dependency',
  'termination_of_parental_rights',
  'protection_orders',
  'jurisdiction',
  'procedure',
  'service_notice',
  'evidence',
  'discovery',
  'motions',
  'appeals',
  'enforcement',
  'contempt',
]);

function makeDefaultJurisdictions() {
  return {
    official_code: "",
    judiciary_rules: "",
    judiciary_forms: "",
    opinions_search: "",
    legal_aid_portal: "",
  };
}


// slug helper for deterministic ids
function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function deriveAuthId(state, entry) {
  if (entry.id) return entry.id;
  const base = [state, entry.kind || 'auth', entry.citation || entry.title || ''].join('-');
  return slugify(base);
}

function loadSource(state) {
  const fname = path.join(__dirname, '../../data/statePacks', state.toLowerCase() + '.ts');
  try {
    // Use ts-node to require TypeScript files
    require('ts-node').register();
    return require(fname);
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      console.log(`⚠️  baseline pack for ${state} not found (${fname}), skipping`);
      return null;
    }
    throw e;
  }
}

function checkAllowedDomain(id, state) {
  if (!ALLOWED_DOMAINS.has(id)) {
    throw new Error(`Invalid domain id '${id}' in ${state}: allowed=${Array.from(ALLOWED_DOMAINS).join(',')}`);
  }
}

function buildPackForState(state) {
  const src = loadSource(state);
  const packVersion = new Date().toISOString();
  const authorities = {};
  const domainsMap = {};
  const authoritiesByIssue = {};

  if (src) {
    // validate declared domains/issues
    if (Array.isArray(src.domains)) {
      src.domains.forEach((d) => {
        if (d && d.id) checkAllowedDomain(d.id, state);
      });
    }
    if (Array.isArray(src.issues)) {
      src.issues.forEach((i) => {
        if (i && i.domainId) checkAllowedDomain(i.domainId, state);
      });
    }

    const authList = Array.isArray(src.authorities) ? src.authorities : [];
    authList.forEach((srcEntry) => {
      const id = deriveAuthId(state, srcEntry);
      const kind = srcEntry.kind || 'statute';
      authorities[id] = {
        kind,
        title: srcEntry.title || '',
        source_url: srcEntry.source_url || '',
        notes: srcEntry.short_summary || srcEntry.notes || '',
      };

      const relevantDomains = Array.isArray(srcEntry.domains) && srcEntry.domains.length ? srcEntry.domains : ['general'];
      relevantDomains.forEach((d) => {
        if (d) checkAllowedDomain(d, state);
      });
      const relevantIssues = Array.isArray(srcEntry.issues) && srcEntry.issues.length ? srcEntry.issues : [];

      relevantIssues.forEach((issueId) => {
        if (!authoritiesByIssue[issueId]) authoritiesByIssue[issueId] = [];
        if (!authoritiesByIssue[issueId].includes(id)) authoritiesByIssue[issueId].push(id);

        const domainId = relevantDomains[0] || 'general';
        if (!domainsMap[domainId]) {
          domainsMap[domainId] = {
            id: domainId,
            label: domainId,
            status: 'partial',
            issues: {},
          };
        }
        const domain = domainsMap[domainId];
        if (!domain.issues[issueId]) {
          domain.issues[issueId] = {
            id: issueId,
            label: issueId,
            summary: '',
            authorities: [],
            legal_tests: [],
            procedural_traps: [],
            forms_and_guides: [],
            notes: '',
            needs_verification: false,
          };
        }
        if (!domain.issues[issueId].authorities.includes(id)) {
          domain.issues[issueId].authorities.push(id);
        }
      });
    });

    // merge any declared domains from src
    if (Array.isArray(src.domains)) {
      src.domains.forEach((d) => {
        const did = d.id || d.label || 'unknown';
        if (!domainsMap[did]) {
          domainsMap[did] = {
            id: did,
            label: d.label || did,
            status: d.status || 'empty',
            issues: {},
          };
        }
        const mapDom = domainsMap[did];
        (Array.isArray(d.issues) ? d.issues : []).forEach((i) => {
          const iid = i.id || i.label || 'unknown';
          if (!mapDom.issues[iid]) {
            mapDom.issues[iid] = {
              id: iid,
              label: i.label || iid,
              summary: i.summary || '',
              authorities: Array.isArray(i.authorities) ? [...i.authorities] : [],
              legal_tests: Array.isArray(i.legal_tests) ? [...i.legal_tests] : [],
              procedural_traps: Array.isArray(i.procedural_traps) ? [...i.procedural_traps] : [],
              forms_and_guides: Array.isArray(i.forms_and_guides) ? [...i.forms_and_guides] : [],
              notes: i.notes || '',
              needs_verification: !!i.needs_verification,
            };
          }
        });
      });
    }

    // optional issues list
    if (Array.isArray(src.issues)) {
      const domainId = 'general';
      if (!domainsMap[domainId]) {
        domainsMap[domainId] = { id: domainId, label: domainId, status: 'partial', issues: {} };
      }
      const genDom = domainsMap[domainId];
      src.issues.forEach((i) => {
        const iid = i.id || i.label || 'unknown';
        if (!genDom.issues[iid]) {
          genDom.issues[iid] = {
            id: iid,
            label: i.label || iid,
            summary: i.summary || '',
            authorities: Array.isArray(i.authorities) ? [...i.authorities] : [],
            legal_tests: [],
            procedural_traps: [],
            forms_and_guides: [],
            notes: i.notes || '',
            needs_verification: !!i.needs_verification,
          };
        }
      });
    }
  }

  const domains = Object.values(domainsMap).map((d) => ({
    id: d.id,
    label: d.label,
    status: d.status,
    issues: Object.values(d.issues),
  }));

  const pack = {
    state,
    schemaVersion: '1',
    packVersion,
    jurisdiction_sources: makeDefaultJurisdictions(),
    domains,
    authorities,
  };

  if (src) {
    const seeds = src.jurisdiction_sources || src.jurisdictions_sources || {};
    pack.jurisdiction_sources.official_code = seeds.official_code || seeds.code || '';
    pack.jurisdiction_sources.judiciary_rules = seeds.judiciary_rules || seeds.rules || '';
    pack.jurisdiction_sources.judiciary_forms = seeds.judiciary_forms || seeds.forms || '';
    pack.jurisdiction_sources.opinions_search = seeds.opinions_search || seeds.opinions || '';
    if (src.authoritiesByIssue) pack.authoritiesByIssue = src.authoritiesByIssue;
    if (src.issues) pack.issues = src.issues;
    if (Array.isArray(src.legalTests)) pack.legalTests = src.legalTests;
    if (Array.isArray(src.testItems)) pack.testItems = src.testItems;
    if (Array.isArray(src.traps)) pack.traps = src.traps;
  }

  return pack;
}

function validatePack(p) {
  if (!p || typeof p !== 'object')
    return { ok: false, error: 'pack not object' };

  if (typeof p.schemaVersion !== 'string')
    return { ok: false, error: 'schemaVersion missing or not string' };
  if (p.quality && typeof p.quality !== 'string')
    return { ok: false, error: 'quality invalid' };

  if (typeof p.state !== 'string')
    return { ok: false, error: 'state missing or not string' };
  if (typeof p.packVersion !== 'string')
    return { ok: false, error: 'packVersion missing or not string' };

  if (!p.jurisdiction_sources || typeof p.jurisdiction_sources !== 'object') {
    return { ok: false, error: 'jurisdiction_sources missing or not object' };
  }
  const j = p.jurisdiction_sources;
  if (typeof j.official_code !== 'string')
    return { ok: false, error: 'jurisdiction_sources.official_code missing or not string' };
  if (typeof j.judiciary_rules !== 'string')
    return { ok: false, error: 'jurisdiction_sources.judiciary_rules missing or not string' };
  if (typeof j.opinions_search !== 'string')
    return { ok: false, error: 'jurisdiction_sources.opinions_search missing or not string' };

  if (!Array.isArray(p.domains))
    return { ok: false, error: 'domains not array' };
  if (!p.authorities || typeof p.authorities !== 'object')
    return { ok: false, error: 'authorities missing or not object' };

  return { ok: true };
}

module.exports = { buildPackForState, validatePack };
