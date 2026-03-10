#!/usr/bin/env bash
set -euo pipefail

staged_files="$(git diff --cached --name-only --diff-filter=ACMRTUXB)"
queue_state_path="docs/business-os/startup-loop/ideas/trial/queue-state.json"

if ! echo "$staged_files" | grep -qE '^(docs/plans/.+/(results-review|build-record|reflection-debt)\.user\.md|docs/plans/.+/bug-scan-findings\.user\.json|docs/business-os/_data/completed-ideas\.json|docs/business-os/startup-loop/ideas/trial/queue-state\.json)$'; then
  echo "[generate-process-improvements] No relevant files staged; skipping."
  exit 0
fi

queue_has_unstaged_changes=0
if git diff --quiet -- "$queue_state_path"; then
  queue_has_unstaged_changes=0
else
  queue_has_unstaged_changes=1
fi

if [ "$queue_has_unstaged_changes" -eq 1 ]; then
  cat >&2 <<EOF
[generate-process-improvements] ERROR: trial queue state has unstaged worktree changes, so pre-commit report generation would read queue data that does not match the commit candidate.
Failure reason: render-only process-improvements generation is blocked because $queue_state_path differs between the worktree and the staged commit snapshot.
Retry posture: retry-allowed
Exact next step: git diff -- $queue_state_path
Anti-retry list: do not rerun \`git commit\` unchanged; do not rerun \`pnpm --filter scripts startup-loop:generate-process-improvements\` from the pre-commit path unchanged; do not bypass hooks with \`SKIP_SIMPLE_GIT_HOOKS=1\`.
Escalation/stop condition: stop after 1 unchanged retry, or immediately if the unstaged queue change belongs to another live writer.
EOF
  exit 1
fi

echo "[generate-process-improvements] Relevant plan files staged; regenerating process improvements..."

set +e
error_output="$(pnpm --filter scripts run startup-loop:generate-process-improvements -- --render-only 2>&1)"
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
