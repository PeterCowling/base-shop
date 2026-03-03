---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: BOS
Workstream: Operations
Created: 2026-02-26
Last-updated: 2026-02-26
Feature-Slug: reflection-prioritization-policy-implementation
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reflection-prioritization-policy-implementation/plan.md
Dispatch-ID: IDEA-DISPATCH-20260226-0020
Trigger-Why: Externally-reviewed canonical prioritization policy v2 defines a complete classification schema that must be implemented in the lp-do-ideas trial system — the current dispatch packet carries routing metadata only, with no deterministic priority tier, urgency evidence gates, or prerequisite ordering.
Trigger-Intended-Outcome: type: operational | statement: Advisory-phase classifier module implemented — every idea dispatched through the trial pipeline receives a complete canonical classification record (priority_tier, urgency, effort, reason_code, effective_priority_rank) persisted alongside the dispatch packet, without gating or blocking existing pipeline flow | source: operator
---

# Reflection Prioritization Policy Implementation — Fact-Find

## Scope

### Summary

The canonical post-build reflection idea prioritization policy (v2, externally reviewed, decision: Revise close-to-approve) defines a deterministic 8-tier classification schema (P0/P0R/P1+proximity/P1M/P2–P5), evidence-gated urgency admission (U0/U1/U2/U3), auto-demotion for missing evidence, prerequisite ordering via `effective_priority_rank`, and anti-gaming controls. None of these are currently implemented in the lp-do-ideas trial pipeline. The pipeline carries a 3-level `priority` field (`P1/P2/P3`) on dispatch packets but has no canonical classification schema, no evidence fields, no auto-demotion logic, and no deterministic queue sort key.

This fact-find scopes the code changes needed to implement the advisory phase of the rollout (Section 12.1 of the policy brief): generate classification outputs alongside dispatch packets without gating or blocking existing pipeline flow.

### Goals

- Add canonical idea classification fields (`priority_tier`, `proximity`, `urgency`, `effort`, `reason_code`, `effective_priority_rank`) as a typed data structure emitted alongside each dispatch packet
- Implement the 8-tier decision tree and urgency admission rules as a pure classifier module
- Implement auto-demotion when required evidence fields are absent
- Persist classification records in the trial artifact paths (advisory — not enforcement-gated)
- Extend the JSON schema and TypeScript types to accept classification fields without breaking existing packets
- Add tests for the classifier decision tree, urgency admission, and auto-demotion logic

### Non-goals

- Enforcement gating (Phase 4 of the rollout) — advisory phase only
- Blocking dispatch admission on missing classification fields
- Changing the existing dispatch packet `priority` field (P1/P2/P3 coarse field stays for queue scheduling compatibility)
- Migrating existing queue-state.json or telemetry.jsonl entries
- Implementing the weekly audit sampling runner (Phase 5)
- Changing the queue sort key in `planNextDispatches()` — the new `effective_priority_rank` sort key (Section 7 of the policy) is a Phase 4 enforcement change

### Constraints & Assumptions

- Constraints:
  - The dispatch schema has `"additionalProperties": false` on both v1 and v2 — any new fields must be added as optional properties to the schema before they will validate
  - The classifier must be a pure function (no file I/O, no external calls) for deterministic test coverage
  - Advisory phase: `classified_by` must be set (e.g. `"lp-do-ideas-classifier-v1"`) and `classified_at` must be an ISO timestamp, but absent evidence fields must result in auto-demotion, not rejection
  - The trial contract (Section 1) prohibits writes outside designated trial artifact paths — classification records must use the existing trial artifact paths or a new designated path within `docs/business-os/startup-loop/ideas/trial/`
  - The `startup-loop-ideas-pipeline-redesign` plan is Status: Complete and all tasks are done — there is no conflict; that plan did not address classification schema at all
- Assumptions:
  - Advisory phase classification is AI-driven at intake (the `/lp-do-ideas` skill populates classification fields based on routing intelligence) with schema validation at the queue layer — there is no code-only classifier at the AI decision level
  - The existing `priority: "P1" | "P2" | "P3"` field on dispatch packets is kept for backward compatibility with `planNextDispatches()` scheduling; the new `effective_priority_rank` lives on the classification record, not on the packet itself during Phase 1
  - The dispatch packet `operator_idea` trigger is the primary driver for this first wave (the dispatch in this packet is itself an `operator_idea`)

## Outcome Contract

- **Why:** The current pipeline generates dispatch packets with no canonical classification. Any priority assignment is ad-hoc. The externally-reviewed policy v2 defines an auditable, deterministic schema that, once implemented in advisory mode, lets the operator calibrate tier and urgency distributions before enforcement is turned on.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Advisory-phase classifier module implemented — every idea dispatched through the trial pipeline receives a complete canonical classification record (priority_tier, urgency, effort, reason_code, effective_priority_rank) persisted to the trial artifact store, without gating or blocking existing pipeline flow. Rollout Phase 1 of the canonical policy is complete.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `scripts/src/startup-loop/lp-do-ideas-trial.ts` — orchestrator; emits `TrialDispatchPacket`; line 918 hardcodes `priority: "P2"` as the only priority assignment
- `.claude/skills/lp-do-ideas/SKILL.md` — skill contract; applies routing intelligence to determine `status` and `recommended_route`; has no classification logic beyond the 3-level priority field

### Key Modules / Files

1. `scripts/src/startup-loop/lp-do-ideas-trial.ts` — `TrialDispatchPacket` interface (lines 118–145); `TrialDispatchPacketV2` interface (lines 212–251); orchestrator function at line 703; priority hardcoded at line 918
2. `scripts/src/startup-loop/lp-do-ideas-trial-queue.ts` — `TrialQueue` class; `ScheduledDispatch` interface (lines 54–61) carries `priority: "P1" | "P2" | "P3"`; `planNextDispatches()` (line 755) uses `priorityBaseScore()` (line 307) which maps only 3 priority values
3. `scripts/src/startup-loop/lp-do-ideas-routing-adapter.ts` — `routeDispatch()` and `routeDispatchV2()`; validates routing metadata only; no classification fields
4. `docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.schema.json` — v1 JSON schema; `"additionalProperties": false` at line 217; `priority` field at line 120 accepts `["P1","P2","P3"]` only; no classification fields present
5. `docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.v2.schema.json` — v2 JSON schema; same `"additionalProperties": false` constraint at line 238; same coarse `priority` field; no classification fields
6. `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md` — mode boundary, autonomy policy, artifact paths; Section 6 defines the designated trial write paths
7. `docs/business-os/startup-loop/2026-02-26-reflection-prioritization-expert-brief.user.md` — canonical policy (v2); defines the complete schema, decision tree, urgency admission, auto-demotion, anti-gaming controls, and rollout plan

New module to create:
- `scripts/src/startup-loop/lp-do-ideas-classifier.ts` — pure classifier; input: idea metadata + evidence fields; output: `IdeaClassification` record

### Data & Contracts

- Types/schemas/events:
  - `TrialDispatchPacket` (lp-do-ideas-trial.ts:118): has `priority: "P1" | "P2" | "P3"` — coarse 3-level field; does NOT have `priority_tier`, `proximity`, `urgency`, `effort`, `reason_code`, `effective_priority_rank`, or any evidence fields from Section 4.2–4.4 of the policy. `trigger` typed as `"artifact_delta"` only (v1 does not support `operator_idea` in the TypeScript type).
  - `TrialDispatchPacketV2` (lp-do-ideas-trial.ts:212): same classification omissions; however `trigger` is typed as `"artifact_delta" | "operator_idea"` — the classifier input type must accept both trigger variants and handle nullable `artifact_id` for `operator_idea` dispatches.
  - `ScheduledDispatch` (lp-do-ideas-trial-queue.ts:54): `priority: "P1" | "P2" | "P3"` — used for scheduling score computation
  - `lp-do-ideas-dispatch.schema.json`: top-level `additionalProperties: false` at line 217 — new fields must be added as optional properties before they will pass validation
  - `lp-do-ideas-dispatch.v2.schema.json`: same constraint at line 238

- New type needed: `IdeaClassification` — an independent record (not embedded in the dispatch packet) containing all Section 4.1–4.4 fields:
  - Identity: `idea_id`, `source_dispatch_id`
  - Classification: `priority_tier`, `proximity`, `urgency`, `effort`, `reason_code`
  - Prerequisite: `parent_idea_id`, `is_prerequisite`, `effective_priority_rank`
  - Governance: `classified_by`, `classified_at`, `status`
  - Evidence: `incident_id`, `deadline_date`, `repro_ref`, `leakage_estimate_value`, `leakage_estimate_unit`, `first_observed_at`, `risk_vector`, `risk_ref`, `failure_metric`, `baseline_value`, `funnel_step`, `metric_name`

- Persistence:
  - Trial artifact paths (contract Section 6): `docs/business-os/startup-loop/ideas/trial/`
  - A new artifact path is needed for classification records: `docs/business-os/startup-loop/ideas/trial/classifications.jsonl` (newline-delimited JSON, append-only)
  - This path must be added to the trial contract's designated artifact paths table

### Dependency & Impact Map

- Upstream dependencies:
  - `lp-do-ideas-trial.ts` emits the dispatch packet → classifier is called after packet emission, before persistence
  - `/lp-do-ideas` SKILL.md is the AI entrypoint — it must be updated to populate evidence fields (incident_id, deadline_date, etc.) when they are available in the operator-stated context
- Downstream dependents:
  - `lp-do-ideas-trial-queue.ts` → `ScheduledDispatch` and `planNextDispatches()` are NOT changed in advisory phase; they continue to use the coarse `priority` field
  - `lp-do-ideas-routing-adapter.ts` — no change needed; routing logic is unchanged
  - Future: Phase 4 enforcement changes `planNextDispatches()` to use `effective_priority_rank` — that is out of scope here
  - `lp-do-ideas-persistence.ts` — if it exists, may need extension to persist classification records; must be confirmed

- Likely blast radius:
  - New file: `scripts/src/startup-loop/lp-do-ideas-classifier.ts` — additive; no existing files changed
  - Schema extension: both v1 and v2 JSON schemas need optional classification fields added (or the classification record is a separate artifact, not embedded in the packet)
  - Trial contract: Section 6 artifact paths table needs one new row
  - SKILL.md: `/lp-do-ideas` intake flow needs guidance on when/how to populate evidence fields

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (`@jest/globals`)
- Commands: `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern=lp-do-ideas-classifier`
- CI integration: startup-loop tests run in CI via the reusable workflow

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Trial queue (enqueue, advance, dedupe, telemetry) | Unit | `__tests__/lp-do-ideas-trial-queue.test.ts` | Comprehensive — TC-01 through TC-04 + edge cases |
| Routing adapter (all route/status/error paths) | Unit | `__tests__/lp-do-ideas-routing-adapter.test.ts` | Comprehensive — TC-01 through TC-15 |
| Trial orchestrator | Unit | `__tests__/lp-do-ideas-trial.test.ts` | Covers dispatch packet emission; no classification fields |
| Dispatch v2 validation | Unit | `__tests__/lp-do-ideas-dispatch-v2.test.ts` | v2 schema validation only; no classification |

No existing tests cover:
- The 8-tier decision tree
- Urgency admission rules (U0/U1 evidence gates)
- Auto-demotion logic
- `effective_priority_rank` computation (including prerequisite inheritance)
- Anti-gaming field checks (`classified_by`, `classified_at` always present)

#### Coverage Gaps

- Untested paths (all new — no existing code to cover):
  - `classify()` function: all 8 decision tree branches
  - `admitUrgency()`: U0 admission gates (incident_id present, deadline within 72h, leakage exceeds threshold)
  - `admitUrgency()`: U1 admission gates (recurrence in 7 days, deadline within 14 days, launch blocker)
  - `admitUrgency()`: default U2/U3 fallback
  - Auto-demotion: P0 missing `risk_vector`+`risk_ref` → demotes to P4/P5
  - Auto-demotion: P0R missing `incident_id` or `failure_metric`+`baseline` → demotes
  - Auto-demotion: P1-Direct missing `funnel_step`+`metric_name`+`baseline` → demotes
  - `computeEffectivePriorityRank()`: prerequisite inheritance rule
  - `ownPriorityRank()`: all 10 rank mappings including P1+Direct/P1M/P1+Near/P1+Indirect ordering

#### Testability Assessment

- Easy to test: The classifier is a pure function (no I/O, injectable clock for `classified_at`). All 8 decision tree branches and all urgency admission paths are directly unit-testable.
- Hard to test: Nothing in this scope is hard to test. The advisory-phase classifier produces a data record; there are no side effects.
- Test seams needed: Injectable clock for `classified_at` timestamp; injectable leakage threshold for U0 gate.

#### Recommended Test Approach

- Unit tests for: all classifier decision tree branches (TC-01–TC-08 per tier); all urgency admission rules (TC-U0a/b/c, TC-U1a/b/c, TC-default); all auto-demotion paths (TC-AD-P0, TC-AD-P0R, TC-AD-P1D); `effective_priority_rank` prerequisite inheritance; anti-gaming field presence (classified_by, classified_at always set)
- Contract tests for: `IdeaClassification` output shape matches the canonical schema for each tier

### Recent Git History (Targeted)

- `scripts/src/startup-loop/lp-do-ideas-trial.ts`, `lp-do-ideas-trial-queue.ts`, `lp-do-ideas-routing-adapter.ts`:
  - `19b4c203f0 chore: checkpoint outstanding workspace changes` (2026-02-25) — most recent
  - `ad7dae72bb startup-loop: complete TASK-08 — dispatch.v1 compat reader, go-live checklist Section I, plan archived` — added `routeDispatchV2()` and compat-v1 reader
  - `c6651c7447 feat(startup-loop): overhaul ideas layer, decision quality, and monitoring` — major ideas layer overhaul

These commits confirm the pipeline is recently active and no classification schema work has been started in any branch.

## Gap Analysis

### Fields absent from dispatch schema and TypeScript types

The following fields from policy Sections 4.2–4.4 are entirely absent from both `TrialDispatchPacket` and `TrialDispatchPacketV2`:

| Field | Policy Section | Status |
|---|---|---|
| `priority_tier` | 4.2 | Absent — only coarse `priority: "P1"\|"P2"\|"P3"` exists |
| `proximity` | 4.2 | Absent |
| `urgency` | 4.2 | Absent |
| `effort` | 4.2 | Absent |
| `reason_code` (classifier rule) | 4.2 | Absent (a different `reason_code` exists in bottleneck-detector; unrelated) |
| `parent_idea_id` | 4.3 | Absent |
| `is_prerequisite` | 4.3 | Absent |
| `effective_priority_rank` | 4.3 | Absent |
| `classified_by` | 4.4 | Absent |
| `classified_at` | 4.4 | Absent |
| `status` (idea lifecycle) | 4.4 | Absent (dispatch has a routing `status`; no idea lifecycle `status`) |
| `incident_id` | 4.4 | Absent |
| `deadline_date` | 4.4 | Absent |
| `repro_ref` | 4.4 | Absent |
| `leakage_estimate_value` | 4.4 | Absent |
| `leakage_estimate_unit` | 4.4 | Absent |
| `first_observed_at` | 4.4 | Absent |
| `risk_vector` | 4.4 | Absent |
| `risk_ref` | 4.4 | Absent |
| `failure_metric` | 4.4 | Absent |
| `baseline_value` | 4.4 | Absent |
| `funnel_step` | 4.4 | Absent |
| `metric_name` | 4.4 | Absent |

### Classification logic

- 8-tier decision tree (Section 5): does not exist anywhere in the codebase
- Urgency admission rules (Section 8): do not exist anywhere
- Auto-demotion logic (Section 9): does not exist anywhere
- `effective_priority_rank` computation (Section 4.3): does not exist anywhere
- Anti-gaming controls (Section 11): do not exist anywhere

The coarse `priority` field is the only classification signal currently in the pipeline, and it is hardcoded to `"P2"` in the orchestrator (lp-do-ideas-trial.ts line 918).

## Architecture Assessment

### Option A: New `lp-do-ideas-classifier.ts` module (recommended)

A pure function module: `classifyIdea(input: IdeaClassificationInput): IdeaClassification`. Called by the trial orchestrator after packet emission. Returns a complete `IdeaClassification` record. Persisted to `classifications.jsonl`.

**Rationale:**
- Separation of concerns: the classifier is reusable, independently testable, and does not require any changes to packet types or schemas during advisory phase
- Advisory phase constraint: the classifier produces output without blocking. A separate record (not embedded in the dispatch packet) achieves this cleanly and does not require schema changes to existing packet formats
- The policy rollout Section 12.1 says "generate classification/rank outputs without gating" — a separate record is the minimal faithful implementation
- Both v1 and v2 schemas have `additionalProperties: false`. Embedding new classification fields directly in packets would require changing both schemas and both TypeScript interfaces, risking regression in the routing adapter and queue validation. A separate record avoids this risk entirely in Phase 1
- When enforcement arrives (Phase 4), the classifier can be wired into the admission gate at that time; the architecture supports it

### Option B: Extend routing adapter

The routing adapter is a pure routing function. Adding classification there would conflate routing concerns with content classification. Rejected.

### Option C: Classification stays entirely AI-driven, no code enforcement

At advisory phase, the AI (lp-do-ideas skill) assigns classifications based on routing intelligence, and the classifier module simply validates and structures the AI-assigned fields. The module still exists for schema enforcement and auto-demotion; it is not pure rule-based code that ignores AI input. The policy is clear that `reason_code` must map to a deterministic classifier rule — the module enforces this by checking evidence fields and applying auto-demotion regardless of AI-assigned tier.

### Recommended architecture for Phase 1 (advisory)

1. New `lp-do-ideas-classifier.ts` module — pure function, injectable clock
2. New `IdeaClassification` TypeScript interface in `lp-do-ideas-trial.ts` or a new types file
3. Classification record persisted to `docs/business-os/startup-loop/ideas/trial/classifications.jsonl`
4. The `/lp-do-ideas` SKILL.md extended with guidance to populate evidence fields from operator context
5. Trial contract Section 6 extended with the new artifact path
6. New test file `__tests__/lp-do-ideas-classifier.test.ts`

The existing `priority: "P1" | "P2" | "P3"` field on dispatch packets is preserved unchanged. The `planNextDispatches()` scheduling continues to use the coarse field. The new `effective_priority_rank` lives only on the `IdeaClassification` record.

## Questions

### Resolved

- Q: Does `startup-loop-ideas-pipeline-redesign` already address the classification schema, creating a conflict?
  - A: No. That plan (Status: Complete, 2026-02-22) redesigned the IDEAS container type from sequential to `standing_pipeline`, rewired IDEAS-01..03 around `/idea-scan`, and updated spec/dict/schema docs. It explicitly set as non-goal: "Changing the handoff-to-fact-find contract." Classification schema is out of scope for that plan entirely. No conflict.
  - Evidence: `docs/plans/startup-loop-ideas-pipeline-redesign/plan.md` Non-goals section; all 7 tasks are Complete.

- Q: Where should the `IdeaClassification` record be persisted in advisory mode?
  - A: `docs/business-os/startup-loop/ideas/trial/classifications.jsonl` — a new append-only JSONL file within the designated trial artifact path. This matches the existing pattern (queue-state.json, telemetry.jsonl) and stays within the trial contract boundary. It must be added to the contract's Section 6 artifact paths table.
  - Evidence: lp-do-ideas-trial-contract.md Section 6.

- Q: Should classification fields be embedded in the dispatch packet (extending both schemas) or kept as a separate record?
  - A: Separate record. The schemas have `additionalProperties: false` on both v1 and v2. Embedding would require changing both schemas and both TypeScript interfaces with non-trivial regression risk during advisory phase. The policy says "generate classification/rank outputs without gating" — a separate record is the cleanest advisory-phase implementation. Schema embedding is the right move at enforcement time (Phase 4), not now.
  - Evidence: lp-do-ideas-dispatch.schema.json line 217; lp-do-ideas-dispatch.v2.schema.json line 238.

- Q: Is the existing coarse `priority` field (P1/P2/P3) redundant after implementing canonical classification?
  - A: Not in Phase 1. It drives `planNextDispatches()` scheduling and `ScheduledDispatch.priority`. During advisory phase, the canonical `effective_priority_rank` exists only on the classification record and does not affect scheduling. The coarse field remains the scheduling input. Alignment between the two is a Phase 4 concern.
  - Evidence: lp-do-ideas-trial-queue.ts lines 54–61, 307–318.

- Q: Does `lp-do-ideas-persistence.ts` need to be extended for classification record persistence?
  - A: Needs confirmation by reading lp-do-ideas-persistence.ts. Based on the trial contract Section 8.1, the persistence adapter is listed as Complete for queue-state and telemetry. Whether it handles arbitrary JSONL append-write is unknown without reading the file. The build task should read it and either extend it or write a minimal JSONL append helper directly in the classifier module.
  - Basis: This is resolvable by the build agent without operator input. Listed here as a confirmed action item for the plan.

- Q: Should the SKILL.md be updated as part of this plan or separately?
  - A: As part of this plan. The SKILL.md governs how the AI populates evidence fields, which directly affects whether classifications will have evidence or get auto-demoted. Without SKILL.md guidance on evidence field population, every classification will trigger auto-demotion (no incident_id, no risk_vector, etc.) and the advisory output will be uniformly low-signal. This is not a separate plan; it is integral to the advisory phase being useful.
  - Basis: Policy Section 12.1 says advisory phase generates classification outputs; those outputs need meaningful signal to calibrate.

- Q: Should the dispatch packet's `trigger` field for `operator_idea` affect classifier behavior?
  - A: Yes, minimally. For `operator_idea` dispatches, `artifact_id` and `after_sha` are absent by design. The classifier should accept nullable `artifact_id` and not require it. The classification schema Section 4.1 requires `source_path` and `source_excerpt` — for operator_idea, these come from `evidence_refs` and `area_anchor` respectively. The classifier input type must handle both `artifact_delta` and `operator_idea` trigger types.
  - Evidence: lp-do-ideas-trial.ts TrialDispatchPacketV2 line 217 (`trigger: "artifact_delta" | "operator_idea"`); lp-do-ideas-dispatch.schema.json trigger enum.

### Open (Operator Input Required)

- Q: What is the U0 leakage threshold for automatic U0 urgency admission (policy Section 8.1, third condition)?
  - Why operator input is required: The policy says `leakage_estimate_value exceeds published threshold` but does not define the threshold value. This is a business calibration decision.
  - Decision impacted: Whether an idea with a leakage estimate can be auto-admitted as U0 without a live incident or near-term deadline.
  - Decision owner: Operator (Peter)
  - Default assumption (if any) + risk: Default assumption = no leakage threshold is defined yet; all U0 admissions rely only on `incident_id` or `deadline_date` until the operator sets a threshold. This is safe for advisory phase — U0 will be restricted to the most clearly urgent ideas. Risk: low, advisory mode only.

## Confidence Inputs

- Implementation: 88%
  - Evidence: All entry points and modules identified. Gap analysis is complete. The new classifier module is purely additive with no changes to existing packet validation or routing logic. The `additionalProperties: false` constraint is confirmed — separate record approach avoids schema regression risk. Test seams are clear.
  - To reach 90%: Confirm `lp-do-ideas-persistence.ts` structure (whether to extend it or write a JSONL helper directly in the classifier).

- Approach: 85%
  - Evidence: Separate classification record vs. packet embedding is architecturally sound and aligned with advisory-phase constraints. Option A (new module) is clearly preferable to Options B and C.
  - To reach 90%: Confirm the SKILL.md update scope with the operator — specifically, whether the AI should prompt the operator for evidence fields at intake, or attempt to infer them from the idea description.

- Impact: 90%
  - Evidence: The policy is externally reviewed and close-to-approved. Advisory phase implementation is low-risk (no enforcement, no blocking). The output — a `classifications.jsonl` file alongside existing telemetry — directly enables the calibration phase. The policy's rollout plan is unambiguous about what Phase 1 delivers.

- Delivery-Readiness: 87%
  - Evidence: All required file locations identified, architecture decided, test strategy defined. One open question (leakage threshold) does not block Phase 1 implementation — the default assumption is safe.
  - To reach 90%: Read `lp-do-ideas-persistence.ts` to confirm whether JSONL append is already supported.

- Testability: 92%
  - Evidence: The classifier is a pure function with an injectable clock. All 8 decision tree branches, all urgency gates, and all auto-demotion paths are directly unit-testable. No external dependencies.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Schema `additionalProperties: false` causes test failures if classification fields are accidentally added to dispatch packets | Low | Medium | Architecture decision (separate record) eliminates this risk entirely. Confirm in TASK-01 that no classification fields are added to packet interfaces |
| SKILL.md update scope is larger than expected (if evidence field population requires a new intake UX) | Low | Low | Advisory phase accepts auto-demotion; SKILL.md update is bounded to adding evidence field guidance to the existing intake flow. Even if SKILL.md is not updated, the classifier works — everything just auto-demotes. |
| `lp-do-ideas-persistence.ts` has a complex interface that requires significant extension | Low | Low | Pure JSONL append can be implemented as a 10-line helper directly in the classifier module if the persistence adapter is not a good fit |
| Classification record format drifts from canonical policy between advisory and enforcement phases | Medium | Medium | Mitigation: the `IdeaClassification` TypeScript interface is the source of truth from day 1. The policy document is a specification input; the interface is the enforcement artifact |
| The existing coarse `priority` field on dispatch packets becomes inconsistent with canonical `priority_tier` | Low | Low | Expected and acceptable in advisory phase. The relationship between the two fields should be documented in the new classifier module's JSDoc |

## Planning Constraints & Notes

- Must-follow patterns:
  - Pure function module: no file I/O inside `lp-do-ideas-classifier.ts`; injectable clock for `classified_at`
  - Append-only telemetry pattern (existing pattern): `classifications.jsonl` is append-only
  - Trial contract write-path restriction: new artifact path must be added to contract Section 6 before the classifier writes to it
  - `additionalProperties: false` on both JSON schemas: do NOT add new fields to dispatch packet schemas in Phase 1; use the separate record pattern
- Rollout/rollback expectations:
  - Advisory phase: no enforcement gates; rollback is removing the classifier call from the orchestrator and deleting `classifications.jsonl`
  - The classifier module is purely additive; reverting it does not affect existing pipeline behavior
- Observability expectations:
  - `classifications.jsonl` is the primary observable output
  - Tier distribution and auto-demotion rate are readable directly from the JSONL file
  - No new HTML report needed for advisory phase; the file is sufficient for calibration

## Suggested Task Seeds (Non-binding)

- TASK-01 (S): Define `IdeaClassification`, `IdeaClassificationInput` TypeScript interfaces in `lp-do-ideas-trial.ts` (or a new `lp-do-ideas-classifier-types.ts` file); define all tier, urgency, effort, and reason_code union types from the canonical policy
- TASK-02 (M): Implement `lp-do-ideas-classifier.ts` — pure classifier module with: `classifyIdea()` entry point, 8-tier decision tree, urgency admission rules (U0/U1/U2/U3), auto-demotion, `effective_priority_rank` computation, prerequisite inheritance, anti-gaming field population (`classified_by`, `classified_at`)
- TASK-03 (M): Write `__tests__/lp-do-ideas-classifier.test.ts` — full coverage of all decision tree branches, urgency gates, auto-demotion paths, and rank computation
- TASK-04 (S): Wire classifier into `lp-do-ideas-trial.ts` orchestrator — call `classifyIdea()` after packet emission; attach classification record to orchestrator result
- TASK-05 (S): Add `classifications.jsonl` artifact path to trial contract Section 6; implement JSONL append persistence (extend `lp-do-ideas-persistence.ts` or add helper)
- TASK-06 (S): Update `/lp-do-ideas` SKILL.md to guide evidence field population at intake (incident_id, deadline_date, risk_vector, funnel_step, etc.) when operator context provides them

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `scripts/src/startup-loop/lp-do-ideas-classifier.ts` present and exports `classifyIdea()`
  - `scripts/src/startup-loop/__tests__/lp-do-ideas-classifier.test.ts` passes — all decision tree branches, urgency gates, auto-demotion paths covered
  - `docs/business-os/startup-loop/ideas/trial/classifications.jsonl` created (may be empty at rest)
  - `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md` Section 6 updated with `classifications.jsonl` entry
  - `.claude/skills/lp-do-ideas/SKILL.md` updated with evidence field guidance
  - `pnpm typecheck && pnpm lint` passes
- Post-delivery measurement plan:
  - Run `/lp-do-ideas` on the next operator idea dispatch; confirm `classifications.jsonl` receives a new record
  - Inspect tier distribution over the first 5–10 classifications to confirm auto-demotion is firing correctly for ideas lacking evidence fields

## Evidence Gap Review

### Gaps Addressed

- Confirmed `additionalProperties: false` constraint on both JSON schemas — drives the separate-record architecture decision
- Confirmed the coarse `priority` field is hardcoded to `"P2"` (lp-do-ideas-trial.ts line 918) — confirms the gap is complete
- Confirmed `startup-loop-ideas-pipeline-redesign` is fully complete and non-conflicting
- Confirmed no classification logic exists anywhere in `scripts/src/startup-loop/` (the `reason_code` occurrences in bottleneck-detector.ts are unrelated — they refer to stage-blocking reasons)
- Confirmed the `operator_idea` trigger type requires nullable artifact fields in the classifier input

### Confidence Adjustments

- Implementation score raised from initial estimate of 80% to 88% after confirming the additive nature of the change and the separate-record approach
- Testability score is 92% — pure function with no I/O is maximally testable

### Remaining Assumptions

- `lp-do-ideas-persistence.ts` supports or can be extended for JSONL append without significant rework (low risk given the existing telemetry.jsonl pattern)
- The U0 leakage threshold will remain undefined for Phase 1 (open question above); this is safe for advisory mode

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None — the leakage threshold open question does not block Phase 1 planning or implementation
- Recommended next step: `/lp-do-plan reflection-prioritization-policy-implementation --auto`
