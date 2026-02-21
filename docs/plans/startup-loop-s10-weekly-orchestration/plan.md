---
Type: Plan
Status: Draft
Domain: Business-OS
Workstream: Operations
Created: 2026-02-18
Last-updated: 2026-02-18T15:00Z
Last-reviewed: 2026-02-18
Feature-Slug: startup-loop-s10-weekly-orchestration
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-sequence, startup-loop, lp-experiment, lp-signal-review, lp-do-fact-find
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort (S=1, M=2, L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: BOS
Card-ID: none
Relates-to: docs/business-os/business-os-charter.md
Related-v2-plan: docs/plans/startup-loop-orchestrated-os-comparison-v2/plan.md
---

# Startup Loop S10 Weekly Orchestration Plan

## Summary
This plan introduces an S10 weekly orchestration wrapper (`/lp-weekly`) while preserving current stage semantics and decision authority. The implementation is additive-first: canonical S10 artifacts remain unchanged, and `/lp-weekly` coordinates existing weekly decision, audit/CI, and experiment flows into one deterministic sequence. Transition is explicitly phased: Phase 0 (compat) plus Phase 1 (default route) first, then a gated checkpoint before any optional Phase 2 stage mapping remap. The plan is designed to fit inside the startup-loop orchestrated-os v2 constraints, especially TASK-06 documentation/skill alignment and TASK-07 compatibility regression checks.

## Goals
- Introduce `/lp-weekly` as the S10 orchestration contract (operator-visible + startup-loop-internal route).
- Preserve authority boundaries:
  - stage graph authority = `docs/business-os/startup-loop/loop-spec.yaml`
  - decision content authority = `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`
- Implement deterministic S10 sequence with lane contracts (`a/b/c`) and additive packetization.
- Add compatibility checks proving canonical artifacts and stage semantics remain intact.
- Capture two-cycle post-delivery metrics: missed Section H checks, unresolved REM carryover, next-experiment spec count.

## Non-goals
- Changing stage IDs, stage ordering, or gate semantics.
- Replacing weekly KPCS prompt authority.
- Forcing Phase 2 remap in the first delivery wave.
- Shipping runtime/business logic changes outside S10 orchestration scope.

## Constraints & Assumptions
- Constraints:
  - `weekly-kpcs-decision-prompt.md` remains canonical for S10 decision text.
  - `loop-spec.yaml` remains canonical for stage graph/order semantics.
  - First wave is no-block: warnings/`restricted` lane states + REM tasks only.
  - Additive-first artifact policy: packet references canonical artifacts and does not replace them.
- Assumptions:
  - Phase 0 + Phase 1 can be delivered safely in one wave.
  - Existing `/lp-experiment` and `/lp-signal-review` remain specialized sub-flows under `/lp-weekly` orchestration.

## Fact-Find Reference
- Related brief: `docs/plans/startup-loop-s10-weekly-orchestration/fact-find.md`
- Key findings used:
  - S10 scope is broader than experiment lifecycle; wrapper naming split is justified.
  - S10 currently has fragmented orchestration across prompt/skill contracts.
  - Lane model (`a/b/c`) maps to real artifacts and operational failure modes.
  - v2 fit is achievable if authority boundaries and compatibility checks are explicit.

## Proposed Approach
- Option A: Phase 0 only (manual `/lp-weekly`) in wave 1; Phase 1 later.
- Option B: Phase 0 + Phase 1 together (default route through `/lp-weekly`), then checkpoint before optional Phase 2 remap.
- Chosen approach: **Option B**.
  - Rationale: avoids “dead code first” alias period while still keeping stage semantics unchanged.

## Plan Gates
- Foundation Gate: **Pass**
  - Fact-find includes required routing fields (`Deliverable-Type`, `Execution-Track`, `Primary-Execution-Skill`, alias).
  - Delivery-readiness and track foundations are present (testability + hypothesis/validation landscape).
- Build Gate: **Fail (expected at planning start)**
  - Blocked by TASK-01 transition decision and unresolved implementation dependencies.
  - Build gate passes after TASK-01 closes and at least one IMPLEMENT task (>=80) is dependency-unblocked.
- Auto-Continue Gate: **Fail**
  - Mode is `plan-only`; no explicit auto-build intent.
- Sequenced: **Yes**
  - Topological dependencies and wave grouping defined below.
- Edge-case review complete: **Yes**
  - Re-entrancy, week-boundary anchor, partial inputs, and authority drift are explicitly covered.
- Auto-build eligible: **No**
  - `plan-only` and Build/Auto gates not passed.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | DECISION | Lock transition mode, week anchor, and idempotency policy | 85% | S | Complete (2026-02-18) | - | TASK-02, TASK-03, TASK-04, TASK-05 |
| TASK-02 | IMPLEMENT | Publish S10 orchestration contract (`/lp-weekly`) with sequence + lane rules | 85% | S | Complete (2026-02-18) | TASK-01 | TASK-04, TASK-05 |
| TASK-03 | IMPLEMENT | Create `/lp-weekly` skill skeleton + modules (no-block posture) | 85% | S | Complete (2026-02-18) | TASK-01 | TASK-04, TASK-05 |
| TASK-04 | IMPLEMENT | Wire Phase 1 default route via startup-loop surfaces (without stage-semantic changes) | 80% | M | Complete (2026-02-18) | TASK-01, TASK-02, TASK-03 | TASK-06 |
| TASK-05 | IMPLEMENT | Add additive weekly packet + latest pointer and cross-artifact linking policy | 85% | S | Complete (2026-02-18) | TASK-01, TASK-02, TASK-03 | TASK-06 |
| TASK-06 | IMPLEMENT | Add compatibility regression checks (authority boundaries + artifact continuity) | 80% | M | Complete (2026-02-18) | TASK-04, TASK-05 | TASK-07 |
| TASK-07 | CHECKPOINT | Two-cycle checkpoint: validate metrics + readiness for optional remap | 95% | S | Pending | TASK-06 | TASK-08 |
| TASK-08 | DECISION | Decide whether to execute optional Phase 2 S10 mapping remap | 85% | S | Pending | TASK-07 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Decision gate first; resolves migration ambiguity and week-key policy |
| 2 | TASK-02, TASK-03 | TASK-01 | Contract and skill skeleton can run in parallel |
| 3 | TASK-04, TASK-05 | TASK-02, TASK-03 | Routing + packetization in parallel with explicit file overlap review |
| 4 | TASK-06 | TASK-04, TASK-05 | Regression checks after integration surfaces are stable |
| 5 | TASK-07 | TASK-06 | Checkpoint with two-cycle evidence collection |
| 6 | TASK-08 | TASK-07 | Optional remap decision only after checkpoint evidence |

## Tasks

### TASK-01: Lock transition mode, week anchor, and idempotency policy
- **Type:** DECISION
- **Deliverable:** `docs/plans/startup-loop-s10-weekly-orchestration/decisions/s10-weekly-transition-decision.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Affects:** `.claude/skills/startup-loop/SKILL.md`, `.claude/skills/startup-loop/modules/cmd-advance.md`, `.claude/skills/lp-weekly/SKILL.md`, `[readonly] docs/business-os/startup-loop/loop-spec.yaml`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04, TASK-05
- **Confidence:** 85%
  - Implementation: 90% - bounded decision surface and explicit options.
  - Approach: 85% - fact-find provides default with migration phases.
  - Impact: 90% - removes the largest sequencing ambiguity before implementation.
- **Options:**
  - Option A: Phase 0 only in wave 1.
  - Option B: Phase 0 + Phase 1 together in wave 1.
- **Recommendation:** Option B
  - Rationale: avoids manual-only dead period while preserving authority boundaries.
- **Decision input needed:**
  - question: Approve Option B (Phase 0 + Phase 1 together) as wave-1 default?
  - why it matters: determines caller path for `/lp-weekly` and all downstream test scope.
  - default + risk: default yes; risk is small routing regression from additional integration touchpoints.
- **Acceptance:**
  - Decision artifact exists and is linked from this plan.
  - Week anchor convention is explicit (timezone and date key policy).
  - Idempotency rule is explicit (overwrite vs supersede behavior per week key).
- **Validation contract:** Decision closes only when routing mode, week anchor, and idempotency policy each have a single unambiguous value.
- **Planning validation:** None: non-implementation decision task.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** Adds decision artifact used by all implementation tasks.
- **Build completion evidence (2026-02-18):**
  - Decision artifact: `docs/plans/startup-loop-s10-weekly-orchestration/decisions/s10-weekly-transition-decision.md`
  - D1 Transition mode: Option B approved (Phase 0 + Phase 1 in wave 1; Phase 2 deferred).
  - D2 Week anchor: ISO week UTC Monday; format `YYYY-Www`.
  - D3 Idempotency: overwrite in-place per week key.
  - All three acceptance criteria met: routing mode, week anchor, and idempotency policy each have a single unambiguous value.
  - Wave 2 unblocked: TASK-02, TASK-03.

### TASK-02: Publish S10 orchestration contract (`/lp-weekly`) with sequence + lane rules
- **Type:** IMPLEMENT
- **Deliverable:** S10 orchestration contract doc at `docs/business-os/startup-loop/s10-weekly-orchestration-contract-v1.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Artifact-Destination:** `docs/business-os/startup-loop/s10-weekly-orchestration-contract-v1.md`
- **Reviewer:** startup-loop maintainers
- **Approval-Evidence:** Decision-log acknowledgment in plan + maintainer review note
- **Measurement-Readiness:** owner=operator; cadence=weekly; tracked in two-cycle checkpoint evidence section
- **Affects:** `docs/business-os/startup-loop/s10-weekly-orchestration-contract-v1.md`, `docs/business-os/startup-loop-workflow.user.md`, `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-04, TASK-05
- **Confidence:** 85%
  - Implementation: 90% - scope is doc-contract and already decomposed in fact-find.
  - Approach: 85% - authority stack and invariants are explicit.
  - Impact: 90% - creates deterministic execution contract for all later tasks.
- **Acceptance:**
  - Contract defines:
    - authority stack,
    - sequence v0,
    - lane I/O/exit/failure/owner,
    - additive artifact continuity policy,
    - no-block first-iteration policy.
  - Contract includes explicit decision-to-experiment-action mapping table.
  - Contract includes rerun/idempotency semantics keyed by week anchor.
- **Validation contract (VC-02):**
  - VC-02-01: authority isolation -> pass when prompt authority and stage authority are each explicitly scoped and non-overlapping by text.
  - VC-02-02: sequence determinism -> pass when two reviewers can derive same step order from contract without ambiguity.
  - VC-02-03: lane completeness -> pass when each lane has explicit inputs/outputs/exit/failure/owner.
  - VC-02-04: no-block policy -> pass when failure handling specifies warning/`restricted`/REM and no new hard gate.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: capture ambiguity list from current S10 docs.
  - Green evidence plan: publish contract with deterministic sections and lane rules.
  - Refactor evidence plan: remove duplicated language across workflow doc and prompt notes.
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** None: boundaries and source surfaces are already established.
- **Edge Cases & Hardening:** include explicit monthly-trigger handling and partial-input restricted-state behavior.
- **What would make this >=90%:** one live reviewer dry-run showing zero interpretation mismatches.
- **Rollout / rollback:**
  - Rollout: publish v1 contract and reference from startup-loop workflow docs.
  - Rollback: remove contract references; keep existing S10 documents authoritative.
- **Documentation impact:** Adds a new canonical S10 orchestration contract.
- **Notes / references:** `docs/business-os/_shared/business-vc-quality-checklist.md`
- **Build completion evidence (2026-02-18):**
  - `docs/business-os/startup-loop/s10-weekly-orchestration-contract-v1.md` — created (10 sections)
  - `docs/business-os/startup-loop-workflow.user.md` — S10 quick-action row updated with `/lp-weekly` reference
  - `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md` — cross-reference note added (read-only comment)
  - VC-02-01 pass: authority isolation table present with non-overlapping scope columns
  - VC-02-02 pass: 7 numbered steps, deterministic order, no conditional reordering
  - VC-02-03 pass: lanes `a`, `b`, `c` each have inputs/outputs/exit/failure/owner
  - VC-02-04 pass: no-block policy table with explicit prohibition on new hard gates

### TASK-03: Create `/lp-weekly` skill skeleton + modules (no-block posture)
- **Type:** IMPLEMENT
- **Deliverable:** New skill scaffold: `.claude/skills/lp-weekly/SKILL.md` + `modules/` files
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Affects:** `.claude/skills/lp-weekly/SKILL.md`, `.claude/skills/lp-weekly/modules/preflight.md`, `.claude/skills/lp-weekly/modules/orchestrate.md`, `.claude/skills/lp-weekly/modules/publish.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-04, TASK-05
- **Confidence:** 85%
  - Implementation: 90% - established thin-orchestrator pattern exists across repo.
  - Approach: 85% - module boundaries map directly to sequence v0.
  - Impact: 90% - enables unified S10 invocation surface without replacing authorities.
- **Acceptance:**
  - Skill exposes explicit invocation for weekly orchestration.
  - Module routing reflects sequence v0 and lane statuses.
  - Prohibited actions include introducing new hard stage blocks in first iteration.
  - Skill output includes additive packet references to canonical artifacts.
- **Validation contract (TC-03):**
  - TC-03-01: skill file includes authority stack references and no-block semantics.
  - TC-03-02: module order maps to preflight -> compile -> decision handoff -> audit/CI -> experiment -> publish.
  - TC-03-03: output contract includes `restricted` lane state for partial inputs.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** None: design is contract-driven from TASK-02.
- **Edge Cases & Hardening:** add explicit week-key and rerun handling sections in module docs.
- **What would make this >=90%:** one dry-run script/check proving stable output sections for two sample businesses.
- **Rollout / rollback:**
  - Rollout: introduce new skill without changing loop-spec mapping.
  - Rollback: remove skill directory; no runtime contract break.
- **Documentation impact:** Adds a new skill to the startup-loop skill set.
- **Build completion evidence (2026-02-18):**
  - `.claude/skills/lp-weekly/SKILL.md` — created (thin-orchestrator pattern; authority stack, module routing, output contract, idempotency semantics)
  - `.claude/skills/lp-weekly/modules/preflight.md` — created (5 sub-steps; `restricted` state; week-key derivation; fail-closed on `run_root`/`week_key` errors)
  - `.claude/skills/lp-weekly/modules/orchestrate.md` — created (steps 2–5: measurement, decisioning handoff, audit/CI, experiment lane)
  - `.claude/skills/lp-weekly/modules/publish.md` — created (packet write, latest-pointer update, required packet sections, additive-first policy)
  - TC-03-01 pass: SKILL.md authority stack + prohibited actions (no hard gates) present
  - TC-03-02 pass: module routing maps preflight → orchestrate (compile/decision/audit-CI/experiment) → publish
  - TC-03-03 pass: `restricted` lane state defined in SKILL.md output contract and preflight.md

### TASK-04: Wire Phase 1 default route via startup-loop surfaces (without stage-semantic changes)
- **Type:** IMPLEMENT
- **Deliverable:** Routing updates in startup-loop skill docs/modules so S10 default path calls `/lp-weekly`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-18)
- **Affects:** `.claude/skills/startup-loop/SKILL.md`, `.claude/skills/startup-loop/modules/cmd-advance.md`, `[readonly] docs/business-os/startup-loop/loop-spec.yaml`
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** TASK-06
- **Confidence:** 80%
  - Implementation: 80% - edit surface confirmed bounded (1 new block in cmd-advance.md + 1 SKILL.md table note); loop-spec.yaml [readonly] simplifies scope. E1 uplift from static audit confirming single insert point and guard scope.
  - Approach: 80% - "Do NOT alter" guard (cmd-advance.md line 129) covers named items and "S10 gates"; Signal Review Dispatch is labeled "dispatch" not "gate"; insertion before it is not alteration. Double-dispatch risk mitigated by explicit "this subsumes" language in new block (agent-instruction file). E1 uplift from guard text and approach pattern.
  - Impact: 85% - unchanged.
- **Replan note (2026-02-18):** Promoted 75→80 via E1 evidence from static audit (cmd-advance.md, SKILL.md, loop-spec.yaml). Key unknowns resolved: (a) guard scope confirmed non-blocking for block insertion; (b) double-dispatch pattern resolved by approach definition below.
- **Acceptance:**
  - Startup-loop S10 operator guidance routes through `/lp-weekly` orchestration.
  - Existing S10 artifacts and authorities remain unchanged.
  - `/lp-experiment` remains a sub-flow, not removed.
  - No stage ID/order/gate semantic changes introduced.
- **Validation contract (TC-04):**
  - TC-04-01: S10 stage semantics in `loop-spec.yaml` unchanged (verify by grep: `skill: /lp-experiment` still present, no new skill field added).
  - TC-04-02: S10 guidance references `/lp-weekly` default route with fallback clarity (verify by inspection of new dispatch block in cmd-advance.md).
  - TC-04-03: Existing signal-review and feedback-audit flow remains reachable as Phase 0 fallback path (verify by inspection of fallback annotation).
- **Execution plan (refined):** Red -> Green -> Refactor
  - **Red evidence target:** Grep snapshot of current S10 references (before edits); confirm no `/lp-weekly` reference exists yet.
  - **Green minimum:** Insert new "S10 Phase 1 `/lp-weekly` dispatch" block in cmd-advance.md, update SKILL.md S10 row note. Pass TC-04-01..TC-04-03.
  - **Refactor:** Remove any redundant wording; tighten fallback language.
- **Approach pattern (pinned):**
  - `cmd-advance.md`: INSERT a new block as first item in S10 section (before GATE-BD-08), containing: trigger, invocation (`/lp-weekly --biz <BIZ> --week <YYYY-Www>`), subsumes note ("This dispatch orchestrates GATE-BD-08, signal-review, feedback-audit, KPCS decision, and experiment lane. When `/lp-weekly` is invoked, the standalone dispatches below are the Phase 0 fallback path."), and fallback line ("If `/lp-weekly` is unavailable, proceed with GATE-BD-08 → Signal Review Dispatch as the fallback sequence."). Do NOT alter GATE-BD-08 or Signal Review Dispatch block content.
  - `SKILL.md` line 102: Extend S10 stage-table row with a Phase note: `S10 | Weekly decision | /lp-experiment (Phase 0) / /lp-weekly (Phase 1 default)`. Do not remove `/lp-experiment` reference.
  - `loop-spec.yaml`: [readonly] — no changes in this task (Phase 2 remap is TASK-08 scope).
- **Planning validation (required for M/L):**
  - Checks run: `rg -n "S10|lp-weekly|lp-experiment|weekly-kpcs" .claude/skills/startup-loop docs/business-os/startup-loop/loop-spec.yaml`
  - Validation artifacts: grep snapshot recorded in task build notes (before and after edits).
  - Pre-edit snapshot taken: cmd-advance.md lines 115–148 (GATE-BD-08 + Signal Review Dispatch blocks); SKILL.md line 102; loop-spec.yaml lines 212–218.
  - Unexpected findings: None (static audit complete).
- **Scouts:** Signal Review Dispatch uses advisory/fallback posture pattern (cmd-advance.md lines 131, 146) — reuse as template for new block's fallback language.
- **Edge Cases & Hardening:** Explicit fallback line if `/lp-weekly` unavailable (included in approach pattern above). Block insertion must not reorder existing S10 gate content.
- **What would make this >=90%:** green TC-04-01..TC-04-03 pass plus TASK-06 compatibility checks passing on first attempt.
- **Rollout / rollback:**
  - Rollout: update startup-loop orchestration docs only (no runtime/code changes).
  - Rollback: remove new dispatch block from cmd-advance.md; revert SKILL.md S10 row to single `/lp-experiment` entry.
- **Documentation impact:** Updates startup-loop operator routing behavior docs; new dispatch block in cmd-advance.md is the only structural addition.
- **Build completion evidence (2026-02-18):**
  - `.claude/skills/startup-loop/modules/cmd-advance.md` — S10 Phase 1 dispatch block inserted before GATE-BD-08; fallback line explicit; GATE-BD-08 and Signal Review Dispatch blocks untouched
  - `.claude/skills/startup-loop/SKILL.md` — S10 row extended: `lp-experiment (Phase 0 fallback) / lp-weekly (Phase 1 default)`
  - `loop-spec.yaml` — not modified (readonly; `skill: /lp-experiment` unchanged per TC-04-01)
  - TC-04-01 pass: loop-spec.yaml `skill: /lp-experiment` confirmed unchanged
  - TC-04-02 pass: cmd-advance.md references `/lp-weekly` as default with explicit fallback line
  - TC-04-03 pass: GATE-BD-08 + Signal Review Dispatch preserved as Phase 0 fallback path

### TASK-05: Add additive weekly packet + latest pointer and cross-artifact linking policy
- **Type:** IMPLEMENT
- **Deliverable:** Weekly packet schema/contract and pointer policy
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Artifact-Destination:** `docs/business-os/startup-loop/s10-weekly-packet-schema-v1.md` + updates to workflow docs
- **Reviewer:** startup-loop maintainers + operator
- **Approval-Evidence:** maintainer acknowledgment comment in decision log
- **Measurement-Readiness:** packet completeness score tracked per weekly run
- **Affects:** `docs/business-os/startup-loop/s10-weekly-packet-schema-v1.md`, `docs/business-os/startup-loop-workflow.user.md`, `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 90% - additive schema and pointer policy are bounded.
  - Approach: 85% - continuity policy is explicit in fact-find.
  - Impact: 90% - improves replayability without replacing canonical outputs.
- **Acceptance:**
  - Packet schema defines required links to canonical S10 artifacts.
  - Pointer update rule is deterministic and idempotent by week key.
  - Schema includes lane statuses and unresolved REM summary fields.
- **Validation contract (VC-05):**
  - VC-05-01: additive continuity -> pass when schema states canonical artifacts are retained and referenced.
  - VC-05-02: idempotency -> pass when rerun policy is deterministic and testable.
  - VC-05-03: observability -> pass when required packet fields support the 3 two-cycle metrics.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: identify missing replayability fields in current S10 surfaces.
  - Green evidence plan: publish packet schema + pointer policy.
  - Refactor evidence plan: remove duplicate field definitions across docs.
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** None: schema is derived from approved TASK-02 contract.
- **Edge Cases & Hardening:** include explicit behavior for missing/late artifact links.
- **What would make this >=90%:** one pilot packet generated with zero missing required links.
- **Rollout / rollback:**
  - Rollout: add schema doc and references.
  - Rollback: keep packet optional and remove pointer policy references.
- **Documentation impact:** Adds packet schema and workflow linking rules.
- **Notes / references:** `docs/business-os/_shared/business-vc-quality-checklist.md`
- **Build completion evidence (2026-02-18):**
  - `docs/business-os/startup-loop/s10-weekly-packet-schema-v1.md` — created (9 sections: purpose, canonical artifacts retained, path template, latest-pointer path, required fields schema, idempotency rule, pointer update rule, two-cycle metrics fields, cross-references)
  - `docs/business-os/startup-loop-workflow.user.md` — S10 row updated with packet schema link and completion criteria extended
  - `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md` — cross-reference comment updated with packet schema link
  - VC-05-01 pass: Section 1 + Section 2 explicitly state canonical artifacts are retained and referenced, not replaced
  - VC-05-02 pass: Section 6 defines idempotency rule: overwrite in-place per `YYYY-Www` key; deterministic and testable
  - VC-05-03 pass: Section 8 maps all 3 two-cycle metrics to explicit required packet fields

### TASK-06: Add compatibility regression checks (authority boundaries + artifact continuity)
- **Type:** IMPLEMENT
- **Deliverable:** Regression checks and test updates for S10 wrapper compatibility
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-18)
- **Affects:** `scripts/src/startup-loop/__tests__/stage-addressing.test.ts`, `scripts/src/startup-loop/__tests__/derive-state.test.ts`, `scripts/src/startup-loop/__tests__/generate-stage-operator-views.test.ts`, `scripts/src/startup-loop/__tests__/s10-weekly-routing.test.ts` (new), `scripts/src/startup-loop/__tests__/s10-packet-linkage.test.ts` (new)
- **Depends on:** TASK-04, TASK-05
- **Blocks:** TASK-07
- **Confidence:** 80%
  - Implementation: 80% - seams confirmed via E2 exploration of 34 test files. js-yaml + fs.readFileSync load pattern is reusable from `generate-stage-operator-views.test.ts` lines 207–215. File-content assertions via `toContain()` established in existing tests. S10 seams found at stage-addressing.test.ts (lines 22, 99–105, 222–228, 239–244) and derive-state.test.ts (lines 73, 143). E2 uplift: identified concrete attachment points for TC-06-01/02.
  - Approach: 80% - lint-style content check path confirmed via `market-intelligence-pack-lint.test.ts` precedent. TC-06-03 (continuity) and TC-06-04 (idempotency) testable via content assertions on `s10-weekly-packet-schema-v1.md` (`YYYY-Www` key and overwrite-in-place language). E1 uplift: no alternative approach required; lint-style pattern is lower-risk than new TS source module.
  - Impact: 85% - unchanged; critical for v2 TASK-07 compatibility posture.
- **Replan note (2026-02-18):** Promoted 75→80 via E1+E2 evidence. Key unknowns resolved: (a) test seams identified at concrete line ranges in 3 existing test files; (b) js-yaml load pattern reusable from existing test (no new loader needed); (c) lint-style approach for TC-06-03/04 confirmed by `market-intelligence-pack-lint.test.ts` precedent; (d) TC-06-04 idempotency testable via content assertions on packet schema doc text. Held-back test: "what single unknown would push below 80?" → only if `s10-packet-linkage.test.ts` content assertions fail to satisfy TC-06-04 idempotency bar — mitigated by direct text check on schema section wording.
- **Acceptance:**
  - Tests prove no stage-semantic drift.
  - Tests prove canonical S10 artifacts still produced/linked.
  - Tests prove wrapper route and fallback behavior are deterministic.
- **Validation contract (TC-06):**
  - TC-06-01: stage contract stability -> S10 stage order/ID assertions unchanged.
  - TC-06-02: authority boundary -> prompt authority references preserved; no conflicting authority text.
  - TC-06-03: continuity -> weekly packet references canonical artifacts and does not replace them.
  - TC-06-04: rerun idempotency -> week-key rerun yields deterministic packet pointer behavior.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: `rg -n "S10|weekly|packet|lp-weekly|lp-experiment" scripts/src/startup-loop/__tests__/`
  - Validation artifacts: 34 test files explored; S10 seams confirmed at stage-addressing.test.ts (lines 22, 99–105, 222–228, 239–244), derive-state.test.ts (lines 73, 143), generate-stage-operator-views.test.ts (line 233).
  - Unexpected findings: None. js-yaml load pattern reusable from `generate-stage-operator-views.test.ts` lines 207–215. Lint-style assertion pattern from `market-intelligence-pack-lint.test.ts` confirmed as the right approach for `s10-packet-linkage.test.ts`.
- **Scouts:** Reusable helpers confirmed: js-yaml + fs.readFileSync loader from `generate-stage-operator-views.test.ts`; `toContain()` content assertions from `market-intelligence-pack-lint.test.ts`; `findStageById()` utility from stage-addressing.test.ts for TC-06-01 stage contract assertions.
- **Edge Cases & Hardening:** include partial-input `restricted` lane-state assertions.
- **What would make this >=90%:** first green run with no fallback logic rewrite.
- **Rollout / rollback:**
  - Rollout: add tests first, then enforce in targeted validation gate.
  - Rollback: keep tests non-blocking while routing is stabilized.
- **Documentation impact:** test evidence references added to plan and task notes.
- **Build completion evidence (2026-02-18):**
  - `scripts/src/startup-loop/__tests__/s10-weekly-routing.test.ts` — created (TC-06-01 + TC-06-02; 15 tests)
  - `scripts/src/startup-loop/__tests__/s10-packet-linkage.test.ts` — created (TC-06-03 + TC-06-04; 13 tests)
  - Existing S10 seams in stage-addressing.test.ts, derive-state.test.ts, generate-stage-operator-views.test.ts already provide TC-06-01 coverage — no edits needed
  - TC-06-01 pass: loop-spec.yaml asserted to retain `skill: /lp-experiment`, `prompt_template: weekly-kpcs-decision-prompt.md`, `[S9B, S10]` DAG edge, and 17-stage count
  - TC-06-02 pass: cmd-advance.md asserted to contain `/lp-weekly`, `Phase 0 fallback`, `GATE-BD-08`, and `weekly-kpcs`; SKILL.md asserted to contain both `lp-experiment` and `lp-weekly` in S10 row
  - TC-06-03 pass: packet schema asserted to contain `never replaces`, canonical artifact path patterns (`weekly-kpcs-decision`, `signal-review`), ref field names, and orchestration contract cross-reference
  - TC-06-04 pass: packet schema asserted to contain `YYYY-Www`, `overwrites the existing weekly packet in place`, `does not create a new packet file with a version suffix`, `never updated on a failed publish`, and `fail-closed`
  - All 28 tests pass (2 test suites green)
  - 2 assertion fixes applied during Red→Green: (a) `weekly-kpcs-decision-prompt.md` → `weekly-kpcs` (cmd-advance.md uses short form); (b) S10 row regex non-greedy fix (use `[^\n]*` instead of `[\s\S]*?` to match full table row)

### TASK-07: Horizon checkpoint - reassess downstream plan
- **Type:** CHECKPOINT
- **Deliverable:** updated plan evidence via `/lp-do-replan`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/startup-loop-s10-weekly-orchestration/plan.md`
- **Depends on:** TASK-06
- **Blocks:** TASK-08
- **Confidence:** 95%
  - Implementation: 95% - process is defined.
  - Approach: 95% - required before optional remap decision.
  - Impact: 95% - prevents remap without real weekly evidence.
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run.
  - `/lp-do-replan` run on downstream remap decision.
  - Two-cycle metrics captured:
    - missed Section H checks,
    - unresolved REM carryover,
    - next-experiment specs created.
  - Plan updated and re-sequenced.
- **Horizon assumptions to validate:**
  - Phase 0/1 route is stable across two cycles.
  - Additive packet improves replayability without operator overload.
- **Validation contract:** checkpoint closes only with two-cycle evidence section linked in plan.
- **Planning validation:** evidence path recorded in checkpoint notes.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** plan updated with checkpoint evidence and recalibrated confidence.

### TASK-08: Decide whether to execute optional Phase 2 S10 mapping remap
- **Type:** DECISION
- **Deliverable:** `docs/plans/startup-loop-s10-weekly-orchestration/decisions/s10-weekly-phase2-remap-decision.md`
- **Execution-Skill:** lp-do-replan
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/business-os/startup-loop/loop-spec.yaml`, `.claude/skills/startup-loop/SKILL.md`, `[readonly] checkpoint evidence`
- **Depends on:** TASK-07
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% - binary decision with clear trigger data.
  - Approach: 85% - bounded by checkpoint metrics and compatibility evidence.
  - Impact: 90% - controls whether S10 mapping is formally remapped.
- **Options:**
  - Option A: Keep Phase 1 route, defer Phase 2 remap.
  - Option B: Approve Phase 2 remap now.
- **Recommendation:** Option A unless checkpoint metrics show clear operational gain and zero compatibility regressions.
- **Decision input needed:**
  - question: Proceed to loop-spec S10 mapping remap (`/lp-weekly`) now?
  - why it matters: changes canonical stage-skill mapping and downstream expectations.
  - default + risk: default no; risk is prolonged dual-surface naming.
- **Acceptance:**
  - Decision artifact cites checkpoint metrics and TC-06 results.
  - If Option B selected, follow-on plan task is created with explicit rollback path.
- **Validation contract:** decision closes when evidence references are complete and option rationale is explicit.
- **Planning validation:** None: decision task.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** records post-checkpoint remap policy.

## Risks & Mitigations
- Routing drift between `/startup-loop` and `/lp-weekly`:
  - Mitigation: TASK-04 explicit routing contract + TASK-06 regression checks.
- Authority confusion (prompt vs orchestrator):
  - Mitigation: maintain explicit authority stack in all touched docs.
- Re-entrancy/duplicate artifacts:
  - Mitigation: week-key idempotency policy from TASK-01 enforced in TASK-05 schema.
- Weekly overhead inflation:
  - Mitigation: no-block first iteration + lane timeboxing + checkpoint review after two cycles.

## Observability
- Logging:
  - Weekly packet records lane status and unresolved REM counts.
- Metrics:
  - `missed_section_h_checks_per_cycle`
  - `unresolved_rem_carryover_count`
  - `next_experiment_specs_created_count`
- Alerts/Dashboards:
  - None: first wave uses document-based weekly review; alerting deferred.

## Acceptance Criteria (overall)
- [ ] Transition decision artifact is complete and unambiguous (TASK-01).
- [ ] `/lp-weekly` contract and skill skeleton exist with deterministic sequence and lane rules (TASK-02, TASK-03).
- [ ] Startup-loop S10 default route references `/lp-weekly` without stage-semantic drift (TASK-04).
- [ ] Additive weekly packet schema exists and references canonical S10 artifacts (TASK-05).
- [ ] Compatibility tests cover authority boundaries and artifact continuity (TASK-06).
- [ ] Two-cycle checkpoint evidence captured and remap decision made or deferred explicitly (TASK-07, TASK-08).
- [ ] Fit checks against `startup-loop-orchestrated-os-comparison-v2` TASK-06/TASK-07 are documented and passing.

## Decision Log
- 2026-02-18: Plan created from `startup-loop-s10-weekly-orchestration` fact-find.
- 2026-02-18: Default transition stance set to Option B (Phase 0 + Phase 1) pending TASK-01 confirmation.
- 2026-02-18: TASK-01 closed. Operator confirmed Option B, ISO week UTC anchor (YYYY-Www), overwrite idempotency. Decision artifact at `decisions/s10-weekly-transition-decision.md`.
- 2026-02-18: TASK-04 replanned 75→80. E1 evidence (static audit of cmd-advance.md, SKILL.md, loop-spec.yaml) resolved: guard scope (dispatch ≠ gate, block insertion allowed), double-dispatch pattern (new block with "subsumes" language), loop-spec [readonly] scope confirmed. Approach pattern pinned in task. Ready for `/lp-do-build`.
- 2026-02-18: TASK-06 replanned 75→80. E1+E2 evidence: 34-test-file exploration; S10 seams confirmed at concrete line ranges in stage-addressing.test.ts, derive-state.test.ts, generate-stage-operator-views.test.ts; js-yaml load pattern reusable; lint-style content assertions (market-intelligence-pack-lint.test.ts) confirmed as approach for TC-06-03/04; TC-06-04 idempotency testable via schema doc text assertions. Ready for `/lp-do-build`.
- 2026-02-18: TASK-06 Complete. 2 new test files (s10-weekly-routing.test.ts + s10-packet-linkage.test.ts); 28 tests green. TC-06-01..04 all pass. 2 assertion fixes applied during Red→Green (weekly-kpcs short form; regex match-to-end-of-line).

## Overall-confidence Calculation
- Task confidence values:
  - TASK-01=85 (S)
  - TASK-02=85 (S)
  - TASK-03=85 (S)
  - TASK-04=80 (M)
  - TASK-05=85 (S)
  - TASK-06=80 (M)
  - TASK-07=95 (S)
  - TASK-08=85 (S)
- Weights: `S=1`, `M=2`, `L=3`
- Weighted sum = `85 + 85 + 85 + (80*2) + 85 + (80*2) + 95 + 85 = 840`
- Weight total = `1+1+1+2+1+2+1+1 = 10`
- Overall-confidence = `840 / 10 = 84%`

## Section Omission Rule
None: all sections are relevant for this mixed-track planning run.
