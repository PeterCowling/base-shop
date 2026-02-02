#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage:"
  echo "  scripts/agents/integrator-shell.sh -- <command> [args...]"
  echo "  scripts/agents/integrator-shell.sh            # opens an integrator subshell"
  echo ""
  echo "Integrator mode:"
  echo "  - Acquires the Base-Shop writer lock"
  echo "  - Enables the git guard (blocks reset --hard, clean -fd, force push, rebase, amend)"
  echo ""
  echo "Example:"
  echo "  scripts/agents/integrator-shell.sh -- codex"
}

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$repo_root" ]]; then
  echo "ERROR: not inside a git repository" >&2
  exit 1
fi

cd "$repo_root"

writer_lock="${repo_root}/scripts/agents/with-writer-lock.sh"
git_guard="${repo_root}/scripts/agents/with-git-guard.sh"

if [[ ! -x "$writer_lock" ]]; then
  echo "ERROR: missing ${writer_lock}" >&2
  exit 1
fi
if [[ ! -x "$git_guard" ]]; then
  echo "ERROR: missing ${git_guard}" >&2
  exit 1
fi

if [[ $# -eq 0 ]]; then
  if [[ ! -t 0 ]]; then
    echo "ERROR: stdin is not a terminal; cannot open an interactive integrator subshell." >&2
    echo "Run in command mode instead:" >&2
    echo "  scripts/agents/integrator-shell.sh -- <command> [args...]" >&2
    exit 2
  fi
  exec "$writer_lock" -- "$git_guard"
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

# Run the command inside both the writer lock and git guard.
exec "$writer_lock" -- "$git_guard" -- "$@"
