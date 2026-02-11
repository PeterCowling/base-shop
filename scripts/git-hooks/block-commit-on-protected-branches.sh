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
  main|master|staging)
    echo "------------------------------------------------------------------" >&2
    echo "COMMIT BLOCKED: protected branch '${branch}'" >&2
    echo "------------------------------------------------------------------" >&2
    echo "" >&2
    echo "Do not commit directly to '${branch}'." >&2
    echo "" >&2
    echo "Use the integration branch flow:" >&2
    echo "  git fetch origin --prune" >&2
    echo "  git switch dev || git switch -c dev origin/dev || git switch -c dev origin/main" >&2
    echo "" >&2
    echo "Then ship via pipeline PR scripts:" >&2
    echo "  - scripts/git/ship-to-staging.sh" >&2
    echo "  - scripts/git/promote-to-main.sh" >&2
    echo "" >&2
    echo "Bypass (human only, emergency):" >&2
    echo "  ALLOW_COMMIT_ON_PROTECTED_BRANCH=1 git commit ..." >&2
    echo "" >&2
    exit 1
    ;;
esac

exit 0
