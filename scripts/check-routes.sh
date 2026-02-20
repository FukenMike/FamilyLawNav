#!/usr/bin/env bash
set -euo pipefail

bad=0

if [ -f "app/search.tsx" ]; then
  echo "ERROR: app/search.tsx exists. Search must live in app/(tabs)/search.tsx only."
  bad=1
fi

if [ -f "app/navigator.tsx" ]; then
  echo "ERROR: app/navigator.tsx exists. Navigator must live in app/(tabs)/navigator.tsx only."
  bad=1
fi

if [ "$bad" -ne 0 ]; then
  exit 1
fi

echo "OK: No duplicate root-level tab routes found."
