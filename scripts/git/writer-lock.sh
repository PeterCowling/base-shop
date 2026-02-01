#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/git/writer-lock.sh status
  scripts/git/writer-lock.sh acquire [--wait] [--timeout <sec>] [--poll <sec>] [--force]
  scripts/git/writer-lock.sh release [--force]

This is a single-writer lock for Base-Shop.
It is designed to prevent multiple agents (or a human + agents) from writing to the same checkout at once.

Notes:
- The lock is stored in the git common dir so it covers all checkouts that share a git dir.
- To use the lock conveniently (and export the token), prefer:
    scripts/agents/with-writer-lock.sh
EOF
}

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$repo_root" ]]; then
  echo "ERROR: not inside a git repository" >&2
  exit 1
fi

cd "$repo_root"

common_dir="$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null || true)"
if [[ -z "$common_dir" ]]; then
  echo "ERROR: unable to determine git common dir" >&2
  exit 1
fi

lock_dir="${common_dir}/base-shop-writer-lock"
lock_meta="${lock_dir}/meta"

cmd="${1:-}"
shift || true

poll_sec="2"
timeout_sec="0"
wait="0"
force="0"

parse_common_flags() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --poll)
        poll_sec="${2:-}"
        shift 2
        ;;
      --timeout)
        timeout_sec="${2:-}"
        shift 2
        ;;
      --wait)
        wait="1"
        shift
        ;;
      --force)
        force="1"
        shift
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
}

read_meta_value() {
  local key="$1"
  if [[ ! -f "$lock_meta" ]]; then
    return 1
  fi
  grep -E "^${key}=" "$lock_meta" | sed "s/^${key}=//" | head -n 1
}

is_pid_alive() {
  local pid="$1"
  if [[ -z "$pid" ]]; then
    return 1
  fi
  if ! [[ "$pid" =~ ^[0-9]+$ ]]; then
    return 1
  fi
  kill -0 "$pid" 2>/dev/null
}

print_status() {
  if [[ ! -d "$lock_dir" ]]; then
    echo "unlocked"
    return 0
  fi

  local token pid user host started_at branch cwd note
  token="$(read_meta_value "token" || true)"
  pid="$(read_meta_value "pid" || true)"
  user="$(read_meta_value "user" || true)"
  host="$(read_meta_value "host" || true)"
  started_at="$(read_meta_value "started_at" || true)"
  branch="$(read_meta_value "branch" || true)"
  cwd="$(read_meta_value "cwd" || true)"
  note="$(read_meta_value "note" || true)"

  echo "locked"
  echo "  owner:      ${user}@${host} pid=${pid}"
  echo "  started_at: ${started_at}"
  echo "  branch:     ${branch}"
  echo "  cwd:        ${cwd}"
  if [[ -n "$note" ]]; then
    echo "  note:       ${note}"
  fi
  if [[ -n "$token" ]]; then
    echo "  token:      ${token}"
  fi
}

acquire_once() {
  local now user host pid branch cwd token note
  user="$(id -un 2>/dev/null || whoami)"
  host="$(hostname -s 2>/dev/null || hostname)"
  # Use the parent PID as the lock-holder PID. The writer-lock script itself exits quickly,
  # but the parent process (shell, agent runner, etc.) represents the actual lock owner.
  pid="${BASESHOP_WRITER_LOCK_PID_OVERRIDE:-$PPID}"
  now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  cwd="$(pwd)"
  token="$(LC_ALL=C tr -dc 'a-f0-9' </dev/urandom | head -c 32)"
  note="${BASESHOP_WRITER_LOCK_NOTE:-}"

  if mkdir "$lock_dir" 2>/dev/null; then
    {
      echo "version=1"
      echo "token=${token}"
      echo "user=${user}"
      echo "host=${host}"
      echo "pid=${pid}"
      echo "started_at=${now}"
      echo "branch=${branch}"
      echo "cwd=${cwd}"
      if [[ -n "$note" ]]; then
        echo "note=${note}"
      fi
    } >"$lock_meta"
    return 0
  fi

  return 1
}

break_stale_lock_if_safe() {
  if [[ ! -d "$lock_dir" ]]; then
    return 0
  fi

  local lock_host lock_pid
  lock_host="$(read_meta_value "host" || true)"
  lock_pid="$(read_meta_value "pid" || true)"
  local current_host
  current_host="$(hostname -s 2>/dev/null || hostname)"

  # Only auto-recover stale locks created on this machine, and only if the PID is dead.
  if [[ "$lock_host" == "$current_host" && -n "$lock_pid" ]] && ! is_pid_alive "$lock_pid"; then
    rm -f "$lock_meta" || true
    rmdir "$lock_dir" 2>/dev/null || true
    return 0
  fi

  return 1
}

case "$cmd" in
  status)
    print_status
    ;;

  acquire)
    parse_common_flags "$@"
    start_epoch="$(date +%s)"

    while true; do
      if acquire_once; then
        exit 0
      fi

      # If the lock is stale (e.g., previous process crashed), recover it automatically.
      break_stale_lock_if_safe || true

      if [[ "$wait" != "1" ]]; then
        echo "ERROR: writer lock is already held." >&2
        print_status >&2
        echo "" >&2
        echo "To wait:    scripts/git/writer-lock.sh acquire --wait" >&2
        echo "To force:   scripts/git/writer-lock.sh release --force   (human only)" >&2
        exit 1
      fi

      if [[ "$timeout_sec" != "0" ]]; then
        now_epoch="$(date +%s)"
        elapsed="$((now_epoch - start_epoch))"
        if [[ "$elapsed" -ge "$timeout_sec" ]]; then
          echo "ERROR: timed out waiting for writer lock (${timeout_sec}s)" >&2
          print_status >&2
          exit 1
        fi
      fi

      echo "Waiting for writer lock..." >&2
      print_status >&2
      sleep "$poll_sec"
    done
    ;;

  release)
    parse_common_flags "$@"

    if [[ ! -d "$lock_dir" ]]; then
      exit 0
    fi

    token_expected="$(read_meta_value "token" || true)"
    token_actual="${BASESHOP_WRITER_LOCK_TOKEN:-}"

    if [[ "$force" != "1" ]]; then
      if [[ -z "$token_actual" ]]; then
        echo "ERROR: BASESHOP_WRITER_LOCK_TOKEN is not set; refusing to release lock." >&2
        print_status >&2
        exit 1
      fi
      if [[ -n "$token_expected" && "$token_actual" != "$token_expected" ]]; then
        echo "ERROR: lock token mismatch; refusing to release lock." >&2
        print_status >&2
        exit 1
      fi
    fi

    rm -f "$lock_meta" || true
    rmdir "$lock_dir" 2>/dev/null || true
    ;;

  ""|-h|--help)
    usage
    ;;

  *)
    echo "ERROR: unknown command: ${cmd}" >&2
    usage >&2
    exit 2
    ;;
esac
