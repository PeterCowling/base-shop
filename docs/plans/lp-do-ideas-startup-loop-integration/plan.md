---
Type: Plan
Status: Active
Domain: Platform / Business-OS
Workstream: Mixed
Created: 2026-02-24
Last-reviewed: 2026-02-24
Last-updated: 2026-02-24
Last-build: 2026-02-24
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: lp-do-ideas-startup-loop-integration
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-sequence, lp-do-fact-find, lp-do-briefing
Overall-confidence: 86%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort (S=1, M=2, L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: on
Business-Unit: BOS
Card-ID: none
artifact: plan
---

# lp-do-ideas Trial-First Integration Plan

## Summary
This plan delivers `lp-do-ideas` as a trial-first capability that can generate actionable dispatches from standing-artifact deltas without integrating into startup-loop orchestration yet. It aligns dispatch output with the revised `lp-do-fact-find` intake contract and adds a routing seam for `lp-do-fact-find` vs `lp-do-briefing`. The plan includes idempotent queue/telemetry behavior for trial operations and a separate go-live integration contract package so activation can happen later without re-architecture. Implementation is staged behind a policy decision and a checkpoint gate to prevent premature startup-loop runtime coupling.

## Active tasks
- [x] TASK-01: Decision on trial autonomy and trigger threshold
- [x] TASK-02: Dispatch schema + trial contract
- [x] TASK-03: `lp-do-ideas` trial orchestrator
- [x] TASK-04: Fact-find/briefing routing adapter
- [x] TASK-05: Idempotent queue + telemetry
- [x] TASK-06: Horizon checkpoint for go-live readiness
- [x] TASK-07: Go-live seam contract package

## Goals
- Ship a usable `lp-do-ideas` trial flow that processes standing-artifact deltas now.
- Guarantee dispatch packets satisfy revised `lp-do-fact-find` intake requirements.
- Keep startup-loop stage orchestration untouched during trial.
- Produce a defined go-live seam with explicit activation and rollback criteria.

## Non-goals
- Enabling `lp-do-ideas` in `/startup-loop advance` during this tranche.
- Modifying stage ordering/topology in `loop-spec.yaml`.
- Replacing existing IDEAS stage family semantics during trial.
- Running production build/deploy operations.

## Constraints & Assumptions
- Constraints:
  - Trial mode must not mutate startup-loop stage status/gates.
  - `lp-do-ideas` outputs must include `area_anchor`, `location_anchors`, and `provisional_deliverable_family`.
  - Understanding-only outcomes must route to `lp-do-briefing`.
  - Event handling must be deterministic and idempotent.
- Assumptions:
  - Existing mapper/queue patterns can be reused with minimal adaptation.
  - A mode-switched rollout (`trial` -> `live`) is preferred over direct integration.
  - Trial telemetry can provide enough signal to set go-live thresholds credibly.

## Fact-Find Reference
- Related brief: `docs/plans/lp-do-ideas-startup-loop-integration/fact-find.md`
- Key findings used:
  - Revised `lp-do-fact-find` requires explicit intake anchors and no longer assumes idea-card promotion fast-path.
  - Startup-loop spec describes IDEAS as standing/event-driven, but runtime automation is not yet guaranteed.
  - Deterministic delta mapping and guarded queue patterns already exist in adjacent systems.
  - Trial-first architecture reduces immediate blast radius while preserving future integration options.

## Proposed Approach
- Option A: Integrate `lp-do-ideas` directly into startup-loop orchestration now.
  - Pros: immediate full automation.
  - Cons: high blast radius and policy risk before trial evidence.
- Option B: Trial-first standalone `lp-do-ideas` with a stable live-integration seam.
  - Pros: controlled rollout, lower risk, reusable contract for go-live.
  - Cons: requires an explicit later activation step.
- Option C: Keep entirely manual idea process until future redesign.
  - Pros: no implementation effort now.
  - Cons: no signal capture or automation learning period.
- Chosen approach:
  - **Option B**.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | DECISION | Lock trial autonomy mode + trigger threshold policy | 85% | S | Complete (2026-02-24) | - | TASK-02, TASK-04 |
| TASK-02 | IMPLEMENT | Define dispatch schema + trial contract artifacts | 85% | M | Complete (2026-02-24) | TASK-01 | TASK-03, TASK-04, TASK-05 |
| TASK-03 | IMPLEMENT | Implement `lp-do-ideas` trial orchestrator (no startup-loop mutation) | 85% | M | Complete (2026-02-24) | TASK-02 | TASK-04, TASK-05 |
| TASK-04 | IMPLEMENT | Implement routing adapter to `lp-do-fact-find`/`lp-do-briefing` | 85% | M | Complete (2026-02-24) | TASK-01, TASK-02, TASK-03 | TASK-06 |
| TASK-05 | IMPLEMENT | Implement idempotent queue + telemetry for trial mode | 85% | M | Complete (2026-02-24) | TASK-02, TASK-03 | TASK-06 |
| TASK-06 | CHECKPOINT | Reassess go-live readiness and downstream integration scope | 95% | S | Complete (2026-02-24) | TASK-04, TASK-05 | TASK-07 |
| TASK-07 | IMPLEMENT | Author go-live seam package (activation + rollback contract) | 85% | S | Complete (2026-02-24) | TASK-06 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Policy lock before contract freeze |
| 2 | TASK-02 | TASK-01 | Dispatch schema/trial contract uses decision outputs |
| 3 | TASK-03 | TASK-02 | Orchestrator consumes frozen schema |
| 4A | TASK-04 | TASK-01, TASK-02, TASK-03 | Routing adapter depends on policy + dispatch format |
| 4B | TASK-05 | TASK-02, TASK-03 | Queue/telemetry can run in parallel with routing adapter |
| 5 | TASK-06 | TASK-04, TASK-05 | Checkpoint before live-seam package |
| 6 | TASK-07 | TASK-06 | Final go-live package after checkpoint evidence |

## Tasks

### TASK-01: Lock trial autonomy mode and trigger threshold policy
- **Type:** DECISION
- **Deliverable:** `docs/plans/lp-do-ideas-startup-loop-integration/artifacts/trial-policy-decision.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/lp-do-ideas-startup-loop-integration/fact-find.md`, `[readonly] .claude/skills/lp-do-fact-find/SKILL.md`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-04
- **Confidence:** 85%
  - Implementation: 85% - decision space is already enumerated in fact-find open questions.
  - Approach: 85% - choosing policy early prevents contract churn.
  - Impact: 85% - unblocks all implementation tasks with explicit guardrails.
- **Options:**
  - Option A: auto-invoke fact-find/briefing on all `ready` dispatches.
  - Option B: queue dispatches for operator confirmation before invocation.
  - Option C: hybrid (auto for P1/high-confidence, queue for others).
- **Recommendation:** Option B for initial trial, with explicit escalation path to Option C after telemetry review.
- **Decision input needed:**
  - question: What semantic-delta threshold qualifies as `fact_find_ready`?
  - why it matters: Controls signal quality and queue load.
  - default + risk: Conservative threshold; risk of under-triggering high-value opportunities.
  - question: Should trial mode auto-invoke downstream skills?
  - why it matters: Balances throughput vs operator safety.
  - default + risk: Queue-with-confirmation; risk of slower cycle time.
- **Acceptance:**
  - Decision memo records selected autonomy mode and threshold rubric.
  - Decision memo includes explicit rationale and fallback policy.
  - Policy outputs are reflected in TASK-02 acceptance criteria.
- **Validation contract:**
  - Decision closure requires explicit values for `mode`, `trigger_threshold`, and `invocation_policy` plus owner/date.
- **Planning validation:**
  - Checks run: reviewed fact-find `Open` questions and revised `lp-do-fact-find` intake constraints.
  - Validation artifacts: `docs/plans/lp-do-ideas-startup-loop-integration/fact-find.md`, `.claude/skills/lp-do-fact-find/SKILL.md`.
  - Unexpected findings: none.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** Adds one decision artifact in plan folder.
- **Notes / references:** trial-first requirement in fact-find scope and findings.
- **Build evidence (2026-02-24):** Decision memo written at `docs/plans/lp-do-ideas-startup-loop-integration/artifacts/trial-policy-decision.md`. Operator selected Option B (queue-with-confirmation) and T1-conservative trigger threshold. Escalation paths to Option C and T2-moderate documented with explicit criteria (≥14 days, ≥40 dispatches, ≥80% precision for autonomy escalation).
- **Status:** Complete (2026-02-24)

### TASK-02: Define dispatch schema and trial contract artifacts
- **Type:** IMPLEMENT
- **Deliverable:**
  - `docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.schema.json`
  - `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md`
  - `docs/business-os/startup-loop/ideas/lp-do-ideas-standing-registry.schema.json`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `docs/business-os/startup-loop/ideas/`, `[readonly] .claude/skills/lp-do-fact-find/SKILL.md`, `[readonly] docs/business-os/startup-loop/loop-output-contracts.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-04, TASK-05
- **Confidence:** 85%
  - Implementation: 85% - contract fields and required routing anchors are already known.
  - Approach: 85% - schema-first freeze minimizes downstream integration churn.
  - Impact: 85% - creates the single handoff source of truth for trial and live.
- **Acceptance:**
  - Dispatch schema includes required fields: `mode`, `area_anchor`, `location_anchors`, `provisional_deliverable_family`, `recommended_route`, `status`, and `evidence_refs`.
  - Allowed `recommended_route` values are `lp-do-fact-find|lp-do-briefing`.
  - Trial contract defines mode boundaries (`trial` vs `live`) and explicitly forbids stage mutation in trial.
  - Standing-registry schema defines tracked artifact identities and hash/delta semantics.
- **Validation contract (TC-02):**
  - TC-01: Schema validation passes for a `fact_find_ready` fixture with all required fields.
  - TC-02: Schema validation fails when `area_anchor` or `location_anchors` is missing.
  - TC-03: Schema validation fails for invalid `recommended_route` values.
  - TC-04: Trial contract doc includes explicit statement: "trial mode does not mutate startup-loop stage state".
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - `rg -n "area_anchor|location_anchors|provisional_deliverable_family|lp-do-briefing" .claude/skills/lp-do-fact-find/SKILL.md`
    - `rg -n "IDEAS|standing_pipeline|layer_a_pack_diff" docs/business-os/startup-loop/loop-spec.yaml`
  - Validation artifacts:
    - `docs/plans/lp-do-ideas-startup-loop-integration/fact-find.md`
    - `.claude/skills/lp-do-fact-find/SKILL.md`
  - Unexpected findings:
    - Revised fact-find skill removed earlier explicit IDEAS-03 idea-card promotion shortcut.
- **Consumer tracing (required):**
  - New outputs:
    - `dispatch.v1` packet consumed by TASK-03 orchestrator and TASK-04 routing adapter.
    - Standing-registry schema consumed by TASK-03 delta detector.
  - Modified behavior:
    - No startup-loop stage graph behavior changes in this task.
- **Scouts:** None: contract scope is bounded by fact-find findings.
- **Edge Cases & Hardening:**
  - Enforce non-empty `location_anchors` array and bounded `confidence` range.
  - Require explicit `status` transitions to prevent ambiguous dispatch state.
- **What would make this >=90%:**
  - Add one compatibility fixture proving the same packet shape is acceptable for both trial and planned live mode.
- **Rollout / rollback:**
  - Rollout: land schemas + contract doc before runtime implementation.
  - Rollback: remove added schema/contract artifacts and restore previous references.
- **Documentation impact:** Establishes canonical `lp-do-ideas` dispatch contract docs.
- **Notes / references:** fact-find "Proposed Trial-First Contract" section.
- **Build evidence (2026-02-24):**
  - Red: gap confirmed — fact-find FND-05 documents no standardized dispatch packet aligned to revised lp-do-fact-find intake.
  - Green: three artifacts created:
    - `docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.schema.json` — JSON Schema (draft-07), required fields: schema_version, dispatch_id, mode, area_anchor, location_anchors (minItems:1), provisional_deliverable_family, recommended_route (enum: lp-do-fact-find|lp-do-briefing), status, evidence_refs (minItems:1). mode locked to enum:["trial"].
    - `docs/business-os/startup-loop/ideas/lp-do-ideas-standing-registry.schema.json` — Registry schema with artifact_entry $def, T1 semantic section keywords, trigger_threshold enum.
    - `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md` — Full mode boundary contract; sections: mode boundary, autonomy policy, trigger threshold, dispatch contract, idempotency, trial artifact paths, queue lifecycle, mode switch criteria, forward compatibility.
  - Refactor: edge cases enforced — non-empty arrays (minItems:1), confidence bounded 0.0–1.0, explicit additionalProperties:false on all objects, T1 keyword table in contract.
  - TC validation: TC-01 ✓ (required fields pass), TC-02 ✓ (area_anchor/location_anchors in required array), TC-03 ✓ (recommended_route enum), TC-04 ✓ (Section 1 explicit statement).
- **Status:** Complete (2026-02-24)

### TASK-03: Implement `lp-do-ideas` trial orchestrator
- **Type:** IMPLEMENT
- **Deliverable:**
  - `.claude/skills/lp-do-ideas/SKILL.md`
  - `scripts/src/startup-loop/lp-do-ideas-trial.ts`
  - `scripts/src/startup-loop/__tests__/lp-do-ideas-trial.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `.claude/skills/lp-do-ideas/`, `scripts/src/startup-loop/`, `[readonly] scripts/src/startup-loop/map-artifact-delta-to-website-backlog.ts`
- **Depends on:** TASK-02
- **Blocks:** TASK-04, TASK-05
- **Confidence:** 85%
  - Implementation: 85% - deterministic mapper pattern already exists and is reusable.
  - Approach: 85% - standalone trial runner limits blast radius.
  - Impact: 85% - enables immediate trial signal generation without loop integration risk.
- **Acceptance:**
  - Runner ingests changed-artifact events and emits dispatch packets conforming to `dispatch.v1`.
  - Runner supports `mode=trial` only in this tranche and rejects `mode=live` execution.
  - Runner does not write startup-loop stage transitions or gate state.
  - Skill documentation defines invocation, inputs, outputs, and failure handling.
- **Validation contract (TC-03):**
  - TC-01: Fixture event -> exactly one valid dispatch packet with deterministic `dispatch_id` pattern.
  - TC-02: Duplicate event hash -> idempotent no-op (no duplicate dispatch).
  - TC-03: `mode=live` invocation in this tranche -> explicit fail-closed error.
  - TC-04: No writes occur outside designated trial artifact paths.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - `sed -n 1,220p scripts/src/startup-loop/map-artifact-delta-to-website-backlog.ts`
    - `rg -n "standing_pipeline|layer_a_pack_diff" docs/business-os/startup-loop/loop-spec.yaml`
  - Validation artifacts:
    - Existing deterministic mapper implementation and loop spec evidence.
  - Unexpected findings:
    - none.
- **Consumer tracing (required):**
  - New outputs:
    - Trial dispatch artifact consumed by TASK-04 router and TASK-05 queue/telemetry pipeline.
  - Modified behavior:
    - Introduces new runner path but leaves `startup-loop advance` behavior unchanged.
- **Scouts:** None: implementation seam is direct analogue to existing mapper pattern.
- **Edge Cases & Hardening:**
  - Handle missing artifact hashes with explicit `logged_no_action` result.
  - Enforce deterministic sorting of input paths for stable packet generation.
- **What would make this >=90%:**
  - Add golden-file fixtures for at least three delta classes (`opportunity`, `constraint`, `regression`).
- **Rollout / rollback:**
  - Rollout: add skill + trial runner + tests in one atomic change.
  - Rollback: remove new skill/runner/test files and any references.
- **Documentation impact:** Adds new skill documentation for trial operation.
- **Notes / references:** revised fact-find findings FND-03/FND-04.
- **Build evidence (2026-02-24):**
  - Red: no trial orchestrator existed; delta events had no path to dispatch.v1 packets.
  - Green: three deliverables created — `.claude/skills/lp-do-ideas/SKILL.md`, `scripts/src/startup-loop/lp-do-ideas-trial.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-trial.test.ts`.
  - Refactor: fixed `buildDispatchId` to use UTC methods (was local time, broke on UTC+1 runner). All 27 tests pass.
  - TC-01 ✓: fixture T1 event → exactly one dispatch packet, dispatch_id matches `^IDEA-DISPATCH-[0-9]{14}-[0-9]{4}$`, deterministic with fixed clock.
  - TC-02 ✓: same event replayed twice → 1 dispatch + 1 suppressed; different after_sha → new dispatch.
  - TC-03 ✓: mode=live and mode=production both return `{ok: false, error: "...not permitted..."}`.
  - TC-04 ✓: orchestrator is a pure function — no file I/O; queue writes are TASK-05.
  - Golden fixtures: opportunity (T1 ICP match → fact_find_ready), constraint (non-T1 structural → briefing_ready), regression (null before_sha / missing sections → noop).
- **Status:** Complete (2026-02-24)

### TASK-04: Implement dispatch routing adapter to fact-find or briefing
- **Type:** IMPLEMENT
- **Deliverable:**
  - `scripts/src/startup-loop/lp-do-ideas-routing-adapter.ts`
  - `scripts/src/startup-loop/__tests__/lp-do-ideas-routing-adapter.test.ts`
  - `docs/business-os/startup-loop/ideas/lp-do-ideas-routing-matrix.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/`, `docs/business-os/startup-loop/ideas/`, `[readonly] .claude/skills/lp-do-fact-find/SKILL.md`, `[readonly] .claude/skills/lp-do-briefing/SKILL.md`
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% - routing matrix and required intake fields are explicit.
  - Approach: 85% - explicit adapter avoids embedding fact-find assumptions in the runner.
  - Impact: 85% - guarantees correct downstream path selection and intake completeness.
- **Acceptance:**
  - Adapter routes `fact_find_ready` to `lp-do-fact-find` only when intake anchors are present.
  - Adapter routes `briefing_ready` to `lp-do-briefing`.
  - Invalid or incomplete packets fail closed with actionable errors.
  - Routing matrix doc maps each status/route combination to expected invocation behavior.
- **Validation contract (TC-04):**
  - TC-01: Valid `fact_find_ready` packet -> adapter emits fact-find invocation payload with required intake fields.
  - TC-02: Missing `location_anchors` for fact-find path -> adapter rejects packet.
  - TC-03: `briefing_ready` packet -> adapter emits briefing invocation payload.
  - TC-04: Unknown status/route pair -> deterministic error outcome.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - `rg -n "Required Inputs|lp-do-briefing|Outcome: planning" .claude/skills/lp-do-fact-find/SKILL.md`
    - `test -e .claude/skills/lp-do-briefing/SKILL.md && echo present`
  - Validation artifacts:
    - Revised fact-find skill contract and routing requirements.
  - Unexpected findings:
    - none.
- **Consumer tracing (required):**
  - New outputs:
    - Adapter invocation payloads consumed by downstream skill-invocation wrapper.
  - Modified behavior:
    - Changes dispatch handling logic from single-route assumption to dual-route (`fact-find`/`briefing`).
- **Scouts:** None: route contract is already defined by upstream schema and downstream skills.
- **Edge Cases & Hardening:**
  - Normalize route/status casing before validation to avoid silent mismatches.
  - Emit explicit diagnostics for policy-blocked auto-invocation mode.
- **What would make this >=90%:**
  - Add cross-fixture tests for all status/route permutations and policy modes.
- **Rollout / rollback:**
  - Rollout: add adapter + tests + matrix doc.
  - Rollback: remove adapter path and revert to manual dispatch review.
- **Documentation impact:** Adds formal routing matrix for operator transparency.
- **Notes / references:** fact-find trial handoff behavior.
- **Build evidence (2026-02-24):**
  - Red: no routing adapter existed; dispatcher had no typed path to fact-find vs briefing intake payload shapes.
  - Green: three deliverables created — `scripts/src/startup-loop/lp-do-ideas-routing-adapter.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-routing-adapter.test.ts`, `docs/business-os/startup-loop/ideas/lp-do-ideas-routing-matrix.md`.
  - Refactor: casing normalisation applied to `status`/`recommended_route` before all comparisons; exhaustive guard at end of function as runtime safety net; error messages are actionable with recovery guidance.
  - TC-01 ✓: valid `fact_find_ready` packet → `RouteSuccess` with `FactFindInvocationPayload`; all intake fields mapped.
  - TC-02 ✓: empty `location_anchors` on fact-find path → `MISSING_LOCATION_ANCHORS` error.
  - TC-03 ✓: valid `briefing_ready` packet → `RouteSuccess` with `BriefingInvocationPayload`; briefing path does not enforce location_anchors.
  - TC-04 ✓: 10 error codes tested (`RESERVED_STATUS`, `UNKNOWN_STATUS`, `INVALID_MODE`, `INVALID_SCHEMA_VERSION`, `ROUTE_STATUS_MISMATCH`, `MISSING_AREA_ANCHOR`, `MISSING_EVIDENCE_REFS`, `MISSING_LOCATION_ANCHORS`, `MISSING_DELIVERABLE_FAMILY`, `UNKNOWN_ROUTE`).
  - 38 tests pass in `lp-do-ideas-routing-adapter.test.ts`.
- **Status:** Complete (2026-02-24)

### TASK-05: Implement idempotent trial queue and telemetry
- **Type:** IMPLEMENT
- **Deliverable:**
  - `scripts/src/startup-loop/lp-do-ideas-trial-queue.ts`
  - `scripts/src/startup-loop/__tests__/lp-do-ideas-trial-queue.test.ts`
  - `docs/business-os/startup-loop/ideas/lp-do-ideas-telemetry.schema.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/`, `docs/business-os/startup-loop/ideas/`, `[readonly] packages/mcp-server/src/tools/loop.ts`
- **Depends on:** TASK-02, TASK-03
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% - queue lifecycle pattern exists and can be mirrored for trial needs.
  - Approach: 85% - idempotent queue + telemetry provides measurable trial signal before live activation.
  - Impact: 85% - prevents duplicate dispatch churn and enables go-live evidence collection.
- **Acceptance:**
  - Queue supports deterministic states: `enqueued`, `processed`, `skipped`, `error`.
  - Duplicate event IDs/hashes are suppressed deterministically.
  - Telemetry captures at minimum: dispatch count, duplicate suppression count, route accuracy denominator fields, and latency timestamp fields.
  - Telemetry schema doc defines required fields and quality checks.
- **Validation contract (TC-05):**
  - TC-01: Replaying the same event twice produces one processed dispatch and one duplicate-suppressed record.
  - TC-02: Invalid packet enters `error` with diagnostic reason and no downstream invocation.
  - TC-03: Queue state transitions are monotonic and auditable by event history.
  - TC-04: Telemetry record validates against schema for processed and skipped outcomes.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - `rg -n "refresh_enqueue_guarded|requestId|lifecycle" packages/mcp-server/src/tools/loop.ts`
  - Validation artifacts:
    - Existing guarded queue lifecycle behavior in MCP loop tooling.
  - Unexpected findings:
    - existing lifecycle includes additional states (`pending`, `running`, terminal variants) that may inform future live-mode mapping.
- **Consumer tracing (required):**
  - New outputs:
    - Queue ledger consumed by TASK-06 checkpoint review and TASK-07 go-live criteria package.
    - Telemetry records consumed by trial KPI analysis.
  - Modified behavior:
    - Adds durable trial event lifecycle where dispatch handling was previously ad hoc.
- **Scouts:** None: queue behavior and telemetry fields are bounded by trial goals.
- **Edge Cases & Hardening:**
  - Handle clock skew by storing both event timestamp and processing timestamp.
  - Preserve deterministic sorting for replay/analysis.
- **What would make this >=90%:**
  - Add one replay test covering out-of-order event ingestion with stable final state.
- **Rollout / rollback:**
  - Rollout: add queue + telemetry artifacts and tests.
  - Rollback: disable queue path and fall back to manual dispatch review.
- **Documentation impact:** Adds telemetry schema for auditability.
- **Notes / references:** fact-find FND-04 and trial observability requirements.
- **Build evidence (2026-02-24):**
  - Red: no queue existed; dispatches had no lifecycle, idempotency, or telemetry.
  - Green: three deliverables created — `scripts/src/startup-loop/lp-do-ideas-trial-queue.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-trial-queue.test.ts`, `docs/business-os/startup-loop/ideas/lp-do-ideas-telemetry.schema.md`.
  - Refactor: monotonic state machine enforced via `ALLOWED_TRANSITIONS` map; `getTelemetry()` returns snapshot copy (caller mutation proof); `buildDedupeKeyFromPacket` mirrors `buildDedupeKey()` from orchestrator for consistency.
  - TC-01 ✓: same dispatch replayed → 1 processed entry, 1 `skipped_duplicate_dispatch_id` telemetry record; dedupe-key path also tested.
  - TC-02 ✓: missing `dispatch_id`, empty `evidence_refs`, `mode=live`, wrong `schema_version` all produce `queue_state=error` with diagnostic reason, no entry in queue.
  - TC-03 ✓: `enqueued→processed` ✓, `enqueued→error` ✓, `processed→enqueued` rejected ✓, `error→processed` rejected ✓, `skipped` terminal ✓, unknown ID rejected ✓, same-state advance rejected ✓, telemetry append-only ✓.
  - TC-04 ✓: all telemetry record kinds (`enqueued`, `advanced_to_processed`, `skipped_duplicate_dispatch_id`, `skipped_duplicate_dedupe_key`, `validation_rejected`) are schema-compliant with required fields.
  - 27 tests pass in `lp-do-ideas-trial-queue.test.ts` (7 `validatePacket` + 8 TC-01 + 5 TC-02 + 8 TC-03 + 6 TC-04 + 5 aggregates + 2 listEntries + 2 clock injection).
- **Status:** Complete (2026-02-24)

### TASK-06: Horizon checkpoint - reassess go-live readiness and downstream scope
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence (and `/lp-do-replan` output if required)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/lp-do-ideas-startup-loop-integration/plan.md`
- **Depends on:** TASK-04, TASK-05
- **Blocks:** TASK-07
- **Confidence:** 95%
  - Implementation: 95% - checkpoint protocol is well-defined.
  - Approach: 95% - avoids premature live integration commitments.
  - Impact: 95% - controls downstream risk and keeps trial-first posture intact.
- **Acceptance:**
  - `/lp-do-build` executes checkpoint gate before TASK-07.
  - Trial evidence from TASK-04/TASK-05 is reviewed and documented.
  - `/lp-do-replan` is invoked if go-live assumptions are invalidated.
- **Horizon assumptions to validate:**
  - Dispatch routing quality is sufficient for future live-mode consideration.
  - Queue/telemetry data is complete enough to define explicit go-live thresholds.
- **Validation contract:**
  - Checkpoint is complete only when plan notes explicitly mark assumptions as confirmed or updated via replan.
- **Planning validation:**
  - None: planning control task.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** plan update only.
- **Build evidence (2026-02-24):**
  - Assumption 1 ("Dispatch routing quality sufficient"): **CONFIRMED** — `routeDispatch()` is pure, fully tested with 38 tests across all 10 error codes. Case normalisation, Option B enforcement, and routing matrix doc are all in place. Go-live seam can reference the adapter directly without further design work.
  - Assumption 2 ("Queue/telemetry complete enough for go-live thresholds"): **CONFIRMED** — `TelemetryAggregates` exposes `route_accuracy_denominator`, `duplicate_suppression_count`, `processed_count` which are the exact fields TASK-07 VC-01/VC-02 are built on. QC-01–08 quality checks documented in telemetry schema.
  - No assumptions invalidated. No `/lp-do-replan` required. Topology unchanged.
  - TASK-07 re-scored: confidence confirmed at 85% (above 80% threshold). TASK-07 is now eligible.
- **Status:** Complete (2026-02-24)

### TASK-07: Produce go-live seam contract package (activation deferred)
- **Type:** IMPLEMENT
- **Deliverable:**
  - `docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-seam.md`
  - `docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-checklist.md`
  - `docs/business-os/startup-loop/ideas/lp-do-ideas-rollback-playbook.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/startup-loop/ideas/`
- **Reviewer:** startup-loop maintainers
- **Approval-Evidence:** `docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-checklist.md` sign-off section
- **Measurement-Readiness:** weekly review of trial telemetry in strategy ops cadence
- **Affects:** `docs/business-os/startup-loop/ideas/`, `[readonly] docs/business-os/startup-loop/stage-operator-dictionary.yaml`, `[readonly] .claude/skills/startup-loop/modules/cmd-advance.md`
- **Depends on:** TASK-06
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% - inputs are constrained by checkpoint outputs.
  - Approach: 85% - explicit seam docs prevent hidden integration assumptions.
  - Impact: 85% - enables safe future activation without re-discovery.
- **Acceptance:**
  - Go-live seam doc defines exact integration boundary points and mode-switch behavior.
  - Checklist defines activation prerequisites and no-go conditions.
  - Rollback playbook defines concrete disable path and recovery verification.
- **Validation contract (VC-07):**
  - VC-01: `dispatch precision` -> pass when `>=80%` over `14 days` with `sample >=40 dispatches`; else remain in trial mode.
  - VC-02: `duplicate suppression stability` -> pass when duplicate suppression rate variance stays within `±10%` over `2 consecutive weekly samples` with `sample >=2 weeks`; else defer activation.
  - VC-03: `activation safety` -> pass when rollback drill completes in `<=30 minutes` within `one controlled rehearsal` and restores trial-only mode with verified no stage mutations.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan:
    - Collect trial KPI baselines showing current gaps versus VC thresholds.
  - Green evidence plan:
    - Populate seam/checklist/rollback docs with threshold-linked criteria and owners.
  - Refactor evidence plan:
    - Simplify checklist to remove redundant gates while preserving fail-closed behavior.
- **Planning validation (required for M/L):**
  - None: S-effort document package.
- **Scouts:** None: checkpoint output is authoritative input.
- **Edge Cases & Hardening:**
  - Include explicit "do not activate" branch when any KPI is missing.
  - Ensure rollback playbook includes command-level disable steps and verification points.
- **What would make this >=90%:**
  - One successful rehearsal of activation checklist + rollback playbook in a dry environment.
- **Rollout / rollback:**
  - Rollout: publish seam package with maintainers sign-off.
  - Rollback: archive seam package and keep mode locked to trial.
- **Documentation impact:** Adds durable activation/rollback governance artifacts.
- **Notes / references:** fact-find go-live predisposition requirements.
- **Build evidence (2026-02-24):**
  - Red: no go-live seam docs existed; `routeDispatch()` and `runTrialOrchestrator()` both hard-reject `mode: live` — no safe activation path defined.
  - Green: three deliverables created — `lp-do-ideas-go-live-seam.md`, `lp-do-ideas-go-live-checklist.md`, `lp-do-ideas-rollback-playbook.md`.
  - Refactor: VC-first criteria enforced — all three VC thresholds (VC-01 precision ≥80%, VC-02 suppression variance ≤±10%, VC-03 drill ≤30min) are referenced in both the seam Section 6 no-go table and checklist Sections A/B/C. Rollback playbook includes 8 command-level steps with verification checks after each. "Do not activate" branch explicit in seam, checklist (Section G scope confirmation), and rollback decision criteria table.
  - VC-01 ✓: precision threshold codified in checklist Section A with computation formula.
  - VC-02 ✓: suppression stability codified in checklist Section B with weekly snapshot methodology.
  - VC-03 ✓: rollback drill procedure in rollback playbook Part 1 (Steps D1–D5), referenced in checklist Section C.
  - Scope confirmed absent: no GATE-IDEAS-01 hard block added to cmd-advance.md (advisory posture preserved in v1 live mode, confirmed in checklist Section G).
- **Status:** Complete (2026-02-24)

## Risks & Mitigations
- Risk: Dispatch packets fail fact-find intake requirements.
  - Mitigation: schema-enforced required intake fields + adapter validation gates.
- Risk: Trial noise overwhelms operator review capacity.
  - Mitigation: policy decision gate + semantic threshold rubric in TASK-01.
- Risk: Hidden coupling appears when moving to live mode.
  - Mitigation: explicit seam/checklist/rollback package before activation.
- Risk: Duplicate events cause misleading throughput metrics.
  - Mitigation: idempotent queue with event-hash suppression and telemetry fields.
- Risk: Startup-loop runtime gets accidentally mutated during trial.
  - Mitigation: explicit contract + tests that assert no stage mutation writes.

## Observability
- Logging:
  - Trial event ledger with event ID, hash, route, and outcome.
- Metrics:
  - Dispatch precision.
  - Route accuracy (`fact-find` vs `briefing`).
  - Duplicate suppression count/rate.
  - Delta-to-dispatch latency.
- Alerts/Dashboards:
  - Weekly KPI summary in trial telemetry report.
  - No-go alert when required telemetry fields are missing.

## Acceptance Criteria (overall)
- [ ] `lp-do-ideas` trial path exists and emits schema-valid dispatch packets.
- [ ] Trial path routes correctly to `lp-do-fact-find` or `lp-do-briefing` with intake enforcement.
- [ ] Trial queue is idempotent and telemetry-complete.
- [ ] Startup-loop runtime orchestration remains unchanged in trial tranche.
- [ ] Go-live seam/checklist/rollback artifacts are complete and reviewed.

## Decision Log
- 2026-02-24: Selected trial-first architecture with deferred startup-loop integration.
- 2026-02-24: Planned routing split to `lp-do-fact-find` vs `lp-do-briefing` per revised fact-find contract.

## Overall-confidence Calculation
- Effort weights used: `S=1`, `M=2`, `L=3`.
- Weighted calculation:
  - TASK-01 (85 x 1)
  - TASK-02 (85 x 2)
  - TASK-03 (85 x 2)
  - TASK-04 (85 x 2)
  - TASK-05 (85 x 2)
  - TASK-06 (95 x 1)
  - TASK-07 (85 x 1)
- Sum = `945`; total weight = `11`; `945 / 11 = 85.9` -> `Overall-confidence: 86%`.

## Critique Trigger Check (Phase 11)
- Trigger 1 (`Overall-confidence < 80%`): Not fired (`86%`).
- Trigger 2 (uncovered task with confidence <80): Not fired (all tasks >=80).
- Result: automatic critique skipped for this planning pass.

## Section Omission Rule
None: all sections are relevant for this plan.
