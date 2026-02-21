#!/usr/bin/env bash
set -euo pipefail

manifest="public/packs/manifest.json"
# ensure directory exists so test for file does not error
mkdir -p "$(dirname "$manifest")"

if [ ! -f "$manifest" ]; then
  echo "ERROR: manifest not found at $manifest"
  exit 1
fi

# simple field assertions
if ! grep -q '"schemaVersion"' "$manifest"; then
  echo "ERROR: manifest missing schemaVersion"
  exit 1
fi
if ! grep -q '"packs"' "$manifest"; then
  echo "ERROR: manifest missing packs object"
  exit 1
fi

# check schemaVersion equals "1"
schema=$(grep '"schemaVersion"' "$manifest" | head -1 | sed -E 's/.*"schemaVersion"[[:space:]]*:[[:space:]]*"([^"]*)".*/\1/')
if [ "$schema" != "1" ]; then
  echo "ERROR: manifest schemaVersion is '$schema', expected '1'"
  exit 1
fi

# optional pack-file existence enforcement
if [ "${REQUIRE_PACK_FILES:-0}" = "1" ]; then
  # collect pack keys (two-letter state codes) within packs object
  keys=$(awk '/"packs"[[:space:]]*:/,/\}/ { if ($0 ~ /"[A-Z][A-Z]"/) { gsub(/.*"([A-Z][A-Z])".*/, "\1"); print } }' "$manifest" | sort -u)
  for s in $keys; do
    if [ ! -f "public/packs/$s.json" ]; then
      echo "ERROR: pack file missing for state $s"
      exit 1
    fi
  done
fi

echo "manifest checks passed"
