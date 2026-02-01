#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/git/writer-lock.sh status
  scripts/git/writer-lock.sh wait [--timeout <sec>] [--poll <sec>]
  scripts/git/writer-lock.sh acquire [--wait] [--timeout <sec>] [--poll <sec>] [--print-token]
  scripts/git/writer-lock.sh release [--if-stale] [--force]

This is a single-writer lock for Base-Shop.
It is designed to prevent multiple agents (or a human + agents) from writing to the same checkout at once.

Notes:
- The lock is stored in the git common dir so it also covers worktrees if any exist.
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

# Older Git versions don't support `--path-format=absolute`. Use a compatible fallback
# and make the result absolute if needed.
common_dir="$(git rev-parse --git-common-dir 2>/dev/null || true)"
if [[ -z "$common_dir" ]]; then
  echo "ERROR: unable to determine git common dir" >&2
  exit 1
fi
if [[ "$common_dir" != /* ]]; then
  common_dir="$(cd "$common_dir" 2>/dev/null && pwd -P || true)"
fi
if [[ -z "$common_dir" ]]; then
  echo "ERROR: unable to determine absolute git common dir" >&2
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
if_stale="0"
print_token="0"

parse_wait_flags() {
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

parse_acquire_flags() {
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
      --print-token)
        print_token="1"
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

parse_release_flags() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --if-stale)
        if_stale="1"
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
  if kill -0 "$pid" 2>/dev/null; then
    return 0
  fi
  # `kill -0` can fail with EPERM for other users' processes; `ps` still indicates existence.
  ps -p "$pid" >/dev/null 2>&1
}

normalize_host() {
  printf "%s" "${1:-}" | tr '[:upper:]' '[:lower:]'
}

current_host_short() {
  hostname -s 2>/dev/null || hostname
}

pid_lstart_fingerprint() {
  local pid="$1"
  if [[ -z "$pid" ]]; then
    return 1
  fi
  if ! [[ "$pid" =~ ^[0-9]+$ ]]; then
    return 1
  fi

  # Prefer a full start time (includes date). Fallback to `start` if `lstart` isn't supported.
  local out
  out="$(ps -p "$pid" -o lstart= 2>/dev/null | head -n 1 | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//')"
  if [[ -z "$out" ]]; then
    out="$(ps -p "$pid" -o start= 2>/dev/null | head -n 1 | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//')"
  fi
  if [[ -z "$out" ]]; then
    return 1
  fi
  printf "%s" "$out"
}

get_stale_reason() {
  if [[ ! -d "$lock_dir" ]]; then
    return 1
  fi

  local grace_sec now_epoch mtime_epoch age
  grace_sec="${BASESHOP_WRITER_LOCK_META_GRACE_SEC:-5}"
  now_epoch="$(date +%s)"
  mtime_epoch="$(dir_mtime_epoch "$lock_dir")"
  age="$((now_epoch - mtime_epoch))"

  if [[ ! -f "$lock_meta" ]]; then
    if [[ "$mtime_epoch" != "0" && "$age" -ge "$grace_sec" ]]; then
      echo "metadata missing (age ${age}s)"
      return 0
    fi
    return 1
  fi

  local lock_host lock_pid current_host
  lock_host="$(read_meta_value "host" || true)"
  lock_pid="$(read_meta_value "pid" || true)"
  current_host="$(current_host_short)"

  if [[ -z "$lock_host" || -z "$lock_pid" ]]; then
    if [[ "$mtime_epoch" != "0" && "$age" -ge "$grace_sec" ]]; then
      echo "metadata incomplete (age ${age}s)"
      return 0
    fi
    return 1
  fi

  if [[ "$(normalize_host "$lock_host")" != "$(normalize_host "$current_host")" ]]; then
    return 1
  fi

  if ! is_pid_alive "$lock_pid"; then
    echo "pid ${lock_pid} is not running on this host"
    return 0
  fi

  local meta_pid_lstart current_pid_lstart
  meta_pid_lstart="$(read_meta_value "pid_lstart" || true)"
  if [[ -n "$meta_pid_lstart" ]]; then
    current_pid_lstart="$(pid_lstart_fingerprint "$lock_pid" || true)"
    if [[ -n "$current_pid_lstart" && "$current_pid_lstart" != "$meta_pid_lstart" ]]; then
      echo "pid ${lock_pid} was reused (start time mismatch)"
      return 0
    fi
  fi

  return 1
}

print_status() {
  if [[ ! -d "$lock_dir" ]]; then
    echo "unlocked"
    return 0
  fi

  if [[ ! -f "$lock_meta" ]]; then
    echo "locked"
    echo "  owner:      <unknown> (metadata missing)"
    echo "  started_at: <unknown>"
    echo "  branch:     <unknown>"
    echo "  cwd:        <unknown>"
    return 0
  fi

  local pid user host started_at branch cwd note
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

  local stale_reason
  if stale_reason="$(get_stale_reason)"; then
    echo "  stale:      yes (${stale_reason})"
    echo "  fix:        scripts/git/writer-lock.sh release --if-stale"
  fi
}

acquire_once() {
  local now user host pid branch cwd token note pid_lstart
  user="$(id -un 2>/dev/null || whoami)"
  host="$(current_host_short)"
  # Prefer an explicit owner PID (wrapper script), otherwise fall back to our parent PID.
  pid="${BASESHOP_WRITER_LOCK_OWNER_PID:-${PPID:-$$}}"
  now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  cwd="$(pwd)"
  token="$(LC_ALL=C tr -dc 'a-f0-9' </dev/urandom | head -c 32)"
  note="${BASESHOP_WRITER_LOCK_NOTE:-}"
  pid_lstart="$(pid_lstart_fingerprint "$pid" || true)"

  if mkdir "$lock_dir" 2>/dev/null; then
    local tmp_meta
    tmp_meta="${lock_meta}.tmp"
    {
      echo "version=1"
      echo "token=${token}"
      echo "user=${user}"
      echo "host=${host}"
      echo "pid=${pid}"
      if [[ -n "$pid_lstart" ]]; then
        echo "pid_lstart=${pid_lstart}"
      fi
      echo "started_at=${now}"
      echo "branch=${branch}"
      echo "cwd=${cwd}"
      if [[ -n "$note" ]]; then
        echo "note=${note}"
      fi
    } >"$tmp_meta"
    mv -f "$tmp_meta" "$lock_meta"
    if [[ "$print_token" == "1" ]]; then
      echo "$token"
    fi
    return 0
  fi

  return 1
}

dir_mtime_epoch() {
  local dir="$1"
  local out
  out="$(stat -c %Y "$dir" 2>/dev/null || true)"
  if [[ -z "$out" ]]; then
    out="$(stat -f %m "$dir" 2>/dev/null || true)"
  fi
  echo "${out:-0}"
}

break_stale_lock_if_safe() {
  if [[ ! -d "$lock_dir" ]]; then
    return 0
  fi

  # If metadata is missing or incomplete, treat this as a potentially interrupted
  # acquisition. Wait a short grace period, then reap it as stale on this machine.
  if [[ ! -f "$lock_meta" ]]; then
    local grace_sec now_epoch mtime_epoch age
    grace_sec="${BASESHOP_WRITER_LOCK_META_GRACE_SEC:-5}"
    now_epoch="$(date +%s)"
    mtime_epoch="$(dir_mtime_epoch "$lock_dir")"
    age="$((now_epoch - mtime_epoch))"
    if [[ "$mtime_epoch" != "0" && "$age" -ge "$grace_sec" ]]; then
      rm -f "${lock_dir}/meta" "${lock_dir}/meta.tmp" 2>/dev/null || true
      rmdir "$lock_dir" 2>/dev/null || true
      return 0
    fi
    return 1
  fi

  local lock_host lock_pid
  lock_host="$(read_meta_value "host" || true)"
  lock_pid="$(read_meta_value "pid" || true)"
  local current_host
  current_host="$(current_host_short)"

  # Corrupt or incomplete metadata: treat similarly to missing meta after grace.
  if [[ -z "$lock_host" || -z "$lock_pid" ]]; then
    local grace_sec now_epoch mtime_epoch age
    grace_sec="${BASESHOP_WRITER_LOCK_META_GRACE_SEC:-5}"
    now_epoch="$(date +%s)"
    mtime_epoch="$(dir_mtime_epoch "$lock_dir")"
    age="$((now_epoch - mtime_epoch))"
    if [[ "$mtime_epoch" != "0" && "$age" -ge "$grace_sec" ]]; then
      rm -f "$lock_meta" || true
      rmdir "$lock_dir" 2>/dev/null || true
      return 0
    fi
    return 1
  fi

  # Only auto-recover stale locks created on this machine.
  if [[ "$(normalize_host "$lock_host")" == "$(normalize_host "$current_host")" && -n "$lock_pid" ]]; then
    # Case 1: PID is dead.
    if ! is_pid_alive "$lock_pid"; then
      rm -f "$lock_meta" || true
      rmdir "$lock_dir" 2>/dev/null || true
      return 0
    fi

    # Case 2: PID exists, but was reused since the lock was created (start time mismatch).
    local meta_pid_lstart current_pid_lstart
    meta_pid_lstart="$(read_meta_value "pid_lstart" || true)"
    if [[ -n "$meta_pid_lstart" ]]; then
      current_pid_lstart="$(pid_lstart_fingerprint "$lock_pid" || true)"
      if [[ -n "$current_pid_lstart" && "$current_pid_lstart" != "$meta_pid_lstart" ]]; then
        rm -f "$lock_meta" || true
        rmdir "$lock_dir" 2>/dev/null || true
        return 0
      fi
    fi
  fi

  return 1
}

case "$cmd" in
  status)
    print_status
    ;;

  wait)
    parse_wait_flags "$@"
    start_epoch="$(date +%s)"
    while [[ -d "$lock_dir" ]]; do
      break_stale_lock_if_safe || true
      if [[ ! -d "$lock_dir" ]]; then
        exit 0
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

  acquire)
    parse_acquire_flags "$@"
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
        echo "To clear stale (safe): scripts/git/writer-lock.sh release --if-stale" >&2
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
    parse_release_flags "$@"

    if [[ ! -d "$lock_dir" ]]; then
      exit 0
    fi

    if [[ "$force" != "1" && "$if_stale" == "1" ]]; then
      if break_stale_lock_if_safe; then
        exit 0
      fi
      echo "ERROR: writer lock does not appear stale; refusing to release without a token." >&2
      print_status >&2
      exit 1
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
