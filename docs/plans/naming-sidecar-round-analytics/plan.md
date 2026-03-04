---
Type: Plan
Status: Active
Domain: Data
Workstream: Operations
Created: 2026-03-04
Last-reviewed: 2026-03-04
Last-updated: 2026-03-04
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: naming-sidecar-round-analytics
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact) per task; overall weighted by effort
Auto-Build-Intent: plan-only
---

# Naming Sidecar Round Analytics Plan

## Summary
This plan advances the BOS P3 idea from candidate to implementation-ready scope by establishing a deterministic naming analytics sidecar pipeline and a recurring round-review cadence. Current sidecar events already exist across three live rounds, but no cross-round standing dataset or formal loop step consumes them. The solution is additive: build a small analytics extractor over existing JSONL sidecars, publish stable outputs in `docs/business-os/`, and codify a post-round review protocol that feeds self-improvement decisions without changing naming runtime behavior. The plan is sequenced to ship extraction contract first, then process integration and validation.

## Active tasks
- [x] TASK-01: Implement cross-round naming sidecar analytics extractor
- [x] TASK-02: Add deterministic artifacts and command wiring
- [x] TASK-03: Add naming round review cadence to startup-loop docs
- [x] TASK-04: Validate on current three-round corpus and finalize handoff

## Goals
- Convert distributed naming sidecar JSONL logs into a single deterministic analytics dataset.
- Produce both machine-readable and operator-readable artifacts for round analytics.
- Formalize an explicit per-round review cadence for ongoing loop self-improvement.
- Keep solution additive and backward compatible with existing naming flows.

## Non-goals
- Replacing current model/ranking pipeline behavior.
- Introducing external storage or dashboards.
- Backfilling manual operator preference labels beyond currently available data.

## Constraints & Assumptions
- Constraints:
  - Do not break existing naming CLI outputs or sidecar schema.
  - Artifacts must remain versionable in git.
  - Validation is scoped to changed package(s) and touched files.
- Assumptions:
  - Existing round files represent valid v1 schema and can seed analytics contract.
  - Sparse preference labels are acceptable in v1 if explicitly represented.

## Inherited Outcome Contract
- **Why:** The naming pipeline has telemetry, but without a standing analytics artifact and cadence the loop cannot reliably learn from round-to-round outcomes.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Produce a deterministic analytics dataset and update cadence so each naming round contributes to measurable pattern/yield/operator-preference learning.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/naming-sidecar-round-analytics/fact-find.md`
- Key findings used:
  - Three sidecar round files exist and meet the 3+ rounds trigger threshold.
  - Existing extractor is single-directory and insufficient for standing analytics.
  - Current operator preference fields are sparse and require coverage-aware reporting.

## Proposed Approach
- Option A: Process-only doc update with manual analytics steps.
  - Pros: low engineering effort.
  - Cons: non-deterministic and likely to drift.
- Option B: Add deterministic extractor + artifacts + formal cadence (chosen).
  - Pros: reproducible, measurable, self-improvement-ready.
  - Cons: moderate implementation effort.
- Chosen approach:
  - Implement additive script and output contract, then wire recurring review process documentation.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Build cross-round extractor for naming sidecar analytics | 84% | M | Complete (2026-03-04) | - | TASK-02, TASK-04 |
| TASK-02 | IMPLEMENT | Publish deterministic analytics artifacts and command wiring | 84% | M | Complete (2026-03-04) | TASK-01 | TASK-03, TASK-04 |
| TASK-03 | IMPLEMENT | Add naming-round review cadence to startup-loop process docs | 86% | S | Complete (2026-03-04) | TASK-02 | TASK-04 |
| TASK-04 | CHECKPOINT | Validate outputs on existing corpus and capture closure evidence | 88% | S | Complete (2026-03-04) | TASK-01, TASK-02, TASK-03 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Core extraction contract |
| 2 | TASK-02 | TASK-01 | Artifact and command integration |
| 3 | TASK-03 | TASK-02 | Process/cadence documentation uses final output contract |
| 4 | TASK-04 | TASK-01, TASK-02, TASK-03 | Final validation and handoff |

## Tasks

### TASK-01: Implement cross-round naming sidecar analytics extractor
- **Type:** IMPLEMENT
- **Deliverable:** New extractor module that reads both `naming-sidecars` and `product-naming-sidecars` across businesses and emits normalized round-level metrics.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-04)
- **Affects:**
  - `scripts/src/startup-loop/naming/` (new analytics module)
  - `scripts/src/startup-loop/naming/baseline-extractor.ts` (reuse or extension)
- **Depends on:** -
- **Blocks:** TASK-02, TASK-04
- **Confidence:** 84%
  - Implementation: 84% — schema and source paths are known.
  - Approach: 84% — additive extraction pattern already exists.
  - Impact: 84% — direct to idea objective.
- **Acceptance:**
  - Extractor supports all existing sidecar stage variants without crash.
  - Output includes business, round, run_date, pipeline_type, stage counts, yield metrics, preference-coverage metrics.
  - Sparse labels are represented explicitly (no inferred preference claims when labels missing).
- **Validation contract (VC-01):**
  - VC-01: Given current three sidecar round files, extractor returns exactly three round records.
  - VC-02: Stage totals in output equal stage counts in source JSONL lines for each round.
  - VC-03: Missing operator labels do not fail extraction; reported as coverage metric.
- **What would make this >=90%:** fixture-based contract tests for mixed pipeline types.

### TASK-02: Add deterministic artifacts and command wiring
- **Type:** IMPLEMENT
- **Deliverable:** CLI/command integration that writes canonical analytics outputs under `docs/business-os/startup-loop/`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-04)
- **Affects:**
  - `scripts/src/startup-loop/naming/` (new CLI entry or runner)
  - `scripts/package.json` (new startup-loop command)
  - `docs/business-os/startup-loop/` (new analytics artifacts)
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-04
- **Confidence:** 84%
  - Implementation: 84% — existing command patterns are established.
  - Approach: 84% — deterministic write path is straightforward.
  - Impact: 84% — artifact availability unlocks review cadence.
- **Acceptance:**
  - One machine-readable artifact (JSON) and one operator-readable artifact (Markdown) are generated.
  - Command is runnable from repo and idempotent over unchanged input.
  - Artifact headers include generation timestamp and source file list.
- **Validation contract (VC-02):**
  - VC-01: Running the command twice with unchanged sidecars yields identical metric payloads (timestamp excluded).
  - VC-02: Artifacts include all three current rounds.

### TASK-03: Add naming round review cadence to startup-loop docs
- **Type:** IMPLEMENT
- **Deliverable:** Process documentation update defining when and how naming analytics are reviewed and fed into loop improvements.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Effort:** S
- **Status:** Complete (2026-03-04)
- **Affects:**
  - `docs/business-os/startup-loop/` relevant process contract docs
  - (if required) naming assessment workflow docs referencing sidecar learning cadence
- **Depends on:** TASK-02
- **Blocks:** TASK-04
- **Confidence:** 86%
  - Implementation: 86% — documentation-only with concrete inputs.
  - Approach: 86% — mirrors existing post-build review patterns.
  - Impact: 86% — closes self-improvement loop behaviorally.
- **Acceptance:**
  - Cadence explicitly defines trigger, owner, and artifacts consumed.
  - Process specifies what to do when coverage is low (e.g., operator labels missing).
  - References canonical analytics artifact paths.
- **Validation contract (VC-03):**
  - VC-01: No stale references to pre-migration sidecar paths.
  - VC-02: Documentation includes objective completion criteria for each review cycle.

### TASK-04: Validate current corpus and finalize handoff
- **Type:** CHECKPOINT
- **Deliverable:** Validation evidence proving extraction + artifacts + cadence work on current sidecar corpus.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-03-04)
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** -
- **Confidence:** 88%
- **Acceptance:**
  - Validation logs show all contracts VC-01..VC-03 passing.
  - Plan captures residual risks and explicit next iteration hooks (e.g., richer preference signals after labeled rounds).

## Risks & Mitigations
- Sparse operator preference labels limit immediate preference trend value.
  - Mitigation: publish label-coverage KPI and guardrail language.
- Future path migrations could break source discovery.
  - Mitigation: centralize sidecar glob configuration and add path-contract checks.

## Observability
- Logging: command prints source file count and per-round extraction summary.
- Metrics: rounds processed, total events, label coverage %, yield metrics by pipeline type.
- Alerts/Dashboards: None (repo artifact checks only in v1).

## Acceptance Criteria (overall)
- [x] BOS P3 idea is no longer "candidate-only" and has a concrete executable contract.
- [x] Deterministic naming analytics artifact pair exists and is reproducible.
- [x] Startup-loop docs include explicit naming-round analytics review cadence.

## Decision Log
- 2026-03-04: Chose deterministic extractor + process cadence (not process-only manual workflow) to avoid drift and preserve measurable self-improvement.
- 2026-03-04: Implemented extractor at scripts/src/startup-loop/naming/round-analytics.ts and command startup-loop:naming-round-analytics.
- 2026-03-04: Published first corpus outputs at docs/business-os/startup-loop/operations/naming-round-analytics.latest.json and docs/business-os/startup-loop/operations/naming-round-analytics.latest.md (3 rounds, 871 events).
- 2026-03-04: Validation passed with pnpm --filter scripts exec tsc -p tsconfig.json --noEmit and targeted eslint for changed scripts files.

## Overall-confidence Calculation
- Weighted by effort (S=1, M=2, L=3):
  - TASK-01: 84% * 2
  - TASK-02: 84% * 2
  - TASK-03: 86% * 1
  - TASK-04: 88% * 1
- Overall-confidence: 84%
