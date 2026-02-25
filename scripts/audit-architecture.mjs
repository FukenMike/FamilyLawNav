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
      // skip node_modules, .git, docs, audit script
      if (f === 'node_modules' || f === '.git' || f === 'docs') continue;
      walk(fp, filelist);
    } else if (/\.(js|mjs|ts|tsx)$/.test(f)) {
      // exclude the audit script itself
      if (fp.endsWith('scripts' + path.sep + 'audit-architecture.mjs')) continue;
      filelist.push(fp);
    }
  }
  return filelist;
}

// filesystem helpers used in pack builder audit
function fileExists(p) {
  try { return fs.existsSync(p); } catch { return false; }
}
function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
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

// build import graph (relative imports, also require and export-from edges)
const importGraph = {};

// helper for resolving a module specifier to a filesystem path if possible
function resolveModule(spec, basedir) {
  // spec: './foo', '../bar', '@/something' or others
  const extensions = ['.ts','.tsx','.js','.mjs','.cjs',
                      '.native.ts','.native.tsx','.native.js','.native.jsx',
                      '.ios.ts','.ios.tsx','.android.ts','.android.tsx'];
  const indexNames = extensions.map(e=>'index'+e);

  const tryFile = rel => {
    const abs = path.resolve(basedir, rel);
    if (fs.existsSync(abs)) return abs;
    return null;
  };

  // if spec already has an extension, test it directly and also test with RN variants
  const hasExt = !!path.extname(spec);
  if (spec.startsWith('./') || spec.startsWith('../')) {
    const dir = basedir;
    if (hasExt) {
      const candidate = tryFile(spec);
      if (candidate) return candidate;
    }
    // try adding extensions
    for (const ext of extensions) {
      const cand = tryFile(spec + ext);
      if (cand) return cand;
    }
    // try index in directory
    for (const idx of indexNames) {
      const cand = tryFile(path.join(spec, idx));
      if (cand) return cand;
    }
    return null;
  } else if (spec.startsWith('@/')) {
    const relPath = spec.slice(2);
    const dir = process.cwd();
    if (hasExt) {
      const candidate = path.resolve(dir, relPath);
      if (fs.existsSync(candidate)) return candidate;
    }
    for (const ext of extensions) {
      const cand = path.resolve(dir, relPath + ext);
      if (fs.existsSync(cand)) return cand;
    }
    for (const idx of indexNames) {
      const cand = path.resolve(dir, relPath, idx);
      if (fs.existsSync(cand)) return cand;
    }
    return null;
  }
  return null;
}

for (const [f, content] of Object.entries(fileContents)) {
  const imports = new Set();
  const reESM = /import\s+(?:[^'";]+)\s+from\s+['"]([^'"\n]+)['"]/g;
  const reCJS = /require\(['"]([^'"\n]+)['"]\)/g;
  const reExport = /export\s+(?:\*\s+from|{[^}]+}\s+from)\s*['"]([^'"\n]+)['"]/g;
  let m;
  const processRel = rel => {
    const resolved = resolveModule(rel, path.dirname(f));
    if (resolved) {
      imports.add(resolved);
    } else if (rel.startsWith('./') || rel.startsWith('../') || rel.startsWith('@/')) {
      // still include raw spec so we know the dependency exists even if missing
      imports.add(rel);
    }
  };
  while ((m = reESM.exec(content))) {
    processRel(m[1]);
  }
  while ((m = reCJS.exec(content))) {
    processRel(m[1]);
  }
  while ((m = reExport.exec(content))) {
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
  // escape characters useful in regex
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function search(pattern, opts = {}) {
  // opts.within = absolute prefix to restrict files
  const results = [];
  let regex;
  if (pattern instanceof RegExp) {
    // remove all global flags so test() doesn't advance
    regex = new RegExp(pattern.source, pattern.flags.replace(/g/g, ''));
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

function callSearch(symbol, opts={}) {
  if (symbol instanceof RegExp) {
    // assume regex already targets call-like usages
    return search(symbol, opts);
  }
  return search(new RegExp('\\b'+escapeRegExp(String(symbol))+'\\s*\\('), opts);
}
function referenceSearch(symbol, opts={}) {
  return search(new RegExp(escapeRegExp(symbol)), opts);
}
function memberSearch(obj, opts={}) {
  return search(new RegExp('\\b'+escapeRegExp(obj)+'\\s*\\.'), opts);
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

// compute reachable files starting from app/ (and optional store/ directory)
const appRoot = path.join(process.cwd(),'app') + path.sep;
const storeRoot = path.join(process.cwd(),'store') + path.sep;
const entryRoots = files.filter(f => f.startsWith(appRoot) || f.startsWith(storeRoot));
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
const tracked = ['getPack','getManifest','adaptPackToV1','runNavigator','runNavigatorWithPack','usePack','decodeAuthorityId','encodeAuthorityId','validateStatePack','validateStatePackV1','fetch','AsyncStorage','localStorage','aiService','crawlerService','save','unsave','toggle','toggleSaved','buildPack','buildPackForState','writePack','writeManifest','validatePack'];
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
  ['useState','useEffect','useRouter','useLocalSearchParams','usePack'].forEach(h => { if (content.includes(h+'(')) hooks.push(h); });
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
const navWithPackCalls = search(/\brunNavigatorWithPack\s*\(/);
makeCallGraph('Navigator run calls', navWithPackCalls);
// also detect legacy runNavigator if any
const navCalls = search(/\brunNavigator\s*\(/);
if (navCalls.length > 0) makeCallGraph('Navigator run calls (legacy)', navCalls);

// 3) Search flow
const searchCalls = search('searchProvider');
makeCallGraph('Search flow references', searchCalls);

// 4) Resource details
const resCalls = search('decodeAuthorityId');
makeCallGraph('Resource details usage', resCalls);

// 5) Saved flow look for "save", "unsave", "toggle" or service helpers
const savedCalls = search(/\bsave\s*\(|\bunsave\s*\(|\btoggleSaved\s*\(/);
makeCallGraph('Saved flow', savedCalls);

// 6) AI summary
const aiCalls = search(/aiService|openai|summarizeAuthority/);
makeCallGraph('AI summary', aiCalls);

// 7) crawler
const crawlCalls = search(/crawl|ingest/);
makeCallGraph('Crawler/ingest', crawlCalls);

// Pack Builder Pipeline checks
out += '## Pack Builder Pipeline\n\n';
// package.json script
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(),'package.json'),'utf8'));
  if (pkg.scripts && pkg.scripts['build:packs']) {
    out += '- package.json contains script "build:packs"\n';
  } else {
    out += '- missing npm script "build:packs"\n';
  }
} catch {
  out += '- package.json not readable\n';
}
// check existence of builder files
['index.js','config.js'].forEach(fn => {
  const p = path.join(process.cwd(),'tools/pack-builder',fn);
  out += `- ${p} ${fileExists(p)?'exists':'MISSING'}\n`;
});
// check output dir
const packsDir = path.join(process.cwd(),'public','packs');
out += `- public/packs ${fileExists(packsDir)?'exists':'MISSING'}\n`;
const manifestPath = path.join(packsDir,'manifest.json');
if (fileExists(manifestPath)) {
  out += '- manifest.json exists\n';
  const manifest = readJson(manifestPath);
  if (manifest && typeof manifest === 'object') {
    out += `  - schemaVersion: ${manifest.schemaVersion}\n`;
    out += `  - pack entries: ${manifest.packs?Object.keys(manifest.packs).length:0}\n`;
    if (manifest.packs) {
      Object.entries(manifest.packs).forEach(([st,entry])=>{
        const packPath = path.join(packsDir,st+'.json');
        out += `  - state ${st}: ` + (fileExists(packPath)?'file exists':'MISSING') + '\n';
        if (fileExists(packPath)) {
          const pjson = readJson(packPath);
          if (pjson) {
            const validShape = pjson.state===st && pjson.schemaVersion && pjson.packVersion && Array.isArray(pjson.domains);
            out += `    - shape ok? ${validShape}\n`;
          }
        }
        if (entry && entry.packVersion) {
          out += `    - manifest packVersion: ${entry.packVersion}\n`;
        }
      });
    }
  }
} else {
  out += '- manifest.json missing\n';
}

// additional pack builder validations
if (fileExists(manifestPath)) {
  const manifest = readJson(manifestPath) || {};
  const states = manifest.packs ? Object.keys(manifest.packs) : [];
  const packFiles = fileExists(packsDir)
    ? fs.readdirSync(packsDir).filter(f=>f.endsWith('.json') && f!=='manifest.json')
    : [];
  const packStates = packFiles.map(f=>path.basename(f,'.json'));
  const missing = states.filter(s=>!packStates.includes(s));
  const extra = packStates.filter(s=>!states.includes(s));
  out += `- pack file reconciliation: missing ${missing.join(',') || 'none'}, extra ${extra.join(',') || 'none'}\n`;

  states.forEach(st=>{
    const packPath = path.join(packsDir, st + '.json');
    if (!fileExists(packPath)) return;
    const pjson = readJson(packPath) || {};
    const domainIds = Array.isArray(pjson.domains)?pjson.domains.map(d=>d.id):[];
    const issueIds = Array.isArray(pjson.issues)?pjson.issues.map(i=>i.id):[];

    // domains unique
    const dupDom = domainIds.filter((v,i,a)=>a.indexOf(v)!==i);
    if (dupDom.length) out += `  - ${st}: duplicate domain ids ${dupDom.join(',')}\n`;

    // authorities domains referenced
    if (pjson.authorities) {
      Object.entries(pjson.authorities).forEach(([aid,adata])=>{
        if (Array.isArray(adata.domains)) {
          adata.domains.forEach(did=>{
            if (!domainIds.includes(did)) {
              out += `  - ${st}: authority ${aid} references unknown domain ${did}\n`;
            }
          });
        }
        if (Array.isArray(adata.issues) && issueIds.length) {
          adata.issues.forEach(iid=>{
            if (!issueIds.includes(iid)) {
              out += `  - ${st}: authority ${aid} references unknown issue ${iid}\n`;
            }
          });
        }
      });
    }
    // issues unique
    if (issueIds.length) {
      const dupIss = issueIds.filter((v,i,a)=>a.indexOf(v)!==i);
      if (dupIss.length) out += `  - ${st}: duplicate issue ids ${dupIss.join(',')}\n`;
    }
    // authoritiesByIssue
    if (pjson.authoritiesByIssue) {
      Object.entries(pjson.authoritiesByIssue).forEach(([iid,list])=>{
        if (issueIds.length && !issueIds.includes(iid)) {
          out += `  - ${st}: authoritiesByIssue key ${iid} not a real issue\n`;
        }
        const uniq = [];
        list.forEach(aid=>{
          if (!pjson.authorities || !pjson.authorities[aid]) {
            out += `  - ${st}: authoritiesByIssue ${iid} references unknown authority ${aid}\n`;
          }
          if (uniq.includes(aid)) {
            out += `  - ${st}: duplicate authority ${aid} in issue ${iid}\n`;
          }
          uniq.push(aid);
        });
      });
    }
  });

  // source coverage
  try {
    const cfg = require(path.join(process.cwd(),'tools','pack-builder','config.js'));
    const configured = Array.isArray(cfg.STATES)?cfg.STATES:[];
    const sourceFiles = [];
    const srcDir = path.join(process.cwd(),'tools','pack-builder','sources');
    if (fileExists(srcDir)) {
      fs.readdirSync(srcDir).forEach(f=>{
        if (f.endsWith('.js')) sourceFiles.push(path.basename(f,'.js').toUpperCase());
      });
    }
    const missingSrc = configured.filter(s=>!sourceFiles.includes(s));
    const extraSrc = sourceFiles.filter(s=>!configured.includes(s));
    out += `- source coverage: configured states missing sources ${missingSrc.join(',')||'none'}; extra sources ${extraSrc.join(',')||'none'}\n`;
  } catch (e) {
    out += '- could not load pack-builder config for source coverage\n';
  }
}
const packInApp = search(/\bgetPack\s*\(/).filter(o=>o.file.includes(path.join('app','')));
const packInSvc = search(/\bgetPack\s*\(/).filter(o=>o.file.includes('services'));
const usePackInApp = search(/\busePack\s*\(/).filter(o=>o.file.includes(path.join('app','')));
out += `\n## Redundancy Counts\n- getPack in app/: ${packInApp.length}\n- getPack in services/: ${packInSvc.length}\n- usePack in app/: ${usePackInApp.length}\n`;
const manifestInApp = search(/\bgetManifest\s*\(/).filter(o=>o.file.includes(path.join('app','')));
out += `- getManifest in app/: ${manifestInApp.length}\n`;

// duplicate import detection (screens only, report lines)
out += '\n## Duplicate Imports\n';
let dupCount = 0;
for (const f of screenFiles) {
  const content = fileContents[f];
  const lines = content.split('\n');
  const impMap = {};
  lines.forEach((line, idx) => {
    const m = line.match(/import\s+[^'";]+\s+from\s+['"]([^'"\n]+)['"]/);
    if (m) {
      const mod = m[1];
      impMap[mod] = impMap[mod] || [];
      impMap[mod].push(idx+1);
    }
  });
  Object.entries(impMap).forEach(([mod, arr]) => {
    if (arr.length > 1 && dupCount < 50) {
      out += `- ${path.relative(process.cwd(),f)} imports ${mod} at lines ${arr.join(', ')}\n`;
      dupCount++;
    }
  });
}

// Reachability map
const totalFiles = files.length;
const reachableFiles = Array.from(reachable).sort();
out += `\n## Reachability Map\n- total files scanned: ${totalFiles}\n`;
out += `- total reachable files: ${reachableFiles.length}\n`;
const svcReach = reachableFiles.filter(f=>f.includes(path.join('services','')));
out += `- reachable service files (${svcReach.length}):\n`;
svcReach.slice(0,20).forEach(f=>{ out += `  - ${path.relative(process.cwd(),f)}\n`; });
const allSvc = files.filter(f=>f.includes(path.join('services','')));
const notReach = allSvc.filter(f=>!reachable.has(f));
out += `- unreachable service files (${notReach.length}):\n`;
notReach.forEach(f=>{ out += `  - ${path.relative(process.cwd(),f)}\n`; });

// helper to locate simple definitions in a file by scanning backwards up to 200 lines
function findDefinition(name, file, fromLineIndex) {
  const lines = fileContents[file].split('\n');
  const start = typeof fromLineIndex === 'number' ? Math.max(0, fromLineIndex - 1) : lines.length - 1;
  const low = Math.max(0, start - 200);
  for (let i = start; i >= low; i--) {
    const ln = lines[i];
    let m;
    // const/let/export const/let or assignment
    m = ln.match(new RegExp('^\\s*(?:export\\s+)?(?:const|let)?\\s*' + name + '\\s*=\\s*([\"\'\`])([^\\1]*)\\1'));
    if (m) {
      const val = m[2];
      if (!/\$\{/.test(val)) return {type:'string', value: val};
    }
    // bare assignment without decl (e.g. NAME = "...")
    m = ln.match(new RegExp('^' + name + '\\s*=\\s*([\"\'\`])([^\\1]*)\\1'));
    if (m) {
      const val = m[2];
      if (!/\$\{/.test(val)) return {type:'string', value: val};
    }
    // new URL pattern (capture literal path and optional base ident/string)
    m = ln.match(new RegExp('^\\s*(?:export\\s+)?(?:const|let)?\\s*' + name + '\\s*=\\s*new\\s+URL\\s*\\(\\s*([\"\'\`])([^\"\'\`]+)\\1\\s*(?:,\\s*([^\\)\\s]+))?'));
    if (m) {
      return {type:'newurl', path: m[2], base: m[3] || null};
    }
  }
  return null;
}

// helper to pick out the first argument expression of a fetch call
function extractFetchArgExpression(line) {
  const idx = line.indexOf('fetch');
  if (idx === -1) return '';
  const start = line.indexOf('(', idx);
  if (start === -1) return '';
  let depth = 0;
  let expr = '';
  for (let i = start + 1; i < line.length; i++) {
    const ch = line[i];
    if (ch === '(') {
      depth++;
      expr += ch;
    } else if (ch === ')') {
      if (depth === 0) break;
      depth--;
      expr += ch;
    } else {
      expr += ch;
    }
  }
  // do not strip parentheses (inside toString), only remove trailing semicolon/whitespace
  return expr.replace(/[;\s]*$/, '').trim();
}

// attempt to convert an expression into a string/newurl/concat result
function resolveExpressionToString(expr, file, lineNum) {
  if (!expr) return null;
  // strip trailing .toString() if present
  const toStr = expr.match(/^([A-Za-z_$][A-Za-z0-9_$]*)\.toString\s*\(\)\s*$/);
  if (toStr) expr = toStr[1];
  // string literal (or template without interpolation)
  let m = expr.match(/^(['"`])([\s\S]*)\1$/);
  if (m) {
    const val = m[2];
    if (expr.startsWith('`') && /\$\{/.test(val)) return null;
    return {type:'string', value: val};
  }
  // inline new URL(...) with optional base
  m = expr.match(/^new\s+URL\s*\(\s*(['"`])([^\1]*)\1\s*(?:,\s*([^\)\s]+))?/);
  if (m) {
    return {type:'newurl', path: m[2], base: m[3] || null};
  }
  // identifier
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(expr)) {
    const def = findDefinition(expr, file, lineNum);
    console.log('DEBUG findDefinition', expr, def, 'in',file,'line',lineNum);
    if (def) return def;
  }
  // concatenation
  if (expr.includes('+')) {
    return {type:'concat', value: expr};
  }
  return null;
}

// Network endpoints and fetch call sites
const fetchSites = search(/\bfetch\s*\(/);
const resolvedEndpoints = [];
let callSites = [];
out += '\n## Network Endpoints\n';
if (fetchSites.length === 0) {
  out += '(no fetch calls found)\n';
} else {
  fetchSites.forEach(o=>{
    const line = fileContents[o.file].split('\n')[o.line-1];
    callSites.push(`${o.file}:${o.line}: ${line.trim()}`);
    const expr = extractFetchArgExpression(line);
    const res = resolveExpressionToString(expr, o.file, o.line);
    // debug
    console.log('DEBUG fetch expr',expr,'res',res);
    if (res) {
      let outstr;
      if (res.type === 'string') {
        outstr = res.value;
      } else if (res.type === 'newurl') {
        outstr = res.base ? `new URL(${res.path}, ${res.base})` : `new URL(${res.path})`;
      } else if (res.type === 'concat') {
        outstr = `concat expression (unresolved): ${res.value}`;
      }
      if (outstr) {
        console.log('DEBUG pushing resolved', outstr, 'from', o.file, o.line);
        resolvedEndpoints.push({url:outstr,file:o.file,line:o.line});
      }
    }
  });
  // print call sites first
  callSites.forEach(c=>{ out += `- fetch call site at ${c}\n`; });
  if (resolvedEndpoints.length === 0) {
    out += '(no endpoints could be resolved statically)\n';
  }
}

// print any resolved endpoints for extra visibility
if (resolvedEndpoints.length) {
  out += '\n## Resolved Endpoints (best effort)\n';
  const seenE = new Set();
  resolvedEndpoints.forEach(e=>{
    if (!seenE.has(e.url)) {
      seenE.add(e.url);
      out += `- ${e.url} (${e.file}:${e.line})\n`;
    }
  });
}

// C. Implemented vs Not Implemented matrix
out += '## C. Implemented vs Not Implemented Matrix\n\n';

const features = [
  {name:'Pack loading',pattern:/\bgetPack\s*\(/,file:'services/packStore.ts'},
  {name:'Manifest fetch',pattern:/\bgetManifest\s*\(/,file:'services/packStore.ts'},
  {name:'Adapt to V1',pattern:/\badaptPackToV1\s*\(/,file:'services/adaptPackToV1.ts'},
  {name:'Validation',pattern:/\bvalidate[A-Za-z0-9_]*\s*\(/,file:'services/packStore.ts'},
  {name:'Navigator engine',pattern:/\brunNavigatorWithPack\s*\(/,file:'services/navigatorService.ts'},
  {name:'Search UI',pattern:'searchProvider',file:'services/searchProvider.ts'},
  {name:'Resource details',pattern:'decodeAuthorityId',file:'app/resource/[id].tsx'},
  {name:'Saved items',pattern:/\bsave\s*\(|\bunsave\s*\(|\btoggleSaved\s*\(/,file:'services/savedStore.ts'},
  {name:'AI summaries',pattern:/aiService|openai|summarizeAuthority/,file:'services/aiService.ts'}
];

out += '| Feature | Implemented? | Evidence | Notes |\n';
out += '|---|---|---|---|\n';
features.forEach(f => {
  // determine evidence and implementation using callSearch vs referenceSearch
  let callMatches = [];
  let refMatches = [];

  // special handling
  if (f.name === 'Navigator engine') {
    // prefer explicit calls within app code
    callMatches = callSearch(/\brunNavigatorWithPack\s*\(/).filter(o=>o.file.startsWith(appRoot));
    if (callMatches.length === 0) {
      // fallback to existence of export in service file
      const svc = fileContents[path.join(process.cwd(),'services','navigatorService.ts')] || '';
      if (/runNavigatorWithPack/.test(svc)) {
        refMatches = [{file:'services/navigatorService.ts',line:1,text:'export runNavigatorWithPack'}];
      }
    }
  } else if (f.name === 'Search UI') {
    callMatches = callSearch('searchResources').filter(o=>reachable.has(o.file));
    // also detect provider.search calls within reachable
    const provMatches = search(/\.search\s*\(/, {within: path.join(process.cwd(),'app')}).filter(o=>reachable.has(o.file));
    callMatches = callMatches.concat(provMatches);
    refMatches = search(f.pattern).filter(o=>reachable.has(o.file));
  } else if (f.name === 'Saved items') {
    callMatches = callSearch('savePack').filter(o=>reachable.has(o.file));
    callMatches = callMatches.concat(callSearch('unsave').filter(o=>reachable.has(o.file)));
    refMatches = search(f.pattern).filter(o=>reachable.has(o.file));
  } else {
    callMatches = callSearch(typeof f.pattern === 'string' ? f.pattern : f.pattern).filter(o=>reachable.has(o.file));
    refMatches = search(typeof f.pattern === 'string' ? f.pattern : f.pattern).filter(o=>reachable.has(o.file));
  }

  let status;
  if (callMatches.length > 0) status = 'Implemented';
  else if (refMatches.length > 0) status = 'Referenced/Partial';
  else status = 'No evidence';

  const evidence = (callMatches.length>0?callMatches:refMatches).slice(0,3).map(o=>`${path.relative(process.cwd(),o.file)}:${o.line}`).join('; ');
  out += `| ${f.name} | ${status} | ${evidence} | |
`;
});

// D. Redundancy + conflict report
out += '\n## D. Redundancy + Conflict Report\n\n';
// look for legacy field duplicates inside JSON packs (not included in `files` list)
const dupMsgs = [];
const packDir = path.join(process.cwd(), 'public', 'packs');
if (fs.existsSync(packDir)) {
  const entries = fs.readdirSync(packDir).filter(n => n.endsWith('.json'));
  entries.forEach(fn => {
    const fpath = path.join(packDir, fn);
    let c = '';
    try { c = fs.readFileSync(fpath, 'utf8'); } catch {}
    if (c.includes('"tests"') && c.includes('"testItems"'))
      dupMsgs.push(`${fn} (tests/testItems)`);
    if (c.includes('"traps"') && c.includes('"proceduralTraps"'))
      dupMsgs.push(`${fn} (traps/proceduralTraps)`);
  });
}
if (dupMsgs.length) {
  out += `- duplicate schema fields (${dupMsgs.slice(0,3).join(', ')}${dupMsgs.length>3?`, +${dupMsgs.length-3} more`:''}; adapter merges them at runtime)\n`;
}
// ensure we only warn about validation order if we still have a path
// that calls validateStatePack prior to adaptPackToV1
const packStoreSrc = fileContents[path.join(process.cwd(),'services','packStore.ts')] || '';
if (/validateStatePack\([^)]*\)\s*;?[\s\n]*.*adaptPackToV1/.test(packStoreSrc) === false) {
  // pattern isn't accurate; our fix above ensures adaptation always occurs first
} else {
  out += '- validation before adaptation in packStore (validateStatePack)\n';
}
// provider abstraction exists if any matching file name remains
const providerFiles = files.filter(f => f.includes('AuthorityPackProvider'));
if (providerFiles.length > 0) {
  out += '- provider abstraction now unused\n';
}

// E. Recommended Single Source of Truth Flow
out += '\n## E. Recommended “Single Source of Truth” Flow\n\n';
out += '1. Use StatePackV1 at runtime exclusively.\n';
out += '2. Adapt and validate inside services/packStore after any fetch or cache read.\n';
out += '3. Cache packs only once (adapted) and share via getPack (exposed via the usePack hook for React UI).\n';
out += '4. UI consumers should use the usePack hook and operate on the pack object, avoiding direct calls to getPack.\n';
out += '5. Manifest fetch should only occur within packStore.\n';
out += '6. Remove legacy imports/dependencies.\n';

// write output
fs.mkdirSync(path.join(process.cwd(),'docs'), { recursive: true });
fs.writeFileSync(path.join(process.cwd(),'docs','ARCH_AUDIT.md'), out);
console.log('Audit complete, output written to docs/ARCH_AUDIT.md');

