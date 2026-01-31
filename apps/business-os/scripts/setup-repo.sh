#!/usr/bin/env bash
set -euo pipefail

# Setup repo for Business OS write operations (no worktrees).
#
# Ensures:
# - We are inside a git repo
# - The `dev` branch exists and is checked out
#
# Notes:
# - This does not acquire the writer lock; it only prepares git state.
# - For multi-agent safety when writing, use: scripts/agents/integrator-shell.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

echo "Business OS Repo Setup"
echo "======================"
echo ""
echo "Repository: $REPO_ROOT"
echo ""

cd "$REPO_ROOT"

git rev-parse --show-toplevel >/dev/null 2>&1 || {
  echo "ERROR: not inside a git repository: $REPO_ROOT" >&2
  exit 1
}

git fetch origin --prune >/dev/null 2>&1 || true

if ! git show-ref --verify --quiet "refs/heads/dev"; then
  if git show-ref --verify --quiet "refs/remotes/origin/main"; then
    echo "Creating local branch dev from origin/main..."
    git checkout -b dev origin/main
  else
    echo "Creating local branch dev..."
    git checkout -b dev
  fi
fi

current_branch="$(git branch --show-current)"
if [[ "$current_branch" != "dev" ]]; then
  echo "Switching to dev..."
  git checkout dev
fi

echo ""
echo "✓ Repo ready for Business OS writes (on branch dev)."
echo ""
echo "Recommended for write sessions:"
echo "  scripts/agents/integrator-shell.sh -- <agent>"
echo ""
