#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage:"
  echo "  scripts/agents/with-writer-lock.sh [options] -- <command> [args...]"
  echo "  scripts/agents/with-writer-lock.sh [options]            # opens a locked subshell"
  echo ""
  echo "Acquires the Base-Shop single-writer lock and exports BASESHOP_WRITER_LOCK_TOKEN"
  echo "for child processes (git hooks use this to enforce single-writer commits/pushes)."
  echo ""
  echo "Options:"
  echo "  --timeout <sec>   Wait timeout while acquiring lock (0 = wait forever, default: 0)"
  echo "  --poll <sec>      Poll interval while waiting (default: 2)"
  echo "  --no-wait         Do not wait; fail immediately if lock is held"
  echo "  --wait            Wait for lock (default)"
  echo "  --wait-forever    Equivalent to --wait --timeout 0"
  echo "  -h, --help        Show this help"
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

wait_for_lock="1"
timeout_sec="${BASESHOP_WRITER_LOCK_TIMEOUT_SEC:-0}"
poll_sec="${BASESHOP_WRITER_LOCK_POLL_SEC:-2}"
command_mode="0"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --timeout)
      timeout_sec="${2:-}"
      if [[ -z "$timeout_sec" ]]; then
        echo "ERROR: --timeout requires a value in seconds." >&2
        exit 2
      fi
      shift 2
      ;;
    --poll)
      poll_sec="${2:-}"
      if [[ -z "$poll_sec" ]]; then
        echo "ERROR: --poll requires a value in seconds." >&2
        exit 2
      fi
      shift 2
      ;;
    --no-wait)
      wait_for_lock="0"
      shift
      ;;
    --wait)
      wait_for_lock="1"
      shift
      ;;
    --wait-forever)
      wait_for_lock="1"
      timeout_sec="0"
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

if ! [[ "$timeout_sec" =~ ^[0-9]+$ ]]; then
  echo "ERROR: --timeout must be an integer number of seconds (0 or greater)." >&2
  exit 2
fi
if ! [[ "$poll_sec" =~ ^[0-9]+$ ]]; then
  echo "ERROR: --poll must be an integer number of seconds (0 or greater)." >&2
  exit 2
fi

acquire_args=(acquire --timeout "$timeout_sec" --poll "$poll_sec")
if [[ "$wait_for_lock" == "1" ]]; then
  acquire_args+=(--wait)
fi

if ! "$lock_script" "${acquire_args[@]}"; then
  if [[ "$wait_for_lock" == "1" && "$timeout_sec" != "0" ]]; then
    echo "Hint: for read-only work, use: scripts/agents/integrator-shell.sh --read-only -- <command>" >&2
    echo "Hint: to wait indefinitely, add: --wait-forever (or --timeout 0)" >&2
  fi
  exit 1
fi

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

if [[ "$command_mode" == "0" ]]; then
  if [[ ! -t 0 ]]; then
    echo "ERROR: stdin is not a terminal; cannot open an interactive locked subshell." >&2
    echo "Run in command mode instead:" >&2
    echo "  scripts/agents/with-writer-lock.sh -- <command> [args...]" >&2
    exit 2
  fi
  echo "Writer lock held for this shell. Exit to release." >&2
  exec bash
fi

if [[ $# -eq 0 ]]; then
  usage >&2
  exit 2
fi

"$@"
