#!/usr/bin/env bash
set -u
artifact_dir="docs/plans/cms-webpack-build-oom/artifacts/raw/2026-02-23-task-01-r2"
summary="$artifact_dir/run-summary.tsv"
printf "variant\texit_code\tstarted_utc\tended_utc\tlog_path\n" > "$summary"

run_variant() {
  local name="$1"
  local cmd="$2"
  local log="$artifact_dir/${name}.log"
  local start end code
  start="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  {
    echo "# Variant: $name"
    echo "# Command: $cmd"
    echo "# Started (UTC): $start"
    echo ""
    /usr/bin/time -lp bash -lc "$cmd"
  } > "$log" 2>&1
  code=$?
  end="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  printf "%s\t%s\t%s\t%s\t%s\n" "$name" "$code" "$start" "$end" "$log" >> "$summary"
  echo "completed $name exit=$code"
}

run_variant "default" "pnpm --filter @apps/cms build"
run_variant "heap8" "NODE_OPTIONS=--max-old-space-size=8192 pnpm --filter @apps/cms build"
run_variant "heap8_cpus1" "NEXT_BUILD_CPUS=1 NODE_OPTIONS=--max-old-space-size=8192 pnpm --filter @apps/cms build"

echo "done" > "$artifact_dir/done.flag"
