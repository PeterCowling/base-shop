---
Type: Plan
Status: Complete
Domain: Platform
Workstream: Engineering
Created: 2026-02-20
Last-updated: 2026-02-20
Feature-Slug: startup-loop-integrity-audit
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
---

# Startup Loop Integrity Audit Plan

## Summary

Six medium-severity inconsistencies were found in the startup loop system spanning four layers: TypeScript event contracts, operator skill docs, spec YAML, and artifact diagram. All issues are localized; none require topology changes or public API changes. Tasks split into doc-only fixes (TASK-01 through TASK-04), TypeScript contract hardening (TASK-05, TASK-06), one investigation (TASK-07), and two coverage additions (TASK-08, TASK-09). Wave 1 tasks are fully independent; only TASK-06 depends on TASK-05.

## Goals
- Eliminate `run_aborted` type/runtime gap in derive-state.ts
- Correct the stale 17-stage `upstream_priority_order` in bottleneck-diagnosis-schema.md to 22 stages
- Fix the artifact-registry.md dependency diagram (S3/S3B/S6B are parallel, not serial)
- Add GATE-S3B-01 stub to cmd-advance.md and fix wrong skill name in loop-spec.yaml changelog
- Add per-sub-stage Gate D routing for S0B, S0C, S0D in cmd-start.md
- Add test coverage for growth-metrics-adapter.ts and hospitality-scenarios.ts

## Non-goals
- Stage additions, topology changes, or loop-spec version bumps
- Public API signature changes
- Backlog warning items (SKILL.md column cosmetics, GATE-BD-01/08/LOOP-GAP in loop-spec, partial_data implementation beyond investigation)

## Constraints & Assumptions
- Constraints:
  - All commits under writer lock (`scripts/agents/with-writer-lock.sh`)
  - Targeted tests only — use `--testPathPattern=<suite>` via `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs`
  - Pre-commit hooks must pass (no `--no-verify`)
  - `pnpm typecheck && pnpm lint` must pass for scripts package after any TypeScript changes
- Assumptions:
  - `run_aborted` is a first-class run-level event; fix is additive (not reductive)
  - derive-state switch has no `default:` branch — unrecognised events fall through silently (verified: lines 90–112)
  - GATE-S3B-01 is advisory (non-blocking), matching the v1.6.0 changelog description
  - `growth-metrics-adapter.ts` `baseDir` option allows test fixture redirection without I/O mocking

## Fact-Find Reference
- Related brief: `docs/plans/startup-loop-integrity-audit/fact-find.md`
- Key findings used:
  - `RunEvent` union verified at `derive-state.ts:14-23`; `VALID_EVENT_TYPES` verified at `event-validation.ts:22-27`
  - `bottleneck-diagnosis-schema.md:139-149` confirms 17-stage list
  - `artifact-registry.md:60-70` confirms incorrect nested diagram
  - `cmd-advance.md` grep: zero occurrences of GATE-S3B-01
  - `recovery.ts:71-84`: uses `"run_aborted" as RunEvent["event"]` cast — confirms gap is real and currently worked around unsafely

## Proposed Approach
- Option A: Single commit for all doc fixes, single commit for TypeScript changes
- Option B: Per-task commits (one logical unit per commit under writer lock)
- Chosen approach: **Option B** — per-task commits tied to TASK IDs; preserves rollback granularity; wave-1 tasks can be dispatched as parallel analysis subagents then committed sequentially under writer lock

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes (TASK-01 through TASK-05, TASK-08, TASK-09 all ≥80; TASK-06 ≥80 when TASK-05 complete)

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Fix bottleneck-diagnosis-schema.md upstream_priority_order (add 5 missing stage IDs) | 95% | S | Complete (2026-02-20) | - | - |
| TASK-02 | IMPLEMENT | Fix artifact-registry.md diagram — correct S3/S3B/S6B parallel fan-out | 85% | S | Complete (2026-02-20) | - | - |
| TASK-03 | IMPLEMENT | Fix GATE-S3B-01 skill name in loop-spec.yaml + add gate stub to cmd-advance.md | 85% | S | Complete (2026-02-20) | - | - |
| TASK-04 | IMPLEMENT | Fix cmd-start.md Gate D — add S0B, S0C, S0D per-sub-stage routing | 90% | S | Complete (2026-02-20) | - | - |
| TASK-05 | IMPLEMENT | Fix run_aborted type gap — add to RunEvent union + derive-state switch handler | 80% | M | Complete (2026-02-20) | - | TASK-06 |
| TASK-06 | IMPLEMENT | Add run_aborted tests — validator acceptance + derive-state deterministic outcome | 80% | M | Complete (2026-02-20) | TASK-05 | - |
| TASK-07 | INVESTIGATE | Investigate diagnosis_status partial_data trigger in bottleneck-detector | 75% | S | Complete (2026-02-20) | - | - |
| TASK-08 | IMPLEMENT | Write unit tests for growth-metrics-adapter.ts | 80% | M | Complete (2026-02-20) | - | - |
| TASK-09 | IMPLEMENT | Write unit tests for hospitality-scenarios.ts | 90% | S | Complete (2026-02-20) | - | - |

## Parallelism Guide

Execution waves for subagent dispatch. Tasks within a wave can run in parallel.
Tasks in a later wave require all blocking tasks from earlier waves to complete.

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-07, TASK-01, TASK-02, TASK-03, TASK-04, TASK-09, TASK-05, TASK-08 | None | All touch different files; TASK-07 (INVESTIGATE) first by type preference; TASK-03 + TASK-04 share `.claude/skills/startup-loop/` dir — use writer lock per commit |
| 2 | TASK-06 | TASK-05 Complete | Requires TASK-05 behavioral contract to write assertions |

**Max parallelism:** 8 (Wave 1)
**Critical path:** TASK-05 → TASK-06 (2 waves)
**Total tasks:** 9

## Tasks

---

### TASK-01: Fix bottleneck-diagnosis-schema.md upstream_priority_order
- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md` — Section 5 `upstream_priority_order` expanded from 17 to 22 stage IDs
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — exact IDs to add are known (S0A, S0B, S0C, S0D, S3B); correct ordering is deterministic from `bottleneck-detector.ts:UPSTREAM_PRIORITY_ORDER` (already has all 22); trivial doc edit
  - Approach: 95% — insert S0A, S0B, S0C, S0D before S0; insert S3B after S3; validate against loop-spec topology
  - Impact: 95% — isolated doc fix; no code changes; schema doc is read by humans only (not parsed by scripts)
- **Acceptance:**
  - `upstream_priority_order` in Section 5 lists exactly 22 stage IDs
  - Ordering matches `UPSTREAM_PRIORITY_ORDER` array in `bottleneck-detector.ts`
  - Note at bottom of Section 5 updated if S3B positioning requires explanation
- **Validation contract (TC-01 through TC-02):**
  - TC-01: After edit, manual count of stage IDs in the `upstream_priority_order` array = 22; grep cross-check against `UPSTREAM_PRIORITY_ORDER` in bottleneck-detector.ts passes
  - TC-02: S0A, S0B, S0C, S0D appear before S0; S3B appears after S3 and before S6B (consistent with parallel fan-out position)
- **Execution plan:** Red → Green → Refactor
  - Red: `grep -n "upstream_priority_order" docs/business-os/startup-loop/bottleneck-diagnosis-schema.md` + read `bottleneck-detector.ts:UPSTREAM_PRIORITY_ORDER` to establish ground truth ordering
  - Green: Edit Section 5 — insert `S0A, S0B, S0C, S0D,` before `S0`; insert `, S3B` after `S3`; verify count = 22
  - Refactor: Update the section note (currently explains S6B precedes S4) to also note where S0A-D and S3B fit in the priority hierarchy
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: IDs and order are determined by bottleneck-detector.ts ground truth; no ambiguity
- **Edge Cases & Hardening:** S3B ordering — confirm it should appear after S3 and before S6B (both are fan-out siblings from S2B; S3B is conditional/advisory, so lower priority than S3 is appropriate)
- **What would make this >=90%:** Already at 95%; nothing blocking
- **Rollout / rollback:**
  - Rollout: Commit under writer lock
  - Rollback: `git revert <commit>`
- **Documentation impact:** Section 5 note updated; no other docs affected
- **Notes / references:**
  - Ground truth: `scripts/src/startup-loop/bottleneck-detector.ts:UPSTREAM_PRIORITY_ORDER`

---

### TASK-02: Fix artifact-registry.md dependency diagram
- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/business-os/startup-loop/artifact-registry.md` — Producer/Consumer Dependency Graph corrected to show S3/S3B/S6B as parallel fan-out from S2B (not S3 nested under S6B)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/business-os/startup-loop/artifact-registry.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — verified the incorrect nesting at lines 60-70; new topology is clear from loop-spec edges
  - Approach: 85% — diagram style in the file uses indented tree format (not mermaid); need to convert serial nesting to parallel branch notation within that format; no existing parallel-branch example in the file to copy from
  - Impact: 90% — doc-only fix; no code changes; diagram is informational
- **Acceptance:**
  - Diagram shows lp-channels (S6B), lp-forecast (S3), and lp-other-products/S3B companion as parallel outputs from lp-offer (S2B)
  - Diagram does not show lp-forecast nested inside lp-channels
  - S4 join barrier correctly references all three fan-out branches as inputs
- **Validation contract (TC-01 through TC-03):**
  - TC-01: Diagram shows `lp-channels (S6B)` and `lp-forecast (S3)` as siblings (same indent level), both branching from `lp-offer (S2B)`
  - TC-02: `lp-forecast` does NOT appear indented under `lp-channels` in the diagram
  - TC-03: The S4 join barrier node appears after all three fan-out branches converge
- **Execution plan:** Red → Green → Refactor
  - Red: Read `artifact-registry.md:60-70`; confirm current nesting shows `lp-forecast` as a child of `lp-channels`
  - Green: Rewrite the Producer/Consumer Dependency Graph section — move `lp-forecast (S3)` to be a parallel branch alongside `lp-channels (S6B)`, both under `lp-offer (S2B)`; add `└── S4 join barrier` as the convergence point
  - Refactor: Add a brief comment or note clarifying this is a data-flow diagram (producer/consumer), not a scheduling dependency graph, to prevent future misreading
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: topology verified from loop-spec edges; no ambiguity
- **Edge Cases & Hardening:** S3B (lp-other-products) — include as a third fan-out branch marked `(conditional)` to match loop-spec; omitting it would re-introduce a gap
- **What would make this >=90%:** Confirming exact diagram format convention — read the rest of artifact-registry.md before editing to match style
- **Rollout / rollback:**
  - Rollout: Commit under writer lock
  - Rollback: `git revert <commit>`
- **Documentation impact:** Diagram updated in artifact-registry.md; no other docs reference this diagram directly
- **Notes / references:**
  - Verified incorrect diagram: `docs/business-os/startup-loop/artifact-registry.md:60-70`
  - Correct topology: `docs/business-os/startup-loop/loop-spec.yaml` fan-out edges

---

### TASK-03: Fix GATE-S3B-01 skill name + add gate stub to cmd-advance.md
- **Type:** IMPLEMENT
- **Deliverable:** (1) `docs/business-os/startup-loop/loop-spec.yaml` — GATE-S3B-01 changelog entry skill name corrected; (2) `.claude/skills/startup-loop/modules/cmd-advance.md` — GATE-S3B-01 advisory gate stub added
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/business-os/startup-loop/loop-spec.yaml`, `.claude/skills/startup-loop/modules/cmd-advance.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — wrong skill name is clear (`adjacent-product-research` → `lp-other-products`); gate stub pattern verified from GATE-S6B-STRAT-01
  - Approach: 85% — need to determine correct rule for GATE-S3B-01 (what artifact must exist to proceed past S3B?); changelog says advisory — implies it should not block progress but log a warning; the skill `lp-other-products` produces a deep-research prompt, not a direct artifact
  - Impact: 85% — two additive file changes; no existing gate logic is modified; advisory gate does not block any existing workflows
- **Acceptance:**
  - loop-spec.yaml GATE-S3B-01 changelog references `lp-other-products` (not `adjacent-product-research`)
  - cmd-advance.md contains a `### GATE-S3B-01` block with Gate ID, trigger, rationale, rule, and when-blocked sections
  - GATE-S3B-01 is classified as Advisory (not Hard)
  - Gate triggers at S2B→S3B transition
- **Validation contract (TC-01 through TC-03):**
  - TC-01: `grep "adjacent-product-research" docs/business-os/startup-loop/loop-spec.yaml` returns zero matches
  - TC-02: `grep "GATE-S3B-01" .claude/skills/startup-loop/modules/cmd-advance.md` returns at least one match with the gate block header
  - TC-03: GATE-S3B-01 block contains fields: Gate ID, Trigger, Rationale, Rule — must pass, When blocked
- **Execution plan:** Red → Green → Refactor
  - Red: `grep -n "adjacent-product-research" docs/business-os/startup-loop/loop-spec.yaml` — confirm occurrence; `grep -c "GATE-S3B-01" .claude/skills/startup-loop/modules/cmd-advance.md` — confirm zero
  - Green: Fix loop-spec.yaml skill name; add GATE-S3B-01 stub to cmd-advance.md following GATE-S6B-STRAT-01 pattern — advisory gate checking for existence of `docs/business-os/strategy/<BIZ>/adjacent-product-research-prompt.md` (the lp-other-products output artifact)
  - Refactor: Position GATE-S3B-01 block logically in cmd-advance (near S3B stage transitions, after GATE-BD gates); ensure advisory classification is explicit in the block
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** Confirm the expected output artifact path for `lp-other-products` by reading its SKILL.md before writing the gate rule
- **Edge Cases & Hardening:** Advisory gate must not set `blocking_reason` or halt advance — should log a warning and proceed; distinguish from hard gate syntax used by GATE-BD-00
- **What would make this >=90%:** Verify `lp-other-products` output artifact path before writing the gate rule (scout step)
- **Rollout / rollback:**
  - Rollout: Commit under writer lock
  - Rollback: `git revert <commit>`
- **Documentation impact:** loop-spec.yaml changelog updated; cmd-advance.md gate list extended
- **Notes / references:**
  - Gate stub pattern: GATE-S6B-STRAT-01 in cmd-advance.md (minimal single-check form)
  - `lp-other-products` SKILL.md: `.claude/skills/lp-other-products/SKILL.md` — read to confirm output artifact path

---

### TASK-04: Fix cmd-start.md Gate D — per-sub-stage S0B/S0C/S0D routing
- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/startup-loop/modules/cmd-start.md` — Gate D extended with per-sub-stage prompt_file and required_output_path entries for S0B, S0C, and S0D; completion artifacts correctly distinguished from started artifacts for the two prompt-handoff stages (S0B, S0D); S0D→S0 pass-through condition explicit
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `.claude/skills/startup-loop/modules/cmd-start.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — current Gate D structure verified (single block for S0A with prompt_file + required_output_path); extension is additive; all skill paths and output contracts are confirmed from SKILL.md files
  - Approach: 90% — S0B and S0D are prompt-handoff stages (skill writes prompt; operator runs research; results file signals completion); S0C is a direct-synthesis stage (skill writes completion artifact directly); both patterns are now explicit and can be encoded as two-tier checks in Gate D
  - Impact: 90% — operator-facing guidance only; no runtime code; adds missing handoff steps for problem-first entry
- **Acceptance:**
  - Gate D has separate `prompt_file` + `required_output_path` entries for S0B, S0C, and S0D
  - S0B: prompt_file = `.claude/skills/lp-solution-profiling/SKILL.md`; required_output_path = `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-solution-profile-results.user.md` (the operator-filled results file — NOT the prompt file; the prompt at `<YYYY-MM-DD>-solution-profiling-prompt.md` signals "started", the results file signals "complete")
  - S0C: prompt_file = `.claude/skills/lp-option-select/SKILL.md`; required_output_path = `docs/business-os/strategy/<BIZ>/solution-select.user.md` (skill writes directly — no operator research step)
  - S0D: prompt_file = `.claude/skills/brand-naming-research/SKILL.md`; required_output_path = `docs/business-os/strategy/<BIZ>/*-candidate-names.user.md` (the operator-filled shortlist — NOT the candidate-names-prompt.md; glob matches any date prefix)
  - S0→S0 pass-through condition documented: Gate D is fully satisfied when all four completion artifacts exist — problem-statement.user.md + solution-profile-results.user.md + solution-select.user.md + candidate-names.user.md — at which point cmd-start routes to standard S0 intake
  - Re-entry logic checks each sub-stage completion artifact independently: solution-profile-results.user.md present → skip S0B; solution-select.user.md present → skip S0C; candidate-names.user.md present → skip S0D and proceed to S0 intake
- **Validation contract (TC-01 through TC-05):**
  - TC-01: Gate D section contains routing blocks for S0A, S0B, S0C, S0D (four distinct blocks or one block with four named sub-steps)
  - TC-02: S0B routing distinguishes started (prompt file) from complete (results file); required_output_path references `solution-profile-results.user.md`, not `solution-profiling-prompt.md`
  - TC-03: S0C routing points to lp-option-select SKILL.md and `solution-select.user.md` output
  - TC-04: S0D routing distinguishes started (candidate-names-prompt.md) from complete (candidate-names.user.md); required_output_path references `*-candidate-names.user.md`, not `candidate-names-prompt.md`
  - TC-05: Gate D documents the S0→S0 pass-through condition — all four completion artifacts present → route to standard S0 intake
- **Execution plan:** Red → Green → Refactor
  - Red: Read cmd-start.md Gate D; confirm only S0A has prompt_file/required_output_path; confirm S0B/S0C/S0D have no routing; note current re-entry check only looks for problem-statement.user.md
  - Green: Extend Gate D with three sub-stage routing blocks; use two-tier artifact model for S0B and S0D (prompt file = started; results/shortlist file = complete); use single-artifact model for S0C; add S0→S0 pass-through block at the end of Gate D
  - Refactor: Add per-sub-stage re-entry skip logic that checks completion artifacts in sequence (results → skip S0B; s0c-option-select → skip S0C; shortlist → skip S0D → enter S0); ensure prompt placeholders use `<BIZ>` and `<YYYY-MM-DD>` consistent with skill output contracts
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** Verify exact output artifact filenames from lp-solution-profiling (solution-profiling-prompt.md + solution-profile-results.user.md), lp-option-select (solution-select.user.md), and brand-naming-research (candidate-names-prompt.md) SKILL.md files before writing routing entries — all confirmed in this planning phase
- **Edge Cases & Hardening:** Two-tier completion model — S0B and S0D each have a "started" artifact (prompt written by skill) and a "complete" artifact (results filled by operator); Gate D must check only the completion artifact for re-entry skip, not the prompt artifact; documenting this distinction prevents future regressions where the prompt file is mistakenly treated as the completion signal
- **What would make this >=90%:** Already at 90%; output contracts verified from SKILL.md files
- **Rollout / rollback:**
  - Rollout: Commit under writer lock
  - Rollback: `git revert <commit>`
- **Documentation impact:** cmd-start.md Gate D expanded; no other docs affected
- **Notes / references:**
  - S0A block as template: `.claude/skills/startup-loop/modules/cmd-start.md` Gate D (currently S0A only)
  - S0B output contract: `lp-solution-profiling/SKILL.md` — `## Output` section (prompt at `<YYYY-MM-DD>-solution-profiling-prompt.md`; results at `<YYYY-MM-DD>-solution-profile-results.user.md`)
  - S0C output contract: `lp-option-select/SKILL.md` — `## Output Contract` (path: `solution-select.user.md`)
  - S0D output contract: `brand-naming-research/SKILL.md` — saves prompt to `candidate-names-prompt.md`; operator saves shortlist to `<YYYY-MM-DD>-candidate-names.user.md` (GATE-BD-00 checks for this on S0→S1 advance)

---

### TASK-05: Fix run_aborted type gap — RunEvent union + derive-state handler
- **Type:** IMPLEMENT
- **Deliverable:** Updated `scripts/src/startup-loop/derive-state.ts` — `RunEvent.event` union includes `"run_aborted"`; switch statement handles `case "run_aborted":` with terminal state behavior (clear `activeStage`, preserve event log)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/derive-state.ts`, `[readonly] scripts/src/startup-loop/recovery.ts`, `[readonly] scripts/src/startup-loop/event-validation.ts`
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 80%
  - Implementation: 85% — switch has no `default:` branch (verified); `run_aborted` falls through silently; adding to union + switch is additive; recovery.ts cast becomes redundant
  - Approach: 80% — RunEvent is an interface (not a discriminated union type), so adding `"run_aborted"` to the event field union is syntactically simple; however, `run_aborted` is a run-level event (`stage: "*"` per recovery.ts:69) and the current stage lookup at derive-state line 88 (`if (!stage) continue;`) would skip it — the handler must be placed before or bypass the stage lookup guard
  - Impact: 85% — localized to derive-state.ts; recovery.ts cast becomes redundant (annotate but do not remove); event-validation.ts unchanged
  - Held-back test (Approach at 80): "What single unresolved unknown would drop Approach below 80?" → The stage lookup guard `if (!stage) continue;` may skip run-level events that reference `stage: "*"`. If `run_aborted` events are silently skipped by this guard, the case handler added inside the switch would never execute. Resolution: inspect the guard at lines 85-90 and ensure run-level events bypass it. If a structural refactor of the guard is needed, confidence drops to 70 and an INVESTIGATE task must precede this.
- **Acceptance:**
  - `RunEvent.event` union is `"stage_started" | "stage_completed" | "stage_blocked" | "run_aborted"`
  - `case "run_aborted":` in derive-state switch sets `activeStage = null` (run-level termination)
  - `pnpm typecheck && pnpm lint` pass for scripts package
  - recovery.ts compiles without requiring the `as RunEvent["event"]` cast (cast may remain with a deprecation comment)
- **Validation contract (TC-01 through TC-04):**
  - TC-01: `RunEvent.event` union at derive-state.ts includes `"run_aborted"` — typecheck passes
  - TC-02: `case "run_aborted":` block exists in derive-state switch; sets `activeStage = null`
  - TC-03: `pnpm -w run typecheck --filter @acme/scripts` exits 0
  - TC-04: recovery.ts cast `as RunEvent["event"]` either compiles cleanly (union now includes the value) or is annotated as redundant
- **Execution plan:** Red → Green → Refactor
  - Red: Read derive-state.ts lines 85-112 in full; confirm (a) stage lookup guard skips `stage: "*"` events, (b) switch has no `run_aborted` case, (c) recovery.ts cast is the only workaround; run `pnpm typecheck` to record baseline
  - Green: Add `"run_aborted"` to `RunEvent.event` union; add `case "run_aborted":` handler that clears `activeStage = null` (and optionally records the abort in a run-level status field if RunState supports it); ensure the stage lookup guard allows run-level events through (or place the run_aborted case before the guard)
  - Refactor: Check RunState interface for a `run_status` or equivalent field; if present, set it to `"aborted"` in the handler; annotate recovery.ts cast as redundant with `// run_aborted is now in RunEvent union`; run `pnpm typecheck && pnpm lint`
- **Planning validation (required for M/L):**
  - Checks run: derive-state.ts lines 85-112 reviewed (verified in pre-planning probe); RunState type not yet inspected — check during execution Red phase
  - Validation artifacts: `pnpm typecheck` baseline pre- and post-change
  - Unexpected findings: stage lookup guard at line 88 (`if (!stage) continue;`) may block run-level `stage: "*"` events — must resolve before placing handler inside the stage loop
- **Scouts:** Read RunState interface definition in derive-state.ts before implementing handler; check whether a `run_status` field exists that should be set to `"aborted"`
- **Edge Cases & Hardening:** `stage: "*"` is not a valid stage ID — the stage lookup (`stages.get(event.stage)`) will return undefined; guard must be bypassed for run-level events before entering the per-stage handler logic
- **What would make this >=90%:** RunState has an explicit `run_status` field that cleanly accepts `"aborted"` without structural changes; stage guard trivially bypassed by checking `event.stage === "*"` before stage lookup
- **Rollout / rollback:**
  - Rollout: Commit under writer lock; run targeted suite `--testPathPattern=derive-state`
  - Rollback: `git revert <commit>`
- **Documentation impact:** Add `run_aborted` to `event-state-schema.md` if it exists (verify during execution); recovery.ts cast annotated as redundant

---

### TASK-06: Add run_aborted tests
- **Type:** IMPLEMENT
- **Deliverable:** Extended test cases in `scripts/src/startup-loop/__tests__/event-validation.test.ts` and `scripts/src/startup-loop/__tests__/derive-state.test.ts` covering `run_aborted` behavior
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-20)
- **Affects:** `scripts/src/startup-loop/__tests__/event-validation.test.ts`, `scripts/src/startup-loop/__tests__/derive-state.test.ts`, `scripts/src/startup-loop/__tests__/generate-stage-operator-views.test.ts` (scope expansion: stale count 17→22), `scripts/src/startup-loop/__tests__/s10-weekly-routing.test.ts` (scope expansion: stale count 17→22)
- **Depends on:** TASK-05
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% — test files exist; adding cases is additive; Jest infrastructure confirmed working
  - Approach: 80% — test assertions for validator acceptance are straightforward; derive-state assertions require the behavioral contract from TASK-05 (specifically: what state fields are set by `case "run_aborted":`)
  - Impact: 85% — test-only additions; no production code touched
  - Held-back test (Approach at 80): "What would drop Approach below 80?" → If TASK-05 introduces structural changes to RunState (e.g., a new `run_status` field), the derive-state test assertions must reference that new field — but the test author won't know the exact field name until TASK-05 is complete. This is the explicit dependency reason.
- **Acceptance:**
  - event-validation.test.ts has at least one test asserting `run_aborted` is accepted by the validator (returns true / no error)
  - derive-state.test.ts has at least one test asserting that a `run_aborted` event produces `activeStage = null` in the resulting state
  - All 36+ existing startup-loop tests continue to pass
- **Validation contract (TC-01 through TC-03):**
  - TC-01: `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern=event-validation --no-coverage` exits 0 with ≥1 test covering `run_aborted` acceptance
  - TC-02: `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern=derive-state --no-coverage` exits 0 with ≥1 test asserting `activeStage` cleared on `run_aborted`
  - TC-03: Full startup-loop suite passes: `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern=startup-loop --no-coverage`
- **Execution plan:** Red → Green → Refactor
  - Red: Run targeted suites for event-validation and derive-state; note absence of `run_aborted` test cases; confirm existing tests pass
  - Green: Add `it("accepts run_aborted event type", ...)` to event-validation.test.ts; add `it("clears activeStage on run_aborted event", ...)` to derive-state.test.ts using a fixture that emits a `{ event: "run_aborted", stage: "*", ... }` event
  - Refactor: Name test descriptions to clearly document the behavioral contract; add a second derive-state test for a mid-run abort (some stages already complete, run_aborted received, verify only activeStage is cleared while completed stages retain their status)
- **Planning validation (required for M/L):**
  - Checks run: Confirmed test files exist; confirmed `pnpm test:governed` command pattern works (used in previous session)
  - Validation artifacts: Green suite output
  - Unexpected findings: None anticipated
- **Scouts:** Inspect TASK-05's completed derive-state.ts to understand RunState shape before writing assertions
- **Edge Cases & Hardening:** Mid-run abort — stages already `Done` should not be reverted to `Active` by a `run_aborted` event; test this explicitly
- **What would make this >=90%:** TASK-05 RunState shape is simple (no new fields needed); tests can use existing fixture patterns without custom builders
- **Rollout / rollback:**
  - Rollout: Commit under writer lock
  - Rollback: `git revert <commit>`
- **Documentation impact:** None beyond test files
- **Build evidence (2026-02-20):**
  - Added VC-04B-02-06 to `event-validation.test.ts`: `run_aborted` accepted with `stage: "*"`, no artifacts required
  - Added VC-04A-05 to `derive-state.test.ts`: `active_stage` cleared on `run_aborted`; mid-run abort preserves completed stages
  - Scope expansion: fixed stale `toBe(17)` → `toBe(22)` in `generate-stage-operator-views.test.ts` and `s10-weekly-routing.test.ts` (pre-existing failures blocking TC-03)
  - Full suite: 43 suites, 548 tests (546 passed, 2 todo), commit `dad9e596bc`

---

### TASK-07: Investigate diagnosis_status partial_data trigger
- **Type:** INVESTIGATE
- **Deliverable:** Investigation notes saved to `docs/plans/startup-loop-integrity-audit/task-07-partial-data-investigation.md` — documents the correct trigger condition for `diagnosis_status: "partial_data"` in bottleneck-detector.ts, or an explicit deferral rationale if no trigger is feasible
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/startup-loop-integrity-audit/task-07-partial-data-investigation.md`, `[readonly] scripts/src/startup-loop/bottleneck-detector.ts`, `[readonly] docs/business-os/startup-loop/bottleneck-diagnosis-schema.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 75%
  - Implementation: 80% — bottleneck-detector.ts is accessible; `diagnosis_status: 'ok'` at line 287 is a known location; investigating trigger condition is a code read + schema cross-reference
  - Approach: 75% — not yet clear whether `partial_data` is meant to fire when stages have no event data, or when stage history is truncated, or some other condition; the schema doc and bottleneck-detector code must be cross-referenced
  - Impact: 80% — investigation output is an artifact; no production code changed in this task; outcome feeds a potential follow-on IMPLEMENT task
- **Questions to answer:**
  - What runtime condition should trigger `diagnosis_status: "partial_data"`? (e.g., missing stage events, incomplete event history, data below a minimum threshold)
  - Is the current hardcoded `'ok'` a deliberate deferral (documented) or an unintentional omission?
  - Is a deterministic test feasible given the trigger condition?
  - Should a follow-on IMPLEMENT task be created to implement the trigger, or should `partial_data` remain deferred with an explicit comment in the code?
- **Acceptance:**
  - Investigation artifact written to output path
  - At least one concrete answer to each of the four questions above
  - Clear GO/NO-GO recommendation for a follow-on implementation task
- **Validation contract:** Investigation artifact exists at output path; contains GO/NO-GO recommendation with evidence
- **Planning validation:** None: S-effort INVESTIGATE task
- **Rollout / rollback:** None: non-implementation task
- **Documentation impact:** New investigation artifact; if GO, plan should be updated to add a follow-on IMPLEMENT task via `/lp-do-replan`
- **Notes / references:**
  - `scripts/src/startup-loop/bottleneck-detector.ts:287` — `diagnosis_status` hardcoded
  - `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md` — Section on `diagnosis_status` values

---

### TASK-08: Write unit tests for growth-metrics-adapter.ts
- **Type:** IMPLEMENT
- **Deliverable:** New file `scripts/src/startup-loop/__tests__/growth-metrics-adapter.test.ts` covering `getWeeklyGrowthMetrics()` with S3 + S10 fixtures
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/__tests__/growth-metrics-adapter.test.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% — `getWeeklyGrowthMetrics()` takes `(runId, business, period, options?)` with `baseDir` option; test fixtures can be placed in `__tests__/fixtures/` or inline temp dir; function is pure computation after file reads
  - Approach: 80% — `funnel-metrics-extractor.test.ts` provides a pattern for file-reading functions in the same directory; `baseDir` option (from `GrowthMetricsAdapterOptions`) enables fixture redirection; test structure is straightforward
  - Impact: 80% — test-only addition; no production code changed; improves coverage for AARRR metric derivation logic
  - Held-back test (Approach at 80): "`baseDir` option actually routes all internal file reads through the provided base path." Verify during Red phase that all `resolveArtifactPath` calls inside the adapter use the `baseDir` option. If any internal path is hardcoded, test isolation is broken.
- **Acceptance:**
  - Test file covers: (1) valid S3 + S10 fixture → verifies at least one AARRR metric value, (2) missing S3 artifact → error/fallback behavior documented, (3) `data_quality.missing_metrics` populated when expected fields absent
  - All new tests pass in targeted suite
- **Validation contract (TC-01 through TC-04):**
  - TC-01: `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern=growth-metrics-adapter --no-coverage` exits 0 with ≥3 passing tests
  - TC-02: At least one test asserts a concrete metric value (e.g., `acquisition.visitor_count`) from a known fixture
  - TC-03: At least one test covers missing artifact error handling
  - TC-04: Full startup-loop suite continues to pass
- **Execution plan:** Red → Green → Refactor
  - Red: Confirm no test file exists; read `growth-metrics-adapter.ts` fully to understand internal `resolveArtifactPath` usage and `baseDir` routing; confirm `funnel-metrics-extractor.test.ts` for fixture pattern
  - Green: Create `__tests__/growth-metrics-adapter.test.ts`; create minimal S3 forecast fixture JSON and S10 readout fixture JSON in `__tests__/fixtures/`; write `getWeeklyGrowthMetrics()` test with fixture inputs; assert ≥1 metric value
  - Refactor: Add error-case test (missing S3 artifact); add `data_quality.missing_metrics` test; ensure fixture files are minimal (only fields actually read by the function)
- **Planning validation (required for M/L):**
  - Checks run: growth-metrics-adapter.ts exports verified (1 function: `getWeeklyGrowthMetrics`; `baseDir` option confirmed)
  - Validation artifacts: Test suite output
  - Unexpected findings: If `resolveArtifactPath` does not use `baseDir`, test isolation approach must change to `jest.mock` for file reads
- **Scouts:** Read `resolveArtifactPath` helper in growth-metrics-adapter.ts to confirm it respects `baseDir` before writing fixture tests
- **Edge Cases & Hardening:** Missing S10 readout (business at S3 but not yet S10) — test that function handles gracefully; `data_quality.missing_metrics` array should be non-empty
- **What would make this >=90%:** `resolveArtifactPath` confirms `baseDir` routing is applied to all file reads; fixture pattern directly mirrors `funnel-metrics-extractor.test.ts`
- **Rollout / rollback:**
  - Rollout: Commit under writer lock
  - Rollback: `git revert <commit>`
- **Documentation impact:** None beyond test files and fixtures

---

### TASK-09: Write unit tests for hospitality-scenarios.ts
- **Type:** IMPLEMENT
- **Deliverable:** New file `scripts/src/startup-loop/__tests__/hospitality-scenarios.test.ts` covering `computeHospitalityScenarioInputs()` and `computeHospitalityScenarioDateLabels()`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/__tests__/hospitality-scenarios.test.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — two pure exported functions with no I/O; take a date string, return deterministic output; trivially unit-testable with known inputs
  - Approach: 95% — standard Jest unit test; no mocking required; date inputs are controlled; expected outputs can be pre-computed
  - Impact: 90% — test-only addition; covers scenario logic used by hospitality businesses in the loop
- **Acceptance:**
  - Test file covers both exported functions with ≥3 tests each
  - Includes peak season (S1: 3rd Friday–Sunday July), shoulder (S2: 2nd Tuesday–Thursday May), off-season (S3: 4th Tuesday–Thursday February) assertions with known reference dates
  - All new tests pass
- **Validation contract (TC-01 through TC-04):**
  - TC-01: `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern=hospitality-scenarios --no-coverage` exits 0 with ≥6 passing tests
  - TC-02: `computeHospitalityScenarioInputs("2026-01-01")` returns S1 check-in = `"2026-07-17"` (3rd Friday of July 2026) and check-out = `"2026-07-19"`
  - TC-03: Off-season S3 check-in = `"2026-02-24"` (4th Tuesday of February 2026) when reference date is `"2026-01-01"`
  - TC-04: `computeHospitalityScenarioDateLabels()` returns strings matching format `"YYYY-MM-DD (Day) to YYYY-MM-DD (Day)"`
- **Execution plan:** Red → Green → Refactor
  - Red: Confirm no test file; read `hospitality-scenarios.ts` fully to understand season date computation logic; pre-compute expected dates for reference date `"2026-01-01"` to anchor assertions
  - Green: Create `__tests__/hospitality-scenarios.test.ts`; write ≥3 tests for each exported function with pre-computed expected values
  - Refactor: Add edge case — reference date in July (near peak season window) to verify the season picks the correct year
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** Pre-compute expected dates for S1, S2, S3 before writing tests; verify 4th Tuesday of February 2026 = 2026-02-24
- **Edge Cases & Hardening:** Reference date in the same month as a season window (e.g., asOfDate in July) — verify season computation returns the same year's dates or rolls to next year as appropriate
- **What would make this >=90%:** Already at 90%; pure functions make this highly testable
- **Rollout / rollback:**
  - Rollout: Commit under writer lock
  - Rollback: `git revert <commit>`
- **Documentation impact:** None beyond test file

---

## Risks & Mitigations
- `run_aborted` stage guard bypass (TASK-05): derive-state line 88 `if (!stage) continue;` may skip `stage: "*"` events — implement handler before or outside the stage lookup loop
- GATE-S3B-01 advisory classification: must not use hard-gate blocking syntax; distinguish from GATE-BD-00 pattern
- growth-metrics-adapter `baseDir` routing: if `resolveArtifactPath` ignores `baseDir`, test isolation breaks; fall back to `jest.mock` for file reads
- TASK-03 + TASK-04 writer lock: both touch `.claude/skills/startup-loop/` files; serialize commits to avoid lock contention

## Observability
- None: all changes are TypeScript source, test files, and docs; no runtime metrics affected

## Acceptance Criteria (overall)
- [ ] All 6 medium-severity issues from fact-find resolved with evidence (doc diff or test passage)
- [ ] All targeted startup-loop suites pass (36+ existing tests + new tests)
- [ ] `pnpm typecheck && pnpm lint` passes for scripts package after TASK-05
- [ ] `run_aborted` fix is deployed as a type-safe contract (no cast workaround remaining or cast annotated as redundant)
- [ ] Plan tasks marked Complete with build evidence

## Decision Log
- 2026-02-20: `run_aborted` fix direction confirmed as additive — keep event, align type contract + handler (evidence: recovery.ts emits it; removing it would lose abort audit trail)
- 2026-02-20: GATE-S3B-01 classified as advisory (non-blocking) per v1.6.0 changelog "advisory gate" language

## Overall-confidence Calculation
- S=1, M=2, L=3
- Weights: TASK-01(S), TASK-02(S), TASK-03(S), TASK-04(S), TASK-05(M), TASK-06(M), TASK-07(S), TASK-08(M), TASK-09(S)
- (95×1 + 85×1 + 85×1 + 90×1 + 80×2 + 80×2 + 75×1 + 80×2 + 90×1) / (1+1+1+1+2+2+1+2+1) = 1000 / 12 = 83.3 → **85%**
