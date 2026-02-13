---
Type: Plan
Status: Draft
Domain: Platform
Workstream: Business-OS
Created: 2026-02-13
Last-updated: 2026-02-13
Last-reviewed: 2026-02-13
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: growth-accounting-kernel
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: platform-infra
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-fact-find, /lp-plan, /lp-sequence
Overall-confidence: 81%
Confidence-Method: min(Implementation,Approach,Impact) — no novel algorithms, clear integration surface, startup-loop contract dependency
Business-OS-Integration: on
Business-Unit: PLAT
---

# Growth Accounting Kernel — Implementation Plan

## Summary

This plan implements Opportunity M from the Advanced Math Algorithms fact-find: a canonical growth accounting kernel that makes scale/hold/kill decisions explicit and auditable. Currently, growth metrics (CAC, CVR, AOV, LTV) appear scattered across forecast docs, weekly decision logs, and business plan artifacts, but there is no single runtime-authoritative growth ledger enforced as a decision gate.

The core deliverable is a per-business **growth ledger** following the AARRR funnel model (Acquisition → Activation → Revenue → Retention → Referral), with strict pass/fail thresholds at each stage and explicit scale/hold/kill guardrails. The immutable audit trail is the startup-loop event ledger/stage-result outputs; `growth-ledger.json` is a materialized latest snapshot rebuilt from those events if needed. This ledger becomes the canonical source of truth for growth decisioning in the startup loop, particularly at S10 (weekly decision loop) and as input to S3 (forecast recalibration).

Primary references:
- `docs/plans/advanced-math-algorithms-fact-find.md` (Opportunity M)
- `docs/business-os/startup-loop-workflow.user.md` (stage definitions, S10 decision contract)
- `docs/business-os/strategy/HEAD/plan.user.md` (outcome contracts, weekly guardrails)
- `docs/business-os/strategy/PET/italy-90-day-launch-forecast-v2.user.md` (week-2 recalibration gates)
- `apps/prime/src/lib/owner/businessScorecard.ts` (existing metric evaluation pattern)

## Goals

1. Define a canonical growth ledger schema following AARRR funnel stages with stage-level pass/fail thresholds.
2. Create per-business growth ledger artifacts that live alongside forecast/baseline artifacts in `data/shops/{shopId}/`.
3. Implement scale/hold/kill guardrail evaluation logic that consumes growth ledger state.
4. Integrate growth ledger updates into the startup loop control plane (S10 weekly decision loop).
5. Surface growth ledger state in business scorecard for operator visibility.

## Non-goals

1. Building a full analytics ingestion pipeline (tracking and raw ETL remain in existing systems; this plan adds a narrow metrics adapter contract only).
2. Multi-business aggregation or portfolio-level growth reporting (first cut is per-business only).
3. Predictive modeling or ML-based forecasting (this is descriptive accounting, not predictive).
4. Replacing existing KPI aggregator (businessScorecard.ts remains for operational health; growth ledger is for strategic decisioning).

## Constraints & Assumptions

- Constraints:
  - TypeScript-only implementation (no Python/Rust sidecars per compatibility constraint).
  - Must integrate with existing startup loop control plane patterns (event ledger, manifest updates, stage-result files).
  - Growth ledger updates must be deterministic and idempotent (same inputs → same state).
- Assumptions:
  - Growth metrics can be sourced from existing data stores through adapter implementations (GA4 exports, Cloudflare analytics, order data, forecast docs) without introducing new raw ETL in v1.
  - Weekly measurement cadence is sufficient for decisioning (no real-time alerting in first cut).
  - Per-business growth ledger is adequate during stabilization (multi-business rollups deferred).

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---|---|---|---|
| GAK-01 | DESIGN | Define growth ledger schema (AARRR stages + metrics + thresholds + status) | 88% | S | Pending | - | GAK-02, GAK-03, GAK-04 |
| GAK-02 | IMPLEMENT | Create per-business growth ledger file structure and versioning | 85% | S | Pending | GAK-01 | GAK-05, GAK-06 |
| GAK-03 | DESIGN | Define scale/hold/kill guardrail evaluation rules per funnel stage | 86% | M | Pending | GAK-01 | GAK-05 |
| GAK-04 | DESIGN | Map growth ledger to existing startup loop stages (S3/S10/forecast integration) | 84% | S | Pending | GAK-01 | GAK-05, GAK-07 |
| GAK-05 | IMPLEMENT | Implement growth ledger evaluation engine (pure function: ledger + thresholds → decision signal) | 82% | M | Pending | GAK-02, GAK-03, GAK-04 | GAK-06, GAK-07 |
| GAK-06 | IMPLEMENT | Implement growth ledger persistence (update/read API with idempotency guarantees) | 80% | M | Pending | GAK-02, GAK-05 | GAK-07 |
| GAK-07 | IMPLEMENT | Integrate growth ledger into S10 weekly decision loop control plane | 78% | M | Pending | GAK-04, GAK-05, GAK-06 | GAK-08 |
| GAK-08 | IMPLEMENT | Surface growth ledger state in business scorecard UI | 82% | S | Pending | GAK-07 | GAK-09 |
| GAK-09 | CHECKPOINT | Validate end-to-end with one business (HEAD or PET) dry-run | 80% | M | Pending | GAK-08 | - |

## Active Tasks

- `GAK-01` (DESIGN) — Unblocked, ready to start (Wave 1).
- `GAK-02`, `GAK-03`, `GAK-04` — Unblocked after GAK-01 (Wave 2, can run in parallel).
- `GAK-05` — Unblocked after GAK-02+03+04 (Wave 3).
- `GAK-06` — Unblocked after GAK-02+05 (Wave 3, parallel with GAK-05 after initial design done).
- `GAK-07` — Unblocked after GAK-04+05+06 (Wave 4).
- `GAK-08` — Unblocked after GAK-07 (Wave 5).
- `GAK-09` — Final validation (Wave 6).

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | GAK-01 | - | Schema design (AARRR stages, metrics, thresholds, status enum) |
| 2 | GAK-02, GAK-03, GAK-04 | GAK-01 | File structure, guardrail rules, startup-loop mapping can run in parallel |
| 3 | GAK-05, GAK-06 | GAK-02+03+04 | Evaluation engine and persistence can start in parallel after schema/rules complete |
| 4 | GAK-07 | GAK-04+05+06 | S10 integration after core engine and persistence ready |
| 5 | GAK-08 | GAK-07 | UI surface after control plane integration |
| 6 | GAK-09 | GAK-08 | End-to-end validation |

## Tasks

### GAK-01: Define growth ledger schema

- **Type:** DESIGN
- **Deliverable:** business-artifact (schema document + TypeScript types).
- **Execution-Skill:** /lp-build
- **Confidence:** 88%
- **Scope:**
  - Define AARRR funnel stage model: Acquisition, Activation, Revenue, Retention, Referral, including `stage_policy: { blocking_mode: "always"|"after_valid"|"never" }` (v1 defaults: Acquisition/Activation/Revenue = `always`, Retention = `after_valid`, Referral = `never`).
  - Define canonical metric catalog with explicit primitive and derived metrics, formulas, units, and denominator semantics:
    - Acquisition primitives: `spend_eur_cents`, `new_customers`; derived: `cac_eur_cents = spend_eur_cents / new_customers`.
    - Activation primitives: `sessions`, `checkout_started`, `orders`; derived: `session_to_order_cvr_bps = (orders * 10000) / sessions`, `checkout_to_order_cvr_bps = (orders * 10000) / checkout_started`.
    - Revenue primitives: `gross_revenue_eur_cents`, `refund_amount_eur_cents`, `discount_amount_eur_cents`, `orders`; derived: `aov_eur_cents = gross_revenue_eur_cents / orders`, `net_revenue_eur_cents = gross_revenue_eur_cents - refund_amount_eur_cents - discount_amount_eur_cents`, `refund_amount_rate_bps = (refund_amount_eur_cents * 10000) / gross_revenue_eur_cents`.
    - Retention primitives: `repeat_customers_30d`, `active_customers_30d`; derived: `repeat_customer_rate_30d_bps = (repeat_customers_30d * 10000) / active_customers_30d`.
    - Referral primitives: `referral_sessions`, `referral_orders`; derived: `referral_conversion_rate_bps = (referral_orders * 10000) / referral_sessions` (stage may still emit `not_tracked` in v1 until instrumentation is available).
  - Define numeric determinism rules: currency values are integer minor units (`*_eur_cents`), rates are integer basis points (`*_bps`), no floating-point threshold comparisons in reducer logic.
  - Define per-stage threshold schema: `{ metric, unit, direction: "higher"|"lower", green_threshold, red_threshold, validity_min_denominator }` with deterministic integer comparison rules for both directions.
  - Define growth ledger status enum: `green`, `yellow`, `red`, `insufficient_data`, `not_tracked`.
  - Define per-business growth ledger file schema: `{ schema_version, ledger_revision, business, period: { period_id, start_date, end_date, forecast_id }, threshold_set_id, threshold_set_hash, threshold_locked_at, updated_at, stages: { acquisition: {...}, activation: {...}, revenue: {...}, retention: {...}, referral: {...} } }`.
  - Document threshold update policy (thresholds are locked per forecast period, updated only during recalibration) with immutable threshold sets (`threshold_set_id` content-addressed from canonical threshold JSON and never mutated after lock).
- **Acceptance:**
  - Schema covers all 5 AARRR stages with concrete primitive and derived metric definitions, formulas, units, and validity denominators.
  - Threshold schema supports validity gates (minimum denominators before decision-valid, matching PET/HEAD forecast pattern).
  - Numeric representation is deterministic (integer cents/basis-points, no floating comparisons).
  - Status enum clearly separates insufficient-data (not enough observations) from red (sufficient data, threshold missed).
  - Stage blocking semantics are explicit and machine-readable (`always|after_valid|never` with deterministic defaults).
  - TypeScript type definitions cover ledger structure, stage metrics, threshold definitions, and evaluation results.
- **Validation contract (VC-GAK-01):**
  - **VC-GAK-01-01:** Schema coverage — all 5 AARRR stages define at least 2 metrics each, and every derived metric references declared primitive metrics.
  - **VC-GAK-01-02:** Threshold validity — threshold schema includes `validity_min_denominator` for all rate-based metrics (CVR, repeat rate, etc.).
  - **VC-GAK-01-03:** Numeric determinism — all currency/rate metrics use integer units (`*_eur_cents`, `*_bps`) with no floating comparisons in evaluation rules.
  - **VC-GAK-01-04:** HEAD/PET compatibility — schema can represent all existing HEAD and PET outcome contract thresholds (including explicit CAC ceiling and CVR floor contracts).
  - **VC-GAK-01-05:** Stage policy coverage — `blocking_mode` behavior (`always|after_valid|never`) is represented in schema and validated against v1 defaults.
  - **VC-GAK-01-06:** Threshold immutability — `threshold_set_id`/`threshold_set_hash` are content-addressed and threshold sets are immutable after lock.
  - **VC-GAK-01-07:** TypeScript type safety — schema compiles with strict TypeScript, no `any` types, all fields documented with JSDoc.
  - **Acceptance coverage:** VC-GAK-01-01 covers acceptance criteria 1; VC-GAK-01-02 covers 2; VC-GAK-01-03 covers 3; VC-GAK-01-04 covers compatibility; VC-GAK-01-05 covers 5; VC-GAK-01-06 covers immutability; VC-GAK-01-07 covers 6.
  - **Validation type:** review checklist + type compilation.
  - **Validation location/evidence:** `docs/business-os/growth-accounting/ledger-schema.md` (new doc), `packages/lib/src/growth/types.ts` (new file), `docs/business-os/growth-accounting/metric-catalog.md` (new doc).
  - **Run/verify:** Review schema against existing HEAD/PET forecast docs; compile TypeScript types with `--strict`; verify primitive/derived formula dependencies and units in metric catalog; verify threshold set hash is stable under canonical serialization.

---

### GAK-02: Create per-business growth ledger file structure

- **Type:** IMPLEMENT
- **Deliverable:** code-change (file I/O module).
- **Execution-Skill:** /lp-build
- **Confidence:** 85%
- **Depends on:** GAK-01 (schema).
- **Scope:**
  - Define canonical file path: `data/shops/{shopId}/growth-ledger.json` (single latest snapshot per business in first cut).
  - Implement versioned schema support (schema_version field, forward-compatible reads).
  - Implement atomic write operations (write to temp file, rename on success to avoid partial writes).
  - Implement canonical JSON serialization for persistence and tests (stable key ordering, fixed indentation, newline normalization) so deterministic runs are byte-comparable.
  - Document audit model: startup-loop event ledger/stage-result artifacts are immutable audit history; `growth-ledger.json` is a materialized current-state view.
  - Document ledger lifecycle: created at S3 (forecast), updated at S10 (weekly decision loop), closed at outcome contract close with final immutable `growth_ledger_closed` event and frozen snapshot pointer.
- **Acceptance:**
  - Growth ledger files live in `data/shops/{shopId}/` alongside existing shop data.
  - Writes are atomic (no partial state ever visible).
  - Schema versioning allows future schema migrations without breaking existing readers.
  - Ledger creation is idempotent (re-creating with same inputs produces identical file bytes via canonical serialization).
- **Validation contract (VC-GAK-02):**
  - **VC-GAK-02-01:** Atomic writes — simulate write interruption (kill process mid-write) → verify ledger file is either fully written or absent (no corrupt partial state).
  - **VC-GAK-02-02:** Idempotent creation — create ledger twice with same inputs → verify byte-identical outputs (deterministic timestamps via explicit input + canonical serializer).
  - **VC-GAK-02-03:** Schema versioning — read v1 ledger with v2 reader (backward-compatible migration path documented).
  - **VC-GAK-02-04:** Audit-model contract — documentation explicitly defines immutable event ledger/stage-results as source-of-truth history and snapshot rebuild path.
  - **Acceptance coverage:** VC-GAK-02-01 covers criteria 2; VC-GAK-02-02 covers 4; VC-GAK-02-03 covers 3; VC-GAK-02-04 covers 1.
  - **Validation type:** unit test (simulated writes + corruption scenarios).
  - **Validation location/evidence:** `packages/lib/src/growth/__tests__/ledger-io.test.ts` (new test file), `docs/business-os/growth-accounting/startup-loop-integration.md` (new doc).
  - **Run/verify:** `npx jest --testPathPattern=growth/ledger-io`.

---

### GAK-03: Define scale/hold/kill guardrail evaluation rules

- **Type:** DESIGN
- **Deliverable:** business-artifact (guardrail decision tree).
- **Execution-Skill:** /lp-build
- **Confidence:** 86%
- **Depends on:** GAK-01 (schema).
- **Scope:**
  - Define decision outputs with explicit separation:
    - `overallStatus`: `green|yellow|red` (state outcome).
    - `guardrailSignal`: `scale|hold|kill` (action outcome), with fixed mapping `green -> scale`, `yellow -> hold`, `red -> kill`.
  - Map per-stage status to `overallStatus` using effective blocking semantics from `blocking_mode`:
    - Any effective blocking stage `red` → overall `red`.
    - Else any effective blocking stage `yellow` or `insufficient_data` or `not_tracked` → overall `yellow`.
    - Else all effective blocking stages `green` → overall `green`.
    - Effective blocking rule: `always` stages are always blocking; `after_valid` stages become blocking only when validity denominator is met; `never` stages are advisory-only.
    - Advisory (`never`) stages never force overall `red`; they affect coverage visibility but not blocking gate decisions.
  - Define stage-specific guardrail actions:
    - Acquisition red → stop cold acquisition expansion, retargeting only.
    - Activation red → pause spend increases, run conversion fixes.
    - Revenue red → hold growth, investigate unit economics or fulfillment issues.
    - Retention red → pause expansion, fix product/service quality.
    - Referral red/yellow/insufficient_data → advisory only in first cut (referral is non-blocking in v1).
  - Document escalation policy: red status triggers named owner, remediation plan within 48 hours, re-test within 7 days (matches PET gate ownership pattern).
- **Acceptance:**
  - Decision tree covers all combinations of stage statuses across the 5-stage funnel (`5^5 = 3125` combinations) and maps each to exactly one `overallStatus` and one `guardrailSignal`.
  - `overallStatus` and `guardrailSignal` are non-duplicative and contractually distinct (state vs action).
  - Each guardrail signal has explicit actions (`scale|hold|kill`) documented.
  - Stage-specific actions match existing HEAD/PET forecast gate logic (CAC gate → retargeting-only; CVR gate → conversion fixes).
  - Blocking behavior is explicit and deterministic for `always|after_valid|never` stage policies and for `red|yellow|insufficient_data|not_tracked` statuses.
  - Escalation policy is deterministic and time-bound.
- **Validation contract (VC-GAK-03):**
  - **VC-GAK-03-01:** Decision tree completeness — enumerate all 3125 stage-status combinations (`5^5`) → verify each maps to exactly one `overallStatus` and one `guardrailSignal`.
  - **VC-GAK-03-02:** HEAD/PET mapping — existing HEAD CAC guardrail and PET week-2 gates map cleanly to decision tree actions (no semantic loss).
  - **VC-GAK-03-03:** Stage policy semantics — `after_valid` stages are non-blocking before validity and blocking after validity, with deterministic transition behavior.
  - **VC-GAK-03-04:** Non-blocking semantics — referral `red` with all effective blocking stages `green` results in overall `green` or `yellow` per configured policy, never forced `red`.
  - **VC-GAK-03-05:** Escalation SLA — decision tree includes explicit owner assignment and remediation timeline for every effective-blocking red status.
  - **Acceptance coverage:** VC-GAK-03-01 covers criteria 1; VC-GAK-03-02 covers 4; VC-GAK-03-03 covers 5; VC-GAK-03-04 covers 5; VC-GAK-03-05 covers 2,6.
  - **Validation type:** review checklist + cross-reference with forecast docs.
  - **Validation location/evidence:** `docs/business-os/growth-accounting/guardrail-decision-tree.md` (new doc).
  - **Run/verify:** Cross-reference decision tree against HEAD/PET forecast gate logic; execute exhaustive 3125-state reducer test table.

---

### GAK-04: Map growth ledger to startup loop stages

- **Type:** DESIGN
- **Deliverable:** business-artifact (integration contract).
- **Execution-Skill:** /lp-build
- **Confidence:** 84%
- **Depends on:** GAK-01 (schema).
- **Scope:**
  - Define where growth ledger is created: S3 (forecast stage) writes initial ledger with target thresholds from forecast assumptions.
  - Define where growth ledger is updated: S10 (weekly decision loop) reads observed metrics via adapter boundary, updates ledger snapshot, emits `overallStatus` + `guardrailSignal` and immutable audit event.
  - Define where growth ledger is consumed:
    - S10 weekly decision logs reference ledger status and guardrail actions.
    - S3 forecast recalibration consumes previous-period ledger as input priors.
    - Business scorecard (apps/business-os) surfaces current ledger state for operator visibility.
  - Define ledger lifecycle hooks: created (S3), updated (S10 weekly), closed (outcome contract closed with final event + frozen snapshot pointer).
  - Define audit boundary explicitly: immutable event ledger + stage-result payloads are the historical record; `growth-ledger.json` is current-state materialization only.
- **Acceptance:**
  - Growth ledger creation/update/consumption is explicitly documented in startup-loop stage table.
  - S3 forecast artifact includes growth ledger initialization as a deliverable.
  - S10 weekly decision loop contract specifies ledger update as mandatory step before decision output.
  - Lifecycle hooks prevent orphaned or stale ledgers (explicit close event + frozen snapshot when outcome contract closes).
- **Validation contract (VC-GAK-04):**
  - **VC-GAK-04-01:** Stage table integration — `docs/business-os/startup-loop-workflow.user.md` stage table includes growth ledger in S3/S10 outputs column.
  - **VC-GAK-04-02:** Lifecycle coverage — ledger lifecycle (create/update/close) mapped to startup-loop events (forecast created, weekly decision run, outcome closed).
  - **VC-GAK-04-03:** Consumption paths — all three consumers (S10 decision logs, S3 recalibration, business scorecard) documented with data flow diagrams.
  - **VC-GAK-04-04:** Audit contract — startup-loop docs define growth event payload fields (inputs, denominators, `threshold_set_id`, `threshold_set_hash`, threshold snapshot, outputs, actions) and snapshot rebuild semantics.
  - **Acceptance coverage:** VC-GAK-04-01 covers criteria 1,2,3; VC-GAK-04-02 covers 4; VC-GAK-04-03 covers 3; VC-GAK-04-04 covers 1,3.
  - **Validation type:** review checklist + documentation cross-reference.
  - **Validation location/evidence:** `docs/business-os/growth-accounting/startup-loop-integration.md` (new doc).
  - **Run/verify:** Cross-reference integration doc against startup-loop stage table; verify all lifecycle hooks mapped to startup-loop events.

---

### GAK-05: Implement growth ledger evaluation engine

- **Type:** IMPLEMENT
- **Deliverable:** code-change (pure evaluation function).
- **Execution-Skill:** /lp-build
- **Confidence:** 82%
- **Depends on:** GAK-02 (file structure), GAK-03 (guardrail rules), GAK-04 (startup-loop contract).
- **Scope:**
  - Implement pure function: `evaluateGrowthLedger(currentMetrics, thresholds, stagePolicies, validityRules) -> { ledgerState, stageStatuses, overallStatus, guardrailSignal, blockingConfidence, overallCoverage, actions[] }`.
  - Per-stage status evaluation: compare metric value against `green_threshold`/`red_threshold` using `direction`, check validity denominator, emit status (`green|yellow|red|insufficient_data|not_tracked`) using integer-unit comparisons (cents/bps/count).
  - Overall status derivation: apply effective blocking-stage semantics from GAK-03 (`always|after_valid|never` policy).
  - Guardrail signal derivation: deterministic mapping from `overallStatus` (`green -> scale`, `yellow -> hold`, `red -> kill`).
  - Action list generation: map red stages to concrete actions (stop cold acquisition, run conversion fixes, etc.) per GAK-03 decision tree.
  - Compute confidence/coverage outputs with non-overlapping semantics:
    - `blockingConfidence` = decision-valid coverage across effective blocking stages only.
    - `overallCoverage` = decision-valid coverage across all stages including advisory stages.
  - Deterministic evaluation: same inputs → same outputs (no wall-clock timestamps; use explicit input timestamp).
- **Acceptance:**
  - Evaluation function is pure (no I/O, no side effects, deterministic).
  - Per-stage status correctly implements `green_threshold`/`red_threshold`/direction logic from schema.
  - Validity rules block decision-making when denominators are below threshold (emits `insufficient_data` status).
  - `overallStatus` and `guardrailSignal` are explicitly distinct and consistent (`status` drives `signal` via fixed mapping).
  - Overall status matches GAK-03 blocking/non-blocking decision tree logic.
  - Referral red (non-blocking) does not automatically force overall red in v1.
  - Advisory-stage data quality can reduce `overallCoverage` without reducing `blockingConfidence`.
  - Action list is non-empty when `overallStatus=red` / `guardrailSignal=kill` (explicit remediation actions).
- **Validation contract (VC-GAK-05):**
  - **VC-GAK-05-01:** Threshold logic — test all 4 direction/threshold outcomes (higher-above-green → green, higher-below-red → red, lower-below-green → green, lower-above-red → red).
  - **VC-GAK-05-02:** Validity gates — test insufficient denominator scenarios (CVR with <500 sessions → `insufficient_data`, not red), including `after_valid` transition behavior.
  - **VC-GAK-05-03:** Status/signal derivation — test combination scenarios (1 effective blocking red stage → `overallStatus=red` + `guardrailSignal=kill`; 3 effective blocking yellow → `yellow` + `hold`; all effective blocking green → `green` + `scale`; referral red only does not force overall red).
  - **VC-GAK-05-04:** Deterministic evaluation — same inputs replayed twice → structurally identical outputs; canonical serializer produces identical bytes for persisted snapshot payloads.
  - **VC-GAK-05-05:** HEAD compatibility — HEAD outcome contract thresholds (CAC <= EUR 13, CVR >= 1.4%) map to correct stage statuses, overall status, and guardrail signal.
  - **VC-GAK-05-06:** Confidence semantics — advisory-stage `insufficient_data` lowers `overallCoverage` while leaving `blockingConfidence` unchanged when effective blocking coverage is unchanged.
  - **VC-GAK-05-07:** Numeric determinism — threshold edge tests in cents/bps produce stable outcomes without floating-point drift.
  - **Acceptance coverage:** VC-GAK-05-01 covers criteria 2; VC-GAK-05-02 covers 3; VC-GAK-05-03 covers 4,5; VC-GAK-05-04 covers 1; VC-GAK-05-05 covers compatibility; VC-GAK-05-06 covers 6; VC-GAK-05-07 covers 2.
  - **Validation type:** unit test (parameterized test cases).
  - **Validation location/evidence:** `packages/lib/src/growth/__tests__/ledger-evaluation.test.ts` (new test file).
  - **Run/verify:** `npx jest --testPathPattern=growth/ledger-evaluation`.

---

### GAK-06: Implement growth ledger persistence

- **Type:** IMPLEMENT
- **Deliverable:** code-change (read/write API).
- **Execution-Skill:** /lp-build
- **Confidence:** 80%
- **Depends on:** GAK-02 (file structure), GAK-05 (evaluation engine).
- **Scope:**
  - Implement `readGrowthLedger(shopId) -> GrowthLedger | null`.
  - Implement `writeGrowthLedger(shopId, ledgerState) -> void` (atomic write via temp file + rename).
  - Implement `updateGrowthLedger(shopId, currentMetrics, timestamp, expectedRevision) -> { ledgerState, overallStatus, guardrailSignal }` (read → evaluate → compare-and-set write chain).
  - Implement optimistic concurrency control via `ledger_revision` CAS semantics to prevent lost updates when overlapping S10 runs occur.
  - Define no-op update semantics: if recomputed ledger content is unchanged, skip write, keep `ledger_revision` unchanged, and return existing snapshot (fast path).
  - Idempotency: re-running update with identical inputs produces identical ledger state (timestamps must be explicit inputs, not wall-clock; serialized output must be canonical).
  - Error handling: missing ledger file → null (not crash); write failure → explicit error (no silent data loss).
- **Acceptance:**
  - Read API returns null for non-existent ledgers (graceful degradation).
  - Write API is atomic (no partial writes).
  - Update API chains read → evaluate → write deterministically.
  - Update idempotency verified (same inputs → same output bytes via canonical serializer).
  - `ledger_revision` increments only when persisted ledger content changes; no-op updates do not increment revision.
  - Concurrency conflicts are surfaced explicitly (CAS mismatch returns conflict error; no silent last-writer-wins overwrite).
- **Validation contract (VC-GAK-06):**
  - **VC-GAK-06-01:** Read missing ledger → returns null, no crash.
  - **VC-GAK-06-02:** Write interruption — kill process mid-write → ledger file is either complete or absent (no corruption).
  - **VC-GAK-06-03:** Idempotent no-op update — run update twice with same metrics + timestamp + revision → byte-identical ledger and unchanged `ledger_revision`.
  - **VC-GAK-06-04:** Revision behavior — changed inputs produce persisted update and incremented `ledger_revision`; unchanged inputs do not write.
  - **VC-GAK-06-05:** Concurrency safety — simulate overlapping updates with stale `expectedRevision` → conflict error, no lost update.
  - **VC-GAK-06-06:** Error propagation — simulate write failure (e.g., read-only filesystem) → explicit error thrown, not silent failure.
  - **Acceptance coverage:** VC-GAK-06-01 covers criteria 1,5; VC-GAK-06-02 covers 2; VC-GAK-06-03 covers 3,4; VC-GAK-06-04 covers 5; VC-GAK-06-05 covers 6; VC-GAK-06-06 covers 5.
  - **Validation type:** unit test (simulated I/O failures).
  - **Validation location/evidence:** `packages/lib/src/growth/__tests__/ledger-persistence.test.ts` (new test file).
  - **Run/verify:** `npx jest --testPathPattern=growth/ledger-persistence`.

---

### GAK-07: Integrate growth ledger into S10 weekly decision loop

- **Type:** IMPLEMENT
- **Deliverable:** code-change (startup-loop control plane integration).
- **Execution-Skill:** /lp-build
- **Confidence:** 78%
- **Depends on:** GAK-04 (startup-loop contract), GAK-05 (evaluation engine), GAK-06 (persistence).
- **Scope:**
  - Add growth ledger update as mandatory step in S10 weekly decision loop control plane.
  - Introduce metrics adapter boundary: `getWeeklyGrowthMetrics(shopId, weekRange) -> CurrentMetrics` so S10 integration is decoupled from raw data-source plumbing.
  - Control plane reads observed metrics through adapter implementations (fixture/mock in tests; production adapter for existing aggregates).
  - Control plane calls `updateGrowthLedger()` with current-week metrics.
  - Control plane emits stage-result file and event ledger entry (`growth_ledger_evaluated`) with full inputs/outputs:
    - Inputs: metrics, denominators, threshold snapshot, `threshold_set_id`/`threshold_set_hash`, period_id, evaluation timestamp, expected revision.
    - Outputs: per-stage statuses, overall status, guardrail signal, `blockingConfidence`, `overallCoverage`, actions.
  - S10 decision log template includes growth ledger status section (mandatory checklist item).
- **Acceptance:**
  - Growth ledger update runs automatically during S10 control plane execution (no manual intervention).
  - Overall status (`green|yellow|red`) and guardrail signal (`scale|hold|kill`) appear in stage-result output.
  - Event payload is sufficient to audit/replay decisions without consulting mutable snapshot history.
  - S10 decision log template enforces growth ledger review (mandatory section, not optional).
  - Integration is testable via dry-run (simulated metrics → control plane → stage-result → verify `overallStatus` + `guardrailSignal`).
- **Validation contract (VC-GAK-07):**
  - **VC-GAK-07-01:** Control plane integration — simulate S10 run with mock metrics → growth ledger updated, `overallStatus` + `guardrailSignal` written to stage-result.json.
  - **VC-GAK-07-02:** Audit payload completeness — emitted event/stage-result include required replay fields (metrics + denominators + threshold snapshot + threshold hash/id + statuses + signal + actions + coverage metrics).
  - **VC-GAK-07-03:** Decision log template — new S10 decision log includes growth ledger status section with all 5 AARRR stages + `overallStatus` + `guardrailSignal`.
  - **VC-GAK-07-04:** Error handling — simulate missing adapter data → control plane emits `insufficient_data` status, not crash.
  - **Acceptance coverage:** VC-GAK-07-01 covers criteria 1,2,4; VC-GAK-07-02 covers 3; VC-GAK-07-03 covers 4; VC-GAK-07-04 covers 1.
  - **Validation type:** integration test (simulated S10 run with fixture data).
  - **Validation location/evidence:** `scripts/src/startup-loop/__tests__/s10-growth-ledger.test.ts` (new test file).
  - **Run/verify:** `npx jest --testPathPattern=startup-loop/s10-growth-ledger`.

---

### GAK-08: Surface growth ledger in business scorecard

- **Type:** IMPLEMENT
- **Deliverable:** code-change (business-os UI integration).
- **Execution-Skill:** /lp-build
- **Confidence:** 82%
- **Depends on:** GAK-07 (control plane integration).
- **Scope:**
  - Extend `apps/business-os` business detail page to include growth ledger card.
  - Card displays: 5 AARRR stages with current status (green/yellow/red/insufficient_data), last updated timestamp, overall status (`green|yellow|red`), guardrail signal (`scale|hold|kill`), active guardrail actions (if red).
  - Read growth ledger via API: `GET /api/business/:business/growth-ledger`.
  - API implementation: authz-check business access, sanitize/validate `business` route param, read `data/shops/{shopId}/growth-ledger.json`, return serialized ledger state.
  - API behavior contract: existing ledger → HTTP 200; missing ledger → HTTP 404 with typed empty-state code (`ledger_not_initialized`) for deterministic UI handling.
  - Empty state: if ledger does not exist (S3 not yet run), display "Growth ledger not initialized" with link to forecast stage.
- **Acceptance:**
  - Business scorecard page displays growth ledger card with all 5 AARRR stages.
  - Status colors match `overallStatus` (green = good, yellow = warning, red = action required).
  - Last updated timestamp visible (operators can verify freshness).
  - API enforces authorization and rejects invalid business identifiers (no path traversal).
  - Empty state handled gracefully (no crash when ledger missing).
- **Validation contract (VC-GAK-08):**
  - **VC-GAK-08-01:** Render happy path — existing ledger with mixed statuses (2 green, 2 yellow, 1 red) → all stages displayed correctly with status colors.
  - **VC-GAK-08-02:** Empty state — missing ledger file → empty state message displayed, no crash.
  - **VC-GAK-08-03:** API integration — API call `/api/business/HEAD/growth-ledger` → returns ledger JSON, HTTP 200.
  - **VC-GAK-08-04:** API auth/security — unauthorized request denied; malformed/path-traversal `business` param rejected; missing ledger returns 404 + `ledger_not_initialized`.
  - **Acceptance coverage:** VC-GAK-08-01 covers criteria 1,2,3; VC-GAK-08-02 covers 5; VC-GAK-08-03 covers API contract; VC-GAK-08-04 covers 4,5.
  - **Validation type:** component test (React Testing Library) + API integration test.
  - **Validation location/evidence:** `apps/business-os/src/components/GrowthLedgerCard.test.tsx` (new test file), `apps/business-os/src/app/api/business/[business]/growth-ledger/route.test.ts` (new test file).
  - **Run/verify:** `pnpm --filter business-os test GrowthLedgerCard`.

---

### GAK-09: End-to-end validation with HEAD or PET dry-run

- **Type:** CHECKPOINT
- **Deliverable:** validation report.
- **Execution-Skill:** /lp-build
- **Confidence:** 80%
- **Depends on:** GAK-08 (UI integration).
- **Scope:**
  - Select one business (HEAD or PET) for dry-run validation.
  - Create fixture growth ledger with realistic metrics from existing forecast doc (HEAD outcome contract or PET week-2 gates).
  - Simulate S10 weekly decision loop: read fixture metrics → update ledger → verify `overallStatus` + `guardrailSignal` → check decision log output.
  - Verify immutable event/stage-result payload captures full replay inputs/outputs for the dry-run decision.
  - Verify business scorecard displays ledger correctly.
  - Document validation results: did `overallStatus`/`guardrailSignal` match expected outcomes? Were threshold violations detected correctly? Did empty states render?
- **Acceptance:**
  - One full S10 cycle completes with growth ledger update (no manual intervention beyond fixture setup).
  - Overall status and guardrail signal match hand-calculated expectation (e.g., HEAD CAC = EUR 16 with ceiling EUR 13 → `overallStatus=red`, `guardrailSignal=kill`).
  - Decision log includes growth ledger section with correct status.
  - Stage-result/event payload is replay-auditable (decision can be reconstructed without mutable history files).
  - Business scorecard card renders ledger state.
- **Validation contract (VC-GAK-09):**
  - **VC-GAK-09-01:** Full cycle trace — S10 dry-run produces ledger file, stage-result with overall status + guardrail signal, decision log with ledger section.
  - **VC-GAK-09-02:** Threshold accuracy — test case with known threshold violation (e.g., CVR = 0.8% with `red_threshold = 0.9%`) → red status detected and action emitted.
  - **VC-GAK-09-03:** Audit replayability — stage-result/event payload contains required fields to recompute decision deterministically.
  - **VC-GAK-09-04:** UI rendering — business scorecard page loads with ledger card showing correct stage statuses.
  - **Acceptance coverage:** VC-GAK-09-01 covers criteria 1,3; VC-GAK-09-02 covers 2; VC-GAK-09-03 covers 4; VC-GAK-09-04 covers 5.
  - **Validation type:** end-to-end dry-run (fixture data + real control plane execution).
  - **Validation location/evidence:** `docs/business-os/growth-accounting/validation-report-GAK-09.md` (new report), `data/shops/HEAD/growth-ledger.json` (fixture ledger).
  - **Run/verify:** Execute S10 control plane script with fixture HEAD metrics; load business-os page for HEAD; document outputs in validation report.

---

## Validation Strategy

1. Schema validation at design stage (GAK-01) ensures all existing forecast thresholds can be represented.
2. Exhaustive reducer validation (3125 combinations) verifies guardrail mapping completeness and deterministic blocking-stage semantics.
3. Unit tests for pure functions and persistence cover deterministic integer-unit math (cents/bps), canonical serialization, idempotency/no-op behavior, and CAS conflict handling.
4. Integration tests for control plane (S10 integration) verify adapter input path, event/stage-result audit payload completeness, and end-to-end data flow.
5. UI/API tests for business scorecard ensure correct rendering, empty-state handling, authz checks, and route parameter sanitization.
6. End-to-end dry-run with HEAD/PET validates real-world integration and replayability from immutable artifacts.

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Metric definitions drift between forecast docs and ledger schema | High | Explicit schema versioning; migration guide; startup-loop contract lint checks for drift |
| Threshold updates bypass ledger (manual doc edits not reflected in runtime) | High | Lock thresholds during forecast period; enforce updates only during S3 recalibration |
| Insufficient data handling ambiguous (operators ignore `insufficient_data` status) | Medium | Explicit validity rules in schema; UI warning badges for insufficient-data states; decision log template requires acknowledgment |
| Growth ledger becomes stale (not updated during S10) | Medium | S10 control plane enforces ledger update as mandatory step; contract lint checks for missing updates |
| Overlapping S10 runs overwrite each other (lost update) | Medium | `ledger_revision` compare-and-set writes; explicit conflict errors and retry policy |
| API endpoint leaks business data or allows path traversal | Medium | Mandatory authz checks; strict business-id validation/sanitization; security tests in VC-GAK-08-04 |
| Floating-point edge cases cause threshold drift on replay | Medium | Represent money in integer cents and rates in basis points; forbid float threshold comparisons in reducer |
| Blocking-stage bootstrapping causes premature global holds | Medium | Use `blocking_mode=after_valid` for ramp-sensitive stages (Retention in v1) and test transition semantics |
| Threshold-set replay mismatch due mutable references | Medium | Content-address threshold sets (`threshold_set_id`/`threshold_set_hash`) and embed threshold snapshot in `growth_ledger_evaluated` payload |

## What Would Make Confidence >=90%

1. Complete a multi-week pilot with HEAD or PET (S3 forecast → S10 weekly update × 4 weeks → S3 recalibration) proving ledger lifecycle end-to-end (post-GAK-09 expansion).
2. Demonstrate threshold violation correctly triggering guardrail action (e.g., CAC ceiling breached → cold acquisition stopped).
3. Prove ledger state correctly feeds back into S3 forecast recalibration (previous-period actuals become next-period priors).
4. Show contract lint detecting drift between forecast doc thresholds and ledger thresholds (schema drift caught before runtime).

## Decision Log

1. 2026-02-13 — Overall guardrail reducer completeness is validated across all `5^5 = 3125` stage-status combinations (not `5x5`).
2. 2026-02-13 — Blocking behavior is first-class via `blocking_mode` (`always|after_valid|never`), with Referral `never` and Retention `after_valid` in v1.
3. 2026-02-13 — CAC is a required first-class metric in schema and HEAD/PET compatibility checks.
4. 2026-02-13 — Immutable audit history lives in startup-loop event ledger/stage-result artifacts; `growth-ledger.json` is a materialized latest snapshot.
5. 2026-02-13 — Deterministic byte-level persistence comparisons require canonical JSON serialization.
6. 2026-02-13 — Decision outputs are split into `overallStatus` (`green|yellow|red`) and `guardrailSignal` (`scale|hold|kill`) to avoid duplicated semantics.
7. 2026-02-13 — Confidence is split into `blockingConfidence` and `overallCoverage` so advisory-stage sparsity is visible without altering blocking gate confidence.
8. 2026-02-13 — `ledger_revision` increments only on state change; idempotent no-op updates do not write.
9. 2026-02-13 — Numeric determinism uses integer units only (`*_eur_cents`, `*_bps`) for threshold comparisons and replay stability.
10. 2026-02-13 — Threshold sets are content-addressed and immutable after lock; event payload includes threshold snapshot for replay.

## Open Questions

1. **Metric adapter ownership:** Which existing service owns the first production implementation of `getWeeklyGrowthMetrics(shopId, weekRange)`? (Assumption: hybrid adapter — sessions from Cloudflare aggregate, orders/customers from order database, spend from forecast tracking source.)
2. **Retention policy calibration:** Is `blocking_mode=after_valid` for Retention sufficient for all launch profiles, or do we need per-business policy overrides during ramp? (Assumption: default `after_valid` in v1, with explicit override field available later if needed.)
3. **Referral tracking:** How do we attribute referral sessions? UTM tags? Referrer headers? (Assumption: defer referral attribution to a later phase; first cut marks referral stage as `not_tracked`.)

## Dependencies

- Startup loop control plane event ledger (LPSP-04A, completed).
- Startup loop stage-result schema (LPSP-03A, completed).
- Startup loop S10 weekly decision loop contract (documented in startup-loop-workflow.user.md).
- Existing business scorecard infrastructure (apps/prime/src/lib/owner/businessScorecard.ts).

## Integration Points

- `data/shops/{shopId}/growth-ledger.json` — canonical per-business latest snapshot (materialized view).
- `packages/lib/src/growth/` — evaluation engine and persistence layer.
- `scripts/src/startup-loop/` — S10 control plane integration.
- Startup-loop event ledger + stage-result artifacts — immutable audit/replay history for growth decisions.
- `apps/business-os/src/app/api/business/[business]/growth-ledger/` — API endpoint.
- `apps/business-os/src/components/GrowthLedgerCard.tsx` — UI component.

## Success Criteria

1. Growth ledger schema can represent all existing HEAD/PET outcome contract thresholds with no semantic loss.
2. S10 weekly decision loop automatically updates growth ledger with no manual intervention.
3. `overallStatus` (`green|yellow|red`) and `guardrailSignal` (`scale|hold|kill`) are deterministic and reproducible (same metrics → same outputs).
4. Business scorecard displays current growth ledger state with correct status colors and actions.
5. One end-to-end S10 dry-run cycle completes successfully with HEAD or PET, including replayable audit artifacts.
