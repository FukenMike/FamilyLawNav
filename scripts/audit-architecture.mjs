#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

// simple helper to read all files recursively
function walk(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const fp = path.join(dir, f);
    const stat = fs.statSync(fp);
    if (stat.isDirectory()) {
      // skip node_modules and .git and docs maybe
      if (f === 'node_modules' || f === '.git' || f === 'docs') continue;
      walk(fp, filelist);
    } else if (/\.(js|mjs|ts|tsx)$/.test(f)) {
      filelist.push(fp);
    }
  }
  return filelist;
}

// read file content mapping
const files = walk(process.cwd());
const fileContents = {};
for (const f of files) {
  try {
    fileContents[f] = fs.readFileSync(f, 'utf8');
  } catch {
    fileContents[f] = '';
  }
}

// build import graph (relative imports, also require)
const importGraph = {};
for (const [f, content] of Object.entries(fileContents)) {
  const imports = new Set();
  const reESM = /import\s+(?:[^'";]+)\s+from\s+['"]([^'"\n]+)['"]/g;
  const reCJS = /require\(['"]([^'"\n]+)['"]\)/g;
  let m;
  const processRel = rel => {
    if (!rel.startsWith('.')) return;
    const dir = path.dirname(f);
    const candidates = [rel, rel + '.ts', rel + '.tsx', rel + '.js', rel + '.mjs', rel + '/index.ts', rel + '/index.tsx', rel + '/index.js', rel + '/index.mjs'];
    for (const c of candidates) {
      const abs = path.resolve(dir, c);
      if (fs.existsSync(abs)) { imports.add(abs); return; }
    }
    imports.add(rel);
  };
  while ((m = reESM.exec(content))) {
    processRel(m[1]);
  }
  while ((m = reCJS.exec(content))) {
    processRel(m[1]);
  }
  importGraph[f] = Array.from(imports).sort();
}

// route tree from /app
function buildRouteTree(dir) {
  const entries = fs.readdirSync(dir);
  const tree = {};
  for (const e of entries) {
    const fp = path.join(dir, e);
    const stat = fs.statSync(fp);
    if (stat.isDirectory()) {
      tree[e + '/'] = buildRouteTree(fp);
    } else {
      tree[e] = null;
    }
  }
  return tree;
}

const routeTree = buildRouteTree(path.join(process.cwd(), 'app'));

// utility to search in files for pattern
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function search(pattern, opts = {}) {
  // opts.within = absolute prefix to restrict files
  const results = [];
  let regex;
  if (pattern instanceof RegExp) {
    regex = new RegExp(pattern.source, pattern.flags.replace(/g/, ''));
  } else {
    regex = new RegExp(escapeRegExp(pattern));
  }
  const keys = Object.keys(fileContents).sort();
  for (const f of keys) {
    if (opts.within && !f.startsWith(opts.within)) continue;
    const content = fileContents[f];
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (regex.test(line)) {
        results.push({file:f,line:idx+1,text:line.trim()});
      }
    });
  }
  return results.sort((a,b)=> a.file.localeCompare(b.file) || a.line - b.line);
}

// build export index for symbols
const exportsIndex = {};
const exportRe = /export\s+(?:function|const|class)\s+([A-Za-z0-9_]+)/g;
const exportListRe = /export\s*{([^}]+)}/g;
for (const [f, content] of Object.entries(fileContents)) {
  let m;
  while ((m = exportRe.exec(content))) {
    const name = m[1];
    exportsIndex[name] = exportsIndex[name] || new Set();
    exportsIndex[name].add(f);
  }
  while ((m = exportListRe.exec(content))) {
    const names = m[1].split(',').map(s=>s.trim().split(' as ')[0]);
    names.forEach(n=>{
      exportsIndex[n] = exportsIndex[n] || new Set();
      exportsIndex[n].add(f);
    });
  }
}

// compute reachable files from app/ and store/ roots
const entryRoots = files.filter(f => f.startsWith(path.join(process.cwd(),'app')) || f.startsWith(path.join(process.cwd(),'services')));
const reachable = new Set();
const queue = [...entryRoots];
while (queue.length) {
  const cur = queue.shift();
  if (reachable.has(cur)) continue;
  reachable.add(cur);
  const deps = importGraph[cur] || [];
  deps.forEach(d => {
    if (typeof d === 'string' && d.startsWith(process.cwd())) {
      queue.push(d);
    }
  });
}

// build call-like index for tracked symbols
const callIndex = {};
const tracked = ['getPack','getManifest','adaptPackToV1','runNavigator','decodeAuthorityId','encodeAuthorityId','validateStatePack','validateStatePackV1','fetch','AsyncStorage','localStorage','aiService','crawlerService'];
for (const sym of tracked) callIndex[sym] = [];
for (const [f, content] of Object.entries(fileContents)) {
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    tracked.forEach(sym => {
      const re = new RegExp('\\b'+sym+'\\s*\\(');
      if (re.test(line)) {
        callIndex[sym].push({file:f,line:idx+1,text:line.trim()});
      }
    });
  });
}

let out = '';

out += '# Architecture Audit Report\n\n';

out += '## A. App Entry + Navigation\n\n';
out += '**Route tree under `app/`:**\n\n';
function printTree(tree, indent = '') {
  for (const key of Object.keys(tree)) {
    out += indent + '- ' + key + '\n';
    if (tree[key]) printTree(tree[key], indent + '  ');
  }
}
printTree(routeTree);

out += '\n';

// for each screen find imports, hooks, call-likes, stores, navigation
const screenFiles = files.filter(f => f.startsWith(path.join(process.cwd(),'app')) && f.endsWith('.tsx')).sort();
for (const f of screenFiles) {
  out += `### Screen: ${path.relative(process.cwd(), f)}\n`;
  const content = fileContents[f];
  // imports sorted
  const imps = [];
  const impRe2 = /import\s+[^'";]+\s+from\s+['"]([^'"\n]+)['"]/g;
  let imi;
  while ((imi = impRe2.exec(content))) { imps.push(imi[1]); }
  imps.sort();
  out += '- imports: ' + imps.join(', ') + '\n';
  // hooks
  const hooks = [];
  ['useState','useEffect','useRouter','useLocalSearchParams'].forEach(h => { if (content.includes(h+'(')) hooks.push(h); });
  out += '- hooks: ' + hooks.join(', ') + '\n';
  // call-like invocations
  const callLikes = [];
  const callRe = /\b([A-Za-z0-9_]+)\s*\(/g;
  let cl;
  while ((cl = callRe.exec(content))) { callLikes.push(cl[1]); }
  const uniqueCalls = Array.from(new Set(callLikes)).sort();
  out += '- call-like invocations: ' + uniqueCalls.join(', ') + '\n';
  // stores
  const storeRe = /use[A-Za-z0-9]+Store\s*\(/g;
  const stores = content.match(storeRe) || [];
  out += '- store hooks: ' + stores.join(', ') + '\n';
  // navigation patterns
  const navUsed = [];
  if (content.includes('router.push')) navUsed.push('router.push');
  if (content.includes('Link ')) navUsed.push('Link');
  out += '- navigation uses: ' + navUsed.join(', ') + '\n';
  out += '\n';
  continue; // skip old code
}

out += '## B. Data Pipelines (call graphs)\n\n';

function makeCallGraph(name, occur) {
  out += `### ${name}\n`;
  occur.forEach(o => {
    out += `- ${o.file}:${o.line} -> ${o.text}\n`;
  });
  out += '\n';
}

// 1) Pack loading pipeline
const packCalls = search(/\bgetPack\s*\(/);
makeCallGraph('Pack loading', packCalls);
const manifestCalls = search(/\bgetManifest\s*\(/);
makeCallGraph('Manifest fetch', manifestCalls);
const adaptCalls = search(/\badaptPackToV1\s*\(/);
makeCallGraph('Adapt to V1', adaptCalls);
const validateCalls = search(/\bvalidate[A-Za-z0-9_]*\s*\(/);
makeCallGraph('Validation calls', validateCalls);
const seedCalls = search('SeedAuthorityPackProvider');
makeCallGraph('Seed pack fallback', seedCalls);

// 2) Navigator run
const navCalls = search(/\brunNavigator\s*\(/);
makeCallGraph('Navigator run calls', navCalls);

// 3) Search flow
const searchCalls = search('searchProvider');
makeCallGraph('Search flow references', searchCalls);

// 4) Resource details
const resCalls = search('decodeAuthorityId');
makeCallGraph('Resource details usage', resCalls);

// 5) Saved flow look for "save" etc
const savedCalls = search(/\bsavePack\b|\bunsave\b/);
makeCallGraph('Saved flow', savedCalls);

// 6) AI summary
const aiCalls = search(/aiService|openai/);
makeCallGraph('AI summary', aiCalls);

// 7) crawler
const crawlCalls = search(/crawl|ingest/);
makeCallGraph('Crawler/ingest', crawlCalls);

// Redundancy detectors
const packInApp = search(/\bgetPack\s*\(/).filter(o=>o.file.includes(path.join('app','')));
const packInSvc = search(/\bgetPack\s*\(/).filter(o=>o.file.includes('services'));
out += `\n## Redundancy Counts\n- getPack in app/: ${packInApp.length}\n- getPack in services/: ${packInSvc.length}\n`;
const manifestInApp = search(/\bgetManifest\s*\(/).filter(o=>o.file.includes(path.join('app','')));
out += `- getManifest in app/: ${manifestInApp.length}\n`;

// Reachability map
const reachableFiles = Array.from(reachable).sort();
out += `\n## Reachability Map\n- total reachable files: ${reachableFiles.length}\n`;
const svcReach = reachableFiles.filter(f=>f.includes(path.join('services','')));
out += `- reachable service files (${svcReach.length}):\n`;
svcReach.slice(0,20).forEach(f=>{ out += `  - ${path.relative(process.cwd(),f)}\n`; });
const allSvc = files.filter(f=>f.includes(path.join('services','')));
const notReach = allSvc.filter(f=>!reachable.has(f));
out += `- unreachable service files (${notReach.length}):\n`;
notReach.forEach(f=>{ out += `  - ${path.relative(process.cwd(),f)}\n`; });

// Network endpoints
const fetchCalls = [];
search(/\bfetch\s*\(/).forEach(o=>{
  const line = fileContents[o.file].split('\n')[o.line-1];
  const m = line.match(/fetch\s*\(\s*['"]([^'"]+)['"]/);
  if (m) fetchCalls.push({file:o.file,line:o.line,url:m[1]});
});
out += '\n## Network Endpoints\n';
fetchCalls.forEach(e=>{ out += `- ${e.url} (${e.file}:${e.line})\n`; });

// C. Implemented vs Not Implemented matrix
out += '## C. Implemented vs Not Implemented Matrix\n\n';

const features = [
  {name:'Pack loading',pattern:/\bgetPack\s*\(/,file:'services/packStore.ts'},
  {name:'Manifest fetch',pattern:/\bgetManifest\s*\(/,file:'services/packStore.ts'},
  {name:'Adapt to V1',pattern:/\badaptPackToV1\s*\(/,file:'services/adaptPackToV1.ts'},
  {name:'Validation',pattern:/\bvalidate[A-Za-z0-9_]*\s*\(/,file:'services/packStore.ts'},
  {name:'Navigator engine',pattern:/\brunNavigator\s*\(/,file:'services/navigatorService.ts'},
  {name:'Search UI',pattern:'searchProvider',file:'services/searchProvider.ts'},
  {name:'Resource details',pattern:'decodeAuthorityId',file:'app/resource/[id].tsx'},
  {name:'Saved items',pattern:/\bsavePack\b|\bunsave\b/,file:'services/packStore.ts'},
  {name:'AI summaries',pattern:/aiService|openai/,file:'services/aiService.ts'}
];

out += '| Feature | Implemented? | Evidence | Notes |\n';
out += '|---|---|---|---|\n';
features.forEach(f => {
  const found = search(f.pattern);
  const reachableFound = found.filter(o=>reachable.has(o.file));
  let impl;
  let evidenceLines = reachableFound.length ? reachableFound : found;
  if (reachableFound.length > 0) impl = 'Yes';
  else if (found.length > 0) impl = 'Partial';
  else impl = 'No';
  const evidence = evidenceLines.slice(0,3).map(o=>`${path.relative(process.cwd(),o.file)}:${o.line}`).join('; ');
  out += `| ${f.name} | ${impl} | ${evidence} | ${impl==='Yes' ? 'reachable' : impl==='Partial' ? 'referenced only' : ''} |
`;
});

// D. Redundancy + conflict report
out += '\n## D. Redundancy + Conflict Report\n\n';
out += '- multiple pack loading points (UI and services both call getPack)\n';
out += '- duplicate schema fields (tests vs testItems, traps vs proceduralTraps)\n';
out += '- validation before adaptation in packStore (validateStatePack)\n';
out += '- provider abstraction now unused\n';

// E. Recommended Single Source of Truth Flow
out += '\n## E. Recommended “Single Source of Truth” Flow\n\n';
out += '1. Use StatePackV1 at runtime exclusively.\n';
out += '2. Adapt and validate inside services/packStore after any fetch or cache read.\n';
out += '3. Cache packs only once (adapted) and share via getPack.\n';
out += '4. UI consumers (navigator, resource) should receive pack object passed from getPack rather than calling again.\n';
out += '5. Manifest fetch should only occur within packStore.\n';
out += '6. Remove legacy imports/dependencies.\n';

// write output
fs.mkdirSync(path.join(process.cwd(),'docs'), { recursive: true });
fs.writeFileSync(path.join(process.cwd(),'docs','ARCH_AUDIT.md'), out);
console.log('Audit complete, output written to docs/ARCH_AUDIT.md');

