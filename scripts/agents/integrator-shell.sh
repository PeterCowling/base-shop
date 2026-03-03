#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage:"
  echo "  scripts/agents/integrator-shell.sh [options] -- <command> [args...]"
  echo "  scripts/agents/integrator-shell.sh [options]            # opens an integrator subshell"
  echo ""
  echo "Integrator mode:"
  echo "  - Default (write mode): acquires the Base-Shop writer lock"
  echo "  - Read-only mode: enables command guards without taking writer lock"
  echo "  - Enables command guards (git safety + broad-test safety)"
  echo ""
  echo "Options:"
  echo "  --read-only       Guard-only mode (no writer lock; use for long audits/dry-runs)"
  echo "  --write           Force write mode (default)"
  echo "  --timeout <sec>   Lock wait timeout in write mode (default: 300s in non-interactive agents; 0 = wait forever only in interactive shells)"
  echo "  --poll <sec>      Lock polling interval in write mode (default: 30)"
  echo "  --no-wait         Do not wait for lock in write mode"
  echo "  --wait-forever    Wait indefinitely for lock in write mode"
  echo "  -h, --help        Show this help"
  echo ""
  echo "Example:"
  echo "  scripts/agents/integrator-shell.sh -- codex"
  echo "  scripts/agents/integrator-shell.sh --read-only -- codex"
  echo "  scripts/agents/integrator-shell.sh --timeout 15 -- <write-command>"
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

mode="write"
lock_wait="1"
lock_timeout=""
lock_poll=""
command_mode="0"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --read-only|--guard-only)
      mode="read-only"
      shift
      ;;
    --write)
      mode="write"
      shift
      ;;
    --timeout)
      lock_timeout="${2:-}"
      if [[ -z "$lock_timeout" ]]; then
        echo "ERROR: --timeout requires a value in seconds." >&2
        exit 2
      fi
      shift 2
      ;;
    --poll)
      lock_poll="${2:-}"
      if [[ -z "$lock_poll" ]]; then
        echo "ERROR: --poll requires a value in seconds." >&2
        exit 2
      fi
      shift 2
      ;;
    --no-wait)
      lock_wait="0"
      shift
      ;;
    --wait)
      lock_wait="1"
      shift
      ;;
    --wait-forever)
      lock_wait="1"
      lock_timeout="0"
      shift
      ;;
    --)
      command_mode="1"
      shift
      break
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "ERROR: unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

# CI-only test execution policy: export BASESHOP_CI_ONLY_TESTS=1 so all child
# processes (agents, commands) receive the block automatically. The governed runner
# checks this variable and exits 1 with a redirect message when CI is not set.
# GitHub Actions sets CI=true, so the block does not fire in CI environments.
export BASESHOP_CI_ONLY_TESTS=1

if [[ "$mode" == "read-only" ]]; then
  if [[ "$command_mode" == "0" ]]; then
    if [[ ! -t 0 ]]; then
      echo "ERROR: stdin is not a terminal; cannot open an interactive guarded subshell." >&2
      echo "Run in command mode instead:" >&2
      echo "  scripts/agents/integrator-shell.sh --read-only -- <command> [args...]" >&2
      exit 2
    fi
    exec "$git_guard"
  fi

  if [[ $# -eq 0 ]]; then
    usage >&2
    exit 2
  fi
  exec "$git_guard" -- "$@"
fi

if [[ -z "$lock_timeout" ]]; then
  if [[ -n "${BASESHOP_INTEGRATOR_LOCK_TIMEOUT_SEC:-}" ]]; then
    lock_timeout="${BASESHOP_INTEGRATOR_LOCK_TIMEOUT_SEC}"
  else
    # Agents (non-interactive) should not wait indefinitely.
    if [[ ! -t 0 ]]; then
      lock_timeout="300"
    else
      lock_timeout="0"
    fi
  fi
fi
if [[ -z "$lock_poll" ]]; then
  lock_poll="${BASESHOP_INTEGRATOR_LOCK_POLL_SEC:-30}"
fi

if ! [[ "$lock_timeout" =~ ^[0-9]+$ ]]; then
  echo "ERROR: --timeout must be an integer number of seconds (0 or greater)." >&2
  exit 2
fi
if ! [[ "$lock_poll" =~ ^[0-9]+$ ]]; then
  echo "ERROR: --poll must be an integer number of seconds (0 or greater)." >&2
  exit 2
fi

# Non-interactive agents must not wait forever, and must poll (check) periodically.
if [[ ! -t 0 ]]; then
  lock_poll="30"
  if [[ "$lock_wait" == "1" ]]; then
    lock_timeout="300"
  fi
fi

writer_lock_args=(--timeout "$lock_timeout" --poll "$lock_poll")
if [[ "$lock_wait" == "1" ]]; then
  writer_lock_args+=(--wait)
else
  writer_lock_args+=(--no-wait)
fi

if [[ "$command_mode" == "0" ]]; then
  if [[ ! -t 0 ]]; then
    echo "ERROR: stdin is not a terminal; cannot open an interactive integrator subshell." >&2
    echo "Run in command mode instead:" >&2
    echo "  scripts/agents/integrator-shell.sh -- <command> [args...]" >&2
    exit 2
  fi
  exec "$writer_lock" "${writer_lock_args[@]}" -- "$git_guard"
fi

if [[ $# -eq 0 ]]; then
  usage >&2
  exit 2
fi

# Run the command inside both the writer lock and git guard.
exec "$writer_lock" "${writer_lock_args[@]}" -- "$git_guard" -- "$@"
