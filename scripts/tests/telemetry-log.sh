#!/usr/bin/env bash
set -euo pipefail

# Writes append-only JSONL telemetry for test governor guard events.
# Rotation and locking are intentionally simple and shell-native for portability.

json_escape() {
  local raw="${1:-}"
  raw="${raw//\\/\\\\}"
  raw="${raw//\"/\\\"}"
  raw="${raw//$'\n'/\\n}"
  raw="${raw//$'\r'/\\r}"
  raw="${raw//$'\t'/\\t}"
  printf '%s' "$raw"
}

bool_normalize() {
  local value="${1:-false}"
  case "${value}" in
    1|true|TRUE|True|yes|YES|on|ON) printf 'true' ;;
    *) printf 'false' ;;
  esac
}

calc_hash() {
  local payload="${1:-}"
  if command -v shasum >/dev/null 2>&1; then
    printf '%s' "$payload" | shasum -a 256 | awk '{print $1}'
    return 0
  fi
  printf 'unknown'
}

repo_root() {
  if [[ -n "${BASESHOP_GUARD_REPO_ROOT:-}" ]]; then
    printf '%s' "$BASESHOP_GUARD_REPO_ROOT"
    return 0
  fi
  git rev-parse --show-toplevel 2>/dev/null || pwd
}

acquire_lock() {
  local lock_file="$1"
  local attempts=200

  while (( attempts > 0 )); do
    if [[ -f "$lock_file" ]]; then
      local owner_pid
      owner_pid="$(cat "$lock_file" 2>/dev/null || true)"
      if [[ "$owner_pid" =~ ^[0-9]+$ ]] && ! kill -0 "$owner_pid" 2>/dev/null; then
        rm -f "$lock_file"
      fi
    fi

    if ( set -o noclobber; echo "$$" > "$lock_file" ) 2>/dev/null; then
      return 0
    fi

    attempts=$((attempts - 1))
    sleep 0.01
  done

  return 1
}

release_lock() {
  local lock_file="$1"
  rm -f "$lock_file" 2>/dev/null || true
}

baseshop_test_governor_emit_event() {
  local governed="false"
  local policy_mode="warn"
  local event_class="unknown"
  local normalized_sig="unknown"
  local argv_hash=""
  local admitted="false"
  local queued_ms="0"
  local peak_rss_mb="0"
  local pressure_level="unknown"
  local workers="0"
  local exit_code="0"
  local override_policy_used="false"
  local override_overload_used="false"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --governed) governed="$(bool_normalize "${2:-false}")"; shift 2 ;;
      --policy-mode) policy_mode="${2:-warn}"; shift 2 ;;
      --class) event_class="${2:-unknown}"; shift 2 ;;
      --normalized-sig) normalized_sig="${2:-unknown}"; shift 2 ;;
      --argv-hash) argv_hash="${2:-}"; shift 2 ;;
      --admitted) admitted="$(bool_normalize "${2:-false}")"; shift 2 ;;
      --queued-ms) queued_ms="${2:-0}"; shift 2 ;;
      --peak-rss-mb) peak_rss_mb="${2:-0}"; shift 2 ;;
      --pressure-level) pressure_level="${2:-unknown}"; shift 2 ;;
      --workers) workers="${2:-0}"; shift 2 ;;
      --exit-code) exit_code="${2:-0}"; shift 2 ;;
      --override-policy-used) override_policy_used="$(bool_normalize "${2:-false}")"; shift 2 ;;
      --override-overload-used) override_overload_used="$(bool_normalize "${2:-false}")"; shift 2 ;;
      *) shift ;;
    esac
  done

  if [[ -z "$argv_hash" ]]; then
    argv_hash="$(calc_hash "${event_class}:${normalized_sig}")"
  fi

  local root
  root="$(repo_root)"
  local cache_dir="${root}/.cache/test-governor"
  local events_file="${cache_dir}/events.jsonl"
  local lock_file="${cache_dir}/telemetry.lock"
  local max_bytes="${BASESHOP_TEST_GOVERNOR_TELEMETRY_MAX_BYTES:-20971520}"
  local ts
  ts="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

  mkdir -p "$cache_dir"
  if ! acquire_lock "$lock_file"; then
    return 0
  fi
  trap "release_lock '$lock_file'" EXIT

  if [[ -f "$events_file" ]]; then
    local size
    size="$(wc -c < "$events_file" | tr -d '[:space:]')"
    if [[ "$size" =~ ^[0-9]+$ ]] && [[ "$max_bytes" =~ ^[0-9]+$ ]] && (( size > max_bytes )); then
      local rotated="${cache_dir}/events-$(date -u +"%Y%m%dT%H%M%SZ").jsonl"
      mv "$events_file" "$rotated"
    fi
  fi

  printf '{"ts":"%s","governed":%s,"policy_mode":"%s","class":"%s","normalized_sig":"%s","argv_hash":"%s","admitted":%s,"queued_ms":%s,"peak_rss_mb":%s,"pressure_level":"%s","workers":%s,"exit_code":%s,"override_policy_used":%s,"override_overload_used":%s}\n' \
    "$(json_escape "$ts")" \
    "$governed" \
    "$(json_escape "$policy_mode")" \
    "$(json_escape "$event_class")" \
    "$(json_escape "$normalized_sig")" \
    "$(json_escape "$argv_hash")" \
    "$admitted" \
    "$queued_ms" \
    "$peak_rss_mb" \
    "$(json_escape "$pressure_level")" \
    "$workers" \
    "$exit_code" \
    "$override_policy_used" \
    "$override_overload_used" >> "$events_file"
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  case "${1:-}" in
    emit)
      shift
      baseshop_test_governor_emit_event "$@"
      ;;
    *)
      echo "Usage: $0 emit [--governed bool] [--policy-mode warn|enforce] [--class value] [--normalized-sig value]" >&2
      exit 2
      ;;
  esac
fi
