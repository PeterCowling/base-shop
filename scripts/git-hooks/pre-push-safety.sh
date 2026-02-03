#!/usr/bin/env bash
set -euo pipefail

# Block non-fast-forward pushes to protected branches (main/master).
# Git provides local_sha/remote_sha pairs over stdin.

PROTECTED_BRANCHES=(
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

  if ! is_protected_ref "$remote_ref"; then
    continue
  fi

  # New branch on remote (remote_sha all zeros) isn't a force push.
  if [[ "$remote_sha" == "$zeros40" ]]; then
    continue
  fi

  if ! git merge-base --is-ancestor "$remote_sha" "$local_sha" 2>/dev/null; then
    echo "------------------------------------------------------------------" >&2
    echo "PUSH BLOCKED: Non-fast-forward push to protected branch" >&2
    echo "------------------------------------------------------------------" >&2
    echo "" >&2
    echo "You are attempting to push a history rewrite to: ${remote_ref#refs/heads/}" >&2
    echo "" >&2
    echo "This would overwrite remote history and can destroy work." >&2
    echo "Reference: docs/historical/RECOVERY-PLAN-2026-01-14.md" >&2
    echo "" >&2
    exit 1
  fi

  echo "WARNING: direct push to protected branch '${remote_ref#refs/heads/}' detected." >&2
  echo "Prefer opening a PR instead." >&2
done

exit 0
