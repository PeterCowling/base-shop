#!/usr/bin/env bash
set -euo pipefail

# Block git rebases by default. This repo treats rebase/amend/force-push as a common path to
# accidental rollbacks and lost work when agents are involved.
#
# Bypass (humans only, emergency): ALLOW_GIT_REBASE=1 git rebase ...

if [[ "${ALLOW_GIT_REBASE:-}" == "1" ]]; then
  exit 0
fi

echo "------------------------------------------------------------------" >&2
echo "REBASE BLOCKED: history rewrites are disabled in this repo" >&2
echo "------------------------------------------------------------------" >&2
echo "" >&2
echo "Use a merge (or create a new branch) instead of rebasing." >&2
echo "" >&2
echo "If you believe a rebase is required, a human may bypass with:" >&2
echo "  ALLOW_GIT_REBASE=1 git rebase ..." >&2
echo "" >&2
echo "Reference: docs/git-safety.md" >&2
echo "" >&2
exit 1
