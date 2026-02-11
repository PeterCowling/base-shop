#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/git/writer-lock.sh status [--print-token]
  scripts/git/writer-lock.sh acquire [--wait] [--timeout <sec>] [--poll <sec>] [--force]
  scripts/git/writer-lock.sh clean-stale
  scripts/git/writer-lock.sh release [--force]

This is a single-writer lock for Base-Shop.
It is designed to prevent multiple agents (or a human + agents) from writing to the same checkout at once.

Notes:
- The lock is stored in the git common dir so it covers all checkouts that share a git dir.
- `acquire --wait` uses a FIFO queue (first-come, first-served).
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
queue_root="${common_dir}/base-shop-writer-lock-queue"
queue_entries_dir="${queue_root}/entries"
queue_counter_file="${queue_root}/counter"
queue_mutex_dir="${queue_root}/.mutex"
queue_mutex_meta="${queue_mutex_dir}/meta"

cmd="${1:-}"
shift || true

poll_sec="2"
timeout_sec="0"
wait="0"
force="0"
print_token="0"

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

ensure_queue_dirs() {
  mkdir -p "$queue_entries_dir"
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

    mutex_host="$(grep -E '^host=' "$queue_mutex_meta" 2>/dev/null | sed 's/^host=//' | head -n 1 || true)"
    mutex_pid="$(grep -E '^pid=' "$queue_mutex_meta" 2>/dev/null | sed 's/^pid=//' | head -n 1 || true)"

    if [[ -n "$mutex_host" && "$mutex_host" == "$current_host" && -n "$mutex_pid" ]] && ! is_pid_alive "$mutex_pid"; then
      rm -f "$queue_mutex_meta" || true
      rmdir "$queue_mutex_dir" 2>/dev/null || true
      continue
    fi

    sleep 0.1
  done
}

queue_mutex_unlock() {
  rm -f "$queue_mutex_meta" || true
  rmdir "$queue_mutex_dir" 2>/dev/null || true
}

read_queue_entry_value() {
  local entry_path="$1"
  local key="$2"
  if [[ ! -f "$entry_path" ]]; then
    return 1
  fi
  grep -E "^${key}=" "$entry_path" | sed "s/^${key}=//" | head -n 1
}

list_queue_tickets() {
  if [[ ! -d "$queue_entries_dir" ]]; then
    return 0
  fi

  for entry in "$queue_entries_dir"/*.meta; do
    [[ -e "$entry" ]] || continue
    basename "$entry" .meta
  done | sort
}

count_queue_tickets() {
  local count="0"
  local _ticket
  while IFS= read -r _ticket; do
    [[ -n "$_ticket" ]] || continue
    count="$((count + 1))"
  done < <(list_queue_tickets)
  echo "$count"
}

remove_queue_ticket() {
  local ticket="$1"
  if [[ -z "$ticket" ]]; then
    return 0
  fi
  rm -f "${queue_entries_dir}/${ticket}.meta" || true
}

cleanup_stale_queue_entries() {
  if [[ ! -d "$queue_entries_dir" ]]; then
    return 0
  fi

  local current_host entry ticket entry_host entry_pid
  current_host="$(hostname -s 2>/dev/null || hostname)"
  for entry in "$queue_entries_dir"/*.meta; do
    [[ -e "$entry" ]] || continue
    ticket="$(basename "$entry" .meta)"
    entry_host="$(read_queue_entry_value "$entry" "host" || true)"
    entry_pid="$(read_queue_entry_value "$entry" "pid" || true)"

    if [[ -n "$entry_host" && "$entry_host" == "$current_host" && -n "$entry_pid" ]] && ! is_pid_alive "$entry_pid"; then
      rm -f "${queue_entries_dir}/${ticket}.meta" || true
    fi
  done
}

queue_head_ticket() {
  local first=""
  first="$(list_queue_tickets | head -n 1)"
  echo "$first"
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

enqueue_waiter() {
  local user host pid branch cwd note now counter ticket
  user="$(id -un 2>/dev/null || whoami)"
  host="$(hostname -s 2>/dev/null || hostname)"
  pid="${BASESHOP_WRITER_LOCK_PID_OVERRIDE:-$PPID}"
  branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  cwd="$(pwd)"
  note="${BASESHOP_WRITER_LOCK_NOTE:-}"
  now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  queue_mutex_lock
  counter="0"
  if [[ -f "$queue_counter_file" ]]; then
    counter="$(cat "$queue_counter_file" 2>/dev/null || true)"
  fi
  if ! [[ "$counter" =~ ^[0-9]+$ ]]; then
    counter="0"
  fi
  counter="$((10#$counter + 1))"
  printf '%012d\n' "$counter" >"$queue_counter_file"
  ticket="$(printf '%012d' "$counter")"
  {
    echo "version=1"
    echo "ticket=${ticket}"
    echo "user=${user}"
    echo "host=${host}"
    echo "pid=${pid}"
    echo "branch=${branch}"
    echo "cwd=${cwd}"
    echo "enqueued_at=${now}"
    if [[ -n "$note" ]]; then
      echo "note=${note}"
    fi
  } >"${queue_entries_dir}/${ticket}.meta"
  queue_mutex_unlock

  echo "$ticket"
}

queue_allows_attempt() {
  local requester_ticket="${1:-}"
  local head

  # DS-02: If the requester has a ticket but it was cleaned (orphan scenario),
  # deny the attempt. This prevents orphaned waiters (whose parent PID died
  # and whose ticket was removed by cleanup_stale_queue_entries) from acquiring
  # the lock when the queue becomes empty.
  if [[ -n "$requester_ticket" && ! -f "${queue_entries_dir}/${requester_ticket}.meta" ]]; then
    return 1
  fi

  head="$(queue_head_ticket)"
  if [[ -z "$head" ]]; then
    return 0
  fi

  if [[ -z "$requester_ticket" ]]; then
    return 1
  fi

  if [[ "$head" == "$requester_ticket" ]]; then
    return 0
  fi

  return 1
}

parse_status_flags() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
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
  local reveal_token="${1:-0}"
  local queue_size
  # Skip mutex for status reads (DS-05). Status is observability-only; slightly
  # stale queue data during contention is acceptable vs. hanging forever when
  # the mutex is held by another process.
  queue_size="$(count_queue_tickets)"
  if [[ ! -d "$lock_dir" ]]; then
    echo "unlocked"
    if [[ "$queue_size" != "0" ]]; then
      echo "  queue_waiters: ${queue_size}"
      echo "  queue_head:    $(queue_head_ticket)"
    fi
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
    if [[ "$reveal_token" == "1" ]]; then
      echo "  token:      ${token}"
    else
      echo "  token:      <redacted> (use --print-token to reveal)"
    fi
  fi
  if [[ "$queue_size" != "0" ]]; then
    echo "  queue_waiters: ${queue_size}"
    echo "  queue_head:    $(queue_head_ticket)"
  fi
}

acquire_once() {
  local requester_ticket="${1:-}"
  local now user host pid branch cwd token note

  if ! queue_allows_attempt "$requester_ticket"; then
    return 2
  fi

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

clean_stale_lock() {
  if [[ ! -d "$lock_dir" ]]; then
    queue_mutex_lock
    cleanup_stale_queue_entries
    queue_mutex_unlock
    echo "unlocked"
    return 0
  fi

  local lock_host lock_pid lock_user
  lock_host="$(read_meta_value "host" || true)"
  lock_pid="$(read_meta_value "pid" || true)"
  lock_user="$(read_meta_value "user" || true)"
  local current_host
  current_host="$(hostname -s 2>/dev/null || hostname)"

  if [[ "$lock_host" != "$current_host" ]]; then
    echo "ERROR: writer lock is owned by ${lock_user}@${lock_host}; refusing stale cleanup across hosts." >&2
    print_status >&2
    return 1
  fi

  if [[ -z "$lock_pid" || ! "$lock_pid" =~ ^[0-9]+$ ]]; then
    echo "ERROR: writer lock PID is missing or invalid; refusing stale cleanup." >&2
    print_status >&2
    return 1
  fi

  if is_pid_alive "$lock_pid"; then
    echo "ERROR: writer lock is held by a live process (pid ${lock_pid}); stale cleanup refused." >&2
    print_status >&2
    return 1
  fi

  rm -f "$lock_meta" || true
  rmdir "$lock_dir" 2>/dev/null || true
  queue_mutex_lock
  cleanup_stale_queue_entries
  queue_mutex_unlock
  echo "cleaned stale writer lock (dead pid ${lock_pid} on ${lock_host})" >&2
  echo "unlocked"
  return 0
}

case "$cmd" in
  status)
    parse_status_flags "$@"
    print_status "$print_token"
    ;;

  acquire)
    parse_common_flags "$@"
    start_epoch="$(date +%s)"
    queue_ticket=""
    queue_cleanup_trap() {
      remove_queue_ticket "$queue_ticket"
    }

    if [[ "$wait" == "1" ]]; then
      queue_mutex_lock
      cleanup_stale_queue_entries
      queue_mutex_unlock
      queue_ticket="$(enqueue_waiter)"
      trap queue_cleanup_trap EXIT INT TERM
      echo "Joined writer queue as ticket ${queue_ticket}" >&2
    fi

    while true; do
      queue_mutex_lock
      cleanup_stale_queue_entries
      queue_mutex_unlock

      # DS-02: If our own ticket was cleaned (parent PID died), exit immediately
      # rather than attempting to acquire as an orphan.
      if [[ -n "$queue_ticket" && ! -f "${queue_entries_dir}/${queue_ticket}.meta" ]]; then
        echo "ERROR: queue ticket ${queue_ticket} was cleaned (owner PID likely dead); exiting." >&2
        queue_ticket=""
        trap - EXIT INT TERM
        exit 1
      fi

      if acquire_once "$queue_ticket"; then
        remove_queue_ticket "$queue_ticket"
        queue_ticket=""
        trap - EXIT INT TERM
        exit 0
      fi

      # If the lock is stale (e.g., previous process crashed), recover it automatically.
      break_stale_lock_if_safe || true

      if [[ "$wait" != "1" ]]; then
        queue_mutex_lock
        cleanup_stale_queue_entries
        queue_mutex_unlock
        if [[ "$(count_queue_tickets)" != "0" ]]; then
          echo "ERROR: writer lock queue has waiting writers; refusing non-wait acquire." >&2
          echo "Join queue with: scripts/git/writer-lock.sh acquire --wait" >&2
          print_status >&2
          exit 1
        fi
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
          if [[ -n "$queue_ticket" ]]; then
            queue_pos="$(queue_position_for_ticket "$queue_ticket")"
            queue_place="${queue_pos%%:*}"
            queue_total="${queue_pos##*:}"
            echo "Queue position at timeout: ${queue_place}/${queue_total}" >&2
          fi
          print_status >&2
          exit 1
        fi
      fi

      queue_pos="$(queue_position_for_ticket "$queue_ticket")"
      queue_place="${queue_pos%%:*}"
      queue_total="${queue_pos##*:}"
      if [[ "$queue_place" == "0" ]]; then
        echo "Waiting for writer lock... queue position unknown (rejoining may be needed)." >&2
      else
        echo "Waiting for writer lock... queue position ${queue_place}/${queue_total} (ticket ${queue_ticket})." >&2
      fi
      print_status >&2
      sleep "$poll_sec"
    done
    ;;

  clean-stale)
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
    clean_stale_lock
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
