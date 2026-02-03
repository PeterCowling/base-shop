#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage:"
  echo "  scripts/agents/with-writer-lock.sh -- <command> [args...]"
  echo "  scripts/agents/with-writer-lock.sh            # opens a locked subshell"
  echo ""
  echo "Acquires the Base-Shop single-writer lock and exports BASESHOP_WRITER_LOCK_TOKEN"
  echo "for child processes (git hooks use this to enforce single-writer commits/pushes)."
}

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$repo_root" ]]; then
  echo "ERROR: not inside a git repository" >&2
  exit 1
fi

cd "$repo_root"

lock_script="${repo_root}/scripts/git/writer-lock.sh"
if [[ ! -x "$lock_script" ]]; then
  echo "ERROR: missing ${lock_script}" >&2
  exit 1
fi

"$lock_script" acquire --wait

common_dir="$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null || true)"
lock_meta="${common_dir}/base-shop-writer-lock/meta"
token="$(grep -E '^token=' "$lock_meta" | sed 's/^token=//' | head -n 1)"

if [[ -z "$token" ]]; then
  echo "ERROR: lock acquired but token missing; refusing to continue." >&2
  exit 1
fi

export BASESHOP_WRITER_LOCK_TOKEN="$token"

release_lock() {
  "$lock_script" release || true
}

trap release_lock EXIT INT TERM

if [[ $# -eq 0 ]]; then
  if [[ ! -t 0 ]]; then
    echo "ERROR: stdin is not a terminal; cannot open an interactive locked subshell." >&2
    echo "Run in command mode instead:" >&2
    echo "  scripts/agents/with-writer-lock.sh -- <command> [args...]" >&2
    exit 2
  fi
  echo "Writer lock held for this shell. Exit to release." >&2
  exec bash
fi

if [[ "${1:-}" != "--" ]]; then
  usage >&2
  exit 2
fi

shift
if [[ $# -eq 0 ]]; then
  usage >&2
  exit 2
fi

"$@"
