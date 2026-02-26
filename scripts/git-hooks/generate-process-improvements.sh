#!/usr/bin/env bash
set -euo pipefail

staged_files="$(git diff --cached --name-only --diff-filter=ACMRTUXB)"

if ! echo "$staged_files" | grep -qE '^docs/plans/.+/(results-review|build-record|reflection-debt)\.user\.md$'; then
  echo "[generate-process-improvements] No relevant files staged; skipping."
  exit 0
fi

echo "[generate-process-improvements] Relevant plan files staged; regenerating process improvements..."

set +e
error_output="$(pnpm --filter scripts run startup-loop:generate-process-improvements 2>&1)"
exit_code=$?
set -e

if [ $exit_code -ne 0 ]; then
  if echo "$error_output" | grep -q 'Unable to locate'; then
    echo "[generate-process-improvements] ERROR: HTML marker invariant violated — commit blocked." >&2
    echo "$error_output" >&2
    exit 1
  else
    echo "[generate-process-improvements] WARNING: generator failed (non-invariant error); skipping auto-update." >&2
    echo "$error_output" >&2
    exit 0
  fi
fi

git add docs/business-os/process-improvements.user.html docs/business-os/_data/process-improvements.json
echo "[generate-process-improvements] Done."
