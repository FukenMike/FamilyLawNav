#!/usr/bin/env bash
set -euo pipefail

# recursively search for TODO or FIXME, excluding various directories

matches=$(grep -R --line-number \
  --exclude-dir=node_modules \
  --exclude-dir=.expo \
  --exclude-dir=.git \
  --exclude-dir=dist \
  --exclude-dir=build \
  --exclude-dir=coverage \
  --exclude-dir=public/packs \
  --exclude=docs/ARCH_AUDIT.md \
  -E "TODO|FIXME" . || true)

if [ -n "$matches" ]; then
  echo "Found TODO/FIXME markers:"
  echo "$matches"
  exit 1
else
  echo "No TODO/FIXME markers found"
  exit 0
fi
