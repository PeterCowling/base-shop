#!/bin/sh
# Pre-push hook to prevent dangerous push operations
# This script blocks force pushes to protected branches and warns about large pushes
#
# Install: Run `pnpm exec simple-git-hooks` after adding to package.json

set -e

# ANSI color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Protected branches that should never receive force pushes
PROTECTED_BRANCHES="main master"

# Get the remote and URL being pushed to
remote="$1"
url="$2"

# Read stdin for push details (local ref, local sha, remote ref, remote sha)
while read local_ref local_sha remote_ref remote_sha; do
  # Extract branch name from ref
  branch_name=$(echo "$remote_ref" | sed 's|refs/heads/||')

  # Check if this is a protected branch
  for protected in $PROTECTED_BRANCHES; do
    if [ "$branch_name" = "$protected" ]; then

      # Check if this is a force push (non-fast-forward)
      # A force push is detected when the remote sha is not an ancestor of local sha
      if [ "$remote_sha" != "0000000000000000000000000000000000000000" ]; then
        # Check if remote_sha is ancestor of local_sha
        if ! git merge-base --is-ancestor "$remote_sha" "$local_sha" 2>/dev/null; then
          echo ""
          echo "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
          echo "${RED}❌ PUSH BLOCKED: Force push to protected branch${NC}"
          echo "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
          echo ""
          echo "${YELLOW}You are attempting to force push to '${branch_name}'${NC}"
          echo ""
          echo "This operation would:"
          echo "  - Overwrite remote history"
          echo "  - Potentially lose commits from other contributors"
          echo "  - Break other developers' local branches"
          echo ""
          echo "Reference: docs/RECOVERY-PLAN-2026-01-14.md"
          echo ""
          echo "If you REALLY need to do this (emergency only):"
          echo "  1. Create a backup: git branch backup-\$(date +%Y%m%d-%H%M%S)"
          echo "  2. Coordinate with all team members"
          echo "  3. Use: SKIP_GIT_HOOKS=1 git push --force"
          echo ""
          exit 1
        fi
      fi

      # Also warn about direct pushes to main (should use PRs)
      echo ""
      echo "${YELLOW}⚠️  WARNING: Pushing directly to '${branch_name}'${NC}"
      echo ""
      echo "Consider using a pull request instead for:"
      echo "  - Code review"
      echo "  - CI validation before merge"
      echo "  - Clear audit trail"
      echo ""
      echo "See AGENTS.md for the recommended workflow."
      echo ""
    fi
  done
done

exit 0
