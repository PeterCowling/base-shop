#!/usr/bin/env bash
# Prime lint wrapper — runs ESLint on recently-changed Prime files only.
# This enforces non-regression: new/modified files must pass lint,
# but existing lint debt doesn't block the gate.
#
# DS rules are disabled inline because Prime's .eslintrc.cjs disables them
# but the root flat config (eslint.config.mjs) overrides local legacy configs.
# This matches the intent of apps/prime/.eslintrc.cjs rules section.
#
# Usage:
#   pnpm lint                # Changed files only
#   pnpm lint -- --full      # Full codebase lint (for auditing)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PRIME_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$PRIME_ROOT/../.." && pwd)"

FULL_LINT=false
for arg in "$@"; do
  if [[ "$arg" == "--full" ]]; then
    FULL_LINT=true
    break
  fi
done

cd "$REPO_ROOT"

# DS rules disabled for Prime (early development; .eslintrc.cjs intent preserved)
DS_OVERRIDES=(
  --rule 'ds/no-unsafe-viewport-units: off'
  --rule 'ds/container-widths-only-at: off'
  --rule 'ds/no-hardcoded-copy: off'
  --rule 'ds/min-tap-size: off'
  --rule 'ds/enforce-focus-ring-token: off'
  --rule 'ds/enforce-layout-primitives: off'
  --rule 'complexity: off'
  --rule 'max-lines-per-function: off'
)

if [[ "$FULL_LINT" == "true" ]]; then
  echo "[Prime lint] Running full ESLint on entire Prime codebase..."
  pnpm exec eslint "apps/prime/" "${DS_OVERRIDES[@]}" || true
  exit 0
fi

# Locally: staged + unstaged + untracked files
STAGED="$(git diff --cached --name-only --diff-filter=ACMRTUXB -- "apps/prime/" 2>/dev/null || true)"
UNSTAGED="$(git diff --name-only --diff-filter=ACMRTUXB -- "apps/prime/" 2>/dev/null || true)"
UNTRACKED="$(git ls-files --others --exclude-standard -- "apps/prime/" 2>/dev/null || true)"

ALL_FILES="$(printf '%s\n%s\n%s' "$STAGED" "$UNSTAGED" "$UNTRACKED" | sort -u | grep -E '\.(ts|tsx|js|jsx|mjs|cjs)$' || true)"

if [[ -z "$ALL_FILES" ]]; then
  echo "[Prime lint] No changed Prime files to lint. ✓"
  exit 0
fi

FILE_COUNT="$(echo "$ALL_FILES" | wc -l | tr -d ' ')"
echo "[Prime lint] Linting $FILE_COUNT changed file(s)..."

echo "$ALL_FILES" | xargs pnpm exec eslint --no-error-on-unmatched-pattern "${DS_OVERRIDES[@]}"
