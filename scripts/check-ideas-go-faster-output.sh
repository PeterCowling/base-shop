#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$repo_root"

fail=0

check_fail() {
  echo "FAIL: $1" >&2
  fail=1
}

usage() {
  cat <<'USAGE'
Usage:
  scripts/check-ideas-go-faster-output.sh [--report <path>] [--artifacts-dir <path>]
  scripts/check-ideas-go-faster-output.sh --self-test

Validates ideas-go-faster sweep outputs against RS-04 contracts:
- report frontmatter + deterministic F1-F6 sections
- 3A/3B artifacts (commit manifest + write ledger + card-id-map)
- dry-run/live-mode write-safety invariants
USAGE
}

is_one_of() {
  local value="$1"
  shift
  local allowed
  for allowed in "$@"; do
    if [[ "$value" == "$allowed" ]]; then
      return 0
    fi
  done
  return 1
}

extract_frontmatter() {
  local report="$1"
  local out_file="$2"
  if ! awk '
    NR==1 {
      if ($0 != "---") {
        exit 2
      }
      in_fm=1
      next
    }
    in_fm && $0 == "---" {
      closed=1
      exit
    }
    in_fm {
      print
    }
    END {
      if (!closed) {
        exit 3
      }
    }
  ' "$report" > "$out_file"; then
    return 1
  fi
  return 0
}

frontmatter_value() {
  local key="$1"
  local fm_file="$2"
  awk -v key="$key" '
    index($0, key ":") == 1 {
      sub("^[^:]+:[[:space:]]*", "", $0)
      print
      exit
    }
  ' "$fm_file"
}

has_heading() {
  local report="$1"
  local heading_title="$2"
  awk -v heading_title="$heading_title" '
    /^## [0-9]+\./ {
      heading=$0
      sub(/^## [0-9]+\. /, "", heading)
      if (heading == heading_title) {
        found=1
        exit
      }
    }
    END {
      if (!found) {
        exit 1
      }
    }
  ' "$report"
}

section_body() {
  local report="$1"
  local heading_title="$2"
  awk -v heading_title="$heading_title" '
    /^## [0-9]+\./ {
      heading=$0
      sub(/^## [0-9]+\. /, "", heading)
      if (in_section && heading != heading_title) {
        exit
      }
      if (heading == heading_title) {
        in_section=1
        next
      }
    }
    in_section {
      print
    }
  ' "$report"
}

validate_manifest_schema() {
  local manifest_path="$1"
  if ! node - "$manifest_path" <<'NODE'
const fs = require('fs');

const manifestPath = process.argv[2];

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

let root;
try {
  root = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} catch (error) {
  fail(`commit manifest is not valid JSON (${error.message})`);
}

const operations = Array.isArray(root) ? root : root.operations;
if (!Array.isArray(operations)) {
  fail('commit manifest must contain an operations array');
}
if (operations.length === 0) {
  fail('commit manifest operations array is empty');
}

const allowedKinds = new Set(['idea_create', 'card_create', 'factfind_upsert']);
const operationIds = new Set();

for (let index = 0; index < operations.length; index += 1) {
  const op = operations[index];
  const label = `manifest operation[${index}]`;

  if (!op || typeof op !== 'object') {
    fail(`${label} must be an object`);
  }

  const requiredFields = [
    'operation_id',
    'kind',
    'slug',
    'payload_fingerprint',
    'depends_on',
    'endpoint',
    'method',
  ];

  for (const field of requiredFields) {
    if (!(field in op)) {
      fail(`${label} missing required field '${field}'`);
    }
  }

  if (typeof op.operation_id !== 'string' || op.operation_id.trim() === '') {
    fail(`${label} has invalid operation_id`);
  }
  if (operationIds.has(op.operation_id)) {
    fail(`${label} has duplicate operation_id '${op.operation_id}'`);
  }
  operationIds.add(op.operation_id);

  if (!allowedKinds.has(op.kind)) {
    fail(`${label} has invalid kind '${String(op.kind)}'`);
  }
  if (typeof op.slug !== 'string' || op.slug.trim() === '') {
    fail(`${label} has invalid slug`);
  }
  if (typeof op.payload_fingerprint !== 'string' || op.payload_fingerprint.trim() === '') {
    fail(`${label} has invalid payload_fingerprint`);
  }
  if (!Array.isArray(op.depends_on)) {
    fail(`${label} depends_on must be an array`);
  }
  if (typeof op.endpoint !== 'string' || op.endpoint.trim() === '') {
    fail(`${label} has invalid endpoint`);
  }
  if (typeof op.method !== 'string' || op.method.trim() === '') {
    fail(`${label} has invalid method`);
  }

  if (op.kind === 'factfind_upsert') {
    if (op.depends_on.length === 0) {
      fail(`${label} factfind_upsert must depend on card_create operation`);
    }

    const payloadTemplateCandidates = [
      op.payload_template,
      op.payload,
      op.content_template,
      op.content,
    ];
    const templateValue = payloadTemplateCandidates.find((value) => typeof value === 'string');
    const hasPlaceholder = typeof templateValue === 'string' && templateValue.includes('{{CARD_ID}}');
    const explicitCardMarker = op.requires_card_id === true;

    if (!hasPlaceholder && !explicitCardMarker) {
      fail(`${label} factfind_upsert must include {{CARD_ID}} placeholder marker`);
    }
  }
}

for (let index = 0; index < operations.length; index += 1) {
  const op = operations[index];
  const label = `manifest operation[${index}]`;

  for (const dep of op.depends_on) {
    if (typeof dep !== 'string' || dep.trim() === '') {
      fail(`${label} has invalid dependency entry`);
    }
    if (!operationIds.has(dep)) {
      fail(`${label} depends_on unknown operation_id '${dep}'`);
    }
  }
}
NODE
  then
    check_fail "Commit manifest schema validation failed"
  fi
}

validate_write_ledger() {
  local ledger_path="$1"
  local persistence_mode="$2"
  local manifest_path="$3"

  if ! node - "$ledger_path" "$persistence_mode" "$manifest_path" <<'NODE'
const fs = require('fs');

const ledgerPath = process.argv[2];
const persistenceMode = process.argv[3];
const manifestPath = process.argv[4];

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

let manifestRoot;
try {
  manifestRoot = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} catch (error) {
  fail(`cannot parse commit manifest while validating ledger (${error.message})`);
}

const manifestOps = Array.isArray(manifestRoot) ? manifestRoot : manifestRoot.operations;
if (!Array.isArray(manifestOps)) {
  fail('manifest operations array missing while validating ledger');
}
const manifestIds = new Set(manifestOps.map((op) => op && op.operation_id).filter(Boolean));

const raw = fs.readFileSync(ledgerPath, 'utf8').trim();
if (!raw) {
  fail('write ledger is empty');
}

const lines = raw.split(/\n+/);
const allowedStatuses = new Set(['created', 'skipped_existing', 'failed', 'would_create']);
const allowedRecon = new Set(['prewrite_lookup', 'postfail_lookup', 'none']);

for (let index = 0; index < lines.length; index += 1) {
  let row;
  try {
    row = JSON.parse(lines[index]);
  } catch (error) {
    fail(`write ledger line ${index + 1} is not valid JSON (${error.message})`);
  }

  const requiredFields = [
    'timestamp',
    'operation_id',
    'payload_fingerprint',
    'request_hash',
    'status',
    'reconciliation_source',
  ];

  for (const field of requiredFields) {
    if (!(field in row)) {
      fail(`write ledger line ${index + 1} missing required field '${field}'`);
    }
  }

  if (typeof row.operation_id !== 'string' || row.operation_id.trim() === '') {
    fail(`write ledger line ${index + 1} has invalid operation_id`);
  }
  if (!manifestIds.has(row.operation_id)) {
    fail(`write ledger line ${index + 1} references unknown operation_id '${row.operation_id}'`);
  }
  if (typeof row.payload_fingerprint !== 'string' || row.payload_fingerprint.trim() === '') {
    fail(`write ledger line ${index + 1} has invalid payload_fingerprint`);
  }
  if (typeof row.request_hash !== 'string' || row.request_hash.trim() === '') {
    fail(`write ledger line ${index + 1} has invalid request_hash`);
  }
  if (!allowedStatuses.has(row.status)) {
    fail(`write ledger line ${index + 1} has invalid status '${String(row.status)}'`);
  }
  if (!allowedRecon.has(row.reconciliation_source)) {
    fail(`write ledger line ${index + 1} has invalid reconciliation_source '${String(row.reconciliation_source)}'`);
  }

  if (persistenceMode === 'dry-run' && row.status !== 'would_create') {
    fail(`write ledger line ${index + 1} must use status 'would_create' in dry-run mode`);
  }
}
NODE
  then
    check_fail "Write ledger schema validation failed"
  fi
}

validate_report_and_artifacts() {
  local report_path="$1"
  local artifacts_dir="$2"

  if [[ ! -f "$report_path" ]]; then
    check_fail "Report file not found: $report_path"
    return
  fi

  local fm_file
  fm_file="$(mktemp)"
  trap 'rm -f "$fm_file"' RETURN

  if ! extract_frontmatter "$report_path" "$fm_file"; then
    check_fail "Report frontmatter is missing or malformed"
    rm -f "$fm_file"
    trap - RETURN
    return
  fi

  local type date run_status persistence_mode stance assumptions_source verbosity_mode rerun_required dry_run_writes
  type="$(frontmatter_value "Type" "$fm_file")"
  date="$(frontmatter_value "Date" "$fm_file")"
  run_status="$(frontmatter_value "Run-Status" "$fm_file")"
  persistence_mode="$(frontmatter_value "Persistence-Mode" "$fm_file")"
  stance="$(frontmatter_value "Stance" "$fm_file")"
  assumptions_source="$(frontmatter_value "Assumptions-Source" "$fm_file")"
  verbosity_mode="$(frontmatter_value "Verbosity-Mode" "$fm_file")"
  rerun_required="$(frontmatter_value "Quality-Rerun-Required" "$fm_file")"
  dry_run_writes="$(frontmatter_value "Dry-Run-Writes-Blocked" "$fm_file")"

  [[ -z "$type" ]] && check_fail "Frontmatter missing Type"
  [[ -z "$date" ]] && check_fail "Frontmatter missing Date"
  [[ -z "$run_status" ]] && check_fail "Frontmatter missing Run-Status"
  [[ -z "$persistence_mode" ]] && check_fail "Frontmatter missing Persistence-Mode"
  [[ -z "$stance" ]] && check_fail "Frontmatter missing Stance"
  [[ -z "$assumptions_source" ]] && check_fail "Frontmatter missing Assumptions-Source"
  [[ -z "$verbosity_mode" ]] && check_fail "Frontmatter missing Verbosity-Mode"
  [[ -z "$rerun_required" ]] && check_fail "Frontmatter missing Quality-Rerun-Required"
  [[ -z "$dry_run_writes" ]] && check_fail "Frontmatter missing Dry-Run-Writes-Blocked"

  if [[ "$type" != "Sweep" ]]; then
    check_fail "Type must be Sweep (found: $type)"
  fi
  if ! is_one_of "$run_status" "complete" "partial" "failed-preflight"; then
    check_fail "Run-Status must be complete|partial|failed-preflight (found: $run_status)"
  fi
  if ! is_one_of "$persistence_mode" "live" "dry-run"; then
    check_fail "Persistence-Mode must be live|dry-run (found: $persistence_mode)"
  fi
  if ! is_one_of "$stance" "improve-data" "grow-business"; then
    check_fail "Stance must be improve-data|grow-business (found: $stance)"
  fi
  if ! is_one_of "$assumptions_source" "none" "inline" "file"; then
    check_fail "Assumptions-Source must be none|inline|file (found: $assumptions_source)"
  fi
  if ! is_one_of "$verbosity_mode" "compact" "standard" "extended"; then
    check_fail "Verbosity-Mode must be compact|standard|extended (found: $verbosity_mode)"
  fi
  if ! is_one_of "$rerun_required" "yes" "no"; then
    check_fail "Quality-Rerun-Required must be yes|no (found: $rerun_required)"
  fi
  if ! is_one_of "$dry_run_writes" "yes" "no"; then
    check_fail "Dry-Run-Writes-Blocked must be yes|no (found: $dry_run_writes)"
  fi

  if [[ "$run_status" == "failed-preflight" ]]; then
    rm -f "$fm_file"
    trap - RETURN
    return
  fi

  local required_headings=(
    "Who Said What (F1)"
    "Assumption Challenge (F3)"
    "Tool-Gap Register (F2)"
    "Kill/Hold Rationale (F4)"
    "Economics Gate (F5)"
    "Persistence Accounting"
    "Delta/Coverage (F6)"
  )

  local heading
  for heading in "${required_headings[@]}"; do
    if ! has_heading "$report_path" "$heading"; then
      check_fail "Missing report section: $heading"
    fi
  done

  local who_body assumptions_body tool_gap_body kill_hold_body economics_body delta_body
  who_body="$(section_body "$report_path" "Who Said What (F1)")"
  assumptions_body="$(section_body "$report_path" "Assumption Challenge (F3)")"
  tool_gap_body="$(section_body "$report_path" "Tool-Gap Register (F2)")"
  kill_hold_body="$(section_body "$report_path" "Kill/Hold Rationale (F4)")"
  economics_body="$(section_body "$report_path" "Economics Gate (F5)")"
  delta_body="$(section_body "$report_path" "Delta/Coverage (F6)")"

  if [[ -n "$who_body" ]]; then
    if ! printf '%s\n' "$who_body" | rg -iq "originator|sub-expert"; then
      check_fail "Who Said What section must include originator/sub-expert attribution"
    fi
    if ! printf '%s\n' "$who_body" | rg -iq "lens"; then
      check_fail "Who Said What section must include lens attribution"
    fi
  fi

  if [[ "$assumptions_source" != "none" ]]; then
    if ! printf '%s\n' "$assumptions_body" | rg -iq "\\baccept\\b|\\bcondition\\b|\\breject\\b"; then
      check_fail "Assumption Challenge must include accept|condition|reject verdicts when assumptions are provided"
    fi
  fi

  if [[ -n "$tool_gap_body" ]]; then
    if ! printf '%s\n' "$tool_gap_body" | rg -iq "gap"; then
      check_fail "Tool-Gap Register section must describe gap categories"
    fi
    if ! printf '%s\n' "$tool_gap_body" | rg -iq "evidence"; then
      check_fail "Tool-Gap Register section must include evidence pointers"
    fi
  fi

  if [[ -n "$kill_hold_body" ]]; then
    if ! printf '%s\n' "$kill_hold_body" | rg -iq "hold|kill"; then
      check_fail "Kill/Hold Rationale section must mention held or killed ideas"
    fi
    if ! printf '%s\n' "$kill_hold_body" | rg -iq "reason"; then
      check_fail "Kill/Hold Rationale section must include reason codes"
    fi
    if ! printf '%s\n' "$kill_hold_body" | rg -iq "restart|trigger|condition|revisit"; then
      check_fail "Kill/Hold Rationale section must include restart condition for held ideas"
    fi
  fi

  if [[ -n "$economics_body" ]]; then
    local economics_term
    for economics_term in "pass" "blocked" "upside" "downside" "reversibility" "cost-of-delay" "time-to-signal"; do
      if ! printf '%s\n' "$economics_body" | rg -iq "$economics_term"; then
        check_fail "Economics Gate section missing required token: $economics_term"
      fi
    done
  fi

  if [[ -n "$delta_body" ]]; then
    if ! printf '%s\n' "$delta_body" | rg -iq "delta"; then
      check_fail "Delta/Coverage section must include delta metrics"
    fi
    if ! printf '%s\n' "$delta_body" | rg -iq "coverage"; then
      check_fail "Delta/Coverage section must include coverage deltas"
    fi
  fi

  if [[ "$run_status" == "partial" ]]; then
    if ! has_heading "$report_path" "Reconciliation Checklist"; then
      check_fail "Partial run must include Reconciliation Checklist section"
    fi
  fi

  local manifest_path ledger_path card_id_map_path
  manifest_path="$artifacts_dir/${date}-commit-manifest.json"
  ledger_path="$artifacts_dir/${date}-write-ledger.jsonl"
  card_id_map_path="$artifacts_dir/${date}-card-id-map.json"

  if [[ ! -f "$manifest_path" ]]; then
    check_fail "Missing 3A artifact: $manifest_path"
  fi
  if [[ ! -f "$ledger_path" ]]; then
    check_fail "Missing 3B artifact: $ledger_path"
  fi
  if [[ ! -f "$card_id_map_path" ]]; then
    check_fail "Missing card-id-map artifact: $card_id_map_path"
  fi

  if [[ -f "$manifest_path" ]]; then
    validate_manifest_schema "$manifest_path"
  fi
  if [[ -f "$manifest_path" && -f "$ledger_path" ]]; then
    validate_write_ledger "$ledger_path" "$persistence_mode" "$manifest_path"
  fi

  if [[ "$persistence_mode" == "dry-run" && "$dry_run_writes" != "yes" ]]; then
    check_fail "Dry-run mode must set Dry-Run-Writes-Blocked: yes"
  fi

  rm -f "$fm_file"
  trap - RETURN
}

run_self_test() {
  local script_path
  script_path="${repo_root}/scripts/check-ideas-go-faster-output.sh"

  local temp_root
  temp_root="$(mktemp -d)"
  trap 'rm -rf "$temp_root"' RETURN

  write_valid_case() {
    local case_dir="$1"
    mkdir -p "$case_dir"

    cat > "$case_dir/2099-01-01-sweep.user.md" <<'REPORT'
---
Type: Sweep
Date: 2099-01-01
Run-Status: complete
Persistence-Mode: dry-run
Stance: improve-data
Assumptions-Source: file
Verbosity-Mode: standard
Quality-Rerun-Required: no
Dry-Run-Writes-Blocked: yes
---

## 1. Executive Summary
Dry-run preview.

## 3. Who Said What (F1)
| Title | Originator Sub-Expert | Lens |
|---|---|---|
| Baseline Instrumentation | vantharp | musk |

## 8. Assumption Challenge (F3)
- Assumption A -> accept (evidence: docs/alpha.md)
- Assumption B -> condition (evidence: docs/beta.md)

## 10. Tool-Gap Register (F2)
- Gap-Type: telemetry
- Evidence: docs/gamma.md

## 13. Kill/Hold Rationale (F4)
- Hold candidate with reason code TG-1; restart condition: data trigger reached.

## 15. Economics Gate (F5)
- pass: 1, blocked: 0
- upside: high
- downside: bounded
- reversibility: high
- cost-of-delay: medium
- time-to-signal: 7 days

## 22. Persistence Accounting
Dry-run mode: attempted writes = 0.

## 26. Delta/Coverage (F6)
- promoted delta: +1
- coverage delta: +0%
REPORT

    cat > "$case_dir/2099-01-01-commit-manifest.json" <<'MANIFEST'
{
  "operations": [
    {
      "operation_id": "idea-brik-baseline",
      "kind": "idea_create",
      "slug": "brik-baseline",
      "payload_fingerprint": "sha256-idea",
      "depends_on": [],
      "endpoint": "/api/agent/ideas",
      "method": "POST"
    },
    {
      "operation_id": "card-brik-baseline",
      "kind": "card_create",
      "slug": "brik-baseline",
      "payload_fingerprint": "sha256-card",
      "depends_on": ["idea-brik-baseline"],
      "endpoint": "/api/agent/cards",
      "method": "POST"
    },
    {
      "operation_id": "factfind-brik-baseline",
      "kind": "factfind_upsert",
      "slug": "brik-baseline",
      "payload_fingerprint": "sha256-factfind",
      "depends_on": ["card-brik-baseline"],
      "endpoint": "/api/agent/stage-docs",
      "method": "POST",
      "payload_template": "{\"cardId\":\"{{CARD_ID}}\"}"
    }
  ]
}
MANIFEST

    cat > "$case_dir/2099-01-01-write-ledger.jsonl" <<'LEDGER'
{"timestamp":"2099-01-01T00:00:00Z","operation_id":"idea-brik-baseline","payload_fingerprint":"sha256-idea","request_hash":"req-idea","status":"would_create","entity_id":null,"reconciliation_source":"none"}
{"timestamp":"2099-01-01T00:00:01Z","operation_id":"card-brik-baseline","payload_fingerprint":"sha256-card","request_hash":"req-card","status":"would_create","entity_id":null,"reconciliation_source":"none"}
{"timestamp":"2099-01-01T00:00:02Z","operation_id":"factfind-brik-baseline","payload_fingerprint":"sha256-factfind","request_hash":"req-factfind","status":"would_create","entity_id":null,"reconciliation_source":"none"}
LEDGER

    cat > "$case_dir/2099-01-01-card-id-map.json" <<'CARDMAP'
{}
CARDMAP
  }

  run_expect_pass() {
    local name="$1"
    local case_dir="$2"
    if ! "$script_path" --report "$case_dir/2099-01-01-sweep.user.md" --artifacts-dir "$case_dir" >/dev/null; then
      echo "FAIL: self-test expected pass but failed: $name" >&2
      return 1
    fi
    return 0
  }

  run_expect_fail() {
    local name="$1"
    local case_dir="$2"
    if "$script_path" --report "$case_dir/2099-01-01-sweep.user.md" --artifacts-dir "$case_dir" >/dev/null 2>&1; then
      echo "FAIL: self-test expected failure but passed: $name" >&2
      return 1
    fi
    return 0
  }

  local failures=0

  local case_valid="$temp_root/case-valid"
  write_valid_case "$case_valid"
  run_expect_pass "valid fixture" "$case_valid" || failures=$((failures + 1))

  local case_missing_section="$temp_root/case-missing-section"
  write_valid_case "$case_missing_section"
  node -e "const fs=require('fs'); const p=process.argv[1]; let s=fs.readFileSync(p,'utf8'); s=s.replace(/## 3\\. Who Said What \\(F1\\)[\\s\\S]*?## 8\\. Assumption Challenge \\(F3\\)/, '## 8. Assumption Challenge (F3)'); fs.writeFileSync(p,s);" "$case_missing_section/2099-01-01-sweep.user.md"
  run_expect_fail "missing Who Said What" "$case_missing_section" || failures=$((failures + 1))

  local case_assumptions_verdict="$temp_root/case-assumptions-verdict"
  write_valid_case "$case_assumptions_verdict"
  node -e "const fs=require('fs'); const p=process.argv[1]; let s=fs.readFileSync(p,'utf8'); s=s.replace(/## 8\\. Assumption Challenge \\(F3\\)[\\s\\S]*?## 10\\. Tool-Gap Register \\(F2\\)/, '## 8. Assumption Challenge (F3)\\nNo verdict provided.\\n\\n## 10. Tool-Gap Register (F2)'); fs.writeFileSync(p,s);" "$case_assumptions_verdict/2099-01-01-sweep.user.md"
  run_expect_fail "missing assumption verdict" "$case_assumptions_verdict" || failures=$((failures + 1))

  local case_economics_missing_field="$temp_root/case-econ-field"
  write_valid_case "$case_economics_missing_field"
  node -e "const fs=require('fs'); const p=process.argv[1]; let s=fs.readFileSync(p,'utf8'); s=s.replace(/\\n- downside: bounded/g, ''); fs.writeFileSync(p,s);" "$case_economics_missing_field/2099-01-01-sweep.user.md"
  run_expect_fail "economics field missing" "$case_economics_missing_field" || failures=$((failures + 1))

  local case_dry_run_write_violation="$temp_root/case-dry-run-write"
  write_valid_case "$case_dry_run_write_violation"
  node -e "const fs=require('fs'); const p=process.argv[1]; let s=fs.readFileSync(p,'utf8'); s=s.replace('\"status\":\"would_create\"', '\"status\":\"created\"'); fs.writeFileSync(p,s);" "$case_dry_run_write_violation/2099-01-01-write-ledger.jsonl"
  run_expect_fail "dry-run ledger write violation" "$case_dry_run_write_violation" || failures=$((failures + 1))

  local case_manifest_dependency="$temp_root/case-manifest-deps"
  write_valid_case "$case_manifest_dependency"
  node -e "const fs=require('fs'); const p=process.argv[1]; let s=fs.readFileSync(p,'utf8'); s=s.replace('\"depends_on\": [\"card-brik-baseline\"]', '\"depends_on\": []'); fs.writeFileSync(p,s);" "$case_manifest_dependency/2099-01-01-commit-manifest.json"
  run_expect_fail "factfind dependency missing" "$case_manifest_dependency" || failures=$((failures + 1))

  local case_missing_manifest="$temp_root/case-missing-manifest"
  write_valid_case "$case_missing_manifest"
  rm -f "$case_missing_manifest/2099-01-01-commit-manifest.json"
  run_expect_fail "missing manifest artifact" "$case_missing_manifest" || failures=$((failures + 1))

  if [[ "$failures" -ne 0 ]]; then
    echo "FAIL: output validator self-test failed ($failures case(s))" >&2
    rm -rf "$temp_root"
    trap - RETURN
    exit 1
  fi

  echo "PASS: ideas-go-faster output validator self-test passed (1 pass fixture + 6 defect fixtures)."
  rm -rf "$temp_root"
  trap - RETURN
}

report_path=""
artifacts_dir=""
self_test=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --report)
      if [[ $# -lt 2 ]]; then
        echo "ERROR: --report requires a path" >&2
        usage >&2
        exit 2
      fi
      report_path="$2"
      shift 2
      ;;
    --artifacts-dir)
      if [[ $# -lt 2 ]]; then
        echo "ERROR: --artifacts-dir requires a path" >&2
        usage >&2
        exit 2
      fi
      artifacts_dir="$2"
      shift 2
      ;;
    --self-test)
      self_test=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "ERROR: unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ "$self_test" -eq 1 ]]; then
  run_self_test
  exit 0
fi

if [[ -z "$report_path" ]]; then
  report_path="$(ls -1t docs/business-os/sweeps/*-sweep.user.md 2>/dev/null | head -n 1 || true)"
fi

if [[ -z "$report_path" ]]; then
  check_fail "No sweep report found. Provide --report <path>."
else
  if [[ -z "$artifacts_dir" ]]; then
    artifacts_dir="$(dirname "$report_path")"
  fi
  validate_report_and_artifacts "$report_path" "$artifacts_dir"
fi

if [[ "$fail" -ne 0 ]]; then
  exit 1
fi

echo "PASS: ideas-go-faster output checks passed ($report_path)."
