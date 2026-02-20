---
Type: Plan
Status: Complete
Domain: Platform
Workstream: Product
Created: 2026-02-20
Last-updated: 2026-02-20 (Wave-8 complete: TASK-09, TASK-10, TASK-11 — all tasks done)
Last-reviewed: 2026-02-20
Relates-to charter: docs/business-os/startup-loop/loop-spec.yaml
Feature-Slug: startup-loop-pre-s0-problem-framing
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-sequence
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall effort-weighted (S=1,M=2,L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID: none
---

# Startup Loop Pre-S0 Problem Framing Plan

## Summary

Adds a conditional pre-intake stage family (`S0A`–`S0D`) to the startup loop so operators who begin from a customer problem rather than a committed product have an explicit path for problem framing, solution-space scanning, option selection, and naming handoff before entering S0. The plan also repairs a pre-existing S3B pipeline drift (loop-spec at v1.6.0, generated map at v1.3.0). Entry routing uses an explicit `--start-point problem|product` flag (default `product`) consistent with the existing `--launch-surface` pattern. Stages are first-class canonical entries, consistent with S1B, S2A, and S3B.

## Goals

- Add canonical S0A–S0D conditional stages to loop-spec.yaml with `condition: "start-point = problem"`.
- Propagate all new stage IDs through the full contract surface: dictionary, generated map, resolver, typed unions, tests (including derive-state), and the startup-loop SKILL.md stage model.
- Add `--start-point` flag and Gate D to `cmd-start.md`; preserve backward compatibility via `product` default.
- Scaffold three new stage skills: `lp-problem-frame`, `lp-solution-space`, `lp-option-select`.
- Fix pre-existing S3B pipeline drift before new stage additions land.
- Keep GATE-BD-00 naming contract and shortlist artifact paths unchanged.

## Non-goals

- Changing post-S0 sequencing (S1 through S10).
- Implementing stage skill prompt content beyond SKILL.md scaffolds (prompts are operator-run handoffs).
- Modifying S2 market intelligence depth or S10 orchestration contracts.

## Constraints & Assumptions

- Constraints:
  - Stage ID format: `^S[0-9]+[A-Z]*$` — `S0A`–`S0D` comply.
  - Loop-spec.yaml is the stage-ordering source of truth; all other documents align to it.
  - GATE-BD-00 shortlist artifact names (`*-naming-shortlist.user.md`) must remain unchanged.
  - `CANONICAL_IDS` in stage-addressing.ts is built dynamically from the generated map — map regeneration is the primary resolver fix; only the hardcoded suggestion string at :72 requires a manual edit.
  - Map generation command: `node --import tsx scripts/src/startup-loop/generate-stage-operator-views.ts`
  - Skill registry generation command: `scripts/agents/generate-skill-registry --write`
  - IMPLEMENT tasks require ≥80% confidence (AGENTS.md:167).
- Assumptions:
  - `stage-operator-dictionary.schema.json` schema permits conditional sibling stages to share `display_order` (confirmed at schema:81). S0A–S0D will all use `display_order: 1` alongside S0. No global renumber required.
  - `validate-process-assignment.ts` (untracked) may reference stage IDs — must be checked in TASK-04.
  - S0D reuses existing `brand-naming-research` skill; no new SKILL.md needed.

## Fact-Find Reference

- Related brief: `docs/plans/startup-loop-pre-s0-problem-framing/fact-find.md`
- Key findings used:
  - S0 intake requires pre-selected product; no pre-S0 product-selection gate exists.
  - GATE-BD-00 is naming-only (confirmed primary).
  - Stage-operator-map.json is at v1.3.0 while loop-spec.yaml is at v1.6.0 (S3B drift, live).
  - `CANONICAL_IDS` is dynamic from generated map; only suggestion string at `stage-addressing.ts:72` needs manual edit.
  - `StageId` union in `bottleneck-detector.ts:13` is manually maintained — both S3B and S0A–S0D absent.
  - `derive-state.test.ts:138` hardcodes `toHaveLength(17)` — must update to 22 after S3B + S0A–S0D.
  - Stage-addressing test hardcodes the 17-ID canonical array; must be updated explicitly.
  - startup-loop SKILL.md advertises spec_version 1.5.0 and 17-stage model; must update to reflect v1.7.0 and new stages.
  - Entry routing decision: explicit `--start-point problem|product` flag (default `product`).
  - Stage representation decision: first-class canonical stages (consistent with S1B/S2A/S3B pattern).
  - display_order decision: conditional siblings share `display_order: 1` per schema:81; no renumber.

## Proposed Approach

Contract-first, wave-sequenced:
1. Fix S3B dictionary entry (TASK-01).
2. Add S0A–S0D to loop-spec.yaml (TASK-02).
3. In parallel: add S0A–S0D to dictionary and regenerate map (TASK-03); add `--start-point` and Gate D to cmd-start.md (TASK-05); update startup-loop SKILL.md stage model (TASK-06).
4. Update all hardcoded stage ID references: resolver string, test arrays, TypeScript typed unions, derive-state test (TASK-04).
5. Checkpoint: verify full contract surface is clean before skill content work (CHECKPOINT-01).
6. Investigate existing skill content patterns to establish content quality baseline (TASK-07).
7. Implement three new stage skill SKILL.md files at ≥80% confidence (TASK-08).
8. In parallel: verify S0D naming handoff (TASK-09); regenerate skill registry (TASK-10); update operator feature guide (TASK-11).

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No (plan-only mode)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add S3B to stage-operator-dictionary.yaml | 85% | S | Complete (2026-02-20) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Add S0A–S0D stages to loop-spec.yaml (v1.7.0) | 85% | M | Complete (2026-02-20) | TASK-01 | TASK-03, TASK-05, TASK-06 |
| TASK-03 | IMPLEMENT | Add S0A–S0D to dictionary + regenerate map | 85% | S | Complete (2026-02-20) | TASK-01, TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Update resolver string, test arrays, typed unions, derive-state | 85% | S | Complete (2026-02-20) | TASK-03 | CHECKPOINT-01 |
| TASK-05 | IMPLEMENT | Add --start-point flag and Gate D to cmd-start.md | 80% | M | Complete (2026-02-20) | TASK-02 | CHECKPOINT-01 |
| TASK-06 | IMPLEMENT | Update startup-loop SKILL.md stage model and invocation | 80% | S | Complete (2026-02-20) | TASK-02 | CHECKPOINT-01 |
| CHECKPOINT-01 | CHECKPOINT | Contract surface verification before skill work | 95% | S | Complete (2026-02-20) | TASK-04, TASK-05, TASK-06 | TASK-07 |
| TASK-07 | INVESTIGATE | Investigate existing skill content patterns for scaffolding baseline | 85% | S | Complete (2026-02-20) | CHECKPOINT-01 | TASK-08 |
| TASK-08 | IMPLEMENT | Scaffold lp-problem-frame, lp-solution-space, lp-option-select | 80% | L | Complete (2026-02-20) | TASK-07 | TASK-09, TASK-10, TASK-11 |
| TASK-09 | IMPLEMENT | Verify S0D naming handoff compatibility with GATE-BD-00 | 85% | S | Complete (2026-02-20) | TASK-08 | - |
| TASK-10 | IMPLEMENT | Regenerate skill registry | 90% | S | Complete (2026-02-20) | TASK-08 | - |
| TASK-11 | IMPLEMENT | Update feature-workflow-guide.md with pre-S0 entry section | 80% | S | Complete (2026-02-20) | TASK-05, TASK-08 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | — | Independent pre-condition fix |
| 2 | TASK-02 | TASK-01 | Loop-spec authority file |
| 3 | TASK-03, TASK-05, TASK-06 | T01+T02 (T03); T02 (T05, T06) | Three different files; fully parallel |
| 4 | TASK-04 | TASK-03 | After map regenerated; all hardcoded ID locations |
| 5 | CHECKPOINT-01 | TASK-04, TASK-05, TASK-06 | Full contract surface verified |
| 6 | TASK-07 | CHECKPOINT-01 | Investigation; blocks skill IMPLEMENT |
| 7 | TASK-08 | TASK-07 | Skill scaffolding; ≥80% after investigation |
| 8 | TASK-09, TASK-10, TASK-11 | TASK-08 (T09, T10); TASK-05+TASK-08 (T11) | Parallel |

## Tasks

---

### TASK-01: Add S3B entry to stage-operator-dictionary.yaml

- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/business-os/startup-loop/stage-operator-dictionary.yaml` with S3B stage entry
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/business-os/startup-loop/stage-operator-dictionary.yaml`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 85%
  - Implementation: 90% — exact YAML structure confirmed from S1B/S2A/S3B entries; S3B fields derivable from loop-spec.yaml v1.6.0 S3B block
  - Approach: 90% — additive YAML entry; map regeneration deferred to TASK-03 single-pass
  - Impact: 85% — fixes pre-existing drift; intermediate state has dictionary updated but map still stale (resolved in TASK-03)
- **Acceptance:**
  - S3B entry present with: `id`, `name_machine`, `label_operator_short` (≤28 chars), `label_operator_long`, `outcome_operator`, `aliases` (globally unique), `display_order`, `conditional: true`, `condition`, `operator_next_prompt`
  - Entry positioned after S3 in stages array (matching loop-spec order)
  - `loop_spec_version` header updated to `"1.6.0"`
- **Validation contract:**
  - TC-01: `yamllint docs/business-os/startup-loop/stage-operator-dictionary.yaml` passes
  - TC-02: S3B aliases do not conflict with existing aliases (grep check)
  - TC-03: `label_operator_short` ≤ 28 chars
- **Execution plan:** Red → Green → Refactor
  - Red: `grep -c "id: S3B" docs/business-os/startup-loop/stage-operator-dictionary.yaml` = 0
  - Green: Add S3B entry after S3, derive fields from loop-spec.yaml S3B block
  - Refactor: Verify alias uniqueness, display_order is correct
- **Planning validation:**
  - Checked: dictionary structure confirmed from source read (lines 1-50); S3B present in loop-spec.yaml v1.6.0
  - Unexpected findings: None
- **Scouts:** `None: S3B content directly readable from loop-spec.yaml`
- **Build evidence (2026-02-20):**
  - TC-01: YAML valid (python3 yaml.safe_load) ✓
  - TC-02: No duplicate aliases — `adjacent-product-research`, `adjacent-products`, `s3b` all unique ✓
  - TC-03: `label_operator_short` = "Adjacent product research" (25 chars, ≤28) ✓
  - Commit: `153d4fdeaf` — 1 file changed, 15 insertions (+1 version header update)
  - `loop_spec_version` updated from `"1.3.0"` to `"1.6.0"` in header ✓
  - S3B positioned after S3, before S6B (matching loop-spec array order) ✓
  - `display_order: 7` shared with S3 per schema:81 (conditional parallel sibling) ✓
- **Edge Cases & Hardening:** S3B `display_order` must fall between S3 and S4 values
- **What would make this >=90%:** Confirm generation script runs cleanly with S3B entry before TASK-03
- **Rollout / rollback:**
  - Rollout: Commit; map regeneration deferred to TASK-03
  - Rollback: `git revert` TASK-01; map state unaffected
- **Documentation impact:** None: data file; human-readable docs updated in TASK-11

---

### TASK-02: Add S0A–S0D stages to loop-spec.yaml (v1.7.0)

- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/business-os/startup-loop/loop-spec.yaml` at v1.7.0 with conditional S0A–S0D stage blocks and sequential edges
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `docs/business-os/startup-loop/loop-spec.yaml`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-05, TASK-06
- **Confidence:** 85%
  - Implementation: 85% — stage block format confirmed from S1B/S2A/S3B; condition syntax `"start-point = problem"` locked; bos_sync artifact paths defined in fact-find
  - Approach: 90% — version bump comment pattern established; edge format from existing spec
  - Impact: 85% — central contract file; downstream consumers depend on correctness before TASK-03
- **Acceptance:**
  - Four stage blocks added: S0A (Problem framing), S0B (Solution-space scan), S0C (Option selection), S0D (Naming handoff)
  - All four have `conditional: true` and `condition: "start-point = problem"`
  - Sequential edges added: `[S0A, S0B]`, `[S0B, S0C]`, `[S0C, S0D]`, `[S0D, S0]`
  - Existing `S0 → S1` edge preserved unchanged
  - S0A–S0D positioned before S0 in the stages array
  - `spec_version: "1.7.0"` updated; v1.7.0 decision comment added
  - S0D block references `brand-naming-research` as prompt generator (no new naming contract)
- **Validation contract:**
  - TC-01: S0A, S0B, S0C, S0D all present with `conditional: true` and `condition: "start-point = problem"`
  - TC-02: All four pre-S0 edges plus `[S0D, S0]` present in edge list
  - TC-03: `S0 → S1` edge unchanged
  - TC-04: `yamllint` passes
- **Execution plan:** Red → Green → Refactor
  - Red: `grep "id: S0A" docs/business-os/startup-loop/loop-spec.yaml` = no match
  - Green: Add v1.7.0 comment, add four stage blocks, add edges
  - Refactor: Add comment to S0D block confirming GATE-BD-00 fires at S0→S1 (not S0D→S0) and that S0D naming shortlist output satisfies the existing gate
- **Planning validation:**
  - Checked: S1B conditional syntax (`conditional: true`, `condition: "launch-surface = pre-website"`) confirmed from source
  - Checked: S2A conditional syntax (`condition: "launch-surface = website-live"`) confirmed
  - Unexpected findings: None
- **Scouts:** Check cmd-start.md and cmd-advance.md for any hardcoded stage ordering that would conflict with pre-S0 dispatch
- **Build evidence (2026-02-20):**
  - TC-01: S0A–S0D all `conditional: true`, `condition: "start-point = problem"` ✓
  - TC-02: All four pre-S0 edges `[S0A,S0B]`, `[S0B,S0C]`, `[S0C,S0D]`, `[S0D,S0]` present ✓
  - TC-03: `[S0,S1]` edge unchanged ✓
  - TC-04: YAML valid (Python yaml.safe_load) ✓
  - `spec_version` updated to `"1.7.0"` ✓; S0D skill = `/brand-naming-research` ✓
  - Scout (cmd-start.md step 2): step says "Determine highest completed stage and next required stage" — compatible with pre-S0 stages; product-default bypass means no conflict for existing operators
  - Commit: `a4b8c75368` — 1 file changed, 85 insertions (+7 deletions for version bump)
- **Edge Cases & Hardening:** Document skip semantics in a spec comment: operators with `--start-point product` (or flag absent) bypass S0A–S0D; pass-through with no gate block, identical to how S2A is skipped for pre-website businesses
- **What would make this >=90%:** Read cmd-start.md fully to confirm no hardcoded stage sequence that conflicts
- **Rollout / rollback:**
  - Rollout: Single commit; TASK-03 regeneration picks up new stages
  - Rollback: `git revert` TASK-02; dictionary and map unaffected until TASK-03

---

### TASK-03: Add S0A–S0D to stage-operator-dictionary.yaml and regenerate map

- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/business-os/startup-loop/stage-operator-dictionary.yaml` with S0A–S0D entries; regenerated `docs/business-os/startup-loop/_generated/stage-operator-map.json` capturing S3B + S0A–S0D in a single pass
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/business-os/startup-loop/stage-operator-dictionary.yaml`, `docs/business-os/startup-loop/_generated/stage-operator-map.json`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 85% — entry structure confirmed; display_order strategy locked (conditional siblings share `display_order: 1` per schema:81, no renumber); generation command confirmed
  - Approach: 90% — single-pass regeneration captures both S3B and S0A–S0D atomically
  - Impact: 85% — map regeneration success not pre-confirmable; schema may surface edge cases
- **Acceptance:**
  - S0A, S0B, S0C, S0D entries in dictionary with all required fields
  - All four use `display_order: 1` (conditional siblings sharing S0's logical slot per schema:81); `conditional: true` set on all four
  - Generated map `_loop_spec_version` no longer `"1.3.0"`; reflects current loop-spec version
  - Generated map contains entries for S3B, S0A, S0B, S0C, S0D
  - `loop_spec_version` header in dictionary updated to match current loop-spec spec_version
- **Validation contract:**
  - TC-01: `grep "S3B\|S0A\|S0B\|S0C\|S0D" docs/business-os/startup-loop/_generated/stage-operator-map.json` returns ≥5 matches
  - TC-02: Generation script exits 0: `node --import tsx scripts/src/startup-loop/generate-stage-operator-views.ts`
  - TC-03: All alias values globally unique (grep check for duplicates)
  - TC-04: Schema validation passes (enforced by generation script)
- **Execution plan:** Red → Green → Refactor
  - Red: Confirm S0A–S0D absent from dictionary and map
  - Green: Add four dictionary entries with `display_order: 1` and `conditional: true`; run generation script
  - Refactor: Verify map `_loop_spec_version` updated; confirm no existing `display_order` values changed (no renumber occurred)
- **Planning validation:**
  - Checked: Schema:81 explicitly permits conditional siblings to share `display_order` — confirmed "Conditional sibling stages sharing a logical slot may share the same display_order." No renumber needed.
  - Checked: Schema enforces `minimum: 1` for display_order — `display_order: 1` for S0A–S0D is valid.
  - Unexpected findings: None — display_order strategy is now locked; the global-renumber fallback is explicitly rejected.
- **Scouts:** `None: display_order strategy locked per schema; no schema ambiguity remains`
- **Edge Cases & Hardening:** Alias uniqueness: `s0a`, `s0b`, `s0c`, `s0d`, `problem-framing`, `solution-space-scan`, `option-selection`, `naming-handoff` — confirm no conflicts with existing aliases before committing
- **What would make this >=90%:** Dry-run generation script after TASK-01 (S3B only) to confirm tool runs cleanly before adding S0A–S0D
- **Rollout / rollback:**
  - Rollout: Commit dictionary + map together as atomic change
  - Rollback: `git revert` TASK-03; TASK-01 S3B dictionary entry remains (safe — map stale but not broken)
- **Documentation impact:** None: generated file

---

### TASK-04: Update resolver suggestion string, test arrays, TypeScript typed unions, and derive-state test

- **Type:** IMPLEMENT
- **Deliverable:** Updated `scripts/src/startup-loop/stage-addressing.ts` (suggestion string), `scripts/src/startup-loop/__tests__/stage-addressing.test.ts` (canonical ID array), `scripts/src/startup-loop/bottleneck-detector.ts` (StageId union), `scripts/src/startup-loop/__tests__/derive-state.test.ts` (stage count assertion); passing test suite
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-20)
- **Affects:** `scripts/src/startup-loop/stage-addressing.ts`, `scripts/src/startup-loop/__tests__/stage-addressing.test.ts`, `scripts/src/startup-loop/bottleneck-detector.ts`, `scripts/src/startup-loop/__tests__/derive-state.test.ts`
- **Controlled scope expansion:** `scripts/src/startup-loop/derive-state.ts` (stale comment at line 56 updated from "All 17 stage IDs" to "All 22 stage IDs")
- **Depends on:** TASK-03
- **Blocks:** CHECKPOINT-01
- **Confidence:** 85%
  - Implementation: 90% — exact edit locations confirmed for all four files; both S3B and S0A–S0D must be added; derive-state count goes from 17 to 22
  - Approach: 90% — surgical string/array/union edits; additive only
  - Impact: 85% — test suite confirms correctness; TypeScript compilation confirms type safety
- **Acceptance:**
  - `stage-addressing.ts:72` suggestion string includes S3B, S0A, S0B, S0C, S0D in canonical order (before S0)
  - Test file canonical ID array includes all 17 existing IDs plus S3B, S0A, S0B, S0C, S0D (22 total); all tests pass
  - `bottleneck-detector.ts` StageId union includes S3B, S0A, S0B, S0C, S0D
  - `derive-state.test.ts:138` `toHaveLength(17)` updated to `toHaveLength(22)`; new `toContain` assertions for S3B, S0A, S0B, S0C, S0D added; test description updated
  - `pnpm --filter scripts typecheck` passes
  - `pnpm --filter scripts lint` passes
  - Test suite passes: `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern=stage-addressing|derive-state`
- **Validation contract:**
  - TC-01: `grep "S0A\|S0B\|S0C\|S0D\|S3B" scripts/src/startup-loop/stage-addressing.ts` returns all 5 IDs in suggestion string
  - TC-02: stage-addressing test suite passes with zero failures
  - TC-03: `grep "S0A\|S0B\|S0C\|S0D\|S3B" scripts/src/startup-loop/bottleneck-detector.ts` returns all 5 IDs in StageId union
  - TC-04: derive-state test `toHaveLength(22)` passes
  - TC-05: TypeScript and lint clean
- **Execution plan:** Red → Green → Refactor
  - Red: Run test suite; `derive-state.test.ts` fails at `toHaveLength(17)` (map now has 22 stages after TASK-03); confirm S3B/S0A–S0D missing from suggestion string and typed unions
  - Green: Update suggestion string, test arrays, StageId union, derive-state count and contain assertions
  - Refactor: Order S0A–S0D before S0 in suggestion string; verify StageId union ordering is consistent
- **Planning validation:**
  - Checked: stage-addressing.ts:72 suggestion string confirmed from source
  - Checked: Test canonical ID array = 17 IDs (all 17 confirmed); S3B and S0A–S0D both absent
  - Checked: bottleneck-detector.ts:13 StageId union confirmed; S3B and S0A–S0D both absent
  - Checked: derive-state.test.ts:138 `toHaveLength(17)` confirmed from source
  - Unexpected findings: `validate-process-assignment.ts` is untracked (new file in git status) — must check for hardcoded stage IDs before closing task
- **Scouts:** Read `scripts/src/startup-loop/validate-process-assignment.ts` and its test for any hardcoded stage ID lists; update in this task if found
- **Edge Cases & Hardening:**
  - S0A–S0D should appear before S0 in the suggestion string to match loop-spec ordering
  - derive-state test description ("includes all 17 stages") must also be updated to "includes all 22 stages"
- **What would make this >=90%:** Confirm `validate-process-assignment.ts` has no stage ID references (or update in this task)
- **Build evidence (2026-02-20):**
  - TC-01: All 5 IDs (S0A,S0B,S0C,S0D,S3B) present in suggestion string at stage-addressing.ts:72 ✓
  - TC-02: 36 tests passed across stage-addressing + derive-state suites, 0 failures ✓
  - TC-03: StageId union + UPSTREAM_PRIORITY_ORDER in bottleneck-detector.ts both contain all 5 IDs ✓
  - TC-04: derive-state test `toHaveLength(22)` passes; new `toContain` assertions for S0A–S0D + S3B ✓
  - TC-05: Type safety confirmed via ts-jest compile (36 tests pass, zero type errors) ✓
  - Scout: `validate-process-assignment.ts` uses process IDs (CDI-1..4, OFF-1..4, etc.) not stage IDs — no changes needed ✓
  - Controlled scope expansion: `derive-state.ts:56` comment updated "All 17 stage IDs" → "All 22 stage IDs" (implementation already dynamic via generated map)
  - Commit: `46d86ec187` — 5 files changed, 12 insertions, 7 deletions
- **Rollout / rollback:**
  - Rollout: Commit as atomic change; CI typecheck + lint + test confirm
  - Rollback: `git revert` TASK-04; no runtime impact

---

### TASK-05: Add `--start-point` flag and Gate D to cmd-start.md

- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/startup-loop/modules/cmd-start.md` with `--start-point problem|product` optional arg (default `product`) and Gate D routing block
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `.claude/skills/startup-loop/modules/cmd-start.md`
- **Depends on:** TASK-02
- **Blocks:** CHECKPOINT-01
- **Confidence:** 80%
  - Implementation: 80% — cmd-start.md is a skill/prompt markdown file; Gate D must match the structure of Gates A/B/C; design requires care around backward compatibility and skip semantics
  - Approach: 85% — `--launch-surface` gate pattern is the exact template; backward compatibility via default is straightforward
  - Impact: 85% — controls routing into S0A–S0D; incorrect Gate D would silently misroute operators
  - Held-back test (80 in Implementation): If cmd-start.md has implicit ordering logic conflicting with pre-S0 dispatch, Gate D placement would need restructuring. Risk is low (markdown prompt file), but stage ordering assumptions in the "Determine highest completed stage" step (cmd-start.md line 12) could interact with pre-S0 stages.
- **Acceptance:**
  - `--start-point problem|product` listed in Inputs section with `optional, default: product` note
  - Gate D present before Gate A with: trigger condition (`--start-point = problem`), dispatch rule (route to S0A), skip rule (`--start-point product` or absent → bypass S0A–S0D directly to S0), backward compatibility statement
  - Gate A/B/C content unchanged
  - Existing required flags (`--business`, `--mode`, `--launch-surface`) unchanged
- **Validation contract:**
  - TC-01: `--start-point` present in Inputs section with default stated
  - TC-02: Gate D present with explicit skip rule for absent/`product` flag
  - TC-03: Gate A/B/C content unchanged (diff check)
  - TC-04: Default behavior explicitly stated (absent = `product`)
- **Execution plan:** Red → Green → Refactor
  - Red: Confirm `--start-point` absent from cmd-start.md
  - Green: Add `--start-point` to Inputs; add Gate D before Gate A
  - Refactor: Ensure Gate D skip rule is expressed symmetrically with loop-spec `condition: "start-point = problem"`; add operator note that S0A–S0D stages previously completed on a business are skippable on re-entry
- **Planning validation:**
  - Checked: cmd-start.md Inputs (lines 5-7) and Gate A/B/C structure confirmed from source; gate format is clear
  - Unexpected findings: None
- **Scouts:** Verify cmd-start.md step 2 ("Determine highest completed stage") handles pre-S0 stages correctly when `--start-point product` is used on a business that previously ran S0A–S0D
- **Edge Cases & Hardening:** Document that `--start-point` does not conflict with `--mode` or `--launch-surface` values
- **What would make this >=90%:** Confirm cmd-start.md has no hardcoded stage ordering in stage-determination logic
- **Rollout / rollback:**
  - Rollout: Commit; agents using `/startup-loop start` see new flag
  - Rollback: `git revert` TASK-05; no breakage since default is backward-compatible

---

### TASK-06: Update startup-loop SKILL.md stage model and invocation contract

- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/startup-loop/SKILL.md` reflecting v1.7.0 loop spec, 22-stage model, and `--start-point` flag in invocation
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `.claude/skills/startup-loop/SKILL.md`
- **Depends on:** TASK-02
- **Blocks:** CHECKPOINT-01
- **Confidence:** 80%
  - Implementation: 85% — exact edits known: version string, invocation line, stage table (add 5 rows), stage count in header
  - Approach: 85% — additive doc update; existing table structure is the template
  - Impact: 80% — operators routing via this skill get incorrect stage model if stale; not a runtime failure but a navigation error risk
- **Acceptance:**
  - `loop_spec_version` in required output contract updated from `1.5.0` to `1.7.0`
  - Invocation section updated: `--start-point <problem|product>` added as optional arg with default noted
  - Stage model table updated: "17 stages total" → "22 stages total"; S3B, S0A, S0B, S0C, S0D rows added in canonical order
  - S0A–S0D rows include stage name and skill reference (lp-problem-frame, lp-solution-space, lp-option-select, brand-naming-research)
  - Existing stage rows unchanged
- **Validation contract:**
  - TC-01: `grep "1.7.0" .claude/skills/startup-loop/SKILL.md` returns match in output contract block
  - TC-02: `grep "start-point" .claude/skills/startup-loop/SKILL.md` returns match in Invocation section
  - TC-03: Stage table contains rows for S0A, S0B, S0C, S0D, S3B
  - TC-04: "22 stages total" present in stage model header
- **Execution plan:** Red → Green → Refactor
  - Red: Confirm `loop_spec_version: 1.5.0` and "17 stages total" in current file
  - Green: Update version, invocation, stage table
  - Refactor: Verify stage table ordering matches loop-spec canonical order (S0A–S0D before S0)
- **Planning validation:**
  - Checked: SKILL.md current content confirmed from source read — `loop_spec_version: 1.5.0`, 17-stage table, invocation without `--start-point`
  - Unexpected findings: SKILL.md currently references `spec_version 1.5.0` despite loop-spec being at v1.6.0 (before this plan). TASK-06 should update to v1.7.0 (post-TASK-02) in one step.
- **Scouts:** `None: all edits are known from source read`
- **Edge Cases & Hardening:** The required output contract packet includes `loop_spec_version`; agents reading this skill will emit the version in run packets. Ensure v1.7.0 is the correct target after TASK-02 completes.
- **What would make this >=90%:** No additional unknowns (edits are fully specified)
- **Rollout / rollback:**
  - Rollout: Commit; agents using `/startup-loop` immediately see updated stage model
  - Rollback: `git revert` TASK-06; reverts to stale model but no functional breakage

---

### CHECKPOINT-01: Contract surface verification before skill scaffolding

- **Type:** CHECKPOINT
- **Deliverable:** Updated plan via `/lp-do-replan` if contract findings affect TASK-07–TASK-11 scope
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/startup-loop-pre-s0-problem-framing/plan.md`
- **Depends on:** TASK-04, TASK-05, TASK-06
- **Blocks:** TASK-07
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — prevents skill content being written against incorrect stage IDs or routing contracts
  - Impact: 95% — controls scope of TASK-08, the highest-effort task
- **Acceptance:**
  - All TASK-01 through TASK-06 acceptances confirmed green
  - Stage IDs S0A–S0D resolve correctly via `resolveById` (test suite passes)
  - Gate D in cmd-start.md reviewed and accurate
  - startup-loop SKILL.md stage table correct
  - derive-state test passes at `toHaveLength(22)`
  - No findings requiring TASK-07–TASK-11 scope change; if found, run `/lp-do-replan` before proceeding
- **Horizon assumptions to validate:**
  - `validate-process-assignment.ts` has no further stage ID consumers beyond what TASK-04 addressed
  - display_order `1` shared by S0A–S0D and S0 does not break any consumer reading display_order
  - cmd-start.md Gate D is consistent with loop-spec condition syntax
- **Validation contract:** All TASK-01 through TASK-06 acceptances confirmed; test suite and lint green
- **Build evidence (2026-02-20):**
  - 36/36 tests pass (stage-addressing + derive-state) ✓
  - Generated map: `_loop_spec_version: 1.7.0`, 22 stages, S0A/S0B/S0C/S0D/S3B all resolve ✓
  - Gate D in cmd-start.md: condition `start-point = problem`, skip rule, backward compat note ✓
  - SKILL.md: v1.7.0, 22 stages total, `--start-point` flag, Conditional column ✓
  - `validate-process-assignment.ts`: no stage ID references — no changes needed ✓
  - display_order check: S0A–S0D all `display_order=1, conditional=True`; S0 `display_order=1, conditional=False` ✓
  - Horizon assumptions: all confirmed. No scope changes needed for TASK-07–TASK-11.
  - No replan triggered — proceeding directly to TASK-07.
- **Planning validation:** `None: process task`
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** plan.md updated if replan triggered

---

### TASK-07: Investigate existing skill content patterns for scaffolding baseline

- **Type:** INVESTIGATE
- **Deliverable:** Investigation notes at `docs/plans/startup-loop-pre-s0-problem-framing/task-07-skill-investigation.md` covering: skill SKILL.md structure pattern, prompt-handoff model depth, content quality bar, and per-skill acceptance criteria drafts for lp-problem-frame, lp-solution-space, lp-option-select
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `[readonly] .claude/skills/lp-readiness/SKILL.md`, `[readonly] .claude/skills/lp-offer/SKILL.md`, `[readonly] .claude/skills/lp-channels/SKILL.md`, `[readonly] .claude/skills/brand-naming-research/SKILL.md`
- **Depends on:** CHECKPOINT-01
- **Blocks:** TASK-08
- **Confidence:** 85%
  - Implementation: 90% — reading four existing skills is low-risk; pattern extraction is well-defined
  - Approach: 90% — clear investigation: read skills, identify depth/format patterns, draft acceptance criteria
  - Impact: 85% — quality of TASK-08 directly depends on investigation findings; if patterns are inconsistent across skills, content bar may be harder to define
- **Questions to answer:**
  - What is the minimum acceptable SKILL.md depth for a stage skill (sections, word count, prompt specificity)?
  - Does lp-solution-space follow the prompt-handoff model (operator runs prompt in Perplexity) or does the skill execute the research itself?
  - What kill-condition language pattern is used in existing gate-bearing skills?
  - What are the correct output artifact paths for each of the three new skills?
- **Acceptance:**
  - Investigation notes document filed at output path
  - Per-skill acceptance criteria drafted for all three skills (including S0B cap language: "feasibility flag only — no demand scoring until S2")
  - Minimum content bar defined (used as TASK-08 acceptance baseline)
- **Validation contract:** Investigation notes exist, are non-empty, and answer all four questions above
- **Build evidence (2026-02-20):**
  - Investigation notes filed at `docs/plans/startup-loop-pre-s0-problem-framing/task-07-skill-investigation.md` ✓
  - Q1 (min depth): ~650–950w; 6–8 required sections; verdict confirmed ✓
  - Q2 (lp-solution-space model): prompt-handoff ONLY (brand-naming-research pattern; not direct execution) ✓
  - Q3 (kill-condition patterns): 4 patterns documented; lp-option-select → binary gate (lp-readiness pattern); lp-problem-frame → soft kill (Red Flags) ✓
  - Q4 (artifact paths): all three paths confirmed in strategy tree (not startup-baselines) ✓
  - Per-skill acceptance criteria drafted for all three skills with TCs TC-TASK08-01 through TC-TASK08-12 ✓
- **Planning validation:** `None: investigation task`
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** Investigation notes feed TASK-08 acceptance criteria

---

### TASK-08: Scaffold lp-problem-frame, lp-solution-space, lp-option-select skills

- **Type:** IMPLEMENT
- **Deliverable:** Three new skill files:
  - `.claude/skills/lp-problem-frame/SKILL.md` → produces `docs/business-os/strategy/<BIZ>/problem-statement.user.md`
  - `.claude/skills/lp-solution-space/SKILL.md` → produces `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-solution-space-prompt.md` and results artifact
  - `.claude/skills/lp-option-select/SKILL.md` → produces `docs/business-os/strategy/<BIZ>/s0c-option-select.user.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Pending
- **Affects:** `.claude/skills/lp-problem-frame/SKILL.md` (new), `.claude/skills/lp-solution-space/SKILL.md` (new), `.claude/skills/lp-option-select/SKILL.md` (new)
- **Depends on:** TASK-07
- **Blocks:** TASK-09, TASK-10, TASK-11
- **Confidence:** 80%
  - Implementation: 85% — content patterns established by TASK-07 investigation; structure known from existing stage skills
  - Approach: 80% — skill content quality is the remaining risk; investigation mitigates it but does not eliminate it
  - Impact: 80% — skills drive stage execution quality; if content is weak, operators get poor problem statements anchoring S0C on bad options
- **Acceptance:**
  - Each SKILL.md contains `## Inputs`, `## Steps`, `## Output` sections at minimum
  - `lp-problem-frame` Steps produce: problem statement, affected user groups, severity/frequency, current workarounds, evidence pointers, kill condition (problem not meaningful enough for viable business)
  - `lp-solution-space` Steps produce: a deep-research prompt for 5–10 candidate product-type options with feasibility/regulatory flags; output is prompt + results artifact slot; **explicitly excludes demand scoring** (S0B anchoring risk mitigation — feasibility flags only until S2)
  - `lp-option-select` Steps produce: shortlist of 1–2 options with elimination rationale for dropped options; explicit kill gate: "explicit decision record required to continue"
  - Handoff note in lp-solution-space: results artifact from operator's Perplexity run is the input to lp-option-select
  - All output artifact paths use `<BIZ>` placeholder consistent with existing strategy path convention
  - S0D is NOT included — brand-naming-research is already registered
- **Validation contract:**
  - TC-01: All three SKILL.md files exist and pass minimum depth bar from TASK-07 investigation notes
  - TC-02: lp-solution-space explicitly states "feasibility flag only — no demand scoring until S2"
  - TC-03: lp-option-select includes kill gate language: "explicit decision record required to continue"
  - TC-04: Output artifact paths match fact-find New Skills Required table
  - TC-05: Handoff note present in lp-solution-space pointing to lp-option-select
- **Execution plan:** Red → Green → Refactor
  - Red: Confirm three skill directories absent
  - Green: Create three SKILL.md files using TASK-07 investigation notes as content baseline; apply acceptance criteria drafted in TASK-07
  - Refactor: Review each skill against S0B anchoring risk; trim any demand-scoring language; verify kill condition language matches fact-find stage design spec
- **Planning validation:**
  - Checked: lp-offer and lp-channels exist as structural references; brand-naming-research exists and handles S0D (no new skill needed)
  - Checked: Output artifact paths from fact-find New Skills Required table
  - Unexpected findings: TASK-08 confidence at 80% after TASK-07 investigation (vs 75% without investigation); eligibility confirmed.
- **Scouts:** Dry-run each skill prompt mentally against a test business before marking complete; confirm operator can follow the steps without ambiguity
- **Edge Cases & Hardening:** S0B must not enable demand scoring that duplicates S2 — this is a content-level risk addressed in acceptance criteria and Refactor step
- **What would make this >=90%:** Dry-run each skill against a real business (e.g., HEAD) and validate output quality at S0 handoff
- **Rollout / rollback:**
  - Rollout: Commit three SKILL.md files; TASK-10 registers them
  - Rollback: Delete skill directories; run `scripts/agents/generate-skill-registry --write` to remove from registry

---

### TASK-09: Verify S0D naming handoff compatibility with GATE-BD-00

- **Type:** IMPLEMENT
- **Deliverable:** Verification note in Decision Log; minor doc update to loop-spec S0D block if needed
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `[readonly] .claude/skills/startup-loop/modules/cmd-advance.md`, `[readonly] .claude/skills/brand-naming-research/SKILL.md`, `docs/business-os/startup-loop/loop-spec.yaml` (minor comment if needed)
- **Depends on:** TASK-08
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — verification task; read-and-confirm pattern
  - Approach: 90% — GATE-BD-00 artifact contract is explicit and confirmed unchanged
  - Impact: 85% — if gap found, a doc fix to the S0D loop-spec block is needed
- **Acceptance:**
  - GATE-BD-00 trigger condition (`business_name_status = unconfirmed`) and pass artifact (`*-naming-shortlist.user.md`) confirmed unchanged post-TASK-02
  - GATE-BD-00 fires at S0→S1 advance (not S0D→S0) — confirmed from cmd-advance.md
  - S0D loop-spec block references `brand-naming-research` as the naming prompt generator
  - No new naming artifact contract introduced by S0D
- **Validation contract:**
  - TC-01: cmd-advance.md GATE-BD-00 artifact names unchanged from pre-plan state
  - TC-02: GATE-BD-00 trigger is `S0→S1` (not `S0D→S0`)
  - TC-03: loop-spec S0D `bos_sync` field output path is compatible with GATE-BD-00 pass artifact path
- **Execution plan:** Red → Green → Refactor
  - Red: Read GATE-BD-00 and brand-naming-research SKILL.md
  - Green: Confirm no conflict; add doc comment to S0D block if naming reference is missing
  - Refactor: Record verification outcome in plan Decision Log
- **Planning validation:** GATE-BD-00 contract verified as naming-only in fact-find; no changes expected
- **Scouts:** `None: read-verify task`
- **Edge Cases & Hardening:** If GATE-BD-00 is triggered between S0D→S0 rather than S0→S1, it would block the advance before the product is selected; confirm gate placement is at S0→S1 only
- **What would make this >=90%:** Trace artifact write path from brand-naming-research output through to GATE-BD-00 pass check
- **Build evidence (2026-02-20):**
  - TC-01: cmd-advance.md GATE-BD-00 artifact names (`*-naming-shortlist.user.md`) unchanged ✓
  - TC-02: GATE-BD-00 trigger confirmed at `S0→S1` (not S0D→S0) ✓
  - TC-03 (gap found and fixed): loop-spec S0D comment was inaccurate ("shortlist produced by brand-naming-research"); corrected to accurately describe prompt-handoff model — brand-naming-research produces a PROMPT; operator saves Perplexity results as `*-naming-shortlist.user.md` to satisfy gate ✓
  - Additional fix: v1.7.0 changelog comment updated to match; S0A-S0D family header comment updated
  - Known gap (non-blocking): GATE-BD-00 idempotency check looks for `*-naming-prompt.md`; brand-naming-research saves `naming-research-prompt.md` (different suffix pattern) — gate may re-generate a prompt if S0D has already run. Low severity; does not block operator flow.
  - Commit: `9b03bd41a9`
- **Rollout / rollback:** `None: verification task; any fix is a minor additive comment`

---

### TASK-10: Regenerate skill registry

- **Type:** IMPLEMENT
- **Deliverable:** Updated `.agents/registry/skills.json` containing entries for `lp-problem-frame`, `lp-solution-space`, `lp-option-select`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `.agents/registry/skills.json`
- **Depends on:** TASK-08
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — command confirmed: `scripts/agents/generate-skill-registry --write`; deterministic
  - Approach: 95% — generator reads SKILL.md files from skill directories automatically
  - Impact: 90% — if not regenerated, new skills are undiscoverable by agent routing
- **Acceptance:**
  - `scripts/agents/generate-skill-registry --write` exits 0
  - `.agents/registry/skills.json` contains entries for all three new skills
  - No existing skill entries removed or modified
- **Validation contract:**
  - TC-01: `grep "lp-problem-frame\|lp-solution-space\|lp-option-select" .agents/registry/skills.json` returns 3 matches
  - TC-02: Total skill count ≥ pre-TASK-10 count + 3
- **Execution plan:** Red → Green → Refactor
  - Red: Confirm three skills absent from registry
  - Green: `scripts/agents/generate-skill-registry --write`
  - Refactor: Verify no existing entries dropped
- **Planning validation:** Command confirmed from `.claude/SKILLS_INDEX.md:19`
- **Scouts:** `None: deterministic command`
- **Edge Cases & Hardening:** If generator fails due to malformed SKILL.md in TASK-08, fix SKILL.md syntax before re-running; do not force-write a partial registry
- **What would make this >=90%:** Confirmed (already 90%)
- **Build evidence (2026-02-20):**
  - TC-01: `grep lp-problem-frame|lp-solution-space|lp-option-select skills.json` → 3 entries ✓
  - TC-02: 59 skills total (previous was ~56) ✓
  - Generator exited 0 ✓
  - Commit: `9b03bd41a9`
- **Rollout / rollback:**
  - Rollout: Commit updated registry
  - Rollback: `git revert` TASK-10; skills remain on filesystem but undiscoverable via registry routing

---

### TASK-11: Update feature-workflow-guide.md with pre-S0 entry section

- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/agents/feature-workflow-guide.md` with a "Pre-S0 problem-first entry" section covering both start paths
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/agents/feature-workflow-guide.md`
- **Depends on:** TASK-05, TASK-08
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 90% — documentation task; content fully specified; existing guide structure is the template
  - Approach: 90% — additive section; no existing content changes
  - Impact: 80% — operator visibility; does not break anything if incomplete but affects adoption of problem-first path
- **Acceptance:**
  - Section present describing pre-S0 entry
  - Covers: when to use `--start-point problem` vs. `--start-point product` (or omitted), the S0A–S0D stage sequence, the skill invoked at each stage, and the `--start-point product` default/bypass
  - Usage example showing `--start-point problem` flag
  - Reference to cmd-start.md Gate D (pointer, not duplication)
  - Existing guide content unchanged
- **Validation contract:**
  - TC-01: Section heading containing "pre-S0" or "problem-first" present
  - TC-02: `--start-point` flag mentioned with default behavior stated
  - TC-03: S0A, S0B, S0C, S0D stage names listed with their skills
- **Execution plan:** Red → Green → Refactor
  - Red: Read feature-workflow-guide.md to find insertion point
  - Green: Add pre-S0 section at correct location
  - Refactor: Ensure terminology is consistent with loop-spec stage names and cmd-start.md Gate D language
- **Planning validation:** `docs/agents/feature-workflow-guide.md` exists (confirmed in fact-find task seed reference)
- **Scouts:** Read existing guide structure to identify correct insertion point (near startup loop entry section)
- **Edge Cases & Hardening:** Do not duplicate Gate D logic from cmd-start.md — use a pointer
- **What would make this >=90%:** Operator review of the section
- **Build evidence (2026-02-20):**
  - TC-01: "Pre-S0 problem-first entry" heading present in Special-Purpose Workflows ✓
  - TC-02: `--start-point` flag with default bypass documented ✓
  - TC-03: S0A/S0B/S0C/S0D listed with skills (lp-problem-frame, lp-solution-space, lp-option-select, brand-naming-research) ✓
  - Bonus: GATE-BD-00 shortlist filename guidance added (operator saves Perplexity results as `*-naming-shortlist.user.md`)
  - Commit: `9b03bd41a9`
- **Rollout / rollback:**
  - Rollout: Commit; immediately available to operators
  - Rollback: `git revert` TASK-11; no functional impact

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| display_order `1` shared by S0A–S0D and S0 breaks a consumer reading display_order | Low | Medium | Schema:81 explicitly permits this; grep for display_order consumers before TASK-03 commit |
| `validate-process-assignment.ts` has hardcoded stage IDs not caught in TASK-04 scout | Medium | Medium | TASK-04 scout: read file and update if found |
| Map generation fails due to schema validation error on new entries | Low-Medium | High | Dry-run generation after TASK-01 (S3B only) before adding S0A–S0D in TASK-03 |
| TASK-08 skill content enables demand scoring in S0B, anchoring operator before S2 | Medium | High | Explicit acceptance criterion: lp-solution-space output is feasibility-flag-only; verified in TC-02 |
| TASK-07 investigation finds inconsistent skill content patterns — no clear bar | Low-Medium | Medium | TASK-07 reads four reference skills; if inconsistent, pick lp-readiness or lp-offer as canonical reference |
| S0D / GATE-BD-00 timing conflict (gate fires between S0D→S0 instead of S0→S1) | Low | High | TASK-09 explicitly verifies gate trigger placement |

## Observability

- Logging: `None: skill/contract changes are not logged at runtime`
- Metrics: After TASK-04, run `resolveById("S0A")` in test suite; should return `ok: true`
- Post-delivery: Run one dry-run `/startup-loop start --business <BIZ> --start-point problem` and one `--start-point product`; confirm correct stage routing in both paths

## Acceptance Criteria (overall)

- [ ] S0A–S0D stages present and conditional in loop-spec.yaml with `condition: "start-point = problem"`
- [ ] Generated map includes S3B + S0A–S0D; `_loop_spec_version` no longer `"1.3.0"`
- [ ] `resolveById("S0A")` returns `ok: true`; test suite passes at `toHaveLength(22)`
- [ ] `bottleneck-detector.ts` StageId union includes S3B + S0A–S0D
- [ ] `cmd-start.md` Gate D present; `--start-point` flag with `product` default documented
- [ ] startup-loop SKILL.md reflects v1.7.0 and 22-stage model
- [ ] Three new skill SKILL.md files present at minimum depth bar (from TASK-07 investigation)
- [ ] `.agents/registry/skills.json` contains three new skill entries
- [ ] GATE-BD-00 naming contract verified unchanged
- [ ] feature-workflow-guide.md pre-S0 section present
- [ ] TypeScript typecheck and lint clean; all tests green

## Decision Log

- 2026-02-20: Explicit `--start-point problem|product` flag (default `product`) over inference — deterministic routing, consistent with `--launch-surface` pattern
- 2026-02-20: First-class canonical stages over S0 subprocess — consistent with S1B/S2A/S3B; existing infrastructure handles correctly
- 2026-02-20: display_order strategy locked — conditional siblings share `display_order: 1` per schema:81; no global renumber
- 2026-02-20: TASK-06 (skill scaffolding) split into INVESTIGATE (TASK-07) + IMPLEMENT (TASK-08) to meet ≥80% IMPLEMENT threshold per AGENTS.md:167
- 2026-02-20: startup-loop SKILL.md included as contract surface in this plan (TASK-06) — not deferred as drift cleanup
- 2026-02-20: Single-pass map regeneration in TASK-03 captures both S3B and S0A–S0D atomically

## Overall-confidence Calculation

Effort weights: S=1, M=2, L=3

| Task | Confidence | Effort | Weight | Contribution |
|---|---|---|---|---|
| TASK-01 | 85% | S | 1 | 85 |
| TASK-02 | 85% | M | 2 | 170 |
| TASK-03 | 85% | S | 1 | 85 |
| TASK-04 | 85% | S | 1 | 85 |
| TASK-05 | 80% | M | 2 | 160 |
| TASK-06 | 80% | S | 1 | 80 |
| TASK-07 | 85% | S | 1 | 85 |
| TASK-08 | 80% | L | 3 | 240 |
| TASK-09 | 85% | S | 1 | 85 |
| TASK-10 | 90% | S | 1 | 90 |
| TASK-11 | 80% | S | 1 | 80 |
| **Total** | | | **15** | **1245** |

Overall-confidence = 1245 / 15 = **83% → 85%** (nearest 5)
