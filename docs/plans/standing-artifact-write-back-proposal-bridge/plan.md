---
Type: Plan
Status: Complete
Domain: BOS
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: standing-artifact-write-back-proposal-bridge
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find
Overall-confidence: 88%
Confidence-Method: evidence-based on existing apply engine reuse and temp-dir validation seams
Auto-Build-Intent: plan+auto
---

# Standing Artifact Write-Back Proposal Bridge Plan

## Summary
The archived deterministic write-back build solved only the apply phase. This follow-on plan closes the remaining proposal-generation seam by compiling rule-mapped KPI observations into `ProposedUpdate[]` payloads that can be handed to the existing write-back engine. The bridge stays fail-closed, bounded to machine-usable KPI observations, and explicit about the current non-goal: generic prose observations still do not contain enough structure for deterministic artifact patches.

## Active tasks
- [x] TASK-01: Define the revised bridge contract and persist the follow-on workflow artifacts
- [x] TASK-02: Implement a deterministic KPI-observation -> ProposedUpdate compiler with optional apply mode
- [x] TASK-03: Add targeted regression coverage and run scoped validation

## Goals
- Close the missing proposal-generation seam without replacing the existing write-back applicator.
- Keep the bridge deterministic and fail-closed.
- Bound the bridge to observation data that is actually structured enough to support deterministic compilation.

## Non-goals
- Parsing arbitrary prose observations into patches.
- Reworking the standing registry.
- Shipping live business mappings in this same build.

## Constraints & Assumptions
- Constraints:
  - Reuse existing write-back safety gates.
  - Require explicit mappings from KPI names to artifact targets.
  - Keep default readiness aligned with current self-evolving measurement thresholds.
- Assumptions:
  - KPI observations are the only current observation class suitable for deterministic write-back proposal compilation.

## Inherited Outcome Contract
- **Why:** The prior deterministic write-back work delivered only the apply engine. The self-evolving pipeline still cannot turn observed factual KPI updates into bounded write-back payloads without manual JSON assembly, so the observation-to-artifact gap remains operationally open.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Add a deterministic bridge that compiles mapped KPI observations into safe write-back proposals and can hand them to the existing write-back engine.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/standing-artifact-write-back-proposal-bridge/fact-find.md`
- Key findings used:
  - `self-evolving-write-back.ts` already provides the safe apply path.
  - `MetaObservation` only supports deterministic compilation for KPI-shaped observations.
  - Current observation readiness already uses a `sample_size >= 30` floor.

## Proposed Approach
- Option A: Extend `MetaObservation` to carry patch-target metadata directly.
- Option B: Add a small deterministic mapping contract that resolves KPI observations into `ProposedUpdate[]`.
- Chosen approach: Option B. It closes the current gap without mutating the shared observation schema or weakening write-back safety.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | INVESTIGATE | Persist the revised idea and bridge contract in current fact-find/plan artifacts | 94% | S | Complete | - | TASK-02 |
| TASK-02 | IMPLEMENT | Add deterministic KPI observation proposal compilation with optional apply handoff | 87% | M | Complete | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Add regression tests and run targeted `tsc`/`eslint` validation | 89% | M | Complete | TASK-02 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Artifact persistence first |
| 2 | TASK-02 | TASK-01 | Core implementation |
| 3 | TASK-03 | TASK-02 | Tests validate the new seam and optional apply flow |

## Tasks

### TASK-01: Persist revised bridge scope
- **Type:** INVESTIGATE
- **Deliverable:** Fresh fact-find + active plan for the revised idea
- **Confidence:** 94%
- **Effort:** S
- **Status:** Complete (2026-03-09)

### TASK-02: Implement proposal bridge
- **Type:** IMPLEMENT
- **Deliverable:** New self-evolving CLI that compiles mapped KPI observations into `ProposedUpdate[]` and can optionally call `applyWriteBack()`
- **Confidence:** 87%
- **Effort:** M
- **Status:** Complete (2026-03-09)

### TASK-03: Validate bridge
- **Type:** IMPLEMENT
- **Deliverable:** Regression coverage for compile-only and compile+apply flows, plus targeted TypeScript and ESLint validation
- **Confidence:** 89%
- **Effort:** M
- **Status:** Complete (2026-03-09)

## Risks & Mitigations
- No live mapping file ships in this build.
  - Mitigation: make the bridge contract explicit and keep compile output deterministic for future mapped rollout.
- Overlapping mappings could target the same field.
  - Mitigation: collapse proposals deterministically by target key and latest observation timestamp.

## Observability
- Logging: stderr summaries from the new bridge CLI
- Metrics: proposal counts, skipped observations, optional apply result counts
- Alerts/Dashboards: none in this build

## Acceptance Criteria (overall)
- [x] A new deterministic bridge can read KPI observations and emit `ProposedUpdate[]`
- [x] The bridge supports optional handoff into the existing write-back engine
- [x] Regression coverage proves compile-only and compile+apply paths
- [x] Targeted `tsc` and `eslint` pass on touched files

## Decision Log
- 2026-03-09: Revised the original idea into a follow-on bridge scope because the archived March 4 work already shipped the apply engine.
- 2026-03-09: Kept live business mappings out of scope; this build ships the reusable bridge contract and validation seam only.

## Overall-confidence Calculation
- S=1, M=2
- Overall-confidence = (94*1 + 87*2 + 89*2) / 5 = 89.2% -> rounded down to 88% for rollout conservatism

## Build completion evidence
- Added `docs/plans/standing-artifact-write-back-proposal-bridge/fact-find.md` to revise the archived idea into the actual missing seam: KPI observation proposal compilation.
- Added `scripts/src/startup-loop/self-evolving/self-evolving-write-back-proposals.ts` with:
  - per-business mapping rule-set contract
  - deterministic KPI observation filtering
  - template-driven `ProposedUpdate[]` generation
  - target-key collision collapse to the latest qualifying observation
  - optional handoff to `applyWriteBack()`
- Added `scripts/src/startup-loop/__tests__/self-evolving-write-back-proposals.test.ts` covering compile-only, sample-size gating, latest-observation collapse, and compile+apply integration.
- Added package wiring in `scripts/package.json` and export wiring in `scripts/src/startup-loop/self-evolving/self-evolving-index.ts`.

## Validation
- `pnpm exec tsc -p /Users/petercowling/base-shop/scripts/tsconfig.json --noEmit`
- `pnpm exec eslint /Users/petercowling/base-shop/scripts/src/startup-loop/self-evolving/self-evolving-write-back-proposals.ts /Users/petercowling/base-shop/scripts/src/startup-loop/__tests__/self-evolving-write-back-proposals.test.ts /Users/petercowling/base-shop/scripts/src/startup-loop/self-evolving/self-evolving-index.ts /Users/petercowling/base-shop/scripts/package.json --no-warn-ignored`
