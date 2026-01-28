#!/usr/bin/env bash
set -euo pipefail

# Setup dedicated worktree for Business OS write operations
# Phase 0: Local-only, work/business-os-store branch

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
WORKTREE_PATH="$REPO_ROOT/../base-shop-business-os-store"
WORK_BRANCH="work/business-os-store"

echo "Business OS Worktree Setup"
echo "=========================="
echo ""
echo "Repository: $REPO_ROOT"
echo "Worktree:   $WORKTREE_PATH"
echo "Branch:     $WORK_BRANCH"
echo ""

# Check if worktree already exists
if [ -d "$WORKTREE_PATH" ]; then
  echo "✓ Worktree already exists at $WORKTREE_PATH"

  # Check if it's on the correct branch
  cd "$WORKTREE_PATH"
  CURRENT_BRANCH=$(git branch --show-current)
  if [ "$CURRENT_BRANCH" != "$WORK_BRANCH" ]; then
    echo "⚠️  Worktree is on branch '$CURRENT_BRANCH' but should be on '$WORK_BRANCH'"
    echo "   Switching to $WORK_BRANCH..."
    git checkout -B "$WORK_BRANCH"
  fi

  # Check if it's clean
  if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Worktree has uncommitted changes"
    git status --short
  else
    echo "✓ Worktree is clean"
  fi

  cd "$REPO_ROOT"
  exit 0
fi

echo "Creating worktree..."

# Create work branch if it doesn't exist
cd "$REPO_ROOT"
if ! git show-ref --verify --quiet "refs/heads/$WORK_BRANCH"; then
  echo "Creating branch $WORK_BRANCH..."
  git branch "$WORK_BRANCH"
fi

# Create worktree
git worktree add "$WORKTREE_PATH" "$WORK_BRANCH"

echo ""
echo "✓ Worktree created successfully"
echo ""
echo "Worktree location: $WORKTREE_PATH"
echo "Branch: $WORK_BRANCH"
echo ""
echo "You can now run the Business OS app:"
echo "  pnpm --filter @apps/business-os dev"
echo ""
