#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const packsDir = path.join(process.cwd(), 'public', 'packs');
if (!fs.existsSync(packsDir)) {
  console.error('packs directory not found:', packsDir);
  process.exit(1);
}

const files = fs.readdirSync(packsDir).filter(f => f.endsWith('.json'));
let changedCount = 0;
const changedFiles = [];

files.forEach(fn => {
  const fp = path.join(packsDir, fn);
  let str;
  try {
    str = fs.readFileSync(fp, 'utf8');
  } catch (e) {
    return;
  }
  let obj;
  try {
    obj = JSON.parse(str);
  } catch (e) {
    console.warn('invalid json skipped', fn);
    return;
  }

  let modified = false;

  // root-level tests/testItems
  if (obj.tests && !obj.testItems) {
    obj.testItems = obj.tests;
    modified = true;
  }
  if (obj.tests && obj.testItems) {
    // prefer testItems, just drop tests
    modified = true;
  }
  if (obj.traps && !obj.proceduralTraps) {
    obj.proceduralTraps = obj.traps;
    modified = true;
  }
  if (obj.traps && obj.proceduralTraps) {
    modified = true;
  }

  if (obj.tests) {
    delete obj.tests;
    modified = true;
  }
  if (obj.traps) {
    delete obj.traps;
    modified = true;
  }

  if (modified) {
    const out = JSON.stringify(obj, null, 2) + '\n';
    fs.writeFileSync(fp, out);
    changedCount++;
    changedFiles.push(fn);
  }
});

console.log(`scanned ${files.length} packs, modified ${changedCount}`);
if (changedFiles.length) console.log('changed files:', changedFiles.join(', '));
