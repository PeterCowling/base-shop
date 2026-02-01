#!/bin/sh
set -eu

label="${1:-}"
base_ref="${2:-origin/main}"

if [ -z "$label" ]; then
  echo "Usage: scripts/git/new-worktree.sh <label> [base-ref]"
  echo ""
  echo "Examples:"
  echo "  scripts/git/new-worktree.sh codex-hooks"
  echo "  scripts/git/new-worktree.sh claude-cms origin/main"
  echo "  scripts/git/new-worktree.sh hotfix-foo HEAD"
  exit 2
fi

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$repo_root" ]; then
  echo "ERROR: not inside a git repository"
  exit 1
fi

cd "$repo_root"

lock_script="${repo_root}/scripts/git/writer-lock.sh"
if [ -x "$lock_script" ]; then
  # Worktree creation mutates the shared git common dir. Serialize it.
  token="$(BASESHOP_WRITER_LOCK_OWNER_PID="$$" "$lock_script" acquire --wait --print-token)"
  if [ -n "$token" ]; then
    export BASESHOP_WRITER_LOCK_TOKEN="$token"
  fi

  release_lock() {
    "$lock_script" release >/dev/null 2>&1 || true
  }
  trap release_lock EXIT INT TERM
fi

date_str="$(date +%Y-%m-%d)"
slug="$(printf "%s" "$label" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//')"

if [ -z "$slug" ]; then
  echo "ERROR: label produced an empty slug; use only letters/numbers (e.g. codex-hooks)"
  exit 1
fi

branch="work/${date_str}-${slug}"
worktree_dir=".worktrees/${date_str}-${slug}"

if git show-ref --verify --quiet "refs/heads/${branch}"; then
  echo "ERROR: branch already exists: ${branch}"
  exit 1
fi

if [ -e "$worktree_dir" ]; then
  echo "ERROR: worktree path already exists: ${worktree_dir}"
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "NOTE: current worktree has uncommitted changes."
  echo "      This script creates a NEW worktree so parallel work doesn't collide."
fi

git fetch origin >/dev/null 2>&1 || true
mkdir -p .worktrees

git worktree add -b "$branch" "$worktree_dir" "$base_ref"

echo ""
echo "Worktree created:"
echo "  Path:   ${repo_root}/${worktree_dir}"
echo "  Branch: ${branch}"
echo ""
echo "Next:"
echo "  cd \"${repo_root}/${worktree_dir}\""
echo "  pnpm install"
echo "  pnpm exec simple-git-hooks"
