#!/usr/bin/env bash
set -euo pipefail

# Prevent commits directly on protected branches.
#
# Bypass (human only, emergency): ALLOW_COMMIT_ON_PROTECTED_BRANCH=1 git commit ...

if [[ "${ALLOW_COMMIT_ON_PROTECTED_BRANCH:-}" == "1" ]]; then
  exit 0
fi

branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
case "$branch" in
  main|master)
    echo "------------------------------------------------------------------" >&2
    echo "COMMIT BLOCKED: protected branch '${branch}'" >&2
    echo "------------------------------------------------------------------" >&2
    echo "" >&2
    echo "Do not commit directly to '${branch}'." >&2
    echo "" >&2
    echo "Use a work branch (recommended via worktree):" >&2
    echo "  scripts/git/new-worktree.sh <label>" >&2
    echo "" >&2
    echo "Or create a work branch in-place:" >&2
    echo "  git checkout -b work/$(date +%Y-%m-%d)-<desc>" >&2
    echo "" >&2
    echo "Bypass (human only, emergency):" >&2
    echo "  ALLOW_COMMIT_ON_PROTECTED_BRANCH=1 git commit ..." >&2
    echo "" >&2
    exit 1
    ;;
esac

exit 0

