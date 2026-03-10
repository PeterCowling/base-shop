---
Type: Plan
Status: Complete
Domain: Infra
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-container-reference-cleanup
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 91%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Startup Loop Container Reference Cleanup Plan

## Summary

This plan replaces the stale, oversized startup-loop root-container idea with the actual remaining cleanup: align a small set of active startup-loop references and metadata with the already-landed containerized authority model. The build is intentionally narrow. It updates two active specification metadata fields, one live plan reference, and the validator fixture that mirrors the assignment metadata. Archived plans, deprecated records, and trial queue telemetry remain untouched.

## Active tasks

- [x] TASK-01: Align active startup-loop references and authority metadata

## Goals

- Remove the remaining active references to pre-containerized startup-loop paths.
- Make active startup-loop metadata consistent with the current v2/containerized authority set.
- Keep the cleanup bounded away from historical and deprecated records.

## Non-goals

- Repeating the startup-loop root-container migration.
- Normalizing archived plans or historical queue-state payloads.
- Changing active versioned contract filenames that are not superseded.

## Constraints & Assumptions

- Constraints:
  - `process-registry-v2.md` remains the authoritative process source.
  - Local Jest execution remains out of bounds.
  - Scope must stay limited to active surfaces and validation artifacts.
- Assumptions:
  - `process_id_source` and `taxonomy_ref` are descriptive metadata fields.
  - Updating the validator fixture is sufficient to keep test expectations aligned.

## Inherited Outcome Contract

- **Why:** The original startup-loop root-container idea is already complete, but a few active docs and metadata fields still point to deprecated or pre-containerized paths.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Active startup-loop references and metadata align with current containerized authorities, while historical/archive telemetry remains unchanged.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/startup-loop-container-reference-cleanup/fact-find.md`
- Key findings used:
  - The root-container reorg is already complete.
  - Remaining drift is limited to one active plan, two active metadata fields, and one validator fixture.
  - Historical/archive surfaces should remain unchanged.

## Proposed Approach

- Option A: Leave the remaining drift alone because the main reorg already landed.
  - Rejected: active authority metadata and live plan references would remain misleading.
- Option B: Apply an active-surface-only cleanup and leave historical records intact.
  - Chosen: fixes the real defect without reopening archive/telemetry churn.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Align active startup-loop references and authority metadata | 91% | S | Complete (2026-03-09) | - | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Single bounded cleanup task |

## Tasks

### TASK-01: Align active startup-loop references and authority metadata
- **Type:** IMPLEMENT
- **Deliverable:** active startup-loop authority metadata, live plan references, and validator fixtures align with the current containerized authority model.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Affects:** `docs/business-os/startup-loop/specifications/process-assignment-v2.yaml`, `docs/business-os/startup-loop/specifications/workstream-workflow-taxonomy-v2.yaml`, `scripts/src/startup-loop/__tests__/validate-process-assignment.test.ts`, `docs/plans/startup-loop-legal-container-insertion/plan.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 91%
  - Implementation: 95% - edits are direct string-alignments in already verified files.
  - Approach: 92% - active-surface-only cleanup matches the verified remaining defect.
  - Impact: 88% - removes live authority ambiguity and keeps validation fixtures honest.
- **Acceptance:**
  - `process-assignment-v2.yaml` names the active v2 process authority rather than the deprecated v1 registry.
  - `workstream-workflow-taxonomy-v2.yaml` no longer points at the deprecated prose taxonomy file.
  - `validate-process-assignment.test.ts` fixture matches the updated assignment metadata.
  - `startup-loop-legal-container-insertion/plan.md` uses containerized `specifications/` paths.
  - No additional active-surface stale references from this cleanup scope remain outside archive/history locations.
- **Validation contract (TC-01):**
  - TC-01: `pnpm exec tsc -p scripts/tsconfig.json --noEmit` exits 0.
  - TC-02: `pnpm exec eslint scripts/src/startup-loop/__tests__/validate-process-assignment.test.ts` exits 0.
  - TC-03: `node --import tsx -e "import { run } from './scripts/src/startup-loop/diagnostics/validate-process-assignment.ts'; run({ repoRoot: process.cwd() });"` exits 0.
  - TC-04: targeted `rg` scans show no remaining active-surface references to `docs/business-os/startup-loop/workstream-workflow-taxonomy-v2.yaml` without `specifications/`, and no stale deprecated metadata references outside intended historical files.
- **Execution plan:** Red -> Green -> Refactor
- **Scouts:** None: fact-find reduced scope to known active surfaces.
- **Edge Cases & Hardening:** Preserve `_deprecated/`, `_archive/`, and `ideas/trial/` history unchanged.
- **What would make this >=90%:**
  - Add a deterministic lint that rejects startup-loop authority metadata pointing at deprecated sources.
- **Rollout / rollback:**
  - Rollout: direct doc/spec/test updates.
  - Rollback: restore prior strings if a hidden runtime consumer is discovered.
- **Documentation impact:**
  - New fact-find, plan, build record, and results review persisted for the narrowed cleanup.
  - Live plan path references now match the containerized startup-loop layout.
- **Notes / references:**
  - `docs/plans/_archive/startup-loop-root-containers/results-review.user.md`
  - `docs/business-os/startup-loop/process-registry-v2.md`

#### Build completion evidence

- Updated `process_id_source` in `process-assignment-v2.yaml` to the active v2 process registry.
- Updated `taxonomy_ref` in `workstream-workflow-taxonomy-v2.yaml` to the canonical YAML authority path.
- Updated the validator fixture in `validate-process-assignment.test.ts` to mirror the new assignment metadata.
- Updated the remaining live plan path in `startup-loop-legal-container-insertion/plan.md` to use `specifications/workstream-workflow-taxonomy-v2.yaml`.
- Validation used direct `tsc`, `eslint`, and validator-module entrypoints because the `scripts` package does not expose standalone `typecheck`/`lint` scripts and the validator CLI currently resolves `repoRoot` incorrectly in package-script mode.

## Risks & Mitigations

- Hidden consumers may rely on the old metadata strings.
  - Mitigation: changes are limited to descriptive fields and validated via the affected package.
- Archive/history cleanup could accidentally expand scope.
  - Mitigation: explicit non-goal and acceptance check to leave those surfaces untouched.

## Observability

- Logging: none required
- Metrics: none required
- Alerts/Dashboards: none required

## Acceptance Criteria (overall)

- [x] Active startup-loop authority metadata matches current containerized authorities.
- [x] The remaining live plan reference uses the containerized path.
- [x] Targeted TypeScript, ESLint, and assignment-validator checks pass after the fixture update.

## Decision Log

- 2026-03-09: Replaced the stale broad “root containers” follow-up with an active-surface-only cleanup plan.
- 2026-03-09: Left `_deprecated/`, `_archive/`, and `ideas/trial/` historical records unchanged by design.

## Overall-confidence Calculation

- S=1, M=2, L=3
- Overall-confidence = 91% for one S-sized implementation task with direct evidence and bounded scope.
