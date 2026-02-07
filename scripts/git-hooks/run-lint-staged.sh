#!/usr/bin/env bash
set -euo pipefail

if [[ "${SKIP_LINT_STAGED:-}" == "1" ]]; then
  echo "[INFO] SKIP_LINT_STAGED=1; skipping lint-staged."
  exit 0
fi

git_dir="$(git rev-parse --git-common-dir 2>/dev/null || git rev-parse --git-dir)"
if [[ -f "${git_dir}/MERGE_HEAD" ]]; then
  echo "[INFO] Merge in progress; skipping lint-staged."
  exit 0
fi

staged_count="$(git diff --cached --name-only --diff-filter=ACMRTUXB | wc -l | tr -d ' ')"
max_files="${LINT_STAGED_MAX_FILES:-300}"

if [[ "$staged_count" -gt "$max_files" ]]; then
  echo "[INFO] ${staged_count} files staged (> ${max_files}); skipping lint-staged to avoid OOM. Relying on pnpm typecheck/lint."
  exit 0
fi

pnpm exec cross-env NODE_OPTIONS=--max-old-space-size=16384 pnpm exec lint-staged --no-stash

