#!/usr/bin/env bash
set -euo pipefail

envfiles=(.env .env.production .env.local .env.example)
error=0
for f in "${envfiles[@]}"; do
  [ -f "$f" ] || continue
  while IFS= read -r line; do
    # strip comments
    line=${line%%#*}
    if [[ "$line" =~ ^EXPO_PUBLIC_PACKS_BASE_URL= || "$line" =~ ^EXPO_PUBLIC_FAMILYLAW_API_BASE_URL= ]]; then
      if [[ "$line" =~ localhost ]] || [[ "$line" =~ 127\.0\.0\.1 ]]; then
        echo "ERROR: $f contains localhost/127.0.0.1 in $line"
        error=1
      fi
    fi
  done < "$f"
done
[ $error -eq 0 ] || exit 1

echo "env checks passed"