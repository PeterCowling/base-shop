#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
runner_shaping_script="${script_dir}/runner-shaping.sh"
test_lock_script="${script_dir}/test-lock.sh"
telemetry_script="${script_dir}/telemetry-log.sh"
resource_admission_script="${script_dir}/resource-admission.sh"
history_store_script="${script_dir}/history-store.sh"

# shellcheck source=scripts/tests/runner-shaping.sh
source "$runner_shaping_script"

if [[ -f "$history_store_script" ]]; then
  # shellcheck source=scripts/tests/history-store.sh
  source "$history_store_script"
fi

if [[ -f "$resource_admission_script" ]]; then
  # shellcheck source=scripts/tests/resource-admission.sh
  source "$resource_admission_script"
fi

baseshop_emit_governed_telemetry() {
  if [[ ! -x "$telemetry_script" ]]; then
    return 0
  fi

  "$telemetry_script" emit "$@" >/dev/null 2>&1 || true
}

baseshop_runner_peak_rss_monitor() {
  local target_pid="$1"
  local output_file="$2"
  local poll_sec="${BASESHOP_TEST_GOVERNOR_RSS_POLL_SEC:-1}"
  local max_mb="0"

  if ! [[ "$poll_sec" =~ ^[0-9]+([.][0-9]+)?$ ]]; then
    poll_sec="1"
  fi

  while kill -0 "$target_pid" 2>/dev/null; do
    local rss_kb rss_mb
    rss_kb="$(ps -o rss= -p "$target_pid" 2>/dev/null | awk '{print $1}' || true)"
    if [[ "$rss_kb" =~ ^[0-9]+$ ]]; then
      rss_mb="$((rss_kb / 1024))"
      if [[ "$rss_mb" =~ ^[0-9]+$ ]] && (( rss_mb > max_mb )); then
        max_mb="$rss_mb"
      fi
    fi
    sleep "$poll_sec"
  done

  printf '%s' "$max_mb" > "$output_file"
}

baseshop_runner_extract_worker_count() {
  local intent="$1"
  shift || true
  local -a args=()
  if [[ $# -gt 0 ]]; then
    args=("$@")
  fi

  local idx arg next

  if [[ "$intent" == "turbo" ]]; then
    for ((idx=0; idx<${#args[@]}; idx++)); do
      arg="${args[$idx]}"
      case "$arg" in
        --concurrency=*)
          next="${arg#--concurrency=}"
          if [[ "$next" =~ ^[0-9]+$ ]]; then
            printf %s "$next"
            return 0
          fi
          ;;
        --concurrency)
          if (( idx + 1 < ${#args[@]} )); then
            next="${args[$((idx + 1))]}"
            if [[ "$next" =~ ^[0-9]+$ ]]; then
              printf %s "$next"
              return 0
            fi
          fi
          ;;
      esac
    done

    printf 0
    return 0
  fi

  for arg in "${args[@]}"; do
    if [[ "$arg" == "--runInBand" ]]; then
      printf 1
      return 0
    fi
  done

  for ((idx=0; idx<${#args[@]}; idx++)); do
    arg="${args[$idx]}"
    case "$arg" in
      --maxWorkers=*)
        next="${arg#--maxWorkers=}"
        if [[ "$next" =~ ^[0-9]+$ ]]; then
          printf %s "$next"
          return 0
        fi
        ;;
      --maxWorkers)
        if (( idx + 1 < ${#args[@]} )); then
          next="${args[$((idx + 1))]}"
          if [[ "$next" =~ ^[0-9]+$ ]]; then
            printf %s "$next"
            return 0
          fi
        fi
        ;;
    esac
  done

  printf 0
}

# pnpm run forwards a separator token before script args; normalize it.
while [[ "${1:-}" == "--" ]]; do
  shift
done

intent="${1:-}"
if [[ -z "$intent" ]]; then
  baseshop_runner_usage >&2
  exit 2
fi
shift || true

if [[ "${1:-}" == "--" ]]; then
  shift
fi

if ! baseshop_runner_intent_allowed "$intent"; then
  echo "ERROR: intent '${intent}' is not allowed." >&2
  baseshop_runner_usage >&2
  exit 2
fi

declare -a raw_args=()
if [[ $# -gt 0 ]]; then
  raw_args=("$@")
fi

# Package scripts can inject additional `--` separators when forwarding args.
# Normalize these tokens so downstream CLI flags keep their intended meaning.
if [[ ${#raw_args[@]} -gt 0 ]]; then
  declare -a normalized_args=()
  for arg in "${raw_args[@]}"; do
    if [[ "$arg" == "--" ]]; then
      continue
    fi
    normalized_args+=("$arg")
  done
  raw_args=("${normalized_args[@]}")
fi

if [[ ${#raw_args[@]} -gt 0 ]]; then
  if ! baseshop_runner_validate_watch_policy "$intent" "${raw_args[@]}"; then
    exit 2
  fi
  baseshop_runner_shape_args "$intent" "${raw_args[@]}"
else
  if ! baseshop_runner_validate_watch_policy "$intent"; then
    exit 2
  fi
  baseshop_runner_shape_args "$intent"
fi

declare -a shaped_args=()
if [[ ${#BASESHOP_SHAPED_ARGS[@]} -gt 0 ]]; then
  shaped_args=("${BASESHOP_SHAPED_ARGS[@]}")
fi

command_sig="${intent}"
telemetry_class="governed-${intent}"
normalized_sig="${telemetry_class}"

case "$intent" in
  jest)
    command=("pnpm" "exec" "jest")
    ;;
  turbo)
    command=("pnpm" "exec" "turbo" "run" "test")
    ;;
  changed)
    command=("pnpm" "exec" "jest" "--findRelatedTests")
    ;;
  watch-exclusive)
    command=("pnpm" "exec" "jest")
    ;;
esac

if [[ ${#shaped_args[@]} -gt 0 ]]; then
  command+=("${shaped_args[@]}")
fi

workers="$(baseshop_runner_extract_worker_count "$intent" "${shaped_args[@]}")"
if ! [[ "$workers" =~ ^[0-9]+$ ]]; then
  workers="0"
fi

lock_held="0"
heartbeat_pid=""
command_pid=""
rss_monitor_pid=""
cleanup_running="0"
queued_ms="0"
command_exit="0"
admitted="true"
admission_reason="admitted"
admission_wait_ms="0"
pressure_level="unknown"
peak_rss_mb="0"
timeout_killed="false"
kill_escalation="none"
rss_peak_file=""

baseshop_record_kill_escalation() {
  local next="${1:-none}"
  if [[ "$kill_escalation" == "sigkill" ]]; then
    return 0
  fi

  case "$next" in
    sigkill)
      kill_escalation="sigkill"
      ;;
    sigterm)
      if [[ "$kill_escalation" == "none" ]]; then
        kill_escalation="sigterm"
      fi
      ;;
  esac
}

baseshop_terminate_command_tree() {
  local target_pid="$1"
  local grace_seconds="${2:-5}"

  if [[ -z "$target_pid" ]] || ! kill -0 "$target_pid" 2>/dev/null; then
    return 0
  fi

  # Attempt process-group kill to reach grandchildren (jest workers).
  # Requires the command to have been spawned via setsid into its own pgid.
  local pgid
  pgid="$(ps -o pgid= -p "$target_pid" 2>/dev/null | tr -d ' ' || true)"

  # Safety guard: never kill our own shell's process group or pgid 0.
  local own_pgid
  own_pgid="$(ps -o pgid= -p "$$" 2>/dev/null | tr -d ' ' || true)"

  if [[ -n "$pgid" && "$pgid" =~ ^[0-9]+$ && "$pgid" != "0" && "$pgid" != "$own_pgid" ]]; then
    kill -TERM -- "-$pgid" 2>/dev/null || true
  else
    # Fallback: pgid unavailable or unsafe — use direct children only.
    pkill -TERM -P "$target_pid" 2>/dev/null || true
    kill -TERM "$target_pid" 2>/dev/null || true
  fi
  baseshop_record_kill_escalation "sigterm"

  local grace_start="$SECONDS"
  while kill -0 "$target_pid" 2>/dev/null && (( SECONDS - grace_start < grace_seconds )); do
    sleep 0.2
  done

  if kill -0 "$target_pid" 2>/dev/null; then
    if [[ -n "$pgid" && "$pgid" =~ ^[0-9]+$ && "$pgid" != "0" && "$pgid" != "$own_pgid" ]]; then
      kill -KILL -- "-$pgid" 2>/dev/null || true
    else
      pkill -KILL -P "$target_pid" 2>/dev/null || true
      kill -KILL "$target_pid" 2>/dev/null || true
    fi
    baseshop_record_kill_escalation "sigkill"
  fi
}

cleanup() {
  if [[ "$cleanup_running" == "1" ]]; then
    return 0
  fi
  cleanup_running="1"

  if [[ -n "$command_pid" ]]; then
    baseshop_terminate_command_tree "$command_pid"
  fi

  if [[ -n "$rss_monitor_pid" ]] && kill -0 "$rss_monitor_pid" 2>/dev/null; then
    kill "$rss_monitor_pid" 2>/dev/null || true
    wait "$rss_monitor_pid" 2>/dev/null || true
  fi

  if [[ -n "$heartbeat_pid" ]] && kill -0 "$heartbeat_pid" 2>/dev/null; then
    kill "$heartbeat_pid" 2>/dev/null || true
    wait "$heartbeat_pid" 2>/dev/null || true
  fi

  if [[ "$lock_held" == "1" ]]; then
    "$test_lock_script" release >/dev/null 2>&1 || "$test_lock_script" release --force >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

ci_compat_mode="0"
if [[ "${BASESHOP_GOVERNED_CI_MODE:-auto}" != "off" ]]; then
  if [[ "${CI:-}" == "true" || "${CI:-}" == "1" ]]; then
    ci_compat_mode="1"
  fi
fi

if [[ "$ci_compat_mode" == "1" ]]; then
  echo "Running in governed CI compatibility mode: scheduler/admission bypassed, shaping enforced." >&2
else
  queue_start_sec="$SECONDS"
  "$test_lock_script" acquire --wait --command-sig "$command_sig"
  lock_held="1"

  heartbeat_interval="${BASESHOP_TEST_LOCK_HEARTBEAT_SEC:-30}"
  if ! [[ "$heartbeat_interval" =~ ^[0-9]+$ ]] || [[ "$heartbeat_interval" == "0" ]]; then
    heartbeat_interval="30"
  fi

  (
    while true; do
      sleep "$heartbeat_interval"
      "$test_lock_script" heartbeat --command-sig "$command_sig" >/dev/null 2>&1 || true
    done
  ) &
  heartbeat_pid="$!"

  if [[ "${BASESHOP_ALLOW_OVERLOAD:-0}" == "1" ]]; then
    echo "Admission bypass active: BASESHOP_ALLOW_OVERLOAD=1" >&2
  fi

  admission_start_sec="$SECONDS"
  admission_timeout="${BASESHOP_TEST_ADMISSION_TIMEOUT_SEC:-300}"
  if [[ "$admission_timeout" =~ ^[0-9]+$ ]] && (( admission_timeout > 0 )); then
    admission_deadline=$((SECONDS + admission_timeout))
  else
    admission_deadline=0
  fi
  while true; do
    if ! declare -f baseshop_resource_admission_decide >/dev/null 2>&1; then
      admitted="false"
      admission_reason="probe-unknown"
      pressure_level="unknown"
    else
      baseshop_resource_admission_decide "$telemetry_class" "$normalized_sig" "$workers"
      admitted="${BASESHOP_ADMISSION_ALLOW:-false}"
      admission_reason="${BASESHOP_ADMISSION_REASON:-probe-unknown}"
      pressure_level="${BASESHOP_ADMISSION_PRESSURE_LEVEL:-unknown}"
    fi

    if [[ "$admitted" == "true" ]]; then
      break
    fi

    if (( admission_deadline > 0 && SECONDS > admission_deadline )); then
      echo "Admission timeout after ${admission_timeout}s (reason=${admission_reason})" >&2
      admission_end_sec="$SECONDS"
      admission_wait_ms="$(( (admission_end_sec - admission_start_sec) * 1000 ))"
      queue_end_sec="$SECONDS"
      queued_ms="$(( (queue_end_sec - queue_start_sec) * 1000 ))"
      baseshop_emit_governed_telemetry \
        --governed true \
        --policy-mode enforce \
        --class "$telemetry_class" \
        --normalized-sig "$normalized_sig" \
        --admitted false \
        --queued-ms "$queued_ms" \
        --peak-rss-mb 0 \
        --pressure-level "$pressure_level" \
        --workers "$workers" \
        --exit-code 124 \
        --override-policy-used false \
        --override-overload-used "${BASESHOP_ALLOW_OVERLOAD:-0}"
      exit 124
    fi

    echo "Waiting for admission gate... reason=${admission_reason} memory=${BASESHOP_ADMISSION_PROJECTED_MEMORY_MB:-0}/${BASESHOP_ADMISSION_MEMORY_BUDGET_MB:-0} cpu=${BASESHOP_ADMISSION_PROJECTED_WORKER_SLOTS:-0}/${BASESHOP_ADMISSION_CPU_SLOTS_TOTAL:-0}" >&2
    sleep "${BASESHOP_TEST_GOVERNOR_ADMISSION_POLL_SEC:-2}"
  done

  admission_end_sec="$SECONDS"
  admission_wait_ms="$(( (admission_end_sec - admission_start_sec) * 1000 ))"
  queue_end_sec="$SECONDS"
  queued_ms="$(( (queue_end_sec - queue_start_sec) * 1000 ))"
fi

export BASESHOP_GOVERNED_CONTEXT=1

set +e
# Spawn the command in a dedicated process group so that kill -TERM -- -$pgid
# reaches grandchildren (jest workers), not only direct children.
# setsid creates a new session+process-group; command PID becomes the leader.
if command -v setsid >/dev/null 2>&1; then
  setsid "${command[@]}" &
else
  echo "WARNING: setsid not available; jest worker processes may be orphaned on kill" >&2
  "${command[@]}" &
fi
command_pid="$!"

timeout_deadline_sec=0
timeout_sec="${BASESHOP_TEST_TIMEOUT_SEC:-600}"
if [[ "$timeout_sec" =~ ^[0-9]+$ ]] && (( timeout_sec > 0 )); then
  timeout_deadline_sec=$((SECONDS + timeout_sec))
fi

if [[ "$ci_compat_mode" != "1" ]]; then
  rss_peak_file="${TMPDIR:-/tmp}/baseshop-test-governor-rss.$$.$RANDOM"
  : > "$rss_peak_file"
  baseshop_runner_peak_rss_monitor "$command_pid" "$rss_peak_file" &
  rss_monitor_pid="$!"
fi

while kill -0 "$command_pid" 2>/dev/null; do
  if (( timeout_deadline_sec > 0 && SECONDS >= timeout_deadline_sec )); then
    echo "Governed test timeout after ${timeout_sec}s; terminating process tree." >&2
    timeout_killed="true"
    baseshop_terminate_command_tree "$command_pid"
    break
  fi
  sleep 1
done

wait "$command_pid"
command_exit="$?"
set -e

if [[ "$timeout_killed" == "true" ]]; then
  command_exit=124
fi

if [[ -n "$rss_monitor_pid" ]]; then
  wait "$rss_monitor_pid" 2>/dev/null || true
  rss_monitor_pid=""
fi

if [[ -n "$rss_peak_file" && -f "$rss_peak_file" ]]; then
  peak_rss_mb="$(cat "$rss_peak_file" 2>/dev/null || true)"
  rm -f "$rss_peak_file" || true
fi
if ! [[ "$peak_rss_mb" =~ ^[0-9]+$ ]]; then
  peak_rss_mb="0"
fi

if [[ "$ci_compat_mode" != "1" ]] && declare -f baseshop_history_record_peak_mb >/dev/null 2>&1; then
  baseshop_history_record_peak_mb "$normalized_sig" "$peak_rss_mb" >/dev/null 2>&1 || true
fi

baseshop_emit_governed_telemetry \
  --governed true \
  --policy-mode enforce \
  --class "$telemetry_class" \
  --normalized-sig "$normalized_sig" \
  --admitted "$admitted" \
  --queued-ms "$queued_ms" \
  --peak-rss-mb "$peak_rss_mb" \
  --pressure-level "$pressure_level" \
  --workers "$workers" \
  --exit-code "$command_exit" \
  --timeout-killed "$timeout_killed" \
  --kill-escalation "$kill_escalation" \
  --override-policy-used false \
  --override-overload-used "${BASESHOP_ALLOW_OVERLOAD:-0}"

exit "$command_exit"
