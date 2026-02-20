#!/usr/bin/env bash
set -euo pipefail

bad=0

# Disallow root-level duplicates that shadow the tab shell
if [ -f "app/search.tsx" ]; then
  echo "ERROR: app/search.tsx exists. Search must live in app/(tabs)/search.tsx only."
  bad=1
fi

if [ -f "app/navigator.tsx" ]; then
  echo "ERROR: app/navigator.tsx exists. Navigator must live in app/(tabs)/navigator.tsx only."
  bad=1
fi

# Require canonical tab routes
if [ ! -f "app/(tabs)/_layout.tsx" ]; then
  echo "ERROR: Missing app/(tabs)/_layout.tsx (Tabs shell)."
  bad=1
fi

if [ ! -f "app/(tabs)/search.tsx" ]; then
  echo "ERROR: Missing app/(tabs)/search.tsx (Search tab screen)."
  bad=1
fi

if [ ! -f "app/(tabs)/navigator.tsx" ]; then
  echo "ERROR: Missing app/(tabs)/navigator.tsx (Navigator tab screen)."
  bad=1
fi

# Require root layout + landing
if [ ! -f "app/_layout.tsx" ]; then
  echo "ERROR: Missing app/_layout.tsx (Root layout)."
  bad=1
fi

if [ ! -f "app/index.tsx" ]; then
  echo "ERROR: Missing app/index.tsx (Landing redirect)."
  bad=1
fi

if [ "$bad" -ne 0 ]; then
  exit 1
fi

echo "OK: Routes are canonical (tabs shell) and no duplicate root routes exist."
