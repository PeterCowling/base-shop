---
Type: Plan
Status: Complete
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-self-evolving-evidence-admission
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find, startup-loop
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Startup Loop Self-Evolving Evidence Admission Plan

## Summary
The self-evolving trial currently admits observations with almost no explicit evidence semantics and only later downgrades them during scoring. That is backwards for an effectiveness-oriented loop. This plan adds a prospective evidence-admission contract at the observation layer, keeps legacy observations readable, and makes builders stamp explicit evidence grade and measurement-contract signals so downstream scoring can distinguish exploratory signals from genuinely instrumented ones without implying historical backfill. The resulting labels are not allowed to become metadata theater: they must drive explicit downstream route and write-back policy.

## Active tasks
- [x] TASK-01: Add explicit evidence-admission metadata to self-evolving observations and validation
- [x] TASK-02: Populate the new admission contract from ideas/build-output ingestion and preserve route behavior with focused tests
- [x] TASK-03: Bind evidence posture to downstream routing, write-back eligibility, and reporting policy

## Goals
- Make new self-evolving observations declare their evidence posture explicitly.
- Preserve compatibility for historical observations already on disk.
- Ensure dispatch/build-output ingestion no longer pretends to be measurement-ready when it is not.
- Make evidence posture authoritative in downstream policy rather than decorative metadata.

## Non-goals
- Historical backfill of old observations or queue entries.
- Dispatch schema changes for `lp-do-ideas`.
- Autonomous promotion or actuator execution.

## Constraints & Assumptions
- Constraints:
  - Existing `meta-observation.v1` records must remain readable.
  - New requirements must be additive and prospective.
  - Local Jest remains out of scope.
- Assumptions:
  - The correct enforcement seam is the observation contract plus builders, not the ideas dispatch schema.
  - Existing scoring/reporting can consume richer admission metadata without a full redesign, but enforcement must still depend on underlying evidence fields, not labels alone.

## Inherited Outcome Contract
- **Why:** The self-evolving trial currently manufactures narrative-only observations with almost no measured evidence, so candidate scoring is forced to downgrade most ideas before it can evaluate whether they are genuinely high-value improvements.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** New self-evolving observations and candidate admission rules require explicit evidence grade or measurement contract, while legacy observations remain readable but cannot masquerade as strong evidence.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/startup-loop-self-evolving-evidence-admission/fact-find.md`
- Key findings used:
  - `self-evolving-from-build-output.ts` emits null measurement fields by construction.
  - `self-evolving-from-ideas.ts` adds KPI hints but still leaves the core evidence contract empty.
  - `validateMetaObservation()` currently only hard-requires richer fields when `kpi_name` is present.
  - Live BRIK candidates end up `structural_only` because builders never state evidence posture cleanly upstream.

## Proposed Approach
- Option A: tighten scoring only and leave observation admission implicit.
  - Pros: smaller code change.
  - Cons: continues mixing exploratory and instrumented observations in the same undifferentiated contract.
- Option B: add explicit admission metadata to observations, keep legacy fallback semantics, and teach ingestion builders to stamp prospective evidence posture at write time.
  - Pros: fixes the seam where ambiguity is introduced and avoids forced backfill.
  - Cons: touches contracts, builders, and tests together.
- Chosen approach: Option B.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add explicit evidence-admission metadata and additive validation rules to self-evolving observations | 89% | M | Complete (2026-03-09) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Populate the admission contract from ideas/build-output bridges and extend focused tests | 87% | M | Complete (2026-03-09) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Bind evidence posture to downstream routing, write-back eligibility, and reporting policy | 84% | M | Complete (2026-03-09) | TASK-02 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Contracts first so builders target a stable shape |
| 2 | TASK-02 | TASK-01 | Builders and tests depend on the new admission metadata |
| 3 | TASK-03 | TASK-02 | Policy must be bound only after the admission model is live |

## Tasks

### TASK-01: Add explicit evidence-admission metadata and additive validation rules to self-evolving observations
- **Type:** IMPLEMENT
- **Deliverable:** additive observation-contract fields for evidence grade and measurement contract, plus validation that keeps legacy records readable while requiring new metadata on freshly written observations
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-events.ts`, `scripts/src/startup-loop/__tests__/self-evolving-contracts.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-detector-scoring.test.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 89%
  - Implementation: 89% - the seam is localized to the observation type and validators.
  - Approach: 90% - additive prospective metadata is the cleanest way to avoid backfill.
  - Impact: 89% - this prevents low-evidence observations from masquerading as generic validated inputs.
- **Acceptance:**
  - `MetaObservation` carries explicit evidence-admission metadata for new writes.
  - Validation distinguishes legacy-readable observations from newly written observations missing admission metadata.
  - Existing scoring tests can reason about the new metadata without breaking old fixtures.
- **Validation contract (TC-01):**
  - TC-01: contract tests accept legacy observations and reject newly-written observations missing the new admission metadata.
  - TC-02: scoring tests can construct both exploratory and instrumented evidence profiles explicitly.
  - TC-03: touched scripts files pass targeted TypeScript/eslint validation.
- **Build evidence:**
  - Added versioned observation admission metadata in `self-evolving-contracts.ts`: `evidence_grade` plus `measurement_contract_status`, with strict v2 validation and legacy v1 compatibility.
  - Extended contract coverage so v2 observations without admission metadata are rejected while v1 historical records remain readable.
  - Updated focused scoring fixtures to use explicit exploratory metadata for newly-written observations.

### TASK-02: Populate the admission contract from ideas/build-output bridges and extend focused tests
- **Type:** IMPLEMENT
- **Deliverable:** ideas/build-output ingestion stamps explicit evidence grade and measurement-contract intent, with focused regression coverage preserving current route fallback behavior
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`, `scripts/src/startup-loop/__tests__/self-evolving-orchestrator-integration.test.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 87%
  - Implementation: 87% - builder changes are straightforward, but tests must stay aligned with current route semantics.
  - Approach: 88% - write explicit evidence posture instead of inferring it later.
  - Impact: 87% - directly improves trial learning quality without changing governance.
- **Acceptance:**
  - Ideas-derived observations are clearly marked as exploratory or structurally instrumented rather than implied measurement-ready.
  - Build-output observations do the same, including pattern-reflection derived seeds.
  - Weak-evidence candidates still route to `lp-do-fact-find`, now with explicit upstream evidence posture.
- **Validation contract (TC-02):**
  - TC-01: ideas/build-output bridge tests show explicit evidence metadata on generated observations.
  - TC-02: orchestrator integration continues routing weak candidates to `lp-do-fact-find`.
  - TC-03: targeted lint/typecheck on touched scripts paths passes.
- **Build evidence:**
  - `self-evolving-from-ideas.ts` now emits `meta-observation.v2` records with `exploratory/none` or `structural/declared` admission posture instead of implicit null-only semantics.
  - `self-evolving-from-build-output.ts` now emits `meta-observation.v2` records with explicit structural admission posture and `next_build_cycle` measurement horizon.
  - Updated `self-evolving-orchestrator-integration.test.ts` and `self-evolving-signal-integrity.test.ts` to assert the new metadata is present on generated observations.
  - Validation passed: targeted eslint on all touched `scripts` files and `pnpm --filter scripts exec tsc -p tsconfig.json --noEmit`.

### TASK-03: Bind evidence posture to downstream routing, write-back eligibility, and reporting policy
- **Type:** IMPLEMENT
- **Deliverable:** explicit downstream policy that makes `exploratory`, `structural`, and `measured` postures drive route eligibility, write-back eligibility, and report language
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-report.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-write-back-proposals.ts`, `scripts/src/startup-loop/__tests__/self-evolving-orchestrator-integration.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-write-back-proposals.test.ts`
- **Depends on:** TASK-02
- **Blocks:** -
- **Confidence:** 84%
  - Implementation: 84% - the affected policy seams are known and localized.
  - Approach: 85% - explicit policy is the only way to prevent the new labels from becoming decorative.
  - Impact: 84% - turns the admission system into a real control surface instead of a better annotation layer.
- **Acceptance:**
  - `exploratory` observations cannot produce anything above fact-find.
  - `structural` observations can support fact-find routing but are excluded from stronger downstream lanes and write-back proposals.
  - `measured` remains the only class eligible for stronger downstream policy where applicable.
  - Reports describe posture using both labels and the underlying evidence fields so coarse labels do not hide missing detail.
- **Validation contract (TC-03):**
  - TC-01: orchestrator integration proves each evidence posture maps to the intended route envelope.
  - TC-02: write-back proposal tests reject `exploratory` and `structural` observations where stronger evidence is required.
  - TC-03: targeted lint/typecheck on touched scripts paths passes.
- **Build evidence:**
  - Added shared posture resolution in `self-evolving-evidence-posture.ts`, including declared-vs-inferred posture summaries so downstream policy can use labels without hiding missing baseline, window, quality, or sample fields.
  - `self-evolving-orchestrator.ts` now enforces posture-aware route policy: `exploratory` and `structural` candidates are forced to `lp-do-fact-find`, while stronger routes remain available only for declared `measured` posture with measurement-ready evidence fields.
  - `self-evolving-write-back-proposals.ts` now rejects exploratory, structural, and legacy unlabeled observations from write-back eligibility, requiring declared `measured/verified` posture before rule matching can succeed.
  - `self-evolving-dashboard.ts` and `self-evolving-report.ts` now expose posture summaries with declared labels, inferred posture, and underlying measurement-field counts so reports show both coarse posture labels and the fields that justify them.
  - Updated focused regression coverage in `self-evolving-orchestrator-integration.test.ts`, `self-evolving-write-back-proposals.test.ts`, and `self-evolving-detector-scoring.test.ts` for exploratory, structural, measured, and legacy policy outcomes.
  - Validation passed: `pnpm --filter scripts exec eslint src/startup-loop/self-evolving/self-evolving-evidence-posture.ts src/startup-loop/self-evolving/self-evolving-orchestrator.ts src/startup-loop/self-evolving/self-evolving-write-back-proposals.ts src/startup-loop/self-evolving/self-evolving-dashboard.ts src/startup-loop/self-evolving/self-evolving-report.ts src/startup-loop/__tests__/self-evolving-write-back-proposals.test.ts src/startup-loop/__tests__/self-evolving-orchestrator-integration.test.ts src/startup-loop/__tests__/self-evolving-detector-scoring.test.ts`; `pnpm --filter scripts exec tsc -p tsconfig.json --noEmit`.

## Risks & Mitigations
- New metadata could become dead weight if scoring/reporting ignore it.
  - Mitigation: thread it through tests immediately and bind it to downstream route and write-back policy in TASK-03.
- Validator could accidentally break old observation files.
  - Mitigation: keep a legacy-readable branch and test it explicitly.

## Observability
- Logging: None new expected beyond existing observation artifacts.
- Metrics: future follow-up can expose evidence-grade mix by business.
- Alerts/Dashboards: None in this tranche.

## Acceptance Criteria (overall)
- [x] New self-evolving observations explicitly declare evidence posture.
- [x] Historical observations remain readable without forced backfill.
- [x] Ideas/build-output ingestion no longer relies on implicit evidence semantics.
- [x] Evidence posture has explicit downstream consequences and is not merely reported.

## Decision Log
- 2026-03-09: Chose prospective observation-layer admission metadata over dispatch-schema changes or retroactive backfill.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = sum(task confidence * effort weight) / sum(effort weight)
