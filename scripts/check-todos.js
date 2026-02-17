#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const PATTERN_TODO = /(?<!\/\/ )TODO: Implement this file/;
const PATTERN_AFTER_BRACE = /[}\)]\s*[^\s\n\/}])+/;

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let errors = [];
  const lines = content.split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (PATTERN_TODO.test(line)) {
      errors.push(`${filePath}:${idx + 1}: Found raw TODO: Implement this file`);
    }
    if (PATTERN_AFTER_BRACE.test(line)) {
      errors.push(`${filePath}:${idx + 1}: Found plain text after closing brace or parenthesis`);
    }
  });
  return errors;
}

function walk(dir) {
  let results = [];
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (/\.(ts|tsx)$/.test(file)) {
      results.push(fullPath);
    }
  });
  return results;
}

const root = process.cwd();
const files = walk(root);
let allErrors = [];
files.forEach(f => {
  allErrors = allErrors.concat(scanFile(f));
});

if (allErrors.length) {
  console.error('TODO validation failed!');
  allErrors.forEach(e => console.error(e));
  process.exit(1);
} else {
  console.log('No invalid TODOs or trailing text found.');
}
