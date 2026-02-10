#!/usr/bin/env bash
# Prime lint wrapper — runs ESLint on recently-changed Prime files only.
# This enforces non-regression: new/modified files must pass lint,
# but existing lint debt doesn't block the gate.
#
# DS rules are now enforced globally after full migration (TASK-01–13).
# Only complexity/max-lines remain relaxed (via eslint.config.mjs).
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

if [[ "$FULL_LINT" == "true" ]]; then
  echo "[Prime lint] Running full ESLint on entire Prime codebase..."
  pnpm exec eslint "apps/prime/" || true
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

echo "$ALL_FILES" | xargs pnpm exec eslint --no-error-on-unmatched-pattern
