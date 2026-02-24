#!/usr/bin/env bash
set -euo pipefail

# Startup Loop Contract Lint (LPSP-08)
#
# Validates alignment across loop-spec.yaml, wrapper skill, workflow guide,
# prompt index, and all lp-* skills. Detects all SQ-01..SQ-12 drift classes.
#
# Usage:
#   scripts/check-startup-loop-contracts.sh          # normal run
#   scripts/check-startup-loop-contracts.sh --self-test   # self-test mode
#
# Exit codes: 0 = PASS, 1 = FAIL (at least one check failed)

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$repo_root"

SELF_TEST=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --self-test)
      SELF_TEST=1
      shift
      ;;
    -h|--help)
      echo "Usage:"
      echo "  scripts/check-startup-loop-contracts.sh"
      echo "  scripts/check-startup-loop-contracts.sh --self-test"
      exit 0
      ;;
    *)
      echo "ERROR: unknown arg: $1" >&2
      echo "Run with --help for usage." >&2
      exit 2
      ;;
  esac
done

fail=0
warn_count=0
check_count=0

run_self_tests() {
  local st_fail=0

  if ! command -v rg >/dev/null 2>&1; then
    echo "SELF-TEST FAIL: rg not found in PATH" >&2
    return 1
  fi

  # Stage alias detection patterns (used for SQ-13)
  if ! printf '%s\n' '{ "stage": "lp-fact-find" }' | rg -q '"stage"\s*:\s*"lp-fact-find"'; then
    echo "SELF-TEST FAIL: stage alias JSON pattern did not match" >&2
    st_fail=1
  fi
  if ! printf '%s\n' 'GET /api/agent/stage-docs/BRIK-ENG-0001/lp-fact-find' | rg -q '/api/agent/stage-docs/.+/lp-fact-find'; then
    echo "SELF-TEST FAIL: stage-doc path alias pattern did not match" >&2
    st_fail=1
  fi
  if ! printf '%s\n' 'Fact-finding stage doc complete (API stage `lp-fact-find`)' | rg -q --fixed-strings 'API stage `lp-fact-find`'; then
    echo "SELF-TEST FAIL: fixed-string backtick pattern did not match" >&2
    st_fail=1
  fi

  # Decision reference extraction (used for SQ-14)
  if ! printf '%s\n' 'decision_reference: "docs/plans/lp-skill-system-sequencing-plan.md#DL-01"' \
    | rg -q 'docs/plans/[^"]+\.md'; then
    echo "SELF-TEST FAIL: decision_reference extraction pattern did not match" >&2
    st_fail=1
  fi

  # Legacy filename reference (used for SQ-15)
  if ! printf '%s\n' 'docs/business-os/cards/BRIK-ENG-0020/fact-finding.user.md' \
    | rg -q --fixed-strings 'fact-finding.user.md'; then
    echo "SELF-TEST FAIL: legacy filename fixed-string pattern did not match" >&2
    st_fail=1
  fi

  if [[ "$st_fail" -ne 0 ]]; then
    return 1
  fi
}

check_fail() {
  echo "FAIL: $1" >&2
  fail=1
  (( check_count++ )) || true
}

check_pass() {
  (( check_count++ )) || true
}

check_warn() {
  echo "WARN: $1" >&2
  (( warn_count++ )) || true
  (( check_count++ )) || true
}

# ── Reference files ──

LOOP_SPEC="docs/business-os/startup-loop/loop-spec.yaml"
WRAPPER_SKILL=".claude/skills/startup-loop/SKILL.md"
WORKFLOW_GUIDE="docs/business-os/startup-loop-workflow.user.md"
PROMPT_INDEX="docs/business-os/workflow-prompts/README.user.md"
AUTONOMY_POLICY="docs/business-os/startup-loop/autonomy-policy.md"
WORKSPACE_PATHS=".claude/skills/_shared/workspace-paths.md"
STAGE_DOC_OPS=".claude/skills/_shared/stage-doc-operations.md"
STAGE_OPERATOR_DICT="docs/business-os/startup-loop/stage-operator-dictionary.yaml"
STAGE_OPERATOR_MAP="docs/business-os/startup-loop/_generated/stage-operator-map.json"

# ── Prerequisite: reference files exist ──

for ref_file in "$LOOP_SPEC" "$WRAPPER_SKILL" "$WORKFLOW_GUIDE" "$PROMPT_INDEX"; do
  if [[ ! -f "$ref_file" ]]; then
    echo "ABORT: Required reference file missing: $ref_file" >&2
    exit 1
  fi
done

if [[ "$SELF_TEST" -eq 1 ]]; then
  if run_self_tests; then
    echo "SELF-TEST PASS"
    exit 0
  fi
  echo "SELF-TEST FAIL" >&2
  exit 1
fi

# ── SQ-01: Stage graph consistency ──
# Loop-spec stage IDs must appear in wrapper skill and workflow guide.

spec_stages=$(rg '^\s+- id: ' "$LOOP_SPEC" | sed 's/.*id: //' | sort)
spec_count=$(echo "$spec_stages" | wc -l | tr -d ' ')

# Check wrapper skill contains each stage ID
sq01_fail=0
while IFS= read -r stage_id; do
  if ! rg -q "\\b${stage_id}\\b" "$WRAPPER_SKILL"; then
    check_fail "Stage $stage_id from loop-spec missing in wrapper skill (SQ-01)"
    sq01_fail=1
  fi
done <<< "$spec_stages"

if [[ $sq01_fail -eq 0 ]]; then
  check_pass
fi

# Check workflow guide contains each stage ID
sq01b_fail=0
while IFS= read -r stage_id; do
  if ! rg -q "\\b${stage_id}\\b" "$WORKFLOW_GUIDE"; then
    check_fail "Stage $stage_id from loop-spec missing in workflow guide (SQ-01)"
    sq01b_fail=1
  fi
done <<< "$spec_stages"

if [[ $sq01b_fail -eq 0 ]]; then
  check_pass
fi

# SQ-01D: Stage-ID parity check between loop-spec and operator map/dictionary.
# Transitional remap is explicitly allowlisted:
#   S3  -> SIGNALS-01
#   S10 -> SIGNALS
sq01d_fail=0

if [[ ! -f "$STAGE_OPERATOR_DICT" ]]; then
  check_fail "Stage operator dictionary missing: $STAGE_OPERATOR_DICT (SQ-01D)"
  sq01d_fail=1
fi

if [[ ! -f "$STAGE_OPERATOR_MAP" ]]; then
  check_fail "Stage operator map missing: $STAGE_OPERATOR_MAP (SQ-01D)"
  sq01d_fail=1
fi

if [[ $sq01d_fail -eq 0 ]]; then
  dict_stages=$(node -e "const fs=require('fs'); const yaml=require('js-yaml'); const d=yaml.load(fs.readFileSync('${STAGE_OPERATOR_DICT}','utf8')); console.log((d.stages||[]).map((s)=>s.id).sort().join('\n'))")
  map_stages=$(node -e "const m=require('./${STAGE_OPERATOR_MAP}'); console.log(m.stages.map((s)=>s.id).sort().join('\n'))")
  spec_unique=$(echo "$spec_stages" | sort -u)

  # loop-spec vs dictionary: allow only controlled transitional remap pair.
  while IFS= read -r missing_stage; do
    [[ -z "$missing_stage" ]] && continue
    if [[ "$missing_stage" != "S3" && "$missing_stage" != "S10" ]]; then
      check_fail "Stage ${missing_stage} from loop-spec missing in stage-operator-dictionary.yaml (SQ-01D)"
      sq01d_fail=1
    fi
  done < <(comm -23 <(echo "$spec_unique") <(echo "$dict_stages"))

  while IFS= read -r extra_stage; do
    [[ -z "$extra_stage" ]] && continue
    case "$extra_stage" in
      SIGNALS|SIGNALS-01|SIGNALS-02|SIGNALS-03|SIGNALS-04|SIGNALS-05) ;;
      *)
        check_fail "Extra stage ${extra_stage} present in stage-operator-dictionary.yaml but absent from loop-spec (SQ-01D)"
        sq01d_fail=1
        ;;
    esac
  done < <(comm -13 <(echo "$spec_unique") <(echo "$dict_stages"))

  # loop-spec vs generated map: allow only controlled remap pair.
  while IFS= read -r missing_map_stage; do
    [[ -z "$missing_map_stage" ]] && continue
    if [[ "$missing_map_stage" != "S3" && "$missing_map_stage" != "S10" ]]; then
      check_fail "Stage ${missing_map_stage} from loop-spec missing in stage-operator-map.json (SQ-01D)"
      sq01d_fail=1
    fi
  done < <(comm -23 <(echo "$spec_unique") <(echo "$map_stages"))

  while IFS= read -r extra_map_stage; do
    [[ -z "$extra_map_stage" ]] && continue
    case "$extra_map_stage" in
      SIGNALS|SIGNALS-01|SIGNALS-02|SIGNALS-03|SIGNALS-04|SIGNALS-05) ;;
      *)
        check_fail "Extra stage ${extra_map_stage} present in stage-operator-map.json but absent from loop-spec (SQ-01D)"
        sq01d_fail=1
        ;;
    esac
  done < <(comm -13 <(echo "$spec_unique") <(echo "$map_stages"))

  # Controlled remap must remain explicit and stable.
  if ! node -e "const m=require('./${STAGE_OPERATOR_MAP}'); process.exit((m.alias_index?.s3==='SIGNALS-01' && m.alias_index?.s10==='SIGNALS')?0:1)"; then
    check_fail "Transitional remap aliases missing or changed: expected s3->SIGNALS-01 and s10->SIGNALS (SQ-01D)"
    sq01d_fail=1
  fi
fi

if [[ $sq01d_fail -eq 0 ]]; then
  check_pass
fi

# SQ-01C: Retired marketing/sales IDs must not appear in active operator surfaces.
# Hard-cut policy for startup-loop-market-sell-containers.

sq01c_fail=0
legacy_marketing_sales_pattern='\bS2\b|\bS2B\b|\bS3B\b|\bS6B\b|GATE-S6B-STRAT-01|GATE-S6B-ACT-01|GATE-S3B-01'

for active_surface in "$WORKFLOW_GUIDE" "$PROMPT_INDEX"; do
  if legacy_hits=$(rg -n -e "$legacy_marketing_sales_pattern" "$active_surface" 2>/dev/null); then
    check_fail "Retired marketing/sales IDs found in ${active_surface} (SQ-01C)"
    echo "$legacy_hits" >&2
    sq01c_fail=1
  fi
done

if [[ $sq01c_fail -eq 0 ]]; then
  check_pass
fi

# ── SQ-02: Skill route resolution ──
# Every skill referenced in loop-spec must have a SKILL.md file.

sq02_fail=0
while IFS= read -r skill_line; do
  skill_name=$(echo "$skill_line" | sed 's/.*skill: //' | sed 's/^\/*//' | awk '{print $1}')
  # Skip non-skill values (prompt-handoff, etc.)
  if [[ "$skill_name" == "prompt-handoff" ]]; then
    continue
  fi
  # Handle "/startup-loop start" → startup-loop
  skill_dir=".claude/skills/${skill_name}"
  if [[ ! -f "${skill_dir}/SKILL.md" ]]; then
    check_fail "Skill '${skill_name}' referenced in loop-spec has no SKILL.md at ${skill_dir}/ (SQ-02)"
    sq02_fail=1
  fi
done < <(rg '^\s+skill: ' "$LOOP_SPEC")

# Also check secondary_skills
while IFS= read -r secondary_line; do
  skill_name=$(echo "$secondary_line" | sed 's/.*- \///' | awk '{print $1}')
  skill_dir=".claude/skills/${skill_name}"
  if [[ ! -f "${skill_dir}/SKILL.md" ]]; then
    check_fail "Secondary skill '${skill_name}' referenced in loop-spec has no SKILL.md (SQ-02)"
    sq02_fail=1
  fi
done < <(rg '^\s+- /' "$LOOP_SPEC" | rg -v 'stage:')

if [[ $sq02_fail -eq 0 ]]; then
  check_pass
fi

# ── SQ-03: Artifact path consistency ──
# Skills that produce startup-baseline artifacts should use consistent path patterns.

sq03_fail=0
# Check lp-offer and lp-channels use matching patterns
if [[ -f ".claude/skills/lp-offer/SKILL.md" ]] && [[ -f ".claude/skills/lp-channels/SKILL.md" ]]; then
  offer_pattern=$(rg -c "startup-baselines" ".claude/skills/lp-offer/SKILL.md" || echo "0")
  channels_pattern=$(rg -c "startup-baselines" ".claude/skills/lp-channels/SKILL.md" || echo "0")
  if [[ "$offer_pattern" -gt 0 ]] && [[ "$channels_pattern" -eq 0 ]]; then
    check_fail "lp-offer references startup-baselines but lp-channels does not — path pattern mismatch (SQ-03)"
    sq03_fail=1
  elif [[ "$offer_pattern" -eq 0 ]] && [[ "$channels_pattern" -gt 0 ]]; then
    check_fail "lp-channels references startup-baselines but lp-offer does not — path pattern mismatch (SQ-03)"
    sq03_fail=1
  fi
fi

if [[ $sq03_fail -eq 0 ]]; then
  check_pass
fi

# ── SQ-04: Repo topology matches path assumptions ──
# Expected directories from loop-spec bos_sync fields must exist.

sq04_fail=0
for expected_dir in "docs/business-os/strategy" "docs/business-os/startup-loop"; do
  if [[ ! -d "$expected_dir" ]]; then
    check_fail "Expected directory '$expected_dir' does not exist (SQ-04)"
    sq04_fail=1
  fi
done

if [[ $sq04_fail -eq 0 ]]; then
  check_pass
fi

# ── SQ-05: Fact-find handoff filename consistency ──
# lp-fact-find output path must use canonical directory-based format.
# Fixed by LPSP-05; lint verifies the fix remains.

sq05_fail=0
if [[ -f ".claude/skills/lp-fact-find/SKILL.md" ]]; then
  # Canonical path should be referenced
  if ! rg -q 'docs/plans/.*fact-find\.md' ".claude/skills/lp-fact-find/SKILL.md"; then
    check_fail "lp-fact-find does not reference canonical fact-find output path (SQ-05)"
    sq05_fail=1
  fi
fi

# lp-plan and lp-build should accept the same path pattern
for consumer in "lp-plan" "lp-build"; do
  if [[ -f ".claude/skills/${consumer}/SKILL.md" ]]; then
    if ! rg -q 'fact-find' ".claude/skills/${consumer}/SKILL.md"; then
      check_fail "${consumer} does not reference fact-find input (SQ-05)"
      sq05_fail=1
    fi
  fi
done

if [[ $sq05_fail -eq 0 ]]; then
  check_pass
fi

# ── SQ-06: BOS persistence contract consistency ──
# Stages with side_effects: none in loop-spec must not have BOS write instructions.

sq06_fail=0
# S5A is the canonical side_effects: none stage
if [[ -f ".claude/skills/lp-prioritize/SKILL.md" ]]; then
  if rg -qi "/api/agent" ".claude/skills/lp-prioritize/SKILL.md"; then
    check_fail "lp-prioritize (side_effects: none) references /api/agent — should not perform BOS writes (SQ-06)"
    sq06_fail=1
  fi
fi

if [[ $sq06_fail -eq 0 ]]; then
  check_pass
fi

# ── SQ-07: Stage-doc key consistency ──
# Canonical stage-doc key for fact-find should be 'fact-find' (not 'lp-fact-find').
# Fixed by LPSP-05; lint verifies canonical key is used.

sq07_fail=0
if [[ -f "$STAGE_DOC_OPS" ]]; then
  if rg -q 'Canonical.*lp-fact-find' "$STAGE_DOC_OPS"; then
    check_fail "stage-doc-operations uses 'lp-fact-find' as canonical key — should be 'fact-find' (SQ-07)"
    sq07_fail=1
  fi
fi

if [[ -f "$WORKSPACE_PATHS" ]]; then
  if rg -q 'canonical.*lp-fact-find' "$WORKSPACE_PATHS"; then
    check_fail "workspace-paths uses 'lp-fact-find' as canonical key — should be 'fact-find' (SQ-07)"
    sq07_fail=1
  fi
fi

if [[ $sq07_fail -eq 0 ]]; then
  check_pass
fi

# ── SQ-13: Stage-doc alias emission (idea-* skills) ──
# idea-* skills must not emit legacy stage-doc keys/paths like lp-fact-find.
# Skill slugs (e.g. /lp-fact-find) are allowed; only stage-doc API keys/paths are forbidden.

sq13_fail=0
if rg -q '"stage"\s*:\s*"lp-fact-find"' -S .claude/skills/idea-*/SKILL.md 2>/dev/null; then
  check_fail "idea-* skills contain stage-doc writes using stage=lp-fact-find — must use stage=fact-find (SQ-13)"
  sq13_fail=1
fi
if rg -q '/api/agent/stage-docs/.+/lp-fact-find\\b' -S .claude/skills/idea-*/SKILL.md 2>/dev/null; then
  check_fail "idea-* skills contain stage-doc endpoint paths using /lp-fact-find — must use /fact-find (SQ-13)"
  sq13_fail=1
fi
if rg -q --fixed-strings 'API stage `lp-fact-find`' -S .claude/skills/idea-*/SKILL.md 2>/dev/null; then
  check_fail "idea-* skills contain stage-doc type text `lp-fact-find` — must use `fact-find` (SQ-13)"
  sq13_fail=1
fi

if [[ $sq13_fail -eq 0 ]]; then
  check_pass
fi

# ── SQ-08: Launch gate dependency verification ──
# lp-launch-qa dependencies must exist: state.json schema, QA skill contract.

sq08_fail=0
if [[ -f ".claude/skills/lp-launch-qa/SKILL.md" ]]; then
  # The event-state-schema.md defines state.json (replaces loop-state.json)
  if ! [[ -f "docs/business-os/startup-loop/event-state-schema.md" ]]; then
    check_fail "event-state-schema.md missing — lp-launch-qa depends on state.json schema (SQ-08)"
    sq08_fail=1
  fi
fi

if [[ $sq08_fail -eq 0 ]]; then
  check_pass
fi

# ── SQ-09: Prompt-pack coverage completeness ──
# All stages with prompt_required: true in loop-spec must appear in prompt index.

sq09_fail=0
# Extract stages with prompt_required: true by scanning loop-spec
# We look for blocks like: "- id: S0\n    name: Intake\n    ...\n    prompt_required: true"
current_stage=""
while IFS= read -r line; do
  if [[ "$line" =~ ^[[:space:]]*-\ id:\ (.+) ]]; then
    current_stage="${BASH_REMATCH[1]}"
  elif [[ "$line" =~ prompt_required:\ true ]] && [[ -n "$current_stage" ]]; then
    if ! rg -q "\\b${current_stage}\\b" "$PROMPT_INDEX"; then
      check_fail "Stage $current_stage requires prompt (loop-spec) but missing from prompt index (SQ-09)"
      sq09_fail=1
    fi
    current_stage=""
  elif [[ "$line" =~ prompt_required:\ false ]] && [[ -n "$current_stage" ]]; then
    current_stage=""
  fi
done < "$LOOP_SPEC"

if [[ $sq09_fail -eq 0 ]]; then
  check_pass
fi

# ── SQ-10: Path topology consistency ──
# Skills referencing BOS paths should use docs/business-os/strategy/<BIZ>/ (not docs/business-os/<BIZ>/).

sq10_fail=0
for skill_dir in .claude/skills/lp-*/; do
  skill_file="${skill_dir}SKILL.md"
  if [[ -f "$skill_file" ]]; then
    # Check for wrong BOS path pattern (docs/business-os/<BIZ>/ without 'strategy' or 'startup-baselines')
    if rg -q 'docs/business-os/<BIZ>/' "$skill_file" 2>/dev/null; then
      check_warn "$(basename "$skill_dir") uses 'docs/business-os/<BIZ>/' — should include subdirectory (strategy/startup-baselines) (SQ-10)"
      sq10_fail=1
    fi
  fi
done

if [[ $sq10_fail -eq 0 ]]; then
  check_pass
fi

# ── SQ-11: Stale integration references ──
# Skills should not reference non-existent skills (e.g., lp-channel instead of lp-channels).

sq11_fail=0
known_stale_refs=("lp-channel" "lp-content")
for stale_ref in "${known_stale_refs[@]}"; do
  for skill_dir in .claude/skills/lp-*/; do
    skill_file="${skill_dir}SKILL.md"
    if [[ -f "$skill_file" ]]; then
      # Match the stale ref as a word boundary (not as part of lp-channels)
      if rg -q "/${stale_ref}\\b" "$skill_file" 2>/dev/null; then
        skill_name=$(basename "$skill_dir")
        # Exclude if the stale ref is a substring of the actual skill name
        if [[ "$skill_name" != "${stale_ref}"* ]]; then
          check_fail "${skill_name} references non-existent skill '${stale_ref}' (SQ-11)"
          sq11_fail=1
        fi
      fi
    fi
  done
done

if [[ $sq11_fail -eq 0 ]]; then
  check_pass
fi

# ── SQ-12: Stage semantics consistency ──
# Stage number references in skills must match loop-spec stage assignments.
# e.g., prioritize is S5A (not S3), forecast is S3 (not S5).

sq12_fail=0
# Check lp-prioritize references S5 (not S3)
if [[ -f ".claude/skills/lp-prioritize/SKILL.md" ]]; then
  if rg -q '\bS3\b.*prioriti' ".claude/skills/lp-prioritize/SKILL.md" 2>/dev/null; then
    check_fail "lp-prioritize references S3 for prioritization — should be S5A (SQ-12)"
    sq12_fail=1
  fi
fi

# Check lp-experiment doesn't mismap stage numbers
if [[ -f ".claude/skills/lp-experiment/SKILL.md" ]]; then
  if rg -q 'lp-prioritize.*S3\b' ".claude/skills/lp-experiment/SKILL.md" 2>/dev/null; then
    check_fail "lp-experiment maps lp-prioritize to S3 — should be S5A (SQ-12)"
    sq12_fail=1
  fi
fi

if [[ $sq12_fail -eq 0 ]]; then
  check_pass
fi

# ── SQ-14: Decision reference targets exist ──
# Canonical docs must not point at missing plan paths.

sq14_fail=0
declare -a decision_ref_sources=(
  "$LOOP_SPEC"
  "docs/business-os/startup-loop/autonomy-policy.md"
  "docs/business-os/startup-loop/event-state-schema.md"
  "docs/business-os/startup-loop/manifest-schema.md"
  "docs/business-os/startup-loop/stage-result-schema.md"
)

for src in "${decision_ref_sources[@]}"; do
  if [[ ! -f "$src" ]]; then
    continue
  fi
  while IFS= read -r ref; do
    ref_path="${ref%%#*}"
    if [[ -n "$ref_path" ]] && [[ ! -f "$ref_path" ]]; then
      check_fail "Decision reference target missing: ${ref_path} (from ${src}) (SQ-14)"
      sq14_fail=1
    fi
  done < <(rg -o 'docs/plans/[^"]+\\.md(#[A-Za-z0-9_-]+)?' "$src" 2>/dev/null | sort -u)
done

if [[ $sq14_fail -eq 0 ]]; then
  check_pass
fi

# ── SQ-15: Legacy stage-doc filename references allowlist ──
# During the compatibility window, allow the legacy filename only in explicitly allowlisted locations.

sq15_fail=0
declare -a MIGRATION_ALLOWLIST=(
  "docs/business-os/startup-loop/contract-migration.yaml"
  "docs/business-os/cards/BRIK-ENG-0020.user.md"
  "docs/registry.json"
)

while IFS= read -r match; do
  match_file="${match%%:*}"
  allowed=0
  for allow in "${MIGRATION_ALLOWLIST[@]}"; do
    if [[ "$match_file" == "$allow" ]]; then
      allowed=1
      break
    fi
  done
  if [[ "$allowed" -eq 0 ]]; then
    check_fail "Legacy filename reference fact-finding.user.md found in non-allowlisted file: ${match_file} (SQ-15)"
    sq15_fail=1
  fi
done < <(rg -n --fixed-strings 'fact-finding.user.md' docs/business-os docs/registry.json 2>/dev/null || true)

if [[ $sq15_fail -eq 0 ]]; then
  check_pass
fi

# ── Root policy checks ──

# Autonomy policy must exist
if [[ ! -f "$AUTONOMY_POLICY" ]]; then
  check_fail "Autonomy policy missing: $AUTONOMY_POLICY (root policy)"
else
  check_pass
fi

# Loop-spec version must be present
if ! rg -q '^spec_version:' "$LOOP_SPEC"; then
  check_fail "loop-spec.yaml missing spec_version field (root policy)"
else
  check_pass
fi

# ── Summary ──

echo ""
echo "Startup Loop contract lint: ${check_count} checks, ${warn_count} warnings"

if [[ $fail -ne 0 ]]; then
  echo "RESULT: FAIL — contract violations detected" >&2
  exit 1
fi

echo "RESULT: PASS — all contract checks passed"
exit 0
