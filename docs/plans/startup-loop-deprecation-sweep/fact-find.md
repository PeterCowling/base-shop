---
Type: Fact-Find
Outcome: Planning
Status: Infeasible
Domain: Infra
Workstream: Engineering
Created: 2026-03-03
Last-updated: 2026-03-03
Feature-Slug: startup-loop-deprecation-sweep
Execution-Track: business-artifact
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Trigger-Source: dispatch-routed
Dispatch-ID: IDEA-DISPATCH-20260303120000-0135
Trigger-Why: Multiple superseded files sit alongside their replacements with no deprecation markers. This creates confusion about which version is canonical and risks agents or operators referencing outdated content.
Trigger-Intended-Outcome: "type: operational | statement: _deprecated/ directory created in startup-loop/. Superseded files moved there with README documenting what replaced them and when. | source: operator"
---

# Startup Loop Deprecation Sweep — Fact-Find Brief

## Scope

### Summary

Investigation into whether superseded files in `docs/business-os/startup-loop/` need deprecation markers or relocation. The dispatch identified process-registry-v1.md, duplicate YAML/MD formats, contract-migration.yaml, and exception-runbooks-v1.md as candidates.

### Goals

- Determine which startup-loop files are actually superseded vs still active
- Check whether _deprecated/ directory and deprecation markers already exist
- Identify any code/skill references to superseded files

### Non-goals

- Building an automatic deprecation review cadence (identified as adjacent-later)
- Renaming active v1 files to remove version suffixes

## Outcome Contract

- **Why:** Multiple superseded files sit alongside their replacements with no deprecation markers.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** _deprecated/ directory created in startup-loop/. Superseded files moved there with README documenting what replaced them and when.
- **Source:** operator

## Kill Rationale

**Intended outcome already achieved.** The `_deprecated/` directory exists at `docs/business-os/startup-loop/_deprecated/` with a README documenting all supersessions. Both superseded files identified in the dispatch (process-registry-v1.md and workstream-workflow-taxonomy-v2.md prose duplicate) are already in `_deprecated/` with explicit archival markers. The remaining files cited (contract-migration.yaml and exception-runbooks-v1.md) are active, not superseded. No additional deprecation work is needed. The dispatch was created before dispatch A (`startup-loop-root-containers`) completed, which reorganised the startup-loop root and established the deprecation infrastructure.

## Evidence Audit (Current State)

### Entry Points

- `docs/business-os/startup-loop/_deprecated/` — existing deprecation directory

### Key Modules / Files

| File | Status | Evidence |
|---|---|---|
| `_deprecated/process-registry-v1.md` | **Already deprecated** | Explicitly marked "ARCHIVED: Superseded by process-registry-v2.md as of 2026-02-18". Frozen — no new edits. |
| `_deprecated/workstream-workflow-taxonomy-v2.md` | **Already deprecated** | README documents supersession by YAML version. Code only reads the YAML. |
| `_deprecated/README.md` | **Present** | Documents all supersessions with dates and replacement file paths. |
| `operations/contract-migration.yaml` | **Active** | Source of truth for build-time generated TypeScript (`contract-migration.generated.ts`). Used by business-os runtime for stage-key aliasing and legacy filename handling. Not superseded. |
| `operations/exception-runbooks-v1.md` | **Active** | Status: Active, no v2 exists. v1 suffix is initial versioning, not deprecation marker. Referenced by process-registry-v2.md, audit-cadence-contract-v1.md, and sales-ops-schema.md. |
| `contracts/audit-cadence-contract-v1.md` | **Active** | No v2 exists. |
| `contracts/s10-weekly-orchestration-contract-v1.md` | **Active** | No v2 exists. Referenced by lp-weekly skill. |
| `schemas/briefing-contract-schema-v1.md` | **Active** | No v2 exists. Created 2026-02-19. |
| `schemas/s10-weekly-packet-schema-v1.md` | **Active** | No v2 exists. |

### Patterns & Conventions Observed

- **_deprecated/ infrastructure is operational:** Directory exists, README documents supersessions, deprecated files have explicit archival markers.
- **v1 suffix ≠ deprecated:** Active files with v1 suffixes (audit-cadence, s10-weekly-orchestration, briefing-contract-schema, s10-weekly-packet-schema) are initial versions with no replacements. The suffix indicates versioning intent, not deprecation.
- **YAML/MD dual format is resolved:** The workstream-workflow-taxonomy has YAML as canonical (code reads it) and MD as deprecated prose (in _deprecated/).

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| _deprecated/ directory state | Yes | None — directory exists with README and 2 superseded files | No |
| process-registry v1 vs v2 | Yes | None — v1 already archived with explicit markers | No |
| workstream-workflow-taxonomy formats | Yes | None — MD deprecated, YAML canonical | No |
| contract-migration.yaml status | Yes | None — confirmed active (build-time source for generated TS) | No |
| exception-runbooks-v1 status | Yes | None — confirmed active (no v2 exists) | No |
| Active v1 file survey | Yes | None — 4 active v1 files confirmed as initial versions, not superseded | No |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** Investigation covered all files cited in the dispatch plus a broader survey of v1/v2 files. Every candidate was verified against current codebase state. No additional investigation needed.

## Questions

### Resolved

- Q: Are there superseded files without deprecation markers?
  - A: No. Both superseded files (process-registry-v1.md and workstream-workflow-taxonomy-v2.md prose) are already in `_deprecated/` with explicit markers and README documentation.
  - Evidence: `ls _deprecated/` shows 3 files; README documents supersessions with dates.

- Q: Is contract-migration.yaml superseded?
  - A: No. It is actively used as the build-time source for `contract-migration.generated.ts`. The backward compatibility windows have expired (cutoffs at 2026-02-14) but the file remains the source of truth for the stage addressing resolver contract.
  - Evidence: `apps/business-os/scripts/generate-contract-migration.mjs` generates TypeScript from this YAML; route handlers use `getContractMigrationConfig()`.

- Q: Is exception-runbooks-v1.md superseded?
  - A: No. Status: Active, no v2 exists. The v1 suffix is initial versioning.
  - Evidence: No file matching `exception-runbooks-v2` exists anywhere in the repo.

### Open (Operator Input Required)

None — all questions resolved from evidence.

## Confidence Inputs

- Implementation: 95% — no implementation needed (outcome already achieved)
- Approach: 95% — investigation confirms dispatch premise is no longer valid
- Impact: 95% — no changes needed, zero risk
- Delivery-Readiness: 95% — nothing to deliver

## Risks

None — no changes proposed.

## Access Declarations

None — all artifacts are repo-local.

## Evidence Gap Review

### Gaps Addressed

- Confirmed _deprecated/ directory exists with proper README
- Confirmed all cited superseded files are already archived with markers
- Confirmed contract-migration.yaml and exception-runbooks-v1.md are active

### Confidence Adjustments

None — evidence fully supports the infeasible determination.

### Remaining Assumptions

None.

## Planning Readiness

- Status: Infeasible
- Blocking items: None — the intended outcome is already achieved
- Recommended next step: Close dispatch as completed (outcome already met)
