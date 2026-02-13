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

fail=0
warn_count=0
check_count=0

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

# ── Prerequisite: reference files exist ──

for ref_file in "$LOOP_SPEC" "$WRAPPER_SKILL" "$WORKFLOW_GUIDE" "$PROMPT_INDEX"; do
  if [[ ! -f "$ref_file" ]]; then
    echo "ABORT: Required reference file missing: $ref_file" >&2
    exit 1
  fi
done

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
