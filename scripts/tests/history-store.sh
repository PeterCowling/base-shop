#!/usr/bin/env bash

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  set -euo pipefail
fi

baseshop_history_repo_root() {
  if [[ -n "${BASESHOP_GUARD_REPO_ROOT:-}" ]]; then
    printf '%s' "${BASESHOP_GUARD_REPO_ROOT}"
    return 0
  fi

  git rev-parse --show-toplevel 2>/dev/null || pwd
}

baseshop_history_file() {
  local root
  root="$(baseshop_history_repo_root)"
  printf '%s/.cache/test-governor/history.json' "$root"
}

baseshop_history_lock_file() {
  local root
  root="$(baseshop_history_repo_root)"
  printf '%s/.cache/test-governor/history.lock' "$root"
}

baseshop_history_lock_acquire() {
  local lock_file="$1"
  local attempts="${BASESHOP_TEST_GOVERNOR_HISTORY_LOCK_ATTEMPTS:-2000}"

  while (( attempts > 0 )); do
    if [[ -f "$lock_file" ]]; then
      local owner_pid
      owner_pid="$(cat "$lock_file" 2>/dev/null || true)"
      if [[ "$owner_pid" =~ ^[0-9]+$ ]] && ! kill -0 "$owner_pid" 2>/dev/null; then
        rm -f "$lock_file" || true
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

baseshop_history_lock_release() {
  local lock_file="$1"
  rm -f "$lock_file" 2>/dev/null || true
}

baseshop_history_bootstrap_if_missing() {
  local file_path="$1"
  local dir_path
  dir_path="$(dirname "$file_path")"
  mkdir -p "$dir_path"

  if [[ ! -f "$file_path" ]]; then
    cat > "$file_path" <<'JSON'
{
  "version": 1,
  "updated_at": null,
  "signatures": {}
}
JSON
  fi
}

baseshop_history_get_stats_json() {
  local normalized_sig="$1"
  local file_path
  file_path="$(baseshop_history_file)"

  baseshop_history_bootstrap_if_missing "$file_path"

  node - <<'NODE' "$file_path" "$normalized_sig"
const fs = require("fs");
const filePath = process.argv[2];
const sig = process.argv[3];

let parsed;
try {
  parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
} catch {
  parsed = { version: 1, updated_at: null, signatures: {} };
}

const entry = parsed?.signatures?.[sig] ?? {};
const samples = Array.isArray(entry.samples)
  ? entry.samples.filter((value) => Number.isFinite(value) && value > 0)
  : [];

const sorted = [...samples].sort((a, b) => a - b);
const p90 = sorted.length > 0
  ? sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * 0.9) - 1))]
  : 0;

const payload = {
  sample_count: samples.length,
  p90_peak_mb: Number.isFinite(entry.p90_peak_mb) && entry.p90_peak_mb > 0 ? entry.p90_peak_mb : p90,
  last_peak_mb: Number.isFinite(entry.last_peak_mb) && entry.last_peak_mb > 0 ? entry.last_peak_mb : 0,
};

process.stdout.write(`${JSON.stringify(payload)}\n`);
NODE
}

baseshop_history_record_peak_mb() {
  local normalized_sig="$1"
  local peak_rss_mb="$2"

  if [[ -z "$normalized_sig" ]]; then
    echo "ERROR: normalized signature required for history record" >&2
    return 2
  fi

  if ! [[ "$peak_rss_mb" =~ ^[0-9]+$ ]] || [[ "$peak_rss_mb" == "0" ]]; then
    return 0
  fi

  local file_path lock_file
  file_path="$(baseshop_history_file)"
  lock_file="$(baseshop_history_lock_file)"

  baseshop_history_bootstrap_if_missing "$file_path"

  if ! baseshop_history_lock_acquire "$lock_file"; then
    echo "ERROR: unable to acquire history lock" >&2
    return 1
  fi

  local max_samples
  max_samples="${BASESHOP_TEST_GOVERNOR_HISTORY_MAX_SAMPLES:-200}"
  if ! [[ "$max_samples" =~ ^[0-9]+$ ]] || [[ "$max_samples" == "0" ]]; then
    max_samples="200"
  fi

  node - <<'NODE' "$file_path" "$normalized_sig" "$peak_rss_mb" "$max_samples"
const fs = require("fs");
const filePath = process.argv[2];
const sig = process.argv[3];
const peak = Number(process.argv[4]);
const maxSamples = Number(process.argv[5]);

const now = new Date().toISOString();
let parsed;
try {
  parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
} catch {
  parsed = { version: 1, updated_at: null, signatures: {} };
}

if (!parsed || typeof parsed !== "object") {
  parsed = { version: 1, updated_at: null, signatures: {} };
}
if (!parsed.signatures || typeof parsed.signatures !== "object") {
  parsed.signatures = {};
}

const entry = parsed.signatures[sig] && typeof parsed.signatures[sig] === "object"
  ? parsed.signatures[sig]
  : {};
const priorSamples = Array.isArray(entry.samples)
  ? entry.samples.filter((value) => Number.isFinite(value) && value > 0)
  : [];

priorSamples.push(peak);
while (priorSamples.length > maxSamples) {
  priorSamples.shift();
}

const sorted = [...priorSamples].sort((a, b) => a - b);
const p90 = sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * 0.9) - 1))];

parsed.signatures[sig] = {
  samples: priorSamples,
  sample_count: priorSamples.length,
  last_peak_mb: peak,
  p90_peak_mb: p90,
  updated_at: now,
};
parsed.updated_at = now;

const tempPath = `${filePath}.tmp.${process.pid}`;
fs.writeFileSync(tempPath, `${JSON.stringify(parsed, null, 2)}\n`);
fs.renameSync(tempPath, filePath);
NODE
  local status=$?

  baseshop_history_lock_release "$lock_file"
  return "$status"
}

history_print_usage() {
  cat <<'EOF'
Usage:
  scripts/tests/history-store.sh get --normalized-sig <sig>
  scripts/tests/history-store.sh record --normalized-sig <sig> --peak-rss-mb <mb>
EOF
}

history_cmd_get() {
  local normalized_sig=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --normalized-sig)
        normalized_sig="${2:-}"
        shift 2
        ;;
      *)
        echo "ERROR: unknown option '$1'" >&2
        history_print_usage >&2
        return 2
        ;;
    esac
  done

  if [[ -z "$normalized_sig" ]]; then
    echo "ERROR: --normalized-sig is required" >&2
    return 2
  fi

  baseshop_history_get_stats_json "$normalized_sig"
}

history_cmd_record() {
  local normalized_sig=""
  local peak_rss_mb=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --normalized-sig)
        normalized_sig="${2:-}"
        shift 2
        ;;
      --peak-rss-mb)
        peak_rss_mb="${2:-}"
        shift 2
        ;;
      *)
        echo "ERROR: unknown option '$1'" >&2
        history_print_usage >&2
        return 2
        ;;
    esac
  done

  if [[ -z "$normalized_sig" || -z "$peak_rss_mb" ]]; then
    echo "ERROR: --normalized-sig and --peak-rss-mb are required" >&2
    return 2
  fi

  baseshop_history_record_peak_mb "$normalized_sig" "$peak_rss_mb"
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  cmd="${1:-}"
  shift || true

  case "$cmd" in
    get)
      history_cmd_get "$@"
      ;;
    record)
      history_cmd_record "$@"
      ;;
    ""|-h|--help)
      history_print_usage
      ;;
    *)
      echo "ERROR: unknown command '$cmd'" >&2
      history_print_usage >&2
      exit 2
      ;;
  esac
fi
