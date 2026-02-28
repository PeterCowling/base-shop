---
Type: Plan
Status: Archived
Domain: Platform / Business-OS
Workstream: Mixed
Created: 2026-02-25
Last-reviewed: 2026-02-25
Last-updated: 2026-02-25
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: lp-do-ideas-source-trigger-operating-model
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-replan, lp-do-factcheck
Overall-confidence: 83%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort (S=1, M=2, L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: on
Business-Unit: BOS
Card-ID: none
artifact: plan
---

# lp-do-ideas Source-Triggered Operating Model Plan

## Summary
This plan upgrades the current pack-diff-biased idea intake model to a source-triggered, invariant-enforced operating system with bounded fan-out and queue throughput controls. The implementation sequence is contract-first: registry/schema and migration rules land before runtime behavior changes, then clustering/materiality/anti-loop enforcement is added, followed by lane governance, reflection debt handling, and observability rollups. The rollout includes explicit cutover phases to avoid double-trigger and silent under-trigger during migration from pack-trigger semantics. A simulation checkpoint validates both the happy path and pathological suppression path before production rollout. This is planning-only; no auto-build handoff is requested.

## Active tasks
- [x] TASK-01: Baseline current intake/fan-out behavior and migration inventory (Complete 2026-02-25)
- [x] TASK-02: Registry v2 contract and trigger taxonomy (Complete 2026-02-25)
- [x] TASK-03: Migration tooling, compatibility defaults, and classification completion (Complete 2026-02-25)
- [x] TASK-04: Deterministic materiality and fingerprint primitives (Complete 2026-02-25)
- [x] TASK-05A: Source-trigger intake and cutover phase state machine (Complete 2026-02-25)
- [x] TASK-05B: Propagation mode enforcement and provenance tagging (Complete 2026-02-25)
- [x] TASK-06: Cluster identity model and cluster-aware dedupe transition (Complete 2026-02-25)
- [x] TASK-07: Anti-loop invariant enforcement (Complete 2026-02-25)
- [x] TASK-08: Dual-lane scheduler and prioritization governance (Complete 2026-02-25)
- [x] TASK-09: Reflection debt soft-gate mechanism + contract alignment (Complete 2026-02-25)
- [x] TASK-10: Observability rollup and alert thresholds (Complete 2026-02-25)
- [x] TASK-11: E2E simulation checkpoint and rollout decision (Complete 2026-02-25)

## Goals
- Implement source-trigger intake from classified source artifacts and suppress projection-trigger churn.
- Enforce deterministic clustering/materiality/lineage controls to prevent runaway fan-out and loops.
- Preserve trial/live safety boundaries and monotonic queue semantics.
- Add dual-lane queue governance (`DO`, `IMPROVE`) with bounded WIP and transparent prioritization.
- Establish migration and cutover controls that prevent double-trigger or silent under-trigger.
- Add deterministic metrics and threshold-based operational actions.

## Non-goals
- Activating `lp-do-ideas` live mode in this plan.
- Replacing unrelated startup-loop stage topology beyond the contracts required for this feature.
- Re-architecting all historical idea artifacts.
- Tuning final prioritization coefficients beyond an initial safe default.

## Constraints & Assumptions
- Constraints:
  - Preserve existing queue idempotency and monotonic transition guarantees.
  - Keep unclassified artifacts fail-closed during migration.
  - Keep projection artifacts non-trigger by default.
  - Keep semantic source-to-source auto rewrites prohibited.
- Assumptions:
  - Existing runtime surfaces can carry additive dispatch metadata (`root_event_id`, `cluster_key`, `lineage_depth`, `truth_fingerprint`).
  - Phased lane default (`1:1` then `2:1`) is acceptable until operator overrides.
  - Reflection debt enforcement via soft gate is operationally acceptable.

## Fact-Find Reference
- Related brief: `docs/plans/lp-do-ideas-source-trigger-operating-model/fact-find.md`
- Key findings used:
  - Current runtime remains pack-diff-centric despite source-inclusive architecture intent.
  - Dedupe is exact-replay strong but not cluster-semantic.
  - Propagation must separate projection regeneration from semantic source rewrites.
  - Anti-loop controls require explicit invariants with deterministic fingerprints.
  - Migration needs explicit cutover to avoid duplicate or missing admission.

## Proposed Approach
- Option A: Keep pack-trigger intake and add only queue throttling.
  - Pros: lower short-term code churn.
  - Cons: keeps root signal ambiguity and duplicate-trigger risk.
- Option B: Source-trigger model with phased cutover, deterministic clustering, and invariant enforcement.
  - Pros: solves signal quality and loop/fan-out risk at root cause.
  - Cons: larger contract + runtime change set.
- Option C: Hard stop all triggers during full redesign, then relaunch.
  - Pros: zero migration overlap complexity.
  - Cons: freezes pipeline usefulness and loses incremental learning.
- Chosen approach:
  - **Option B**.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes (validated at TASK-11 checkpoint)
- Auto-build eligible: No

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | INVESTIGATE | Baseline fan-out/loop metrics + registry inventory | 85% | S | Complete (2026-02-25) | - | TASK-02, TASK-03, TASK-05A |
| TASK-02 | IMPLEMENT | Registry v2 contract (`artifact_class`, `trigger_policy`, `propagation_mode`) | 85% | M | Complete (2026-02-25) | TASK-01 | TASK-03, TASK-05A, TASK-05B, TASK-09 |
| TASK-03 | IMPLEMENT | Registry v1->v2 migration tool + compatibility rules + pilot classification output | 83% | M | Complete (2026-02-25) | TASK-01, TASK-02 | TASK-05A, TASK-05B |
| TASK-04 | IMPLEMENT | Deterministic truth/materiality fingerprint primitives | 84% | M | Complete (2026-02-25) | TASK-01 | TASK-05A, TASK-05B, TASK-06, TASK-07 |
| TASK-05A | IMPLEMENT | Source-trigger intake + explicit cutover phase state machine | 82% | L | Complete (2026-02-25) | TASK-02, TASK-03, TASK-04 | TASK-05B, TASK-06, TASK-07 |
| TASK-05B | IMPLEMENT | Propagation mode enforcement + provenance tagging | 81% | M | Complete (2026-02-25) | TASK-02, TASK-03, TASK-04, TASK-05A | TASK-07, TASK-10 |
| TASK-06 | IMPLEMENT | Cluster identity model + cluster-aware dedupe (dual-key transition) | 81% | L | Complete (2026-02-25) | TASK-04, TASK-05A | TASK-07, TASK-08, TASK-10 |
| TASK-07 | IMPLEMENT | Anti-loop invariant enforcement (lineage/cooldown/self-trigger) | 80% | L | Complete (2026-02-25) | TASK-05A, TASK-05B, TASK-06 | TASK-09, TASK-10 |
| TASK-08 | IMPLEMENT | Dual-lane scheduler (`DO`/`IMPROVE`) and aging policy | 82% | M | Complete (2026-02-25) | TASK-06 | TASK-09, TASK-10 |
| TASK-09 | IMPLEMENT | Reflection debt soft-gate mechanism + contract alignment | 80% | M | Complete (2026-02-25) | TASK-02, TASK-07, TASK-08 | TASK-10, TASK-11 |
| TASK-10 | IMPLEMENT | Observability rollups and threshold-driven ops actions | 82% | M | Complete (2026-02-25) | TASK-05B, TASK-06, TASK-07, TASK-08, TASK-09 | TASK-11 |
| TASK-11 | CHECKPOINT | E2E simulation and rollout go/no-go | 95% | S | Complete (2026-02-25) | TASK-10 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Establish baseline and migration inventory before contract freeze |
| 2 | TASK-02, TASK-04 | TASK-01 | Contract and deterministic primitives can run in parallel |
| 3 | TASK-03 | TASK-01, TASK-02 | Migration depends on v2 schema |
| 4 | TASK-05A | TASK-02, TASK-03, TASK-04 | Intake/cutover state machine after contract + migration + materiality |
| 5 | TASK-05B, TASK-06 | TASK-05A (+ upstream deps) | Propagation semantics and cluster dedupe transition can proceed together |
| 6 | TASK-07, TASK-08 | TASK-05B, TASK-06 | Invariants + lane scheduling on stabilized admission semantics |
| 7 | TASK-09 | TASK-02, TASK-07, TASK-08 | Reflection debt depends on contracts + invariants + lane model |
| 8 | TASK-10 | TASK-05B, TASK-06, TASK-07, TASK-08, TASK-09 | Metrics/alerts after runtime semantics are complete |
| 9 | TASK-11 | TASK-10 | Simulation gate before rollout |

## Tasks

### TASK-01: Baseline current intake/fan-out behavior and migration inventory
- **Type:** INVESTIGATE
- **Deliverable:**
  - `docs/plans/lp-do-ideas-source-trigger-operating-model/artifacts/baseline-metrics.md`
  - `docs/plans/lp-do-ideas-source-trigger-operating-model/artifacts/registry-v1-inventory.md`
  - `docs/plans/lp-do-ideas-source-trigger-operating-model/artifacts/baseline-method-notes.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-25)
- **Affects:** `docs/business-os/startup-loop/ideas/trial/queue-state.json`, `docs/business-os/startup-loop/ideas/lp-do-ideas-standing-registry.schema.json`, `[readonly] docs/business-os/startup-loop/two-layer-model.md`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-05A
- **Confidence:** 85%
  - Implementation: 85% - telemetry and queue artifacts are available.
  - Approach: 85% - baseline-first reduces migration blindness.
  - Impact: 85% - informs thresholds and cutover safety.
- **Questions to answer:**
  - What are current `fan_out_raw`, `fan_out_admitted`, and suppression patterns?
  - Which current monitored artifacts are aggregate/projection-like vs source-like?
  - What unknown/unclassified registry entries exist?
- **Acceptance:**
  - Baseline metrics computed with explicit formulas.
  - Registry inventory lists candidate v2 class and trigger policy for each entry.
  - Unknown artifacts and coverage risks are explicit.
  - If `candidate_count` history is unavailable, baseline notes explicitly record fallback (`admitted-only proxy` or controlled replay in observe-only mode) and resulting limits.
- **Validation contract:** Baseline report reproducible from queue artifacts + registry snapshot, or from controlled replay with stated limitations.
- **Planning validation:**
  - Checks run: `cat docs/business-os/startup-loop/ideas/trial/queue-state.json`; `sed -n` on registry schema and fact-find.
  - Validation artifacts: fact-find + current queue snapshot.
  - Unexpected findings: historical candidate count availability may be partial.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** Adds baseline evidence artifacts under plan folder.
- **Notes / references:**
  - BR-07 metric definitions, BR-08 migration defaults.
  - Build completion evidence (2026-02-25):
    - Added:
      - `docs/plans/lp-do-ideas-source-trigger-operating-model/artifacts/baseline-metrics.md`
      - `docs/plans/lp-do-ideas-source-trigger-operating-model/artifacts/registry-v1-inventory.md`
      - `docs/plans/lp-do-ideas-source-trigger-operating-model/artifacts/baseline-method-notes.md`
    - Key findings captured:
      - `fan_out_admitted` proxy is computable from current queue snapshot (`1.00`), but `fan_out_raw` and `loop_incidence` are `N/A` until candidate/loop-guard counters are persisted.
      - Trial contract paths for `dispatch-ledger.jsonl`, `telemetry.jsonl`, and `standing-registry.json` are currently missing on disk.
      - Current monitor behavior is implicit and pack-oriented; process-level source candidates are inventoried but not registry-backed.
    - Commands run:
      - `cat docs/business-os/startup-loop/ideas/trial/queue-state.json`
      - `cat docs/business-os/startup-loop/ideas/lp-do-ideas-standing-registry.schema.json`
      - `sed -n '1,260p' docs/business-os/startup-loop/two-layer-model.md`
      - `rg -n "Read current Layer A aggregate packs|MARKET-11|SELL-07|PRODUCTS-07|LOGISTICS-07" .claude/skills/idea-scan/SKILL.md`
      - `rg -n "market-pack\\.user\\.md|sell-pack\\.user\\.md|product-pack\\.user\\.md|logistics-pack\\.user\\.md" docs/business-os/startup-loop/artifact-registry.md`
  - Downstream confidence propagation after TASK-01 completion (2026-02-25):
    - TASK-02, TASK-03, TASK-04 re-scored as neutral/affirming with no threshold change; confidences unchanged.

### TASK-02: Registry v2 contract and trigger taxonomy
- **Type:** IMPLEMENT
- **Deliverable:**
  - `docs/business-os/startup-loop/ideas/lp-do-ideas-standing-registry.schema.json` (v2)
  - `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md` (v2 taxonomy/cutover alignment)
  - `docs/plans/lp-do-ideas-source-trigger-operating-model/artifacts/contract-id-reference-map.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-02-25)
- **Affects:** `docs/business-os/startup-loop/ideas/lp-do-ideas-standing-registry.schema.json`, `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md`, `docs/plans/lp-do-ideas-source-trigger-operating-model/artifacts/contract-id-reference-map.md` (scope-expanded from initial Affects to satisfy deliverable contract), `[readonly] docs/plans/lp-do-ideas-source-trigger-operating-model/fact-find.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-05A, TASK-05B, TASK-09
- **Confidence:** 85%
  - Implementation: 85% - schema extension pattern already established.
  - Approach: 85% - contract-first prevents runtime drift.
  - Impact: 85% - enables explicit trigger control and propagation mode.
- **Acceptance:**
  - Registry v2 fields exist: `artifact_class`, `trigger_policy`, `propagation_mode`, `depends_on`, `produces`.
  - Unknown artifact default is fail-closed.
  - Aggregate pack default classification is explicitly pinned as `projection_summary + manual_override_only` in cutover phases.
  - Contract ID references used in this plan resolve against fact-find ACC/INV IDs.
- **Validation contract (TC-02):**
  - TC-01: valid v2 entry passes schema validation.
  - TC-02: missing `artifact_class` in v2 mode fails.
  - TC-03: invalid trigger policy fails.
  - TC-04: contract doc states cutover phases and fail-open prohibition.
  - TC-05: ACC/INV reference map has no unresolved IDs.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: reviewed fact-find BR-01/BR-08 and current registry schema.
  - Validation artifacts: current v1 schema + baseline inventory.
  - Unexpected findings: compatibility semantics required to avoid abrupt trigger loss.
- **Consumer tracing (required):**
  - New outputs:
    - Registry v2 fields consumed by intake classifier, propagation handlers, and migration tooling (TASK-03/TASK-05A/TASK-05B).
  - Modified behavior:
    - Classification defaults alter admission eligibility for legacy pack artifacts.
- **Scouts:** None: bounded schema/doc scope.
- **Edge Cases & Hardening:** enforce enum values + additionalProperties false.
- **What would make this >=90%:** one fixture pack proving compatibility default behavior.
- **Rollout / rollback:**
  - Rollout: contract first, runtime later.
  - Rollback: restore v1 schema snapshot and compatibility references.
- **Documentation impact:** updates canonical ideas contracts.
- **Notes / references:**
  - BR-01, ACC-01..04.
  - Downstream confidence propagation after TASK-01 completion (2026-02-25): confidence remains 85%; TASK-01 evidence confirms taxonomy and fail-closed migration preconditions while surfacing missing live registry artifact as an explicit implementation input.
  - Build completion evidence (2026-02-25):
    - Updated:
      - `docs/business-os/startup-loop/ideas/lp-do-ideas-standing-registry.schema.json`
      - `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md`
      - `docs/plans/lp-do-ideas-source-trigger-operating-model/artifacts/contract-id-reference-map.md`
    - TC-02 validation results:
      - TC-01 pass: valid registry.v2 entry validates.
      - TC-02 pass: missing `artifact_class` fails schema validation.
      - TC-03 pass: invalid `trigger_policy` fails schema validation.
      - TC-04 pass: trial contract includes cutover phases and explicit fail-open prohibition.
      - TC-05 pass: plan ACC/INV references resolve against fact-find IDs.
    - Commands run:
      - `python3` JSON Schema validation harness using `jsonschema.validate` for TC-01..03.
      - `python3` plan/fact-find ACC/INV cross-reference check for TC-05.

### TASK-03: Registry migration tooling and compatibility defaults
- **Type:** IMPLEMENT
- **Deliverable:**
  - `scripts/src/startup-loop/lp-do-ideas-registry-migrate-v1-v2.ts`
  - `scripts/src/startup-loop/__tests__/lp-do-ideas-registry-migrate-v1-v2.test.ts`
  - `docs/plans/lp-do-ideas-source-trigger-operating-model/artifacts/registry-migration-report-template.md`
  - `docs/plans/lp-do-ideas-source-trigger-operating-model/artifacts/registry-v2-classification-pilot.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-02-25)
- **Affects:** `scripts/src/startup-loop/`, `docs/business-os/startup-loop/ideas/`, `docs/plans/lp-do-ideas-source-trigger-operating-model/artifacts/`, `[readonly] docs/business-os/startup-loop/ideas/lp-do-ideas-standing-registry.schema.json`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-05A, TASK-05B
- **Confidence:** 83%
  - Implementation: 83% - deterministic transform is straightforward but edge-rich.
  - Approach: 83% - explicit migration prevents ad-hoc manual edits.
  - Impact: 83% - lowers rollout risk of silent under-trigger.
- **Acceptance:**
  - Migration script transforms v1 entries into v2-compatible entries with conservative defaults.
  - Report includes counts: classified, inferred, unknown, blocked.
  - No fail-open output entries.
  - Pilot classification output covers all current pack-trigger artifacts plus primary source artifacts for the pilot business scope.
- **Validation contract (TC-03):**
  - TC-01: known v1 entries produce valid v2 output.
  - TC-02: unknown entries are flagged and default to non-trigger.
  - TC-03: aggregate pack entries map to cutover-safe defaults.
  - TC-04: pilot-scope artifact list has no unclassified trigger-eligible entries.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: baseline inventory mapping and schema constraints.
  - Validation artifacts: TASK-01 inventory + TASK-02 schema.
  - Unexpected findings: none.
- **Consumer tracing (required):**
  - New outputs:
    - v2 registry consumed by intake, propagation, and admission logic in TASK-05A/TASK-05B.
    - migration report consumed by rollout checkpoint in TASK-11.
  - Modified behavior:
    - legacy entries now classed explicitly rather than implicit behavior.
- **Scouts:** None: deterministic transform.
- **Edge Cases & Hardening:** malformed input rows, duplicate artifact IDs, partial entries.
- **What would make this >=90%:** dry-run on at least one real business registry snapshot.
- **Rollout / rollback:**
  - Rollout: dry-run then write mode.
  - Rollback: retain v1 snapshot and restore.
- **Documentation impact:** migration usage notes in plan artifacts.
- **Notes / references:**
  - BR-08, ACC-22.
  - Downstream confidence propagation after TASK-01 completion (2026-02-25): confidence remains 83%; TASK-01 inventory reduces ambiguity on implicit monitored entries and required pilot classification scope.
  - Downstream confidence propagation after TASK-02 completion (2026-02-25): confidence remains 83%; registry v2 contract is now fixed, reducing specification risk without changing implementation scope.
  - Build completion evidence (2026-02-25):
    - Added:
      - `scripts/src/startup-loop/lp-do-ideas-registry-migrate-v1-v2.ts`
      - `scripts/src/startup-loop/__tests__/lp-do-ideas-registry-migrate-v1-v2.test.ts`
      - `docs/plans/lp-do-ideas-source-trigger-operating-model/artifacts/registry-migration-report-template.md`
      - `docs/plans/lp-do-ideas-source-trigger-operating-model/artifacts/registry-v2-classification-pilot.md`
    - TC-03 validation results:
      - TC-01 pass: known v1 entries migrate to v2 with required taxonomy fields.
      - TC-02 pass: unknown entries are flagged and default to non-trigger fail-closed output.
      - TC-03 pass: aggregate pack entries map to `projection_summary + manual_override_only`.
      - TC-04 pass: pilot scope includes pack + primary source entries with no unclassified trigger-eligible rows.
    - Commands run:
      - `pnpm --filter scripts test -- src/startup-loop/__tests__/lp-do-ideas-registry-migrate-v1-v2.test.ts`
      - `pnpm --filter scripts exec tsc -p tsconfig.json --noEmit`
      - `pnpm --filter scripts exec eslint src/startup-loop/lp-do-ideas-registry-migrate-v1-v2.ts src/startup-loop/__tests__/lp-do-ideas-registry-migrate-v1-v2.test.ts`

### TASK-04: Deterministic truth/materiality fingerprint primitives
- **Type:** IMPLEMENT
- **Deliverable:**
  - `scripts/src/startup-loop/lp-do-ideas-fingerprint.ts`
  - `scripts/src/startup-loop/__tests__/lp-do-ideas-fingerprint.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-02-25)
- **Affects:** `scripts/src/startup-loop/`, `[readonly] docs/plans/lp-do-ideas-source-trigger-operating-model/fact-find.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-05A, TASK-05B, TASK-06, TASK-07
- **Confidence:** 84%
  - Implementation: 84% - normalization rules are explicit in appendix.
  - Approach: 84% - deterministic fingerprints are mandatory for stable dedupe.
  - Impact: 84% - directly prevents false cluster churn.
- **Acceptance:**
  - Fingerprint functions exclude metadata/format-only noise.
  - `truth_fingerprint` and `normalized_semantic_diff_hash` are deterministic.
  - Non-deterministic text inputs are forbidden in fingerprint path.
- **Validation contract (TC-04):**
  - TC-01: same semantic content with formatting differences -> same fingerprint.
  - TC-02: metadata-only changes -> non-material.
  - TC-03: semantic body change -> fingerprint change.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: appendix A rules and current dispatch fields.
  - Validation artifacts: fact-find deterministic fingerprint appendix.
  - Unexpected findings: none.
- **Consumer tracing (required):**
  - New outputs:
    - fingerprint values consumed by TASK-05A intake and TASK-06 cluster logic.
  - Modified behavior:
    - materiality gate replaces section-name-only heuristics for rerun suppression.
- **Scouts:** None: rule set is explicit.
- **Edge Cases & Hardening:** markdown tables, regenerated index blocks, reordered evidence refs.
- **What would make this >=90%:** corpus test over historical sample diffs.
- **Rollout / rollback:**
  - Rollout: additive utility, then wire into intake.
  - Rollback: detach intake from new utilities.
- **Documentation impact:** update contracts with deterministic rule references.
- **Notes / references:**
  - BR-03, BR-04, Appendix A.
  - Downstream confidence propagation after TASK-01 completion (2026-02-25): confidence remains 84%; TASK-01 confirms candidate-level telemetry gaps that TASK-04 deterministic primitives must tolerate until TASK-10 instrumentation is active.
  - Build completion evidence (2026-02-25):
    - Added:
      - `scripts/src/startup-loop/lp-do-ideas-fingerprint.ts`
      - `scripts/src/startup-loop/__tests__/lp-do-ideas-fingerprint.test.ts`
    - TC-04 validation results:
      - TC-01 pass: formatting-only changes produce identical truth fingerprints.
      - TC-02 pass: metadata-only changes are non-material with zero semantic diff fragments.
      - TC-03 pass: semantic body changes alter both truth and semantic diff fingerprints.
      - Determinism hardening pass: cluster fingerprint is stable under evidence ref ordering and rejects forbidden non-deterministic summary fields.
    - Commands run:
      - `pnpm --filter scripts test -- src/startup-loop/__tests__/lp-do-ideas-fingerprint.test.ts`
      - `pnpm --filter scripts exec tsc -p tsconfig.json --noEmit`
      - `pnpm --filter scripts exec eslint src/startup-loop/lp-do-ideas-fingerprint.ts src/startup-loop/__tests__/lp-do-ideas-fingerprint.test.ts`
      - `bash scripts/validate-changes.sh` (failed outside task scope due pre-existing `@apps/reception` typecheck error in `src/components/ClientProviders.tsx`).

### TASK-05A: Source-trigger intake and cutover phase state machine
- **Type:** IMPLEMENT
- **Deliverable:**
  - `scripts/src/startup-loop/lp-do-ideas-trial.ts` (source-trigger intake + phase state machine)
  - `scripts/src/startup-loop/__tests__/lp-do-ideas-trial.test.ts` (phase behavior tests)
  - `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md` (cutover phase table)
  - `.claude/skills/lp-do-ideas/SKILL.md` (source-trigger policy)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** L
- **Status:** Complete (2026-02-25)
- **Affects:** `scripts/src/startup-loop/lp-do-ideas-trial.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-trial.test.ts`, `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md`, `.claude/skills/lp-do-ideas/SKILL.md`, `[readonly] docs/business-os/startup-loop/loop-spec.yaml`
- **Depends on:** TASK-02, TASK-03, TASK-04
- **Blocks:** TASK-05B, TASK-06, TASK-07
- **Confidence:** 82%
  - Implementation: 82% - moderate runtime and contract interplay.
  - Approach: 82% - phase-explicit cutover is the safest migration path.
  - Impact: 82% - largest effect on signal quality and duplicate prevention.
- **Acceptance:**
  - Cutover state machine is explicit with phases: P0 legacy, P1 shadow, P2 source-primary, P3 pack-disabled.
  - Admission behavior is deterministic per phase and matches contract docs.
  - Pack-only diffs cannot admit in P2/P3 unless manual override.
  - Phase P1 emits shadow telemetry fields (`root_event_id`, candidate counts, suppression reason pre-codes) before full enforcement.
- **Validation contract (TC-05A):**
  - TC-01: source delta admits eligible cluster in P2/P3.
  - TC-02: pack-only delta in P2/P3 yields no admission.
  - TC-03: projection artifact delta yields no admission in all phases.
  - TC-04: unknown artifact yields warning + no admission.
  - TC-05: phase transition tests assert no double-admission when both pack and source deltas are present.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - reviewed current trial orchestrator path assumptions.
    - verified cutover contract in fact-find BR-01 and cutover section.
  - Validation artifacts: current orchestrator tests + migration outputs.
  - Unexpected findings: none.
- **Consumer tracing (required):**
  - New outputs:
    - phase-tagged admission events consumed by queue and routing adapter.
  - Modified behavior:
    - admission logic now keyed by registry class/policy and source truth evidence.
- **Scouts:** None: core runtime change is bounded by tests and phase gates.
- **Edge Cases & Hardening:** missing registry entries, multi-artifact commits, mixed source+projection deltas.
- **What would make this >=90%:** replay test using sampled historical deltas across one business.
- **Rollout / rollback:**
  - Rollout: enable P1 shadow first.
  - Rollback: pin phase to prior state and restore previous admission behavior.
- **Documentation impact:** update skill-level intake semantics and trial contract phase table.
- **Notes / references:**
  - BR-01, cutover rule, ACC-04.
  - Downstream confidence propagation after TASK-02 completion (2026-02-25): confidence remains 82%; cutover implementation can now assume explicit `trigger_policy` and aggregate-pack default classification contract.
  - Downstream confidence propagation after TASK-04 completion (2026-02-25): confidence remains 82%; deterministic truth/materiality primitives are now available for P1 shadow telemetry and P2/P3 source-admission gating with no scope increase.
  - Downstream confidence propagation after TASK-03 completion (2026-02-25): confidence remains 82%; migration and pilot-classification outputs now provide concrete registry fixtures for cutover phase-state admission tests.
  - Build completion evidence (2026-02-25):
    - Updated:
      - `scripts/src/startup-loop/lp-do-ideas-trial.ts`
      - `scripts/src/startup-loop/__tests__/lp-do-ideas-trial.test.ts`
      - `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md`
      - `.claude/skills/lp-do-ideas/SKILL.md`
    - TC-05A validation results:
      - TC-01 pass: source deltas admit in P2/P3 when registry class/policy are eligible.
      - TC-02 pass: pack-only deltas in P2/P3 do not admit without manual override.
      - TC-03 pass: projection artifacts do not admit across P0/P1/P2/P3.
      - TC-04 pass: unknown artifacts emit warning and do not admit.
      - TC-05 pass: mixed pack + source events in source-primary phase produce one admission (no double-admit).
      - P1 shadow telemetry pass: phase, root/candidate/admitted counts, and suppression reason pre-codes emitted.
    - Commands run:
      - `pnpm --filter scripts test -- src/startup-loop/__tests__/lp-do-ideas-trial.test.ts`
      - `pnpm --filter scripts exec tsc -p tsconfig.json --noEmit`
      - `pnpm --filter scripts exec eslint src/startup-loop/lp-do-ideas-trial.ts src/startup-loop/__tests__/lp-do-ideas-trial.test.ts`

### TASK-05B: Propagation mode enforcement and provenance tagging
- **Type:** IMPLEMENT
- **Deliverable:**
  - `scripts/src/startup-loop/lp-do-ideas-propagation.ts` (mode handlers)
  - `scripts/src/startup-loop/lp-do-ideas-trial.ts` (provenance tagging on writes)
  - `scripts/src/startup-loop/__tests__/lp-do-ideas-propagation.test.ts`
  - `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md` (propagation mode semantics)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-02-25)
- **Affects:** `scripts/src/startup-loop/lp-do-ideas-propagation.ts`, `scripts/src/startup-loop/lp-do-ideas-trial.ts`, `scripts/src/startup-loop/__tests__/`, `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md`
- **Depends on:** TASK-02, TASK-03, TASK-04, TASK-05A
- **Blocks:** TASK-07, TASK-10
- **Confidence:** 81%
  - Implementation: 81% - propagation modes touch write pathways and provenance contracts.
  - Approach: 81% - explicit propagation semantics remove BR-02 ambiguity.
  - Impact: 81% - enables reliable anti-self-trigger behavior and traceability.
- **Acceptance:**
  - `projection_auto` writes are tagged (`updated_by_process=projection_auto`) and cannot trigger intake by default.
  - `source_task` emits standing-update tasks with deterministic idempotency keys.
  - `source_mechanical_auto` executes only for allowlisted operations and cannot alter semantic fingerprints.
  - Automatic semantic source-to-source rewrite remains prohibited.
- **Validation contract (TC-05B):**
  - TC-01: projection regeneration writes are tagged and suppressed by intake.
  - TC-02: source dependency implications emit task artifacts instead of semantic rewrites.
  - TC-03: non-allowlisted mechanical update attempt is rejected.
  - TC-04: allowlisted mechanical updates preserve semantic fingerprint.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: reviewed BR-02 propagation contract and anti-self-trigger dependencies.
  - Validation artifacts: TASK-02 schema, TASK-04 fingerprint rules, TASK-05A phase behavior.
  - Unexpected findings: none.
- **Consumer tracing (required):**
  - New outputs:
    - provenance tags consumed by TASK-07 anti-self-trigger logic and TASK-10 telemetry rollups.
    - standing-update task artifacts consumed by downstream standing-update workflows.
  - Modified behavior:
    - propagation is now explicit by mode instead of implicit write behavior.
- **Scouts:** None: direct implementation of BR-02 contract.
- **Edge Cases & Hardening:** repeated source_task emissions, conflicting dependency chains, mixed-mode artifacts.
- **What would make this >=90%:** replay tests with mixed propagation modes over one pilot business.
- **Rollout / rollback:**
  - Rollout: run in shadow-log mode for one cycle before enforcement.
  - Rollback: disable propagation mode handlers and keep source_task outputs advisory.
- **Documentation impact:** trial contract gains propagation mode section and provenance rules.
- **Notes / references:**
  - BR-02, ACC-05..07.
  - Downstream confidence propagation after TASK-02 completion (2026-02-25): confidence remains 81%; propagation mode semantics are now contract-defined in trial contract.
  - Downstream confidence propagation after TASK-04 completion (2026-02-25): confidence remains 81%; propagation handlers can now assert semantic immutability using canonical truth fingerprints.
  - Downstream confidence propagation after TASK-03 completion (2026-02-25): confidence remains 81%; migration compatibility defaults and pilot classification data now anchor propagation-mode enforcement fixtures.
  - Downstream confidence propagation after TASK-05A completion (2026-02-25): confidence remains 81%; phase-state admission and shadow telemetry are now concrete runtime surfaces for propagation provenance integration.
  - Build completion evidence (2026-02-25):
    - Updated:
      - `scripts/src/startup-loop/lp-do-ideas-propagation.ts`
      - `scripts/src/startup-loop/__tests__/lp-do-ideas-propagation.test.ts`
      - `scripts/src/startup-loop/lp-do-ideas-trial.ts`
      - `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md`
    - TC-05B validation results:
      - TC-01 pass: `projection_auto` writes are provenance-tagged and intake-suppressed.
      - TC-02 pass: `source_task` emits deterministic standing-update tasks instead of semantic rewrites.
      - TC-03 pass: non-allowlisted `source_mechanical_auto` operations are rejected.
      - TC-04 pass: allowlisted mechanical updates are blocked when semantic fingerprints would change.
    - Commands run:
      - `pnpm --filter scripts test -- src/startup-loop/__tests__/lp-do-ideas-propagation.test.ts`
      - `pnpm --filter scripts exec tsc -p tsconfig.json --noEmit`
      - `pnpm --filter scripts exec eslint src/startup-loop/lp-do-ideas-propagation.ts src/startup-loop/lp-do-ideas-trial.ts src/startup-loop/__tests__/lp-do-ideas-propagation.test.ts`

### TASK-06: Cluster identity model and cluster-aware dedupe transition
- **Type:** IMPLEMENT
- **Deliverable:**
  - `scripts/src/startup-loop/lp-do-ideas-trial.ts` (cluster fields)
  - `scripts/src/startup-loop/lp-do-ideas-trial-queue.ts` (dual-key dedupe transition)
  - `scripts/src/startup-loop/__tests__/lp-do-ideas-trial-queue.test.ts`
  - `docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.schema.json` (additive fields)
  - `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md` (dedupe compatibility semantics)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** L
- **Status:** Complete (2026-02-25)
- **Affects:** `scripts/src/startup-loop/lp-do-ideas-trial.ts`, `scripts/src/startup-loop/lp-do-ideas-trial-queue.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-trial-queue.test.ts`, `docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.schema.json`, `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md`
- **Depends on:** TASK-04, TASK-05A
- **Blocks:** TASK-07, TASK-08, TASK-10
- **Confidence:** 81%
  - Implementation: 81% - key semantics transition touches queue persistence.
  - Approach: 81% - stable IDs are required for deterministic control.
  - Impact: 81% - significantly reduces correlated duplicate admissions.
- **Acceptance:**
  - Dispatch packets include `root_event_id`, `anchor_key`, `cluster_key`, `cluster_fingerprint`, `lineage_depth`.
  - Transition strategy uses dual-key suppression (`dedupe_key_v1` + `dedupe_key_v2`) and suppresses if either key is present.
  - Same fingerprint reruns are suppressed.
  - Replay with existing queue-state entries does not re-admit historical duplicates due to key migration.
- **Validation contract (TC-06):**
  - TC-01: same root+anchor+fingerprint => one admitted dispatch.
  - TC-02: fingerprint change => new revision admitted.
  - TC-03: non-deterministic input order does not change fingerprint.
  - TC-04: legacy v1 dedupe history still suppresses duplicates during transition.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: verified existing dedupe behavior and dispatch schema fields.
  - Validation artifacts: queue tests + dispatch schema.
  - Unexpected findings: queue-state compatibility must be explicit during cutover.
- **Consumer tracing (required):**
  - New outputs:
    - cluster metadata consumed by anti-loop guards (TASK-07), scheduler telemetry (TASK-08/TASK-10), simulation checks (TASK-11).
  - Modified behavior:
    - queue suppression semantics extend beyond artifact tuple duplication.
- **Scouts:** None: direct extension of existing queue model.
- **Edge Cases & Hardening:** missing anchor key normalization, very large evidence lists, compatibility with existing queue entries.
- **What would make this >=90%:** backfill compatibility test for old dispatch entries without new fields.
- **Rollout / rollback:**
  - Rollout: additive fields first, then dual-key suppression, then v2-primary enforcement.
  - Rollback: retain fields but pin suppression to v1 tuple key only.
- **Documentation impact:** dispatch schema and queue contract docs updated.
- **Notes / references:**
  - BR-03, ACC-08..10.
  - Downstream confidence propagation after TASK-04 completion (2026-02-25): confidence remains 81%; deterministic `normalized_semantic_diff_hash` and truth fingerprint utilities reduce implementation ambiguity for dual-key dedupe.
  - Downstream confidence propagation after TASK-05A completion (2026-02-25): confidence remains 81%; source-primary admission boundaries now stabilize cluster-key rollout assumptions and phase-transition fixtures.
  - Build completion evidence (2026-02-25):
    - Updated:
      - `scripts/src/startup-loop/lp-do-ideas-trial.ts`
      - `scripts/src/startup-loop/lp-do-ideas-trial-queue.ts`
      - `scripts/src/startup-loop/__tests__/lp-do-ideas-trial.test.ts`
      - `scripts/src/startup-loop/__tests__/lp-do-ideas-trial-queue.test.ts`
      - `scripts/src/startup-loop/__tests__/lp-do-ideas-routing-adapter.test.ts`
      - `docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.schema.json`
      - `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md`
    - TC-06 validation results:
      - TC-01 pass: same `root_event_id + anchor_key + cluster_fingerprint` admits once.
      - TC-02 pass: fingerprint change admits a new cluster revision.
      - TC-03 pass: evidence-order variance does not alter fallback v2 cluster dedupe behavior.
      - TC-04 pass: legacy v1 dedupe history suppresses duplicates during transition.
    - Commands run:
      - `pnpm --filter scripts test -- src/startup-loop/__tests__/lp-do-ideas-trial.test.ts src/startup-loop/__tests__/lp-do-ideas-trial-queue.test.ts src/startup-loop/__tests__/lp-do-ideas-routing-adapter.test.ts`
      - `pnpm --filter scripts exec tsc -p tsconfig.json --noEmit`
      - `pnpm --filter scripts exec eslint src/startup-loop/lp-do-ideas-trial.ts src/startup-loop/lp-do-ideas-trial-queue.ts src/startup-loop/__tests__/lp-do-ideas-trial.test.ts src/startup-loop/__tests__/lp-do-ideas-trial-queue.test.ts src/startup-loop/__tests__/lp-do-ideas-routing-adapter.test.ts`

### TASK-07: Anti-loop invariant enforcement
- **Type:** IMPLEMENT
- **Deliverable:**
  - `scripts/src/startup-loop/lp-do-ideas-trial.ts` (lineage/cooldown/self-trigger checks)
  - `scripts/src/startup-loop/lp-do-ideas-trial-queue.ts` (guard-aware suppression reasons)
  - `scripts/src/startup-loop/__tests__/lp-do-ideas-trial.test.ts`
  - `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md` (invariant table)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** L
- **Status:** Complete (2026-02-25)
- **Affects:** `scripts/src/startup-loop/lp-do-ideas-trial.ts`, `scripts/src/startup-loop/lp-do-ideas-trial-queue.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-trial.test.ts`, `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md`
- **Depends on:** TASK-05A, TASK-05B, TASK-06
- **Blocks:** TASK-09, TASK-10
- **Confidence:** 80%
  - Implementation: 80% - multiple guard interactions require careful ordering.
  - Approach: 80% - invariants are explicit and testable.
  - Impact: 80% - core protection against loop pathologies.
- **Acceptance:**
  - Enforce projection immunity, anti-self-trigger, same-origin attach rule, lineage cap, cooldown, and materiality gates.
  - Same-origin attach semantics are explicit: attach means merge evidence into existing cluster chain; only create a new cluster revision when deterministic fingerprint changes.
  - Suppressions are attributed to specific invariant reasons in telemetry.
- **Validation contract (TC-07):**
  - TC-01: third-hop chain rejected without override.
  - TC-02: cooldown suppresses non-material re-admission.
  - TC-03: projection-only regeneration produces zero admissions.
  - TC-04: metadata-only source edits are non-material.
  - TC-05: anti-self-trigger uses provenance tags from TASK-05B and does not suppress true source-material deltas.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: verified required invariants in fact-find BR-04.
  - Validation artifacts: cluster metadata fields + fingerprint utilities + propagation provenance tags.
  - Unexpected findings: none.
- **Consumer tracing (required):**
  - New outputs:
    - suppression reason taxonomy consumed by observability rollups (TASK-10).
  - Modified behavior:
    - admission now guard-constrained by lineage and materiality, not only route heuristics.
- **Scouts:** None: fully bounded by invariant table.
- **Edge Cases & Hardening:** override path correctness, clock skew in cooldown checks.
- **What would make this >=90%:** randomized replay test across synthetic cascade chains.
- **Rollout / rollback:**
  - Rollout: enforce invariants behind feature flag in trial first.
  - Rollback: disable invariant enforcement flag and preserve telemetry.
- **Documentation impact:** contract docs gain invariant matrix and reason codes.
- **Notes / references:**
  - BR-04, INV-01..07.
  - Downstream confidence propagation after TASK-04 completion (2026-02-25): confidence remains 80%; invariant enforcement can now key materiality/cooldown decisions to deterministic fingerprints instead of section-name heuristics.
  - Downstream confidence propagation after TASK-05A completion (2026-02-25): confidence remains 80%; projection immunity and unknown-artifact suppression behavior are now implemented baselines for invariant hardening.
  - Downstream confidence propagation after TASK-05B completion (2026-02-25): confidence remains 80%; provenance-tagged propagation outputs now provide deterministic anti-self-trigger inputs.
  - Downstream confidence propagation after TASK-06 completion (2026-02-25): confidence remains 80%; cluster identity fields and dual-key dedupe transition fixtures now constrain same-origin and cooldown guard behavior.
  - Build completion evidence (2026-02-25):
    - Updated:
      - `scripts/src/startup-loop/lp-do-ideas-trial.ts`
      - `scripts/src/startup-loop/lp-do-ideas-trial-queue.ts`
      - `scripts/src/startup-loop/__tests__/lp-do-ideas-trial.test.ts`
      - `scripts/src/startup-loop/__tests__/lp-do-ideas-trial-queue.test.ts`
      - `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md`
    - TC-07 validation results:
      - TC-01 pass: third-hop lineage without override is suppressed.
      - TC-02 pass: cooldown suppresses non-material re-admission for matching cluster key/fingerprint.
      - TC-03 pass: projection-only regeneration events produce zero admissions.
      - TC-04 pass: metadata-only source edits are classified as non-material.
      - TC-05 pass: provenance-tagged self-trigger events still admit when explicitly material.
    - Commands run:
      - `pnpm --filter scripts test -- src/startup-loop/__tests__/lp-do-ideas-trial.test.ts src/startup-loop/__tests__/lp-do-ideas-trial-queue.test.ts src/startup-loop/__tests__/lp-do-ideas-routing-adapter.test.ts`
      - `pnpm --filter scripts exec tsc -p tsconfig.json --noEmit`
      - `pnpm --filter scripts exec eslint src/startup-loop/lp-do-ideas-trial.ts src/startup-loop/lp-do-ideas-trial-queue.ts src/startup-loop/__tests__/lp-do-ideas-trial.test.ts src/startup-loop/__tests__/lp-do-ideas-trial-queue.test.ts src/startup-loop/__tests__/lp-do-ideas-routing-adapter.test.ts`

### TASK-08: Dual-lane scheduler and prioritization governance
- **Type:** IMPLEMENT
- **Deliverable:**
  - `scripts/src/startup-loop/lp-do-ideas-trial-queue.ts` (lane-aware scheduling helpers)
  - `docs/business-os/startup-loop/ideas/lp-do-ideas-routing-matrix.md` (lane semantics)
  - `docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-checklist.md` (lane governance checks)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-02-25)
- **Affects:** `scripts/src/startup-loop/lp-do-ideas-trial-queue.ts`, `docs/business-os/startup-loop/ideas/lp-do-ideas-routing-matrix.md`, `docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-checklist.md`
- **Depends on:** TASK-06
- **Blocks:** TASK-09, TASK-10
- **Confidence:** 82%
  - Implementation: 82% - additive scheduler logic over existing queue.
  - Approach: 82% - one physical queue with lane field minimizes migration complexity.
  - Impact: 82% - introduces bounded throughput and anti-starvation mechanics.
- **Acceptance:**
  - Queue entries carry `lane` field at admission.
  - Scheduler enforces per-lane WIP caps.
  - Aging increases priority over time.
- **Validation contract (TC-08):**
  - TC-01: scheduler never exceeds lane caps.
  - TC-02: aging causes old low-priority item promotion within lane.
  - TC-03: lane reassignment requires explicit override path.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: reviewed lane mechanics in fact-find target contract.
  - Validation artifacts: queue design + invariants.
  - Unexpected findings: none.
- **Consumer tracing (required):**
  - New outputs:
    - lane scheduling state consumed by reflection debt routing (TASK-09) and metrics rollup (TASK-10).
  - Modified behavior:
    - queue dispatch order now lane-governed.
- **Scouts:** None: isolated to queue governance.
- **Edge Cases & Hardening:** empty-lane behavior, all-lane saturation.
- **What would make this >=90%:** simulation with skewed DO/IMPROVE arrivals.
- **Rollout / rollback:**
  - Rollout: default 1:1 for two cycles, then 2:1 if stable.
  - Rollback: disable lane scheduler and revert to FIFO pending queue.
- **Documentation impact:** lane policy documented in routing/checklist docs.
- **Notes / references:**
  - BR-05.
  - Downstream confidence propagation after TASK-06 completion (2026-02-25): confidence remains 82%; cluster metadata and dual-key suppression semantics are now available to lane-aware scheduler decisions.
  - Build completion evidence (2026-02-25):
    - Updated:
      - `scripts/src/startup-loop/lp-do-ideas-trial-queue.ts`
      - `scripts/src/startup-loop/__tests__/lp-do-ideas-trial-queue.test.ts`
      - `docs/business-os/startup-loop/ideas/lp-do-ideas-routing-matrix.md`
      - `docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-checklist.md`
    - TC-08 validation results:
      - TC-01 pass: `planNextDispatches` never exceeds per-lane WIP caps.
      - TC-02 pass: aging score promotes older low-priority entries within lane.
      - TC-03 pass: lane reassignment requires explicit override path and rationale.
    - Commands run:
      - `pnpm --filter scripts test -- src/startup-loop/__tests__/lp-do-ideas-trial-queue.test.ts src/startup-loop/__tests__/lp-do-ideas-trial.test.ts src/startup-loop/__tests__/lp-do-ideas-routing-adapter.test.ts`
      - `pnpm --filter scripts exec tsc -p tsconfig.json --noEmit`
      - `pnpm --filter scripts exec eslint src/startup-loop/lp-do-ideas-trial-queue.ts src/startup-loop/__tests__/lp-do-ideas-trial-queue.test.ts`

### TASK-09: Reflection debt soft-gate mechanism + contract alignment
- **Type:** IMPLEMENT
- **Deliverable:**
  - `scripts/src/startup-loop/lp-do-build-reflection-debt.ts` (deterministic debt emitter)
  - `scripts/src/startup-loop/__tests__/lp-do-build-reflection-debt.test.ts`
  - `.claude/skills/lp-do-build/SKILL.md` (soft-gate debt semantics)
  - `docs/business-os/startup-loop/loop-output-contracts.md` (minimum reflection schema alignment)
  - `docs/business-os/startup-loop/loop-spec.yaml` (comment alignment)
  - `docs/plans/_templates/results-review.user.md` (if absent, add minimal template)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-02-25)
- **Affects:** `scripts/src/startup-loop/`, `.claude/skills/lp-do-build/SKILL.md`, `docs/business-os/startup-loop/loop-output-contracts.md`, `docs/business-os/startup-loop/loop-spec.yaml`, `docs/plans/_templates/`
- **Depends on:** TASK-02, TASK-07, TASK-08
- **Blocks:** TASK-10, TASK-11
- **Confidence:** 80%
  - Implementation: 80% - adds deterministic emitter plus contract alignment.
  - Approach: 80% - soft gate balances closure with delivery pace.
  - Impact: 80% - removes current advisory/required ambiguity.
- **Acceptance:**
  - Reflection debt artifact key `reflection-debt:{build_id}` is defined and idempotent.
  - Missing minimum reflection payload creates one debt item per build from a deterministic emitter path.
  - Debt default lane is `IMPROVE`, SLA is 7 days, and breach behavior is explicit across docs.
  - Retry/replay of the same build does not create duplicate debt artifacts.
- **Validation contract (VC-09):**
  - VC-01: docs are aligned on soft-gate policy and minimum reflection payload.
  - VC-02: idempotency of debt key is explicit and test-validated.
  - VC-03: emitter integration point is deterministic and produces one artifact per missing-reflection build.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: identify and record current contract conflicts.
  - Green evidence plan: aligned wording and policy in all listed artifacts.
  - Refactor evidence plan: tighten ambiguity and add enforcement notes.
- **Planning validation (required for M/L):**
  - Checks run: reviewed loop-spec comment, lp-do-build policy, and loop-output contract.
  - Validation artifacts: current mismatch evidence in fact-find.
  - Unexpected findings: none.
- **Scouts:** None: scoped runtime emitter plus documentation alignment.
- **Edge Cases & Hardening:** duplicate debt generation from retries; owner attribution scope.
- **What would make this >=90%:** one dry-run walkthrough artifact showing debt creation and resolution path.
- **Rollout / rollback:**
  - Rollout: policy alignment first, then emitter enforcement.
  - Rollback: revert to advisory mode wording while retaining mismatch record.
- **Documentation impact:** canonical reflection closure semantics.
- **Notes / references:**
  - BR-06, ACC-18..19.
  - Downstream confidence propagation after TASK-02 completion (2026-02-25): confidence remains 80%; reflection debt alignment can reference stable registry v2 taxonomy language.
  - Downstream confidence propagation after TASK-07 completion (2026-02-25): confidence remains 80%; invariant reason taxonomy and same-origin attach semantics now provide stable preconditions for debt-trigger routing.
  - Downstream confidence propagation after TASK-08 completion (2026-02-25): confidence remains 80%; lane assignment/reassignment contracts now provide deterministic routing target for reflection debt default lane behavior.
  - Build completion evidence (2026-02-25):
    - Added:
      - `scripts/src/startup-loop/lp-do-build-reflection-debt.ts`
      - `scripts/src/startup-loop/__tests__/lp-do-build-reflection-debt.test.ts`
      - `docs/plans/_templates/results-review.user.md`
    - Updated:
      - `.claude/skills/lp-do-build/SKILL.md`
      - `docs/business-os/startup-loop/loop-output-contracts.md`
      - `docs/business-os/startup-loop/loop-spec.yaml`
    - VC-09 validation results:
      - VC-01 pass: loop output contract, build skill, and loop spec now align on soft-gate reflection debt semantics and minimum payload.
      - VC-02 pass: deterministic debt key `reflection-debt:{build_id}` is idempotent under replay with zero duplicate entries.
      - VC-03 pass: deterministic emitter writes one debt artifact per missing-reflection build and resolves the same debt entry when payload is completed.
    - Commands run:
      - `pnpm --filter scripts test -- src/startup-loop/__tests__/lp-do-build-reflection-debt.test.ts`
      - `pnpm --filter scripts exec tsc -p tsconfig.json --noEmit`
      - `pnpm --filter scripts exec eslint src/startup-loop/lp-do-build-reflection-debt.ts src/startup-loop/__tests__/lp-do-build-reflection-debt.test.ts`
  - Downstream confidence propagation after TASK-09 completion (2026-02-25): TASK-10 confidence remains 82%; reflection debt reason codes and deterministic closure semantics now provide stable observability dimensions with no scope expansion.

### TASK-10: Observability rollup and threshold alerts
- **Type:** IMPLEMENT
- **Deliverable:**
  - `scripts/src/startup-loop/lp-do-ideas-metrics-rollup.ts`
  - `scripts/src/startup-loop/__tests__/lp-do-ideas-metrics-rollup.test.ts`
  - `docs/business-os/startup-loop/ideas/lp-do-ideas-telemetry.schema.md` (formula + shadow telemetry extensions)
  - `docs/plans/lp-do-ideas-source-trigger-operating-model/artifacts/ops-threshold-runbook.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-02-25)
- **Affects:** `scripts/src/startup-loop/`, `docs/business-os/startup-loop/ideas/lp-do-ideas-telemetry.schema.md`, `docs/plans/lp-do-ideas-source-trigger-operating-model/artifacts/`
- **Depends on:** TASK-05B, TASK-06, TASK-07, TASK-08, TASK-09
- **Blocks:** TASK-11
- **Confidence:** 82%
  - Implementation: 82% - formulas are explicit and bounded.
  - Approach: 82% - threshold-based ops actions prevent silent degradation.
  - Impact: 82% - enables operational control of fan-out/loop risk.
- **Acceptance:**
  - Rollup computes `fan_out_raw`, `fan_out_admitted`, `loop_incidence`, queue age p95, throughput, lane mix.
  - Shadow telemetry fields from cutover phases are included in rollup provenance.
  - Alert threshold breaches emit deterministic action records.
  - Suppression reasons are grouped by invariant type.
- **Validation contract (TC-10):**
  - TC-01: sample telemetry produces exact expected metrics.
  - TC-02: threshold breach yields actionable alert record.
  - TC-03: root_event_count denominator matches unique root event IDs.
  - TC-04: shadow phase telemetry and enforced phase telemetry reconcile without double counting.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: reviewed BR-07 formulas and definitions.
  - Validation artifacts: fact-find metrics section.
  - Unexpected findings: none.
- **Consumer tracing (required):**
  - New outputs:
    - metrics rollup consumed by S10 weekly operations and TASK-11 checkpoint.
  - Modified behavior:
    - operational health decisions now threshold-driven instead of ad hoc.
- **Scouts:** None: deterministic metric functions.
- **Edge Cases & Hardening:** zero denominator handling; sparse cycle windows.
- **What would make this >=90%:** validation against one real telemetry history window.
- **Rollout / rollback:**
  - Rollout: shadow-run metrics before making alerts actionable.
  - Rollback: metrics in observe-only mode.
- **Documentation impact:** telemetry schema and runbook updates.
- **Notes / references:**
  - BR-07, ACC-20..21.
  - Downstream confidence propagation after TASK-05B completion (2026-02-25): confidence remains 82%; propagation provenance tags now provide stable suppression-cause dimensions for rollup grouping.
  - Downstream confidence propagation after TASK-06 completion (2026-02-25): confidence remains 82%; root/cluster metadata and dual-key suppression counters now provide deterministic fan-out denominator and dedupe transition observability inputs.
  - Downstream confidence propagation after TASK-07 completion (2026-02-25): confidence remains 82%; invariant suppression reason codes and cooldown/lineage outcomes now provide complete loop-incidence numerator inputs.
  - Downstream confidence propagation after TASK-08 completion (2026-02-25): confidence remains 82%; lane-aware scheduler outputs now provide stable lane-mix and queue-age rollup dimensions.
  - Downstream confidence propagation after TASK-09 completion (2026-02-25): confidence remains 82%; reflection-debt deterministic closure semantics now provide stable soft-gate observability joins.
  - Build completion evidence (2026-02-25):
    - Added:
      - `scripts/src/startup-loop/lp-do-ideas-metrics-rollup.ts`
      - `scripts/src/startup-loop/__tests__/lp-do-ideas-metrics-rollup.test.ts`
      - `docs/plans/lp-do-ideas-source-trigger-operating-model/artifacts/ops-threshold-runbook.md`
    - Updated:
      - `docs/business-os/startup-loop/ideas/lp-do-ideas-telemetry.schema.md`
    - TC-10 validation results:
      - TC-01 pass: sample telemetry rollup computes exact expected `fan_out_raw`, `fan_out_admitted`, `loop_incidence`, queue-age p95, throughput, and lane-mix outputs.
      - TC-02 pass: threshold breaches emit deterministic actionable records for fan-out, loop-incidence, and queue-age lanes.
      - TC-03 pass: root-event denominator is computed from unique root-event IDs with deterministic fallback to explicit counts.
      - TC-04 pass: shadow and enforced snapshots reconcile by selecting enforced mode for shared cycle+phase without double counting.
    - Commands run:
      - `pnpm --filter scripts test -- src/startup-loop/__tests__/lp-do-ideas-metrics-rollup.test.ts`
      - `pnpm --filter scripts exec tsc -p tsconfig.json --noEmit`
      - `pnpm --filter scripts exec eslint src/startup-loop/lp-do-ideas-metrics-rollup.ts src/startup-loop/__tests__/lp-do-ideas-metrics-rollup.test.ts`
  - Downstream confidence propagation after TASK-10 completion (2026-02-25): TASK-11 confidence remains 95%; checkpoint now has deterministic rollup metrics and action-record inputs.

### TASK-11: E2E simulation and rollout go/no-go checkpoint
- **Type:** CHECKPOINT
- **Deliverable:** updated plan evidence via `/lp-do-replan` plus simulation readout artifact
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-25)
- **Affects:** `docs/plans/lp-do-ideas-source-trigger-operating-model/plan.md`, `docs/plans/lp-do-ideas-source-trigger-operating-model/artifacts/simulation-readout.md`
- **Depends on:** TASK-10
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% - checkpoint protocol is defined.
  - Approach: 95% - prevents rollout without evidence.
  - Impact: 95% - controls late-stage risk.
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run.
  - E2E-01 happy path and E2E-02 pathological suppression scenarios executed.
  - Phase-state machine assertions pass for P1/P2/P3 cutover behavior.
  - Dual-key dedupe transition assertions pass against legacy queue-state fixtures.
  - Downstream confidence recalibrated using simulation evidence.
  - Rollout go/no-go recommendation written.
- **Horizon assumptions to validate:**
  - Cluster identity remains stable across reruns.
  - Cutover does not double-admit from pack + source deltas.
  - Loop guard suppressions remain within expected threshold bands.
- **Validation contract:** simulation artifact includes ACC/INV pass matrix and threshold outcomes.
- **Planning validation:** checkpoint evidence logged in plan artifacts.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** final checkpoint evidence and go/no-go record.
- **Notes / references:**
  - Build-checkpoint executor workflow applied:
    - summarized completed-task evidence and validated assumptions.
    - evaluated downstream task graph after checkpoint (no downstream implementation tasks remain after TASK-11).
    - sequence topology unchanged (no resequencing required).
  - Checkpoint evidence artifact:
    - `docs/plans/lp-do-ideas-source-trigger-operating-model/artifacts/simulation-readout.md`
  - Build completion evidence (2026-02-25):
    - Added:
      - `docs/plans/lp-do-ideas-source-trigger-operating-model/artifacts/simulation-readout.md`
    - Checkpoint validation results:
      - E2E-01 happy path: pass (source admission, projection immunity, reflection soft-gate, shadow/enforced reconciliation).
      - E2E-02 pathological suppression: pass (lineage/cooldown/materiality guards, pack-only suppression, dual-key legacy compatibility).
      - P1/P2/P3 phase assertions: pass.
      - Dual-key dedupe transition assertions against legacy fixtures: pass.
      - ACC/INV matrix + threshold outcomes documented in simulation readout.
      - Rollout recommendation: **Go** with controlled cutover guardrails.
    - Commands run:
      - `pnpm --filter scripts test -- src/startup-loop/__tests__/lp-do-ideas-trial.test.ts src/startup-loop/__tests__/lp-do-ideas-trial-queue.test.ts src/startup-loop/__tests__/lp-do-ideas-metrics-rollup.test.ts src/startup-loop/__tests__/lp-do-build-reflection-debt.test.ts`
      - `pnpm --filter scripts exec tsc -p tsconfig.json --noEmit`
      - `pnpm --filter scripts exec eslint src/startup-loop/lp-do-ideas-trial.ts src/startup-loop/lp-do-ideas-trial-queue.ts src/startup-loop/lp-do-ideas-metrics-rollup.ts src/startup-loop/lp-do-build-reflection-debt.ts src/startup-loop/__tests__/lp-do-ideas-trial.test.ts src/startup-loop/__tests__/lp-do-ideas-trial-queue.test.ts src/startup-loop/__tests__/lp-do-ideas-metrics-rollup.test.ts src/startup-loop/__tests__/lp-do-build-reflection-debt.test.ts`

## Risks & Mitigations
- Double-trigger during migration:
  - Mitigation: phase-gated cutover state machine with per-phase admission assertions (TASK-05A).
- Silent under-trigger from aggressive fail-closed defaults:
  - Mitigation: migration report + explicit pilot classification completion criteria (TASK-03).
- Dedupe regression during key transition:
  - Mitigation: dual-key suppression compatibility with legacy queue-state replay tests (TASK-06).
- Non-deterministic dedupe behavior:
  - Mitigation: deterministic fingerprint functions and test corpus (TASK-04/TASK-06).
- Re-trigger loops from reflection/projection writes:
  - Mitigation: propagation provenance tags + invariant enforcement + suppression reason telemetry (TASK-05B/TASK-07).
- Governance drift between specs and skills:
  - Mitigation: aligned reflection contract and deterministic debt emitter semantics (TASK-09).

## Observability
- Logging:
  - Structured suppression reasons by invariant code.
  - Cluster admission/revision events with root/cluster IDs.
  - Cutover phase tags and propagation provenance tags on write events.
- Metrics:
  - `fan_out_raw`, `fan_out_admitted`, `loop_incidence`, `queue_age_p95_days`, throughput, lane mix.
  - Shadow telemetry coverage for P1 cutover.
- Alerts/Dashboards:
  - Threshold-based alerts from TASK-10 runbook.
  - Weekly S10 review includes queue health and breach actions.

## Acceptance Criteria (overall)
- [x] Registry v2 taxonomy and migration defaults are live with no fail-open paths.
- [x] Pilot classification coverage is complete for current pack triggers + primary source artifacts in scope.
- [x] Source-trigger admission works while pack-only diffs cannot admit without source truth deltas.
- [x] Cutover phase state machine behavior is tested and deterministic across P1/P2/P3.
- [x] Propagation modes are enforced (`projection_auto`, `source_task`, `source_mechanical_auto`) with provenance tags.
- [x] Cluster-aware dedupe prevents repeat admissions for unchanged fingerprints.
- [x] Dual-key dedupe transition preserves suppression compatibility with legacy queue-state entries.
- [x] Anti-loop invariants enforce lineage/cooldown/materiality protections.
- [x] Dual-lane scheduler enforces WIP caps and aging policy.
- [x] Reflection soft-gate debt behavior is contract-aligned, idempotent, and emitted deterministically.
- [x] Rollup metrics and alerts operate deterministically and are action-linked.
- [x] E2E checkpoint passes happy path and pathological suppression scenarios.

## Decision Log
- 2026-02-25: Selected source-trigger operating model with phased cutover over pack-trigger semantics.
- 2026-02-25: Selected explicit cutover state machine (P0 legacy, P1 shadow, P2 source-primary, P3 pack-disabled).
- 2026-02-25: Selected propagation mode enforcement with provenance tagging instead of implicit write behavior.
- 2026-02-25: Selected dual-key dedupe transition strategy (`dedupe_key_v1` + `dedupe_key_v2`) for migration safety.
- 2026-02-25: Selected single physical queue with lane field (vs separate physical queues).
- 2026-02-25: Selected soft-gate reflection debt enforcement for loop closure.
- 2026-02-25: Applied phased default lane budget (`1:1` first two cycles, then `2:1` if stable) pending explicit operator override.
- 2026-02-25: TASK-11 checkpoint completed; rollout recommendation set to **Go** for controlled cutover progression.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Weighted task confidence:
  - TASK-01 85*1 = 85
  - TASK-02 85*2 = 170
  - TASK-03 83*2 = 166
  - TASK-04 84*2 = 168
  - TASK-05A 82*3 = 246
  - TASK-05B 81*2 = 162
  - TASK-06 81*3 = 243
  - TASK-07 80*3 = 240
  - TASK-08 82*2 = 164
  - TASK-09 80*2 = 160
  - TASK-10 82*2 = 164
  - TASK-11 95*1 = 95
- Total weighted score: 2063
- Total weight: 25
- Overall-confidence: `2063 / 25 = 82.52%` (rounded to 83%)

## Critique Trigger Check (Phase 11)
- Trigger 1 (`Overall-confidence < 4.0` on 5-point scale): **No** (`83% = 4.15/5`).
- Trigger 2 (task confidence <80 without upstream SPIKE/INVESTIGATE): **No** (all tasks >=80).
- Result: automatic critique skipped.

## Section Omission Rule
None: all sections are relevant for this plan.
