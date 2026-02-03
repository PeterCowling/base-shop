#!/usr/bin/env bash
set -euo pipefail

# simple-git-hooks installs into <projectRoot>/.git/hooks unless core.hooksPath is set.
# In git worktrees, .git is a file (gitdir pointer), so <projectRoot>/.git/hooks is not a directory.
# This script ensures core.hooksPath points at the real hooks directory so installs work everywhere.

if [[ "${SKIP_SIMPLE_GIT_HOOKS:-}" == "1" ]]; then
  exit 0
fi

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$repo_root" ]]; then
  exit 0
fi

cd "$repo_root"

common_dir="$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null || true)"
if [[ -z "$common_dir" ]]; then
  exit 0
fi

hooks_dir="${common_dir}/hooks"
mkdir -p "$hooks_dir"

existing_hooks_path="$(git config --local --get core.hooksPath 2>/dev/null || true)"

if [[ -z "$existing_hooks_path" || "$existing_hooks_path" == ".git/hooks"* ]]; then
  git config --local core.hooksPath "$hooks_dir"
fi

pnpm exec simple-git-hooks

