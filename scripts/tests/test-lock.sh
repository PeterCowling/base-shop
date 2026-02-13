#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/tests/test-lock.sh status
  scripts/tests/test-lock.sh acquire [--wait] [--timeout <sec>] [--poll <sec>] [--command-sig <sig>]
  scripts/tests/test-lock.sh heartbeat [--command-sig <sig>] [--force]
  scripts/tests/test-lock.sh release [--force]
  scripts/tests/test-lock.sh cancel [--ticket <ticket>] [--pid <pid>]
  scripts/tests/test-lock.sh clean-stale [--stale-sec <sec>]

Configuration (env):
  BASESHOP_TEST_LOCK_SCOPE=repo|machine
  BASESHOP_TEST_LOCK_REPO_ROOT=<abs path>      # optional for repo scope
  BASESHOP_TEST_LOCK_MACHINE_ROOT=<abs path>   # optional for machine scope
  BASESHOP_TEST_LOCK_STALE_SEC=<seconds>       # default: 120
  BASESHOP_TEST_LOCK_PID_OVERRIDE=<pid>        # test harness support
EOF
}

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/tests/test-lock-config.sh
source "${script_dir}/test-lock-config.sh"

scope="$(test_lock_scope)"
state_root="$(test_lock_state_root)"
default_stale_sec="$(test_lock_stale_seconds)"

lock_dir="${state_root}/lock"
lock_meta="${lock_dir}/meta"
queue_root="${state_root}/queue"
queue_entries_dir="${queue_root}/entries"
queue_counter_file="${queue_root}/counter"
queue_mutex_dir="${queue_root}/.mutex"
queue_mutex_meta="${queue_mutex_dir}/meta"

cmd="${1:-}"
shift || true

now_utc() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

is_pid_alive() {
  local pid="${1:-}"
  [[ -n "$pid" ]] || return 1
  [[ "$pid" =~ ^[0-9]+$ ]] || return 1
  kill -0 "$pid" 2>/dev/null
}

ensure_queue_dirs() {
  mkdir -p "$queue_entries_dir"
}

read_meta_value() {
  local file_path="$1"
  local key="$2"
  [[ -f "$file_path" ]] || return 1
  local line
  line="$(grep -E "^${key}=" "$file_path" 2>/dev/null | head -n 1 || true)"
  [[ -n "$line" ]] || return 1
  printf '%s' "${line#${key}=}"
}

upsert_meta_value() {
  local file_path="$1"
  local key="$2"
  local value="$3"
  local tmp_path
  tmp_path="${file_path}.tmp.$$"
  local found="0"
  local line
  : >"$tmp_path"

  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$line" == "${key}="* ]]; then
      printf '%s=%s\n' "$key" "$value" >>"$tmp_path"
      found="1"
    else
      printf '%s\n' "$line" >>"$tmp_path"
    fi
  done <"$file_path"

  if [[ "$found" != "1" ]]; then
    printf '%s=%s\n' "$key" "$value" >>"$tmp_path"
  fi

  mv "$tmp_path" "$file_path"
}

queue_mutex_lock() {
  ensure_queue_dirs
  local current_host mutex_host mutex_pid
  current_host="$(hostname -s 2>/dev/null || hostname)"

  while true; do
    if mkdir "$queue_mutex_dir" 2>/dev/null; then
      {
        echo "host=${current_host}"
        echo "pid=$$"
      } >"$queue_mutex_meta"
      return 0
    fi

    mutex_host="$(read_meta_value "$queue_mutex_meta" "host" || true)"
    mutex_pid="$(read_meta_value "$queue_mutex_meta" "pid" || true)"

    if [[ -n "$mutex_host" && "$mutex_host" == "$current_host" && -n "$mutex_pid" ]] && ! is_pid_alive "$mutex_pid"; then
      rm -f "$queue_mutex_meta" || true
      rmdir "$queue_mutex_dir" 2>/dev/null || true
      continue
    fi

    sleep 0.05
  done
}

queue_mutex_unlock() {
  rm -f "$queue_mutex_meta" || true
  rmdir "$queue_mutex_dir" 2>/dev/null || true
}

list_queue_tickets() {
  if [[ ! -d "$queue_entries_dir" ]]; then
    return 0
  fi

  local entry
  for entry in "$queue_entries_dir"/*.meta; do
    [[ -e "$entry" ]] || continue
    basename "$entry" .meta
  done | sort
}

count_queue_tickets() {
  local count="0"
  local current
  while IFS= read -r current; do
    [[ -n "$current" ]] || continue
    count="$((count + 1))"
  done < <(list_queue_tickets)
  echo "$count"
}

queue_head_ticket() {
  list_queue_tickets | head -n 1
}

queue_position_for_ticket() {
  local ticket="$1"
  local idx="0"
  local pos="0"
  local total="0"
  local current

  while IFS= read -r current; do
    [[ -n "$current" ]] || continue
    idx="$((idx + 1))"
    total="$((total + 1))"
    if [[ "$current" == "$ticket" && "$pos" == "0" ]]; then
      pos="$idx"
    fi
  done < <(list_queue_tickets)

  echo "${pos}:${total}"
}

remove_queue_ticket() {
  local ticket="$1"
  [[ -n "$ticket" ]] || return 0
  rm -f "${queue_entries_dir}/${ticket}.meta" || true
}

cleanup_stale_queue_entries() {
  [[ -d "$queue_entries_dir" ]] || return 0
  local current_host
  current_host="$(hostname -s 2>/dev/null || hostname)"
  local entry ticket entry_host entry_pid

  for entry in "$queue_entries_dir"/*.meta; do
    [[ -e "$entry" ]] || continue
    ticket="$(basename "$entry" .meta)"
    entry_host="$(read_meta_value "$entry" "host" || true)"
    entry_pid="$(read_meta_value "$entry" "pid" || true)"
    if [[ -n "$entry_host" && "$entry_host" == "$current_host" && -n "$entry_pid" ]] && ! is_pid_alive "$entry_pid"; then
      rm -f "${queue_entries_dir}/${ticket}.meta" || true
    fi
  done
}

enqueue_waiter() {
  queue_mutex_lock
  cleanup_stale_queue_entries

  local counter="0"
  if [[ -f "$queue_counter_file" ]]; then
    counter="$(cat "$queue_counter_file" 2>/dev/null || true)"
  fi
  if ! [[ "$counter" =~ ^[0-9]+$ ]]; then
    counter="0"
  fi
  counter="$((10#$counter + 1))"
  printf '%012d\n' "$counter" >"$queue_counter_file"
  local ticket
  ticket="$(printf '%012d' "$counter")"

  local user host pid cmd_sig
  user="$(id -un 2>/dev/null || whoami)"
  host="$(hostname -s 2>/dev/null || hostname)"
  pid="${BASESHOP_TEST_LOCK_PID_OVERRIDE:-$PPID}"
  cmd_sig="${1:-unknown}"

  {
    echo "version=1"
    echo "ticket=${ticket}"
    echo "user=${user}"
    echo "host=${host}"
    echo "pid=${pid}"
    echo "command_sig=${cmd_sig}"
    echo "enqueued_at=$(now_utc)"
  } >"${queue_entries_dir}/${ticket}.meta"

  queue_mutex_unlock
  echo "$ticket"
}

queue_allows_attempt() {
  local requester_ticket="${1:-}"
  local head
  head="$(queue_head_ticket)"

  if [[ -z "$head" ]]; then
    return 0
  fi

  if [[ -z "$requester_ticket" ]]; then
    return 1
  fi

  if [[ ! -f "${queue_entries_dir}/${requester_ticket}.meta" ]]; then
    return 1
  fi

  [[ "$head" == "$requester_ticket" ]]
}

acquire_once() {
  local requester_ticket="${1:-}"
  local command_sig="${2:-unknown}"

  if ! queue_allows_attempt "$requester_ticket"; then
    return 2
  fi

  local user host pid now_iso now_epoch
  user="$(id -un 2>/dev/null || whoami)"
  host="$(hostname -s 2>/dev/null || hostname)"
  pid="${BASESHOP_TEST_LOCK_PID_OVERRIDE:-$PPID}"
  now_iso="$(now_utc)"
  now_epoch="$(date +%s)"

  if mkdir "$lock_dir" 2>/dev/null; then
    {
      echo "version=1"
      echo "user=${user}"
      echo "host=${host}"
      echo "pid=${pid}"
      echo "started_at=${now_iso}"
      echo "started_epoch=${now_epoch}"
      echo "heartbeat_at=${now_iso}"
      echo "heartbeat_epoch=${now_epoch}"
      echo "command_sig=${command_sig}"
      echo "scope=${scope}"
      echo "state_root=${state_root}"
    } >"$lock_meta"
    return 0
  fi

  return 1
}

lock_heartbeat_age() {
  local heartbeat_epoch
  heartbeat_epoch="$(read_meta_value "$lock_meta" "heartbeat_epoch" || true)"
  if ! [[ "$heartbeat_epoch" =~ ^[0-9]+$ ]]; then
    echo "999999"
    return 0
  fi

  local now_epoch
  now_epoch="$(date +%s)"
  echo "$((now_epoch - heartbeat_epoch))"
}

break_stale_lock_if_safe() {
  local stale_sec="$1"
  [[ -d "$lock_dir" ]] || return 0

  local lock_host lock_pid
  lock_host="$(read_meta_value "$lock_meta" "host" || true)"
  lock_pid="$(read_meta_value "$lock_meta" "pid" || true)"
  local current_host
  current_host="$(hostname -s 2>/dev/null || hostname)"

  if [[ "$lock_host" != "$current_host" ]]; then
    return 1
  fi

  if [[ -n "$lock_pid" ]] && ! is_pid_alive "$lock_pid"; then
    rm -f "$lock_meta" || true
    rmdir "$lock_dir" 2>/dev/null || true
    return 0
  fi

  local age
  age="$(lock_heartbeat_age)"
  if [[ "$age" =~ ^[0-9]+$ ]] && (( age > stale_sec )); then
    rm -f "$lock_meta" || true
    rmdir "$lock_dir" 2>/dev/null || true
    return 0
  fi

  return 1
}

print_status() {
  local queue_size
  queue_size="$(count_queue_tickets)"

  if [[ ! -d "$lock_dir" ]]; then
    echo "unlocked"
    echo "  scope:      ${scope}"
    echo "  state_root: ${state_root}"
    if [[ "$queue_size" != "0" ]]; then
      echo "  queue_waiters: ${queue_size}"
      echo "  queue_head:    $(queue_head_ticket)"
    fi
    return 0
  fi

  local user host pid started_at heartbeat_at command_sig
  user="$(read_meta_value "$lock_meta" "user" || true)"
  host="$(read_meta_value "$lock_meta" "host" || true)"
  pid="$(read_meta_value "$lock_meta" "pid" || true)"
  started_at="$(read_meta_value "$lock_meta" "started_at" || true)"
  heartbeat_at="$(read_meta_value "$lock_meta" "heartbeat_at" || true)"
  command_sig="$(read_meta_value "$lock_meta" "command_sig" || true)"

  echo "locked"
  echo "  owner:      ${user}@${host} pid=${pid}"
  echo "  started_at: ${started_at}"
  echo "  heartbeat:  ${heartbeat_at}"
  echo "  command:    ${command_sig}"
  echo "  scope:      ${scope}"
  echo "  state_root: ${state_root}"
  if [[ "$queue_size" != "0" ]]; then
    echo "  queue_waiters: ${queue_size}"
    echo "  queue_head:    $(queue_head_ticket)"
  fi
}

parse_int_flag() {
  local name="$1"
  local value="$2"
  if ! [[ "$value" =~ ^[0-9]+$ ]]; then
    echo "ERROR: ${name} must be an integer >= 0" >&2
    exit 2
  fi
}

acquire_cmd() {
  local wait="0"
  local timeout_sec="0"
  local poll_sec="1"
  local command_sig="${BASESHOP_TEST_LOCK_COMMAND_SIG:-unknown}"
  local stale_sec="$default_stale_sec"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --wait)
        wait="1"
        shift
        ;;
      --timeout)
        timeout_sec="${2:-}"
        parse_int_flag "--timeout" "$timeout_sec"
        shift 2
        ;;
      --poll)
        poll_sec="${2:-}"
        parse_int_flag "--poll" "$poll_sec"
        shift 2
        ;;
      --command-sig)
        command_sig="${2:-unknown}"
        shift 2
        ;;
      --stale-sec)
        stale_sec="${2:-}"
        parse_int_flag "--stale-sec" "$stale_sec"
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

  local start_epoch
  start_epoch="$(date +%s)"
  local queue_ticket=""
  cleanup_ticket_on_exit() {
    remove_queue_ticket "$queue_ticket"
  }

  if [[ "$wait" == "1" ]]; then
    queue_ticket="$(enqueue_waiter "$command_sig")"
    trap cleanup_ticket_on_exit EXIT INT TERM
    echo "Joined test queue as ticket ${queue_ticket}" >&2
  fi

  while true; do
    queue_mutex_lock
    cleanup_stale_queue_entries
    queue_mutex_unlock

    if [[ -n "$queue_ticket" && ! -f "${queue_entries_dir}/${queue_ticket}.meta" ]]; then
      echo "ERROR: queue ticket ${queue_ticket} was canceled or cleaned." >&2
      queue_ticket=""
      trap - EXIT INT TERM
      exit 1
    fi

    if acquire_once "$queue_ticket" "$command_sig"; then
      remove_queue_ticket "$queue_ticket"
      queue_ticket=""
      trap - EXIT INT TERM
      exit 0
    fi

    break_stale_lock_if_safe "$stale_sec" || true

    if [[ "$wait" != "1" ]]; then
      echo "ERROR: test lock already held." >&2
      print_status >&2
      exit 1
    fi

    if [[ "$timeout_sec" != "0" ]]; then
      local now_epoch elapsed
      now_epoch="$(date +%s)"
      elapsed="$((now_epoch - start_epoch))"
      if [[ "$elapsed" -ge "$timeout_sec" ]]; then
        echo "ERROR: timed out waiting for test lock (${timeout_sec}s)." >&2
        print_status >&2
        exit 1
      fi
    fi

    local queue_pos queue_place queue_total
    queue_pos="$(queue_position_for_ticket "$queue_ticket")"
    queue_place="${queue_pos%%:*}"
    queue_total="${queue_pos##*:}"
    echo "Waiting for test lock... queue position ${queue_place}/${queue_total} (ticket ${queue_ticket})." >&2
    sleep "$poll_sec"
  done
}

heartbeat_cmd() {
  local force="0"
  local command_sig="${BASESHOP_TEST_LOCK_COMMAND_SIG:-}"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --command-sig)
        command_sig="${2:-}"
        shift 2
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

  if [[ ! -f "$lock_meta" ]]; then
    echo "ERROR: lock is not held." >&2
    exit 1
  fi

  local lock_pid requester_pid
  lock_pid="$(read_meta_value "$lock_meta" "pid" || true)"
  requester_pid="${BASESHOP_TEST_LOCK_PID_OVERRIDE:-$PPID}"
  if [[ "$force" != "1" && "$requester_pid" != "$lock_pid" ]]; then
    echo "ERROR: only lock holder can heartbeat (pid mismatch)." >&2
    exit 1
  fi

  local now_iso now_epoch
  now_iso="$(now_utc)"
  now_epoch="$(date +%s)"

  upsert_meta_value "$lock_meta" "heartbeat_at" "$now_iso"
  upsert_meta_value "$lock_meta" "heartbeat_epoch" "$now_epoch"
  if [[ -n "$command_sig" ]]; then
    upsert_meta_value "$lock_meta" "command_sig" "$command_sig"
  fi
}

release_cmd() {
  local force="0"
  while [[ $# -gt 0 ]]; do
    case "$1" in
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

  if [[ ! -d "$lock_dir" ]]; then
    exit 0
  fi

  if [[ "$force" != "1" ]]; then
    local lock_pid requester_pid
    lock_pid="$(read_meta_value "$lock_meta" "pid" || true)"
    requester_pid="${BASESHOP_TEST_LOCK_PID_OVERRIDE:-$PPID}"
    if [[ "$lock_pid" != "$requester_pid" ]]; then
      echo "ERROR: lock holder pid mismatch; refusing release." >&2
      print_status >&2
      exit 1
    fi
  fi

  rm -f "$lock_meta" || true
  rmdir "$lock_dir" 2>/dev/null || true
}

cancel_cmd() {
  local ticket=""
  local pid=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --ticket)
        ticket="${2:-}"
        shift 2
        ;;
      --pid)
        pid="${2:-}"
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

  queue_mutex_lock
  cleanup_stale_queue_entries

  local removed="0"
  if [[ -n "$ticket" ]]; then
    if [[ -f "${queue_entries_dir}/${ticket}.meta" ]]; then
      remove_queue_ticket "$ticket"
      removed="$((removed + 1))"
    fi
  else
    local target_pid
    target_pid="$pid"
    if [[ -z "$target_pid" ]]; then
      target_pid="${BASESHOP_TEST_LOCK_PID_OVERRIDE:-$PPID}"
    fi

    local entry entry_pid
    for entry in "$queue_entries_dir"/*.meta; do
      [[ -e "$entry" ]] || continue
      entry_pid="$(read_meta_value "$entry" "pid" || true)"
      if [[ "$entry_pid" == "$target_pid" ]]; then
        rm -f "$entry"
        removed="$((removed + 1))"
      fi
    done
  fi

  queue_mutex_unlock
  echo "canceled=${removed}"
}

clean_stale_cmd() {
  local stale_sec="$default_stale_sec"
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --stale-sec)
        stale_sec="${2:-}"
        parse_int_flag "--stale-sec" "$stale_sec"
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

  queue_mutex_lock
  cleanup_stale_queue_entries
  queue_mutex_unlock

  if [[ ! -d "$lock_dir" ]]; then
    print_status
    return 0
  fi

  local lock_host lock_pid current_host
  lock_host="$(read_meta_value "$lock_meta" "host" || true)"
  lock_pid="$(read_meta_value "$lock_meta" "pid" || true)"
  current_host="$(hostname -s 2>/dev/null || hostname)"

  if [[ "$lock_host" != "$current_host" ]]; then
    echo "ERROR: lock held on another host (${lock_host}); refusing cleanup." >&2
    print_status >&2
    return 1
  fi

  if [[ -n "$lock_pid" ]] && ! is_pid_alive "$lock_pid"; then
    rm -f "$lock_meta" || true
    rmdir "$lock_dir" 2>/dev/null || true
    echo "cleaned stale test lock (dead pid ${lock_pid})." >&2
    print_status
    return 0
  fi

  local age
  age="$(lock_heartbeat_age)"
  if [[ "$age" =~ ^[0-9]+$ ]] && (( age > stale_sec )); then
    rm -f "$lock_meta" || true
    rmdir "$lock_dir" 2>/dev/null || true
    echo "cleaned stale test lock (heartbeat age ${age}s > ${stale_sec}s)." >&2
    print_status
    return 0
  fi

  echo "lock-live"
  print_status
}

case "$cmd" in
  status)
    if [[ $# -gt 0 ]]; then
      case "$1" in
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
    fi
    queue_mutex_lock
    cleanup_stale_queue_entries
    queue_mutex_unlock
    print_status
    ;;
  acquire)
    acquire_cmd "$@"
    ;;
  heartbeat)
    heartbeat_cmd "$@"
    ;;
  release)
    release_cmd "$@"
    ;;
  cancel)
    cancel_cmd "$@"
    ;;
  clean-stale)
    clean_stale_cmd "$@"
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
