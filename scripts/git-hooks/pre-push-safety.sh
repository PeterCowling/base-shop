#!/usr/bin/env bash
set -euo pipefail

# Block dangerous pushes:
# - Any direct push to protected branches (staging/main/master)
# - Any non-fast-forward push to any branch (history rewrite / force push)
#
# Git provides local_sha/remote_sha pairs over stdin.

PROTECTED_BRANCHES=(
  "refs/heads/staging"
  "refs/heads/main"
  "refs/heads/master"
)

is_protected_ref() {
  local ref="$1"
  for protected in "${PROTECTED_BRANCHES[@]}"; do
    if [[ "$ref" == "$protected" ]]; then
      return 0
    fi
  done
  return 1
}

zeros40="0000000000000000000000000000000000000000"

while read -r local_ref local_sha remote_ref remote_sha; do
  # stdin can be empty in some scenarios
  [[ -z "${remote_ref:-}" ]] && continue

  # Block direct push to protected branches (even if fast-forward).
  if is_protected_ref "$remote_ref"; then
    echo "------------------------------------------------------------------" >&2
    echo "PUSH BLOCKED: Direct push to protected branch" >&2
    echo "------------------------------------------------------------------" >&2
    echo "" >&2
    echo "Protected branch: ${remote_ref#refs/heads/}" >&2
    echo "" >&2
    echo "Use the pipeline PR scripts instead:" >&2
    echo "  - Ship dev -> staging: scripts/git/ship-to-staging.sh" >&2
    echo "  - Promote staging -> main: scripts/git/promote-to-main.sh" >&2
    echo "" >&2
    exit 1
  fi

  # New branch on remote (remote_sha all zeros) isn't a force push.
  if [[ "$remote_sha" == "$zeros40" ]]; then
    continue
  fi

  # Branch deletion (local_sha all zeros) is allowed (except protected branches, handled above).
  if [[ "$local_sha" == "$zeros40" ]]; then
    continue
  fi

  if ! git merge-base --is-ancestor "$remote_sha" "$local_sha" 2>/dev/null; then
    echo "------------------------------------------------------------------" >&2
    echo "PUSH BLOCKED: Non-fast-forward push (history rewrite)" >&2
    echo "------------------------------------------------------------------" >&2
    echo "" >&2
    echo "You are attempting to push a history rewrite to: ${remote_ref#refs/heads/}" >&2
    echo "" >&2
    echo "This would overwrite remote history and can destroy work." >&2
    echo "Reference: docs/historical/RECOVERY-PLAN-2026-01-14.md" >&2
    echo "" >&2
    exit 1
  fi
done

exit 0
