---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Infra
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: startup-loop-container-reference-cleanup
Execution-Track: mixed
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/startup-loop-container-reference-cleanup/plan.md
Trigger-Why: The original startup-loop root-container idea is already complete, but a few active docs and metadata fields still point to deprecated or pre-containerized paths.
Trigger-Intended-Outcome: "type: operational | statement: Active startup-loop references and metadata align with current containerized authorities, while historical/archive telemetry remains unchanged. | source: operator"
---

# Startup Loop Container Reference Cleanup Fact-Find Brief

## Scope

### Summary

The startup-loop root-container reorganisation already landed, but three active surfaces still misstate the current structure: one live plan references the old flat startup-loop root, `process-assignment-v2.yaml` still identifies the deprecated v1 registry as the process ID source, and `workstream-workflow-taxonomy-v2.yaml` still points to the deprecated prose taxonomy file. The remaining cleanup is a bounded authority-alignment pass, not another container migration.

### Goals

- Replace active startup-loop references that still point at pre-containerized paths.
- Align active metadata fields with the current authoritative v2/containerized startup-loop files.
- Leave archived plans and historical queue telemetry unchanged.

### Non-goals

- Re-running or redesigning the startup-loop root-container migration.
- Rewriting archived plans, `_deprecated/` records, or trial queue history.
- Renaming active v1 contract files that remain the current version.

### Constraints & Assumptions

- Constraints:
  - `docs/business-os/startup-loop/process-registry-v2.md` remains the active process authority.
  - `_deprecated/` files must remain intact as historical records.
  - Testing policy forbids local Jest execution; validation must rely on scoped typecheck/lint and direct file inspection.
- Assumptions:
  - Metadata fields such as `process_id_source` and `taxonomy_ref` are descriptive authority markers, not runtime selectors.
  - Historical queue-state strings are preserved telemetry and should not be rewritten just to remove stale paths.

## Outcome Contract

- **Why:** The original startup-loop root-container idea is already complete, but a few active docs and metadata fields still point to deprecated or pre-containerized paths.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Active startup-loop references and metadata align with current containerized authorities, while historical/archive telemetry remains unchanged.
- **Source:** operator

## Access Declarations

None.

## Evidence Audit (Current State)

### Entry Points

- `docs/business-os/startup-loop/process-registry-v2.md` - active process registry and authority header.
- `docs/business-os/startup-loop/specifications/process-assignment-v2.yaml` - active process assignment metadata.
- `docs/business-os/startup-loop/specifications/workstream-workflow-taxonomy-v2.yaml` - active taxonomy metadata.
- `docs/plans/startup-loop-legal-container-insertion/plan.md` - live plan with one stale pre-containerized path.

### Key Modules / Files

- `docs/plans/_archive/startup-loop-root-containers/results-review.user.md` - confirms the container reorg already shipped and stale-path cleanup was part of the original build.
- `docs/business-os/startup-loop/_deprecated/README.md` - confirms deprecated files were already relocated and marked.
- `scripts/src/startup-loop/diagnostics/validate-process-assignment.ts` - validator defines the metadata fields but does not treat them as runtime path loaders.
- `scripts/src/startup-loop/__tests__/validate-process-assignment.test.ts` - fixture mirrors the current assignment metadata and must stay aligned after cleanup.

### Patterns & Conventions Observed

- Current startup-loop authorities are already containerized:
  - `process-registry-v2.md` points to `specifications/workstream-workflow-taxonomy-v2.yaml` and `specifications/process-assignment-v2.yaml`.
- Deprecated material is explicitly marked and retained:
  - `_deprecated/README.md` maps `process-registry-v1.md` and `workstream-workflow-taxonomy-v2.md` to their replacements.
- The remaining problem is limited to active-surface metadata drift, not missing migration infrastructure.

### Data & Contracts

- Types/schemas/events:
  - `ProcessAssignment` includes `taxonomy_ref` and `process_id_source` as string metadata fields.
- Persistence:
  - Startup-loop specification YAML files are repo-backed artifacts under `docs/business-os/startup-loop/specifications/`.
- API/contracts:
  - No runtime API contract changes are required; scope is authority metadata plus live doc references.

### Dependency & Impact Map

- Upstream dependencies:
  - Current startup-loop authority model in `process-registry-v2.md`.
- Downstream dependents:
  - Process-assignment validator fixture and any operator reading active startup-loop plans/specs.
- Likely blast radius:
  - One active plan doc, two active startup-loop spec metadata fields, one validator test fixture.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest for `scripts` package tests, but local execution is policy-blocked.
- Commands: `pnpm --filter scripts typecheck`, `pnpm --filter scripts lint`
- CI integration: `scripts` package validation and repo hooks consume the startup-loop spec files.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Process assignment metadata shape | Unit | `scripts/src/startup-loop/__tests__/validate-process-assignment.test.ts` | Fixture currently encodes the stale `process_id_source` path. |

#### Coverage Gaps

- Untested paths:
  - No dedicated assertion currently checks `workstream-workflow-taxonomy-v2.yaml` self-declared authority path.
- Extinct tests:
  - None identified.

#### Recommended Test Approach

- Typecheck and lint the `scripts` package after updating the metadata fixture.
- Use targeted `rg` scans to confirm no active non-archive surfaces still point at pre-containerized startup-loop paths for this narrowed scope.

## Questions

### Resolved

- Q: Does `startup-loop-root-containers` still need implementation?
  - A: No. The root-container reorg already completed and was recorded as shipped.
  - Evidence: `docs/plans/_archive/startup-loop-root-containers/results-review.user.md`

- Q: Which active surfaces are still wrong today?
  - A: One live plan doc still references flat startup-loop root paths, and two active startup-loop metadata fields still point at deprecated/pre-containerized authorities.
  - Evidence: `docs/plans/startup-loop-legal-container-insertion/plan.md`, `docs/business-os/startup-loop/specifications/process-assignment-v2.yaml`, `docs/business-os/startup-loop/specifications/workstream-workflow-taxonomy-v2.yaml`

- Q: Should archived plans, deprecated docs, or queue telemetry be rewritten as part of this cleanup?
  - A: No. Those are historical records and should remain unchanged unless a separate archival-normalization task is created.
  - Evidence: `_deprecated/README.md` already documents the deprecation model; historical queue-state entries record prior observations rather than active authority.

## Confidence Inputs

- Implementation: 95%
  - Evidence basis: only four bounded file edits plus new workflow artifacts are required.
  - >=80 already met; >=90 maintained because the active-surface scope is directly verified.
- Approach: 92%
  - Evidence basis: active-surface-only cleanup avoids rewriting historical records and matches the actual remaining defect.
  - What would raise it further: an automated lint for stale startup-loop authority metadata.
- Impact: 88%
  - Evidence basis: resolves remaining operator-facing ambiguity without risking runtime behavior.
  - What would raise it further: a deterministic stale-path audit covering all active plans/spec metadata.
- Delivery-Readiness: 95%
  - Evidence basis: all needed files are local and directly editable; no external access or approvals required.
  - What would raise it further: none materially for this scope.
- Testability: 85%
  - Evidence basis: scoped lint/typecheck and grep-based verification are available, but local Jest is intentionally blocked.
  - What would raise it further: CI confirmation after a future commit.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Updating metadata to the wrong authority path could create a new contradiction | Low | Medium | Use the authority header in `process-registry-v2.md` as the source for canonical paths. |
| Cleanup scope expands into archive rewriting | Low | Medium | Keep the task explicitly limited to active files; do not touch `_archive/`, `_deprecated/`, or `ideas/trial/`. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Preserve `_deprecated/` as the historical namespace for superseded startup-loop docs.
  - Keep plan references containerized under `specifications/`, `schemas/`, `contracts/`, or `operations/` as appropriate.
- Rollout/rollback expectations:
  - Rollout: direct doc/spec metadata updates.
  - Rollback: restore the previous strings if a downstream consumer is discovered to require them.
- Observability expectations:
  - Verification is via targeted grep plus scoped `scripts` package validation.

## Suggested Task Seeds (Non-binding)

- Update active startup-loop spec metadata and live plan references to current containerized authorities.
- Align validator fixture expectations with the new canonical metadata strings.

## Execution Routing Packet

- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `none`
- Deliverable acceptance package:
  - Updated startup-loop metadata/docs + targeted `scripts` lint/typecheck + stale-reference grep evidence.
- Post-delivery measurement plan:
  - None beyond validation evidence; this is a bounded correctness cleanup.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Root-container implementation status | Yes | None - archived build artifacts already prove completion | No |
| Active startup-loop authority files | Yes | Minor: two metadata fields still reference deprecated/pre-container paths | Yes |
| Live plan references | Yes | Minor: one active plan still uses a flat startup-loop path | Yes |
| Historical/archive surfaces | Yes | None - historical records intentionally preserve old paths | No |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The remaining work is tightly bounded to active-surface correctness and does not require broader repo reorganisation.

## Evidence Gap Review

### Gaps Addressed

- Confirmed the original root-container idea is already implemented.
- Confirmed the remaining defects are limited to active-surface references/metadata.
- Confirmed validator/test impact is limited to one fixture file.

### Confidence Adjustments

- Delivery confidence increased once active/archive boundaries were separated.

### Remaining Assumptions

- No hidden runtime consumer parses `process_id_source` or `taxonomy_ref` beyond treating them as descriptive metadata.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items:
  - None.
- Recommended next step:
  - `/lp-do-plan` then immediate `lp-do-build` execution for a single-task cleanup plan.
