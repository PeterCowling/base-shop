#!/usr/bin/env bash

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  set -euo pipefail
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
history_store_script="${script_dir}/history-store.sh"

if [[ -f "$history_store_script" ]]; then
  # shellcheck source=scripts/tests/history-store.sh
  source "$history_store_script"
fi

baseshop_admission_bool() {
  case "${1:-}" in
    1|true|TRUE|True|yes|YES|on|ON) printf 'true' ;;
    *) printf 'false' ;;
  esac
}

baseshop_admission_floor_mul() {
  local lhs="$1"
  local rhs="$2"
  awk -v lhs="$lhs" -v rhs="$rhs" 'BEGIN { printf("%d", lhs * rhs) }'
}

baseshop_admission_total_ram_mb() {
  if [[ -n "${BASESHOP_ADMISSION_MOCK_TOTAL_RAM_MB:-}" ]]; then
    printf '%s' "${BASESHOP_ADMISSION_MOCK_TOTAL_RAM_MB}"
    return 0
  fi

  local bytes
  bytes="$(sysctl -n hw.memsize 2>/dev/null || true)"
  if ! [[ "$bytes" =~ ^[0-9]+$ ]]; then
    return 1
  fi

  awk -v bytes="$bytes" 'BEGIN { printf("%d", bytes / 1048576) }'
}

baseshop_admission_logical_cpu() {
  if [[ -n "${BASESHOP_ADMISSION_MOCK_LOGICAL_CPU:-}" ]]; then
    printf '%s' "${BASESHOP_ADMISSION_MOCK_LOGICAL_CPU}"
    return 0
  fi

  local cpus
  cpus="$(sysctl -n hw.logicalcpu 2>/dev/null || true)"
  if [[ ! "$cpus" =~ ^[0-9]+$ || "$cpus" == "0" ]]; then
    return 1
  fi
  printf '%s' "$cpus"
}

baseshop_admission_pressure_level() {
  if [[ -n "${BASESHOP_ADMISSION_MOCK_PRESSURE_LEVEL:-}" ]]; then
    printf '%s' "${BASESHOP_ADMISSION_MOCK_PRESSURE_LEVEL}"
    return 0
  fi

  local output
  output="$(memory_pressure 2>/dev/null || true)"
  if [[ -z "$output" ]]; then
    printf 'unknown'
    return 0
  fi

  if echo "$output" | grep -qi "system-wide memory pressure:.*critical"; then
    printf 'critical'
    return 0
  fi
  if echo "$output" | grep -qi "system-wide memory pressure:.*warning"; then
    printf 'warning'
    return 0
  fi
  if echo "$output" | grep -qi "system-wide memory pressure:.*normal"; then
    printf 'normal'
    return 0
  fi

  printf 'unknown'
}

baseshop_admission_active_test_rss_mb() {
  if [[ -n "${BASESHOP_ADMISSION_MOCK_ACTIVE_TEST_RSS_MB_FILE:-}" ]]; then
    local value_file
    value_file="${BASESHOP_ADMISSION_MOCK_ACTIVE_TEST_RSS_MB_FILE}"
    if [[ -f "$value_file" ]]; then
      cat "$value_file"
      return 0
    fi
  fi

  if [[ -n "${BASESHOP_ADMISSION_MOCK_ACTIVE_TEST_RSS_MB:-}" ]]; then
    printf '%s' "${BASESHOP_ADMISSION_MOCK_ACTIVE_TEST_RSS_MB}"
    return 0
  fi

  local rss_mb
  rss_mb="$(
    ps -axo rss=,command= 2>/dev/null | awk '
      /(jest\/bin\/jest\.js|pnpm exec jest|turbo run test)/ {
        if ($1 ~ /^[0-9]+$/) {
          sum += $1
        }
      }
      END {
        printf("%d", sum / 1024)
      }
    '
  )"

  if [[ ! "$rss_mb" =~ ^[0-9]+$ ]]; then
    return 1
  fi
  printf '%s' "$rss_mb"
}

baseshop_admission_active_worker_slots() {
  if [[ -n "${BASESHOP_ADMISSION_MOCK_ACTIVE_WORKER_SLOTS_FILE:-}" ]]; then
    local value_file
    value_file="${BASESHOP_ADMISSION_MOCK_ACTIVE_WORKER_SLOTS_FILE}"
    if [[ -f "$value_file" ]]; then
      cat "$value_file"
      return 0
    fi
  fi

  if [[ -n "${BASESHOP_ADMISSION_MOCK_ACTIVE_WORKER_SLOTS:-}" ]]; then
    printf '%s' "${BASESHOP_ADMISSION_MOCK_ACTIVE_WORKER_SLOTS}"
    return 0
  fi

  local total="0"
  local saw_match="0"
  local parsed_any="0"
  local line
  while IFS= read -r line; do
    if [[ ! "$line" =~ (jest/bin/jest\.js|pnpm\ exec\ jest|turbo\ run\ test) ]]; then
      continue
    fi
    saw_match="1"

    if [[ "$line" == *"--runInBand"* ]]; then
      total=$((total + 1))
      parsed_any="1"
    fi

    if [[ "$line" =~ --maxWorkers=([0-9]+) ]]; then
      total=$((total + ${BASH_REMATCH[1]}))
      parsed_any="1"
    fi

    if [[ "$line" =~ --concurrency=([0-9]+) ]]; then
      total=$((total + ${BASH_REMATCH[1]}))
      parsed_any="1"
    fi
  done < <(ps -axo command= 2>/dev/null)

  if [[ "$saw_match" == "1" && "$parsed_any" == "0" ]]; then
    return 1
  fi

  printf '%s' "$total"
}

baseshop_admission_seed_budget_mb() {
  local event_class="$1"
  case "$event_class" in
    governed-jest) printf '%s' "${BASESHOP_TEST_GOVERNOR_SEED_MB_GOVERNED_JEST:-1200}" ;;
    governed-changed) printf '%s' "${BASESHOP_TEST_GOVERNOR_SEED_MB_GOVERNED_CHANGED:-800}" ;;
    governed-turbo) printf '%s' "${BASESHOP_TEST_GOVERNOR_SEED_MB_GOVERNED_TURBO:-1800}" ;;
    governed-watch-exclusive) printf '%s' "${BASESHOP_TEST_GOVERNOR_SEED_MB_GOVERNED_WATCH_EXCLUSIVE:-1000}" ;;
    *) printf '%s' "${BASESHOP_TEST_GOVERNOR_SEED_MB_DEFAULT:-1200}" ;;
  esac
}

baseshop_admission_predict_peak_mb() {
  local event_class="$1"
  local normalized_sig="$2"
  local workers="$3"
  local min_samples="${BASESHOP_TEST_GOVERNOR_HISTORY_MIN_SAMPLES:-5}"

  local seed_mb
  seed_mb="$(baseshop_admission_seed_budget_mb "$event_class")"
  if [[ ! "$seed_mb" =~ ^[0-9]+$ ]] || [[ "$seed_mb" == "0" ]]; then
    seed_mb="1200"
  fi

  local stats_json sample_count p90_peak
  sample_count="0"
  p90_peak="0"
  if stats_json="$(baseshop_history_get_stats_json "$normalized_sig" 2>/dev/null)"; then
    sample_count="$(node -e 'const payload = JSON.parse(process.argv[1]); process.stdout.write(String(payload.sample_count ?? 0));' "$stats_json" 2>/dev/null || printf '0')"
    p90_peak="$(node -e 'const payload = JSON.parse(process.argv[1]); process.stdout.write(String(payload.p90_peak_mb ?? 0));' "$stats_json" 2>/dev/null || printf '0')"
  fi

  local base_mb source
  base_mb="$seed_mb"
  source="seed"
  if [[ "$sample_count" =~ ^[0-9]+$ && "$p90_peak" =~ ^[0-9]+$ ]] && (( sample_count >= min_samples )) && (( p90_peak > 0 )); then
    base_mb="$p90_peak"
    source="history-p90"
  fi

  local workers_scale predicted
  workers_scale="1.0"
  if [[ "$workers" =~ ^[0-9]+$ ]] && (( workers > 2 )); then
    workers_scale="$(awk -v w="$workers" 'BEGIN { printf("%.3f", w / 2.0) }')"
  fi
  predicted="$(awk -v base="$base_mb" -v scale="$workers_scale" 'BEGIN { printf("%d", base * scale) }')"
  if [[ ! "$predicted" =~ ^[0-9]+$ || "$predicted" == "0" ]]; then
    predicted="$base_mb"
  fi

  BASESHOP_ADMISSION_HISTORY_SAMPLE_COUNT="$sample_count"
  BASESHOP_ADMISSION_HISTORY_P90_MB="$p90_peak"
  BASESHOP_ADMISSION_CLASS_BUDGET_MB="$base_mb"
  BASESHOP_ADMISSION_CLASS_BUDGET_SOURCE="$source"
  printf '%s' "$predicted"
}

baseshop_resource_admission_decide() {
  local event_class="$1"
  local normalized_sig="$2"
  local workers="$3"

  local memory_budget_pct cpu_slot_pct
  memory_budget_pct="${BASESHOP_TEST_GOVERNOR_MEMORY_BUDGET_PCT:-0.60}"
  cpu_slot_pct="${BASESHOP_TEST_GOVERNOR_CPU_SLOT_PCT:-0.70}"

  BASESHOP_ADMISSION_ALLOW="false"
  BASESHOP_ADMISSION_REASON="probe-unknown"
  BASESHOP_ADMISSION_MEMORY_BUDGET_MB="0"
  BASESHOP_ADMISSION_CPU_SLOTS_TOTAL="0"
  BASESHOP_ADMISSION_ACTIVE_TEST_RSS_MB="0"
  BASESHOP_ADMISSION_ACTIVE_WORKER_SLOTS="0"
  BASESHOP_ADMISSION_REQUIRED_WORKER_SLOTS="0"
  BASESHOP_ADMISSION_PREDICTED_PEAK_MB="0"
  BASESHOP_ADMISSION_PROJECTED_MEMORY_MB="0"
  BASESHOP_ADMISSION_PROJECTED_WORKER_SLOTS="0"
  BASESHOP_ADMISSION_PRESSURE_LEVEL="unknown"
  BASESHOP_ADMISSION_CLASS_BUDGET_MB="0"
  BASESHOP_ADMISSION_CLASS_BUDGET_SOURCE="seed"
  BASESHOP_ADMISSION_HISTORY_SAMPLE_COUNT="0"
  BASESHOP_ADMISSION_HISTORY_P90_MB="0"

  if [[ "${BASESHOP_ALLOW_OVERLOAD:-0}" == "1" ]]; then
    BASESHOP_ADMISSION_ALLOW="true"
    BASESHOP_ADMISSION_REASON="override-overload"
    BASESHOP_ADMISSION_PRESSURE_LEVEL="$(baseshop_admission_pressure_level)"
    return 0
  fi

  local total_ram_mb logical_cpu active_test_rss_mb active_worker_slots pressure_level
  total_ram_mb="$(baseshop_admission_total_ram_mb 2>/dev/null || true)"
  logical_cpu="$(baseshop_admission_logical_cpu 2>/dev/null || true)"
  active_test_rss_mb="$(baseshop_admission_active_test_rss_mb 2>/dev/null || true)"
  active_worker_slots="$(baseshop_admission_active_worker_slots 2>/dev/null || true)"
  pressure_level="$(baseshop_admission_pressure_level)"
  BASESHOP_ADMISSION_PRESSURE_LEVEL="$pressure_level"

  if [[ ! "$workers" =~ ^[0-9]+$ ]] || [[ "$workers" == "0" ]]; then
    workers="1"
  fi

  BASESHOP_ADMISSION_REQUIRED_WORKER_SLOTS="$workers"

  if [[ "$pressure_level" == "critical" ]]; then
    BASESHOP_ADMISSION_REASON="pressure-critical"
    return 0
  fi

  if [[ ! "$total_ram_mb" =~ ^[0-9]+$ || ! "$logical_cpu" =~ ^[0-9]+$ || ! "$active_test_rss_mb" =~ ^[0-9]+$ || ! "$active_worker_slots" =~ ^[0-9]+$ ]]; then
    BASESHOP_ADMISSION_REASON="probe-unknown"
    return 0
  fi

  local predicted_peak memory_budget cpu_slots_total projected_memory projected_slots
  predicted_peak="$(baseshop_admission_predict_peak_mb "$event_class" "$normalized_sig" "$workers")"
  if [[ ! "$predicted_peak" =~ ^[0-9]+$ ]]; then
    BASESHOP_ADMISSION_REASON="probe-unknown"
    return 0
  fi

  memory_budget="$(baseshop_admission_floor_mul "$total_ram_mb" "$memory_budget_pct")"
  cpu_slots_total="$(baseshop_admission_floor_mul "$logical_cpu" "$cpu_slot_pct")"
  if [[ ! "$cpu_slots_total" =~ ^[0-9]+$ ]] || (( cpu_slots_total < 1 )); then
    cpu_slots_total="1"
  fi

  projected_memory="$((active_test_rss_mb + predicted_peak))"
  projected_slots="$((active_worker_slots + workers))"

  BASESHOP_ADMISSION_MEMORY_BUDGET_MB="$memory_budget"
  BASESHOP_ADMISSION_CPU_SLOTS_TOTAL="$cpu_slots_total"
  BASESHOP_ADMISSION_ACTIVE_TEST_RSS_MB="$active_test_rss_mb"
  BASESHOP_ADMISSION_ACTIVE_WORKER_SLOTS="$active_worker_slots"
  BASESHOP_ADMISSION_PREDICTED_PEAK_MB="$predicted_peak"
  BASESHOP_ADMISSION_PROJECTED_MEMORY_MB="$projected_memory"
  BASESHOP_ADMISSION_PROJECTED_WORKER_SLOTS="$projected_slots"

  if (( projected_memory > memory_budget )); then
    BASESHOP_ADMISSION_REASON="memory-budget"
    return 0
  fi

  if (( projected_slots > cpu_slots_total )); then
    BASESHOP_ADMISSION_REASON="cpu-slots"
    return 0
  fi

  BASESHOP_ADMISSION_ALLOW="true"
  BASESHOP_ADMISSION_REASON="admitted"
  return 0
}

baseshop_resource_admission_status_kv() {
  cat <<EOF
allow=${BASESHOP_ADMISSION_ALLOW}
reason=${BASESHOP_ADMISSION_REASON}
pressure_level=${BASESHOP_ADMISSION_PRESSURE_LEVEL}
memory_budget_mb=${BASESHOP_ADMISSION_MEMORY_BUDGET_MB}
cpu_slots_total=${BASESHOP_ADMISSION_CPU_SLOTS_TOTAL}
active_test_rss_mb=${BASESHOP_ADMISSION_ACTIVE_TEST_RSS_MB}
predicted_peak_mb=${BASESHOP_ADMISSION_PREDICTED_PEAK_MB}
projected_memory_mb=${BASESHOP_ADMISSION_PROJECTED_MEMORY_MB}
active_worker_slots=${BASESHOP_ADMISSION_ACTIVE_WORKER_SLOTS}
required_worker_slots=${BASESHOP_ADMISSION_REQUIRED_WORKER_SLOTS}
projected_worker_slots=${BASESHOP_ADMISSION_PROJECTED_WORKER_SLOTS}
class_budget_mb=${BASESHOP_ADMISSION_CLASS_BUDGET_MB}
class_budget_source=${BASESHOP_ADMISSION_CLASS_BUDGET_SOURCE}
history_sample_count=${BASESHOP_ADMISSION_HISTORY_SAMPLE_COUNT}
history_p90_mb=${BASESHOP_ADMISSION_HISTORY_P90_MB}
override_overload_used=$(baseshop_admission_bool "${BASESHOP_ALLOW_OVERLOAD:-0}")
EOF
}

baseshop_resource_admission_print_usage() {
  cat <<'EOF'
Usage:
  scripts/tests/resource-admission.sh decide --class <class> --normalized-sig <sig> --workers <n>
EOF
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  cmd="${1:-}"
  shift || true

  case "$cmd" in
    decide)
      event_class=""
      normalized_sig=""
      workers=""
      while [[ $# -gt 0 ]]; do
        case "$1" in
          --class)
            event_class="${2:-}"
            shift 2
            ;;
          --normalized-sig)
            normalized_sig="${2:-}"
            shift 2
            ;;
          --workers)
            workers="${2:-}"
            shift 2
            ;;
          *)
            echo "ERROR: unknown option '$1'" >&2
            baseshop_resource_admission_print_usage >&2
            exit 2
            ;;
        esac
      done

      if [[ -z "$event_class" || -z "$normalized_sig" ]]; then
        echo "ERROR: --class and --normalized-sig are required" >&2
        baseshop_resource_admission_print_usage >&2
        exit 2
      fi

      if [[ -z "$workers" ]]; then
        workers="1"
      fi

      baseshop_resource_admission_decide "$event_class" "$normalized_sig" "$workers"
      baseshop_resource_admission_status_kv
      ;;
    ""|-h|--help)
      baseshop_resource_admission_print_usage
      ;;
    *)
      echo "ERROR: unknown command '$cmd'" >&2
      baseshop_resource_admission_print_usage >&2
      exit 2
      ;;
  esac
fi
