#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage:"
  echo "  scripts/agents/with-git-guard.sh -- <command> [args...]"
  echo "  scripts/agents/with-git-guard.sh            # opens a guarded subshell"
  echo ""
  echo "Prepends scripts/agent-bin/ to PATH so `git` is wrapped with a guard that blocks"
  echo "destructive/history-rewriting commands (e.g. reset --hard, clean -fd, force push)."
  echo ""
  echo "Example:"
  echo "  scripts/agents/with-git-guard.sh -- codex"
}

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$repo_root" ]]; then
  echo "ERROR: not inside a git repository" >&2
  exit 1
fi

cd "$repo_root"

guard_bin="${repo_root}/scripts/agent-bin"
if [[ ! -d "$guard_bin" ]]; then
  echo "ERROR: missing ${guard_bin}" >&2
  exit 1
fi

export PATH="${guard_bin}:${PATH}"

if [[ $# -eq 0 ]]; then
  if [[ ! -t 0 ]]; then
    echo "ERROR: stdin is not a terminal; cannot open an interactive guarded subshell." >&2
    echo "Run in command mode instead:" >&2
    echo "  scripts/agents/with-git-guard.sh -- <command> [args...]" >&2
    exit 2
  fi
  echo "Git guard enabled for this shell (PATH prepended with scripts/agent-bin)." >&2
  echo "Run your agent from here, or exit to disable." >&2
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

exec "$@"
