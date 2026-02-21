#!/usr/bin/env node
const { writeFileSync, mkdirSync } = require('fs');
const { join } = require('path');

const OUT_DIR = join(process.cwd(), 'public', 'packs');
mkdirSync(OUT_DIR, { recursive: true });

const schemaVersion = '1';
const packVersion = new Date().toISOString().slice(0,10).replace(/-/g, '.');
const generatedAt = new Date().toISOString();

// import national shell definitions
const shell = require('../data/nationalShell');

const domains = shell.NATIONAL_DOMAINS; // array of {id,label,description}

const states = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
];

const manifest = { schemaVersion, packs: {} };

for (const st of states) {
  const pack = {
    quality: 'baseline',
    schemaVersion,
    state: st,
    packVersion,
    domains,
    issues: shell.NATIONAL_ISSUES,
    intakeQuestions: shell.NATIONAL_INTAKE,
    tests: shell.NATIONAL_TESTS,
    testItems: shell.NATIONAL_TESTS.map(t => ({ id: t.id, issueId: t.issueId, label: t.label })),
    authorities: {},
    issueAuthorities: [],
    proceduralTraps: [],
    gaps: shell.NATIONAL_ISSUES.map(i => ({ domainId: i.domainId, issueId: i.id, message: 'Authorities not populated yet' })),
    metadata: { level: 'baseline', generatedAt }
  };
  const path = join(OUT_DIR, `${st}.json`);
  let shouldWrite = true;
  if (st === 'GA' && require('fs').existsSync(path)) {
    try {
      const existing = JSON.parse(require('fs').readFileSync(path, 'utf8'));
      if (existing.quality && existing.quality !== 'baseline') {
        // curated GA exists, do not overwrite
        shouldWrite = false;
      }
    } catch {}
  }
  if (shouldWrite) {
    writeFileSync(path, JSON.stringify(pack, null, 2));
  }
  manifest.packs[st] = { packVersion };
}

writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('Generated baseline packs for', states.length, 'states.');
