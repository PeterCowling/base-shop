#!/usr/bin/env bash
set -euo pipefail

# Enforce "single writer" operations when sharing a checkout.
#
# Base-Shop's recommended workflow is one worktree per agent/human (see AGENTS.md).
# When contributors ignore that and operate in the main checkout, this lock prevents
# overlapping writes (commits/pushes/hooks) that can lead to lost work.
#
# Bypass (human only, emergency): SKIP_WRITER_LOCK=1 <git command>

if [[ "${SKIP_WRITER_LOCK:-}" == "1" ]]; then
  exit 0
fi

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$repo_root" ]]; then
  exit 0
fi

cd "$repo_root"

# If the contributor is operating in a linked worktree, do not require the writer lock.
# Worktrees isolate changes (separate working trees + branches) and are the supported
# way to run in parallel.
git_dir="$(git rev-parse --git-dir 2>/dev/null || true)"
case "$git_dir" in
  ""|".git"|*/.git)
    # Primary worktree: enforce.
    ;;
  *)
    # Linked worktree (typically ends with `.git/worktrees/<name>`): skip.
    exit 0
    ;;
esac

# Older Git versions don't support `--path-format=absolute`. Use a compatible fallback
# and make the result absolute if needed.
common_dir="$(git rev-parse --git-common-dir 2>/dev/null || true)"
if [[ -z "$common_dir" ]]; then
  exit 0
fi
if [[ "$common_dir" != /* ]]; then
  common_dir="$(cd "$common_dir" 2>/dev/null && pwd -P || true)"
fi
if [[ -z "$common_dir" ]]; then
  exit 0
fi

lock_dir="${common_dir}/base-shop-writer-lock"
lock_meta="${lock_dir}/meta"

if [[ ! -d "$lock_dir" || ! -f "$lock_meta" ]]; then
  echo "------------------------------------------------------------------" >&2
  echo "BLOCKED: single-writer lock is not held" >&2
  echo "------------------------------------------------------------------" >&2
  echo "" >&2
  echo "This repo may run many agents/humans. If you operate in the main checkout," >&2
  echo "git write operations require holding the writer lock." >&2
  echo "" >&2
  echo "Acquire a writer-locked shell, then retry:" >&2
  echo "  scripts/agents/with-writer-lock.sh" >&2
  echo "" >&2
  echo "Prefer the recommended parallel workflow instead:" >&2
  echo "  scripts/git/new-worktree.sh <label>" >&2
  echo "" >&2
  echo "Status:" >&2
  echo "  scripts/git/writer-lock.sh status" >&2
  echo "" >&2
  exit 1
fi

token_expected="$(grep -E '^token=' "$lock_meta" | sed 's/^token=//' | head -n 1)"
token_actual="${BASESHOP_WRITER_LOCK_TOKEN:-}"

if [[ -z "$token_actual" || "$token_actual" != "$token_expected" ]]; then
  echo "------------------------------------------------------------------" >&2
  echo "BLOCKED: writer lock token missing or mismatched" >&2
  echo "------------------------------------------------------------------" >&2
  echo "" >&2
  echo "A writer lock exists, but your current shell does not own it." >&2
  echo "" >&2
  echo "Current lock:" >&2
  sed -E 's/^token=.*/token=<redacted>/' "$lock_meta" | sed 's/^/  /' >&2 || true
  echo "" >&2
  echo "Status:" >&2
  scripts/git/writer-lock.sh status >&2 || true
  echo "" >&2
  echo "If you're confident this lock is stale on this machine, safely reap it:" >&2
  echo "  scripts/git/writer-lock.sh release --if-stale" >&2
  echo "" >&2
  echo "Resolve by waiting for the lock holder to finish (see Status), then retry:" >&2
  echo "  scripts/agents/with-writer-lock.sh" >&2
  echo "" >&2
  echo "Bypass (human only, emergency): SKIP_WRITER_LOCK=1 <git command>" >&2
  echo "" >&2
  exit 1
fi

exit 0
