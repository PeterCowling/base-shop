---
Type: Plan
Status: Active
Domain: Venture-Studio
Workstream: Process
Created: 2026-02-13
Last-updated: 2026-02-13
Last-reviewed: 2026-02-13
Replan-date: 2026-02-13
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: bottleneck-locator
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-sequence, /lp-replan
Overall-confidence: 87%
Confidence-Method: min(Implementation,Approach,Impact) — schema/persistence patterns proven; startup-loop metrics exist; guarded trigger lifecycle specified
Business-OS-Integration: on
Business-Unit: PLAT
---

# Bottleneck Locator + Replan Signal Plan

## Summary

Implement a bottleneck diagnosis system that runs on S10 completion (typically weekly), identifies the highest-leverage growth constraint, and writes a guarded replan signal when the same constraint signature persists across N consecutive runs.

This is diagnosis + signaling only. It does not execute `/lp-replan` automatically.

Primary references:
- `docs/plans/advanced-math-algorithms-fact-find.md` (Opportunity R)
- `docs/business-os/startup-loop/loop-spec.yaml`
- `.claude/skills/lp-replan/SKILL.md`
- `docs/business-os/startup-loop/event-state-schema.md`
- `docs/business-os/startup-loop/manifest-schema.md`

## Goals

1. Make the highest-leverage bottleneck visible and trackable across runs.
2. Reduce operator toil with deterministic replan signaling when constraints persist.
3. Persist diagnosis history for retrospective analysis and auditability.
4. Prefer upstream drivers over downstream symptoms in bottleneck selection.

## Non-goals

1. Real-time bottleneck detection.
2. Automated remediation or automated replan execution.
3. Cross-business benchmarking in v1.
4. Predictive bottleneck forecasting in v1.

## Constraints & Assumptions

- Constraints:
  - TypeScript-only implementation (no Python/Rust sidecars).
  - Must fit existing startup-loop control-plane ownership model.
  - Persistence uses JSON files in baseline directories (snapshot + JSONL ledger + trigger state).
  - No new external dependencies beyond existing monorepo stack.
- Assumptions:
  - Metrics are available from S3/S10 artifacts and events ledger.
  - Default persistence threshold is `N=3` runs.
  - S10 completion is the integration point (typically weekly cadence).
  - Run IDs follow `SFS-<BIZ>-<YYYYMMDD>-<hhmm>` per manifest schema.

## Canonical Definitions (BL-01 Baseline)

### Metric Catalog (v1)

| Metric ID | Class | Direction | Default Stage | Candidate Priority |
|---|---|---|---|---|
| `traffic` | primitive | higher_is_better | `S6B` | primary |
| `cvr` | primitive | higher_is_better | `S3` | primary |
| `aov` | primitive | higher_is_better | `S2B` | primary |
| `cac` | primitive | lower_is_better | `S6B` | primary |
| `orders` | derived | higher_is_better | `S10` | secondary |
| `revenue` | derived | higher_is_better | `S10` | secondary |

### Normalized Miss Formula

`miss` is normalized so higher is always worse:

- Higher-is-better metrics (`traffic`, `cvr`, `aov`, `orders`, `revenue`):
  - `miss = max(0, (target - actual) / target)`
- Lower-is-better metrics (`cac`):
  - `miss = max(0, (actual - target) / target)`

If `target <= 0` or missing, `miss` is `null` and metric is excluded from rank candidates.

### Severity Bands

- `critical`: `miss >= 0.50`
- `moderate`: `0.20 <= miss < 0.50`
- `minor`: `0.05 <= miss < 0.20`
- `none`: `miss < 0.05`

No bottleneck condition: `identified_constraint = null` only when all rank-eligible metrics are `none` and there is no `stage_blocked` constraint.

### Stage Ordering and Mapping

- `upstream_priority_order` (used for tie-breakers and multi-block selection): `S0`, `S1`, `S1B`, `S2A`, `S2`, `S2B`, `S3`, `S6B`, `S4`, `S5A`, `S5B`, `S6`, `S7`, `S8`, `S9`, `S9B`, `S10`
- `upstream_priority_order` is derived from startup-loop dependency flow (not stage-ID numeric sorting). `S6B` intentionally precedes `S4` because `S4` consumes S6B outputs.
- `metric_to_stage`: defined by Metric Catalog table above.
- `stage_blocked` constraints may originate from any stage in `upstream_priority_order`.

### Constraint Signatures

- Metric constraint key: `<stage>/<metric>` (example: `S3/cvr`)
- Blocked-stage constraint key: `<stage>/stage_blocked/<reason_code>` (example: `S4/stage_blocked/deps_blocked`)

Persistence checks and trigger logic use this `constraint_key` contract, not free-text reason text.

### Diagnosis Status and Data Quality

- `diagnosis_status`: `"ok" | "no_bottleneck" | "insufficient_data" | "partial_data"`
- `data_quality`:
  - `missing_targets: MetricId[]`
  - `missing_actuals: MetricId[]`
  - `excluded_metrics: MetricId[]` (for invalid target/actual values, unsupported direction, or target <= 0)
- Status rules:
  - `ok`: rank-eligible metrics exist and primary constraint identified.
  - `no_bottleneck`: rank-eligible metrics exist but all are severity `none` and no blocked stage exists.
  - `insufficient_data`: no rank-eligible metrics and no blocked stage exists.
  - `partial_data`: some metrics missing/excluded but at least one rank-eligible metric or blocked stage exists.

### Blocked Constraint Ranking Rules

- Any normalized `stage_blocked` constraint outranks any metric constraint.
- Represent blocked constraints with `miss = 1.0` in `ranked_constraints` for comparability.
- If multiple blocked constraints are present, select primary by:
  1. earliest stage in `upstream_priority_order`
  2. latest timestamp (if same stage has multiple blocked events)
  3. lexical `reason_code`
- Blocked constraints are always severity `critical`.

### Blocked Reason Taxonomy (v1)

Normalize `stage_blocked` reason codes:
- `data_missing`
- `deps_blocked`
- `compliance`
- `ops_capacity`
- `unclear_requirements`
- `other`

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---|---|---|---|
| BL-01 | DECISION | Define canonical schema, metric model, and deterministic contracts | 90% | S | Complete (2026-02-13) | - | BL-02, BL-03 |
| BL-02 | IMPLEMENT | Implement metrics extraction into canonical diagnosis input shape | 85% | M | Complete (2026-02-13) | BL-01 | BL-04 |
| BL-03 | IMPLEMENT | Implement deterministic bottleneck detector with upstream attribution | 84% | M | Complete (2026-02-13) | BL-01 | BL-04 |
| BL-04 | IMPLEMENT | Generate per-run diagnosis snapshot with deterministic prior comparison | 87% | S | Complete (2026-02-13) | BL-02, BL-03 | BL-05 |
| BL-05 | IMPLEMENT | Implement idempotent bottleneck history ledger and persistence check | 87% | M | Complete (2026-02-13) | BL-04 | BL-06 |
| BL-06 | IMPLEMENT | Add guarded replan trigger with severity gate and lifecycle state | 86% | M | Complete (2026-02-13) | BL-05 | BL-07 |
| BL-07 | IMPLEMENT | Integrate diagnosis pipeline into S10 completion flow | 84% | S | Pending | BL-06 | - |

## Active Tasks

- `BL-01` (DECISION) — unblocked, ready to build.
- `BL-02`, `BL-03` — blocked by BL-01.
- `BL-04` — blocked by BL-02, BL-03.
- `BL-05` — blocked by BL-04.
- `BL-06` — blocked by BL-05.
- `BL-07` — blocked by BL-06.

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | BL-01 | - | Canonical contracts for schema, ranking, determinism |
| 2 | BL-02, BL-03 | BL-01 | Data extraction and ranking engine can run in parallel |
| 3 | BL-04 | BL-02, BL-03 | Snapshot orchestration and prior-run diff |
| 4 | BL-05 | BL-04 | History persistence + idempotency |
| 5 | BL-06 | BL-05 | Trigger policy and lifecycle |
| 6 | BL-07 | BL-06 | S10 integration and docs |

## Tasks

### BL-01: Define canonical schema, metric model, and deterministic contracts

- **Type:** DECISION
- **Deliverable:** business-artifact (schema definition document)
- **Execution-Skill:** /lp-build
- **Confidence:** 90%
  - Implementation: 90% — aligns with existing manifest/events deterministic patterns
  - Approach: 91% — explicit contracts reduce downstream ambiguity
  - Impact: 89% — foundational for all implementation tasks
- **Scope:**
  - Define canonical JSON schema for diagnosis snapshot, history ledger, and replan trigger.
  - Define metric catalog, directionality, normalized miss formula, severity bands, and no-bottleneck threshold.
  - Define stage ordering semantics, metric-stage mapping, blocked-stage reason normalization, and blocked-stage ranking behavior.
  - Define diagnosis status and data-quality semantics (`ok`, `no_bottleneck`, `insufficient_data`, `partial_data`).
  - Define deterministic prior-run selection and history append idempotency by `run_id`.
  - Define bottleneck ranking and upstream-attribution rules.
  - Define atomic write contract for snapshot and trigger files.
- **Acceptance:**
  - Schema doc exists at `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md` and includes canonical examples for:
    - `bottleneck-diagnosis.json`
    - one line of `bottleneck-history.jsonl`
    - `replan-trigger.json`
  - Snapshot schema includes:
    - `diagnosis_schema_version`
    - `constraint_key_version`
    - `run_id`, `business`, `timestamp`
    - `diagnosis_status`, `data_quality`
    - `funnel_metrics` keyed by `MetricId` with `target`, `actual`, `delta_pct`, `miss`, `stage`, `direction`, `metric_class`
    - `identified_constraint` and `ranked_constraints[]`
    - `comparison_to_prior_run`
  - History schema includes:
    - `timestamp`, `run_id`, `diagnosis_status`, `constraint_key`, `constraint_stage`, `constraint_metric`, `reason_code?`, `severity`
    - explicit representation for no-bottleneck entry (`constraint_key: "none"`, `severity: "none"`)
  - Trigger schema includes lifecycle:
    - `status: "open" | "acknowledged" | "resolved"`
    - `created_at`, `last_evaluated_at`, `resolved_at?`
    - `reopened_count`, `last_reopened_at?`
    - `constraint`, `run_history`, `min_severity`, `persistence_threshold`
  - Algorithm contract includes:
    - normalized miss formulas by metric direction
    - severity and no-bottleneck thresholds
    - rule: prefer primitive driver constraints over derived outcomes when both are available
    - blocked constraints outrank metrics and use `miss=1.0`
    - deterministic tiebreakers (`miss desc`, `upstream_priority_order asc`, `metric id asc`)
  - Determinism contracts documented:
    - prior run selection strategy independent of filesystem listing order and filtered to runs with an existing diagnosis snapshot (or completed S10 artifact pointer)
    - history append dedupe by `run_id`
    - snapshot/trigger writes are atomic (temp file + rename)
- **Validation contract:**
  - **VC-01:** Canonical schema completeness — all required fields and examples present.
  - **VC-02:** Metric policy clarity — direction, miss formula, severity, and no-bottleneck threshold are unambiguous.
  - **VC-03:** Stage policy clarity — `upstream_priority_order`, `metric_to_stage`, blocked taxonomy, and blocked ranking behavior are explicit.
  - **VC-04:** Status policy clarity — `diagnosis_status` and `data_quality` transitions are explicit.
  - **VC-05:** Determinism + idempotency clarity — prior-run filtering, run-id dedupe, and atomic write behavior are fully specified.
  - **Acceptance coverage:** VC-01 covers criteria 1-3; VC-02 covers criterion 4; VC-03 covers criterion 4; VC-04 covers criterion 4; VC-05 covers criterion 5.
  - **Validation type:** review checklist
  - **Validation location/evidence:** `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md`
  - **Run/verify:** cross-reference with `event-state-schema.md` and `manifest-schema.md`

### BL-02: Implement metrics extraction into canonical diagnosis input shape

- **Type:** IMPLEMENT
- **Deliverable:** code-change
- **Execution-Skill:** /lp-build
- **Confidence:** 85%
  - Implementation: 85% — artifact read/parsing is straightforward
  - Approach: 86% — no new data collection required
  - Impact: 84% — read-only over existing stage artifacts + ledger
- **Depends on:** BL-01
- **Scope:**
  - Read targets/actuals via canonical artifact pointers from run manifest + stage-result artifacts (not directory assumptions alone).
  - Read blocked-stage signals from `events.jsonl` and normalize to reason taxonomy.
  - Build canonical `FunnelMetricsInput` shape keyed by `MetricId`.
  - Compute `delta_pct` and `miss` in extraction layer (shared formula from BL-01).
  - Populate `data_quality` fields (`missing_targets`, `missing_actuals`, `excluded_metrics`).
- **Acceptance:**
  - Function `extractFunnelMetrics(runId, business): FunnelMetricsInput` exists.
  - Reads from:
    - `docs/business-os/startup-baselines/<BIZ>/runs/<run_id>/baseline.manifest.json`
    - stage-result artifact pointers for S3/S10 forecast/readout artifacts
    - `docs/business-os/startup-baselines/<BIZ>/runs/<run_id>/events.jsonl`
  - Returns canonical object:
    - `diagnosis_schema_version: "v1"`
    - `constraint_key_version: "v1"`
    - `metric_catalog_version: "v1"`
    - `funnel_metrics: { traffic, cvr, aov, cac, orders, revenue }`
    - `blocked_stages: [{ stage, reason_code, blocking_reason, timestamp }]`
    - `data_quality: { missing_targets, missing_actuals, excluded_metrics }`
    - `sources: { s3_forecast, s10_readout, events }`
  - Missing/invalid artifacts do not throw; affected metric fields become `null` and warning is logged.
- **Test contract:**
  - **TC-01:** Happy path — valid S3 + S10 + events produce complete `FunnelMetricsInput` with all six metric IDs.
  - **TC-02:** Missing S10 — targets present, actuals/miss values `null` for unavailable metrics.
  - **TC-03:** Malformed S3 JSON — warning logged, S3-dependent fields `null`, process continues.
  - **TC-04:** Event parsing — two `stage_blocked` events normalize to `reason_code` values and preserve timestamps.
  - **TC-05:** Directionality correctness — CAC above target yields positive miss; CVR below target yields positive miss.
  - **TC-06:** Pointer-based reads — manifest/stage-result pointers are used even when stage directories contain extra unrelated files.
  - **Acceptance coverage:** TC-01 covers criteria 1-3; TC-02/TC-03 cover criterion 4; TC-04 covers criterion 3; TC-05 covers criterion 3; TC-06 covers criterion 2.
  - **Test type:** unit
  - **Test location:** `scripts/src/startup-loop/__tests__/funnel-metrics-extractor.test.ts` (new)
  - **Run:** `npx jest --config scripts/jest.config.cjs --testPathPattern=funnel-metrics-extractor`
- **Affects:**
  - `scripts/src/startup-loop/funnel-metrics-extractor.ts` (new)
  - `scripts/src/startup-loop/__tests__/funnel-metrics-extractor.test.ts` (new)

### BL-03: Implement deterministic bottleneck detector with upstream attribution

- **Type:** IMPLEMENT
- **Deliverable:** code-change
- **Execution-Skill:** /lp-build
- **Confidence:** 84%
  - Implementation: 84% — pure deterministic ranking function
  - Approach: 85% — attribution rules avoid symptom-only bottlenecks
  - Impact: 83% — central logic, but isolated and testable
- **Depends on:** BL-01
- **Scope:**
  - Rank candidate constraints by normalized miss.
  - Prefer primitive metrics over derived metrics when primitive drivers are available.
  - Apply deterministic tiebreakers and include ranked alternatives.
  - Apply diagnosis-status classification (`ok`, `no_bottleneck`, `insufficient_data`, `partial_data`).
  - Elevate blocked-stage constraints as critical with normalized reason code and explicit ranking precedence.
- **Acceptance:**
  - Function `identifyBottleneck(input): BottleneckDiagnosis` exists.
  - Output always includes `diagnosis_status` and `data_quality`.
  - `identified_constraint` may be `null` when:
    - `diagnosis_status = "no_bottleneck"` (all eligible misses `<0.05`, no blocked stages)
    - `diagnosis_status = "insufficient_data"` (no eligible metrics, no blocked stages)
  - Returns:
    - `identified_constraint`
    - `ranked_constraints` (top 3-5 candidates with miss/severity/reasoning)
  - Upstream attribution rules:
    - If `orders` is worst but `traffic` and `cvr` are available, choose larger miss of `{traffic, cvr}` as primary.
    - If `revenue` is worst but `orders` and `aov` are available, compare `{orders, aov}`; if `orders` selected and its drivers exist, apply rule above.
  - Blocked-stage rule:
    - any blocked-stage candidate outranks all metric candidates
    - blocked candidate uses `miss=1.0` in ranking payload
    - multi-block selection uses `upstream_priority_order`, then timestamp desc, then reason_code lexical
  - Deterministic tiebreakers for metric candidates: `miss desc`, then earlier `upstream_priority_order`, then `metric id` lexical.
  - Severity classification uses BL-01 bands and wording as "worse than target" (direction-aware).
  - Stage blocks are treated as critical constraints using key `<stage>/stage_blocked/<reason_code>`.
- **Test contract:**
  - **TC-01:** Single clear bottleneck — CAC 80% worse than target yields `S6B/cac` critical.
  - **TC-02:** Equal miss tie — CAC miss 0.60 and CVR miss 0.60 returns CVR (`S3`) by upstream priority order.
  - **TC-03:** No bottleneck — all metrics within 4% miss returns `diagnosis_status="no_bottleneck"` and `identified_constraint=null`.
  - **TC-04:** Stage blocked — `S4` blocked with `deps_blocked` returns critical key `S4/stage_blocked/deps_blocked`.
  - **TC-05:** Minor miss — CVR miss 0.10 returns severity `minor`.
  - **TC-06:** Symptom guard — orders miss highest but traffic miss > cvr miss returns `traffic` as primary, not `orders`.
  - **TC-07:** Ranked transparency — output includes top-ranked alternatives with misses and reason text.
  - **TC-08:** Insufficient data — no eligible metrics and no blocked stages returns `diagnosis_status="insufficient_data"` and `identified_constraint=null`.
  - **TC-09:** Multiple blocked stages — choose primary by `upstream_priority_order` and return blocked candidate with `miss=1.0`.
  - **Acceptance coverage:** TC-01 covers criteria 1,8; TC-02 covers criterion 6; TC-03 covers criterion 3; TC-04 covers criterion 7; TC-05 covers criterion 8; TC-06 covers criterion 5; TC-07 covers criterion 4; TC-08 covers criterion 3; TC-09 covers criterion 7.
  - **Test type:** unit
  - **Test location:** `scripts/src/startup-loop/__tests__/bottleneck-detector.test.ts` (new)
  - **Run:** `npx jest --config scripts/jest.config.cjs --testPathPattern=bottleneck-detector`
- **Affects:**
  - `scripts/src/startup-loop/bottleneck-detector.ts` (new)
  - `scripts/src/startup-loop/__tests__/bottleneck-detector.test.ts` (new)

### BL-04: Generate per-run diagnosis snapshot with deterministic prior comparison

- **Type:** IMPLEMENT
- **Deliverable:** code-change
- **Execution-Skill:** /lp-build
- **Confidence:** 87%
  - Implementation: 87% — composition of BL-02 + BL-03 with deterministic comparator
  - Approach: 88% — uses explicit run ordering contract
  - Impact: 86% — single snapshot write per run
- **Depends on:** BL-02, BL-03
- **Scope:**
  - Compose extraction + bottleneck detection into a snapshot writer.
  - Compare current diagnosis to deterministic prior run.
  - Persist `bottleneck-diagnosis.json` under run directory.
- **Acceptance:**
  - Function `generateDiagnosisSnapshot(runId, business): DiagnosisSnapshot` exists.
  - Calls BL-02 + BL-03 and writes:
    - `docs/business-os/startup-baselines/<BIZ>/runs/<run_id>/bottleneck-diagnosis.json`
  - Prior-run selection is deterministic and filesystem-order independent:
    - scan runs for valid manifest/run IDs
    - filter to runs with available diagnosis snapshot (or completed S10 artifact pointer)
    - order by `run_id` lexicographically (`SFS-<BIZ>-<YYYYMMDD>-<hhmm>`)
    - select greatest run ID strictly less than current `run_id`
  - Snapshot includes `diagnosis_status` and `data_quality`.
  - `comparison_to_prior_run` includes:
    - `constraint_changed`
    - `prior_constraint_key`
    - `metric_trends` (`improving|worsening|stable`)
  - First run writes `comparison_to_prior_run: null`.
  - Snapshot writes are atomic (temp file + rename).
- **Test contract:**
  - **TC-01:** Happy path with prior run — snapshot includes populated comparison and trend fields.
  - **TC-02:** Constraint changed — prior `S6B/cac`, current `S3/cvr` yields `constraint_changed=true`.
  - **TC-03:** First run — no prior run yields `comparison_to_prior_run=null`.
  - **TC-04:** Deterministic prior selection — unsorted directory listing still selects correct prior by run ID ordering.
  - **TC-05:** Write path — snapshot written to canonical path with valid JSON.
  - **TC-06:** Skip invalid prior — nearest prior run lacking diagnosis snapshot is skipped; next earlier valid snapshot is used.
  - **Acceptance coverage:** TC-01 covers criteria 1,2,5; TC-02 covers criterion 5; TC-03 covers criterion 6; TC-04 covers criterion 3; TC-05 covers criterion 2; TC-06 covers criterion 3.
  - **Test type:** integration
  - **Test location:** `scripts/src/startup-loop/__tests__/diagnosis-snapshot.test.ts` (new)
  - **Run:** `npx jest --config scripts/jest.config.cjs --testPathPattern=diagnosis-snapshot`
- **Affects:**
  - `scripts/src/startup-loop/diagnosis-snapshot.ts` (new)
  - `scripts/src/startup-loop/__tests__/diagnosis-snapshot.test.ts` (new)

### BL-05: Implement idempotent bottleneck history ledger and persistence check

- **Type:** IMPLEMENT
- **Deliverable:** code-change
- **Execution-Skill:** /lp-build
- **Confidence:** 87%
  - Implementation: 87% — JSONL append + dedupe by run_id is straightforward
  - Approach: 88% — matches existing append-only ledger patterns
  - Impact: 86% — local file updates only
- **Depends on:** BL-04
- **Scope:**
  - Maintain `bottleneck-history.jsonl` with one logical entry per S10-completed run.
  - Enforce idempotent append by `run_id` (duplicate writes are no-ops).
  - Provide rolling-window reads and persistence checks using `constraint_key`.
  - Encode no-bottleneck and insufficient-data runs explicitly so persistence streaks break deterministically.
- **Acceptance:**
  - Function `appendBottleneckHistory(business, diagnosis): { appended: boolean }` exists.
  - History file path:
    - `docs/business-os/startup-baselines/<BIZ>/bottleneck-history.jsonl`
  - Entry schema:
    - `{ timestamp, run_id, diagnosis_status, constraint_key, constraint_stage, constraint_metric, reason_code, severity }`
    - for `no_bottleneck`: `constraint_key="none"`, `severity="none"`
    - for `insufficient_data` with no constraint: `constraint_key="insufficient_data"`, `severity="none"`
  - Duplicate `run_id` handling:
    - if an entry with same `run_id` already exists, skip append (`appended=false`)
  - Function `getRecentBottlenecks(business, N): BottleneckEntry[]` returns last `N` entries in ledger order.
  - Function `checkConstraintPersistence(business, N): { persistent: boolean, constraint_key: string | null }` checks last `N` consecutive entries.
    - entries with `constraint_key in {"none", "insufficient_data"}` are persistence breakers
- **Test contract:**
  - **TC-01:** Append happy path — valid diagnosis appends one JSONL line.
  - **TC-02:** Idempotent duplicate — same `run_id` appended twice results in one ledger entry.
  - **TC-03:** Rolling window — with 5 entries, requesting 3 returns last 3.
  - **TC-04:** Persistent constraint — last 3 identical `constraint_key` values returns persistent true.
  - **TC-05:** Non-persistent — mixed keys returns persistent false.
  - **TC-06:** Empty history — returns persistent false and null key.
  - **TC-07:** No-bottleneck breaker — history `[A, A, none, A]` yields persistence false for `N=3`.
  - **Acceptance coverage:** TC-01 covers criteria 1-3; TC-02 covers criterion 4; TC-03 covers criterion 5; TC-04/TC-05/TC-06/TC-07 cover criterion 6.
  - **Test type:** integration
  - **Test location:** `scripts/src/startup-loop/__tests__/bottleneck-history.test.ts` (new)
  - **Run:** `npx jest --config scripts/jest.config.cjs --testPathPattern=bottleneck-history`
- **Affects:**
  - `scripts/src/startup-loop/bottleneck-history.ts` (new)
  - `scripts/src/startup-loop/__tests__/bottleneck-history.test.ts` (new)

### BL-06: Add guarded replan trigger with severity gate and lifecycle state

- **Type:** IMPLEMENT
- **Deliverable:** code-change
- **Execution-Skill:** /lp-build
- **Confidence:** 86%
  - Implementation: 86% — state machine is small and deterministic
  - Approach: 87% — guarded signaling follows autonomy policy
  - Impact: 85% — signal-file only, no autonomous control-plane mutation
- **Depends on:** BL-05
- **Scope:**
  - Evaluate persistence + severity gate after each new diagnosis.
  - Create/update `replan-trigger.json` with lifecycle fields.
  - Preserve operator signal unless resolution criteria are met.
- **Acceptance:**
  - Function `checkAndTriggerReplan(business, diagnosis, options): ReplanTrigger | null` exists.
  - Options:
    - `persistenceThreshold` (default `3`)
    - `minSeverity` (`"moderate" | "critical"`, default `"moderate"`)
    - `autoResolveAfterNonPersistentRuns` (default `2`)
  - Trigger file path:
    - `docs/business-os/startup-baselines/<BIZ>/replan-trigger.json`
  - Trigger file schema includes:
    - `status`, `created_at`, `last_evaluated_at`, `resolved_at?`
    - `reopened_count`, `last_reopened_at?`
    - `constraint`, `run_history`, `reason`, `recommended_focus`
    - `min_severity`, `persistence_threshold`
  - Trigger behavior:
    - opens/updates when persistence is true and severity meets gate
    - does not auto-delete on first non-persistent run
    - resolves only after configured non-persistent streak or explicit operator resolution
    - resolved trigger reopens (`status=resolved -> open`) if persistence criteria are met again; increment `reopened_count`
  - Does not execute `/lp-replan`; it writes a guarded signal only.
- **Test contract:**
  - **TC-01:** Open trigger — 3 persistent moderate+ runs create `status=open` trigger file.
  - **TC-02:** Severity gate — persistent `minor` constraint does not open trigger when `minSeverity=moderate`.
  - **TC-03:** Non-persistent single run — existing open trigger remains open with updated `last_evaluated_at`.
  - **TC-04:** Auto-resolve — after configured non-persistent streak, status transitions to `resolved`.
  - **TC-05:** Custom threshold — `persistenceThreshold=5` with 4 runs does not trigger.
  - **TC-06:** Recommended focus — known constraints map to deterministic recommendations.
  - **TC-07:** Reopen semantics — resolved trigger + renewed persistence reopens trigger and increments `reopened_count`.
  - **Acceptance coverage:** TC-01 covers criteria 1-4; TC-02 covers criterion 2; TC-03/TC-04 cover criterion 5; TC-05 covers criterion 2; TC-06 covers criterion 4; TC-07 covers criterion 5.
  - **Test type:** integration
  - **Test location:** `scripts/src/startup-loop/__tests__/replan-trigger.test.ts` (new)
  - **Run:** `npx jest --config scripts/jest.config.cjs --testPathPattern=replan-trigger`
- **Affects:**
  - `scripts/src/startup-loop/replan-trigger.ts` (new)
  - `scripts/src/startup-loop/__tests__/replan-trigger.test.ts` (new)

### BL-07: Integrate diagnosis pipeline into S10 completion flow

- **Type:** IMPLEMENT
- **Deliverable:** code-change
- **Execution-Skill:** /lp-build
- **Confidence:** 84%
  - Implementation: 84% — clear hook point in S10 completion
  - Approach: 85% — preserves existing S10 flow with additive behavior
  - Impact: 83% — non-breaking integration with warning-on-failure handling
- **Depends on:** BL-06
- **Scope:**
  - On S10 completion, run:
    1. BL-04 snapshot generation
    2. BL-05 history append/persistence check
    3. BL-06 replan signal evaluation
  - Add diagnosis artifact pointer to S10 `stage-result.json`.
  - Update user workflow documentation.
- **Acceptance:**
  - S10 completion invokes diagnosis pipeline automatically.
  - Snapshot exists at:
    - `docs/business-os/startup-baselines/<BIZ>/runs/<run_id>/bottleneck-diagnosis.json`
  - History ledger updates idempotently for the run.
  - Trigger file updates per BL-06 lifecycle.
  - S10 `stage-result.json` includes:
    - `artifacts: { ..., bottleneck_diagnosis: "bottleneck-diagnosis.json" }`
  - Documentation updated in:
    - `docs/business-os/startup-loop-workflow.user.md`
  - If diagnosis fails, S10 completion continues with warning log (no hard failure).
- **Test contract:**
  - **TC-01:** Happy path — S10 completion generates snapshot, updates history, evaluates trigger.
  - **TC-02:** First run — snapshot generated with null prior comparison.
  - **TC-03:** Persistence path — third persistent moderate+ run results in open trigger.
  - **TC-04:** Missing artifact path — warnings logged, S10 completion still succeeds.
  - **TC-05:** Stage-result artifact pointer — `bottleneck_diagnosis` path present.
  - **Acceptance coverage:** TC-01 covers criteria 1-4; TC-02 covers criterion 2; TC-03 covers criterion 4; TC-04 covers criterion 7; TC-05 covers criterion 5.
  - **Test type:** integration
  - **Test location:** `scripts/src/startup-loop/__tests__/s10-diagnosis-integration.test.ts` (new)
  - **Run:** `npx jest --config scripts/jest.config.cjs --testPathPattern=s10-diagnosis-integration`
- **Affects:**
  - `scripts/src/startup-loop/s10-completion.ts` (modify existing or new)
  - `scripts/src/startup-loop/__tests__/s10-diagnosis-integration.test.ts` (new)
  - `docs/business-os/startup-loop-workflow.user.md` (documentation update)

## Validation Strategy

1. Finalize BL-01 schema and decision contracts before implementation.
2. Unit-test BL-02/BL-03 pure logic with explicit edge-case fixtures.
3. Integration-test BL-04/BL-05/BL-06/BL-07 with temporary filesystem fixtures.
4. Simulate deterministic 3-run persistent sequence and verify signal lifecycle transitions.
5. Validate idempotency by re-running S10 integration for the same `run_id`.

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Artifact format drift breaks extraction | Medium | Add tolerant parser + schema guards + warning logs for missing fields |
| Detector selects non-actionable symptoms | Medium | Enforce primitive-first attribution + include ranked alternatives for operator review |
| Trigger noise from minor misses | Low | `minSeverity` gate default `moderate`; require persistence threshold |
| Trigger state churn from single-run changes | Medium | Lifecycle state with delayed auto-resolve and explicit operator acknowledgment |

## What Would Make Confidence >=90%

1. Ship BL-01 schema doc with canonical JSON examples and worked ranking examples.
2. Validate BL-02 extraction on at least 3 real businesses (`BRIK`, `HEAD`, `PET`).
3. Replay 10 historical scenarios through BL-03 and compare against operator judgments.
4. Dry-run BL-07 end-to-end on one complete run and verify idempotent re-run behavior.
5. Run operator review on first 5 trigger files for actionability and false-positive rate.

## Decision Log

### DL-01: Persistence threshold N=3

**Decided:** 2026-02-13
**Chosen option:** `N=3` consecutive runs before opening a replan trigger.

**Rationale:**
- Reduces transient-noise triggers relative to `N=2`.
- Still responds quickly enough for current run frequency.
- Works with guarded signaling (manual operator handoff).

**Alternative considered:** `N=5` — rejected as too slow.

---

### DL-02: Direction-aware normalized miss + primitive-first attribution

**Decided:** 2026-02-13
**Chosen option:** Direction-aware normalized miss with deterministic ranking and upstream attribution rules.

**Algorithm summary:**
1. Compute `miss` by direction so higher always means worse.
2. Classify severity (`critical/moderate/minor/none`) with explicit no-bottleneck threshold (`<5%`).
3. Rank by `miss`; apply deterministic tiebreakers (`upstream_priority_order`, metric id).
4. Prefer primitive drivers over derived outcomes (`orders`, `revenue`) when drivers are available.
5. Promote normalized blocked-stage constraints as critical and rank them above metric constraints.

**Rationale:**
- Removes threshold contradictions.
- Avoids selecting downstream symptoms as primary constraints.
- Produces stable, explainable results for operators.

**Alternative considered:** weighted fixed-score model — rejected for higher tuning burden and lower transparency.

---

### DL-03: Guarded trigger with lifecycle, not autonomous replan execution

**Decided:** 2026-02-13
**Chosen option:** Maintain `replan-trigger.json` lifecycle state (`open/acknowledged/resolved`) and require manual `/lp-replan` invocation.

**Rationale:**
- Matches autonomy policy for guarded control-plane actions.
- Avoids accidental replan loops.
- Preserves operator context and decision authority.

**Alternative considered:** immediate auto-execution of `/lp-replan` — rejected for v1 risk profile.

---
