#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
runner_script="${script_dir}/run-governed-test.sh"
summary_script="${script_dir}/summarize-governor-telemetry.mjs"

profile="synthetic-day-zero"
events_file="${repo_root}/.cache/test-governor/events.jsonl"
summary_json="${repo_root}/.cache/test-governor/calibration-summary.json"
summary_md="${repo_root}/.cache/test-governor/calibration-summary.md"
report_path="${repo_root}/docs/plans/test-execution-resource-governor-calibration.md"
assert_gates="1"
reset_events="${BASESHOP_GOVERNED_CALIBRATION_RESET_EVENTS:-1}"

usage() {
  cat <<EOF
Usage:
  scripts/tests/run-governed-calibration.sh [options]

Options:
  --profile <synthetic-day-zero>
  --events-file <path>
  --summary-json <path>
  --summary-md <path>
  --report-path <path>
  --no-assert-gates
  --no-reset-events

Environment knobs (optional):
  BASESHOP_CALIBRATION_JEST_BASE_RUNS (default: 8)
  BASESHOP_CALIBRATION_TURBO_BASE_RUNS (default: 8)
  BASESHOP_CALIBRATION_CHANGED_BASE_RUNS (default: 8)
  BASESHOP_CALIBRATION_CONTENTION_PAIRS (default: 5)
  BASESHOP_CALIBRATION_CONTENTION_SLEEP_SEC (default: 1)
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile)
      profile="${2:-}"
      shift 2
      ;;
    --events-file)
      events_file="${2:-}"
      shift 2
      ;;
    --summary-json)
      summary_json="${2:-}"
      shift 2
      ;;
    --summary-md)
      summary_md="${2:-}"
      shift 2
      ;;
    --report-path)
      report_path="${2:-}"
      shift 2
      ;;
    --no-assert-gates)
      assert_gates="0"
      shift
      ;;
    --no-reset-events)
      reset_events="0"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "ERROR: unknown option " >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ "$profile" != "synthetic-day-zero" ]]; then
  echo "ERROR: unsupported profile " >&2
  exit 2
fi

if [[ ! -x "$runner_script" ]]; then
  echo "ERROR: runner script missing or not executable: $runner_script" >&2
  exit 2
fi

if [[ ! -x "$summary_script" ]]; then
  echo "ERROR: summary script missing or not executable: $summary_script" >&2
  exit 2
fi

mkdir -p "$(dirname "$events_file")"

if [[ "$reset_events" == "1" ]]; then
  rm -f "$events_file"
fi

jest_base_runs="${BASESHOP_CALIBRATION_JEST_BASE_RUNS:-8}"
turbo_base_runs="${BASESHOP_CALIBRATION_TURBO_BASE_RUNS:-8}"
changed_base_runs="${BASESHOP_CALIBRATION_CHANGED_BASE_RUNS:-8}"
contention_pairs="${BASESHOP_CALIBRATION_CONTENTION_PAIRS:-5}"
contention_sleep_sec="${BASESHOP_CALIBRATION_CONTENTION_SLEEP_SEC:-1}"

for value in "$jest_base_runs" "$turbo_base_runs" "$changed_base_runs" "$contention_pairs"; do
  if ! [[ "$value" =~ ^[0-9]+$ ]]; then
    echo "ERROR: run counts must be non-negative integers" >&2
    exit 2
  fi
done

run_intent() {
  local intent="$1"
  shift || true
  "$runner_script" -- "$intent" -- "$@"
}

for ((i=1; i<=jest_base_runs; i++)); do
  run_intent jest "--testPathPattern=calibration-jest-${i}"
done

for ((i=1; i<=turbo_base_runs; i++)); do
  run_intent turbo "--filter=scripts"
done

for ((i=1; i<=changed_base_runs; i++)); do
  run_intent changed "scripts/tests/run-governed-test.sh" "--passWithNoTests"
done

for ((i=1; i<=contention_pairs; i++)); do
  (
    BASESHOP_TEST_GOVERNED_SLEEP_SEC="$contention_sleep_sec" run_intent jest "--testPathPattern=calibration-contention-a-${i}"
  ) &
  pid_a="$!"
  sleep 0.05
  (
    BASESHOP_TEST_GOVERNED_SLEEP_SEC="$contention_sleep_sec" run_intent jest "--testPathPattern=calibration-contention-b-${i}"
  ) &
  pid_b="$!"

  wait "$pid_a"
  wait "$pid_b"
done

summary_args=(
  --events-file "$events_file"
  --json-out "$summary_json"
  --md-out "$summary_md"
  --report-path "$report_path"
  --label "$profile"
  --min-governed-samples 30
  --min-governed-classes 3
  --min-contention-samples 5
  --require-classes "governed-jest,governed-turbo,governed-changed"
)

if [[ "$assert_gates" == "0" ]]; then
  summary_args+=(--no-assert-gates)
fi

node "$summary_script" "${summary_args[@]}" >/dev/null

echo "Calibration profile  complete."
echo "  events:  ${events_file}"
echo "  summary: ${summary_json}"
echo "  report:  ${report_path}"
