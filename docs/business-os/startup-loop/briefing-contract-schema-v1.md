---
Type: Schema-Contract
Status: Active
Version: 1.0.0
Domain: Venture-Studio
Workstream: Mixed
Created: 2026-02-19
Last-updated: 2026-02-19
Owner: startup-loop maintainers
Source: docs/plans/startup-loop-briefing-feedback-loop/fact-find.md
Related-plan: docs/plans/startup-loop-briefing-feedback-loop/plan.md
Related-registry: docs/business-os/startup-loop/artifact-registry.md
---

# Startup Loop Briefing Contract Schema v1

## Purpose

Define one canonical contract for startup-loop briefing artifacts so compiled operator outputs are coherent, lintable, and decision-grade.

This schema is the source of truth for:
- Required briefing metadata fields
- Allowed status taxonomy and legacy migration rules
- P0 contradiction key checks
- T1 (top-of-fold) operator-card structure

## Scope

Applies to startup-loop business artifacts that feed the consolidated operator briefing.

| Field | Rule |
|---|---|
| Business coverage | `HEAD`, `PET`, `BRIK` (and future business codes onboarded to startup-loop) |
| Artifact types | `strategy_plan`, `outcome_contract`, `forecast`, `market_intel`, `site_upgrade`, `brand_dossier`, `consolidated_briefing` |
| Canonical output consumer | `docs/business-os/startup-loop-output-registry.user.html` |
| Lint consumer | `scripts/src/startup-loop/contract-lint.ts` (enforcement added in TASK-04) |

## Required Metadata Schema

Every compliant briefing source artifact MUST include the following frontmatter keys, using lowercase key names exactly.

| Key | Type | Required | Validation rule |
|---|---|---|---|
| `business` | string | yes | Uppercase business code, one of `HEAD`, `PET`, `BRIK` unless explicitly onboarded |
| `artifact` | string | yes | One of the allowed artifact types in Scope |
| `status` | string | yes | One of canonical statuses in this contract (`Draft`, `Active`, `Frozen`, `Superseded`) |
| `owner` | string | yes | Non-empty accountable owner |
| `last_updated` | date (`YYYY-MM-DD`) | yes | Must parse as calendar date and be >= `created` when present |
| `source_of_truth` | boolean | yes | `true` only for authoritative copy; `false` for derived/supporting docs |
| `depends_on` | list of paths | yes | Canonical repo paths; use `[]` when no dependencies |
| `decisions` | list of decision IDs | yes | IDs must match pattern `DEC-<BIZ>-...`; use `[]` when no active decision linkage |

### Authoring Rule

Mixed-case legacy keys (`Business`, `Status`, `Owner`, `Updated`, etc.) are transitional and MUST be migrated to canonical keys. During transition, lint reports deterministic migration warnings (or failures once hard-fail mode is active).

## Status Taxonomy

### Canonical statuses

| Status | Meaning | Operator behavior |
|---|---|---|
| `Draft` | Incomplete guidance; may contain explicit TBDs | Do not treat as execution authority |
| `Active` | Current execution guidance | Use for weekly decisions |
| `Frozen` | Time-bound locked guidance; changes require explicit override decision | Use as active authority until replaced |
| `Superseded` | Historical artifact replaced by newer authority | Keep for reference only |

### Legacy label migration map

The map below is deterministic: each legacy label has exactly one canonical target.

| Legacy label | Canonical target |
|---|---|
| `Locked` | `Frozen` |
| `Resolved` | `Active` |
| `Current` | `Active` |
| `Deprecated` | `Superseded` |
| `Archived` | `Superseded` |

### Explicit reject list

The following labels are invalid for briefing contract status and must fail lint:
- `Open`
- `Closed`
- `Done`
- `Final`
- `Unknown`
- `TBD`

### Migration-phase enforcement

For one transition cycle, mapped legacy labels may emit warning severity only. After transition, all legacy labels listed in the migration map are hard-fail unless migrated to canonical status values.

## P0 Contradiction Key Set

P0 contradiction checks compare canonical values across all `source_of_truth: true` artifacts for a business.

| Key | Required structure | Contradiction rule |
|---|---|---|
| `primary_channel_surface` | enum: `own_site_dtc`, `marketplace`, `hybrid` | Any non-identical value across active/frozen sources is a contradiction |
| `primary_icp` | stable segment ID string | Any non-identical value across active/frozen sources is a contradiction |
| `hero_sku_price_corridor` | object with `currency`, `min`, `max` | Currency mismatch or non-overlapping ranges is a contradiction |
| `claim_confidence` | map `claim_id -> confidence` (`Low`/`Medium`/`High`) | Same `claim_id` with different confidence labels is a contradiction |

Policy alignment: unresolved P0 contradictions are hard-fail after the one-cycle warn-only preflight selected in `TASK-02`.

## T1 Operator-Card Contract

The consolidated briefing top-of-fold for each business MUST render all blocks below before T2/T3 narrative content.

| Block | Required content | Constraint |
|---|---|---|
| Outcome + window | Outcome statement and target-by window | 1-2 lines max |
| Gate status | Pass/Warn/Fail state with denominators | Denominators visible or explicitly `unmeasured` |
| Top blockers | Stable IDs, owner, due date, status | At least top 3 blockers |
| Next 72h plan | Immediate execution actions | Max 5 bullets |
| Decision register summary | Decision ID, trigger, state, next evidence required | Must include all open decision IDs |
| Metrics snapshot | Current values for key KPIs | Missing metrics must display `unmeasured`, not blank |

### Canonical Blockers and Unknowns Table

When present, use this column contract:
- `id`
- `question_or_gap`
- `why_it_matters`
- `owner`
- `due_date`
- `status` (`Open`, `In progress`, `Closed`)
- `source_artifact`

## Validation Procedure (Task VC Contract)

### VC-01 — Schema completeness and sample validation

Pass condition:
1. All eight required metadata fields are documented in this file.
2. Validation was run against HEAD/PET/BRIK sample artifacts in this task cycle.

Sample set used (2026-02-19):
- `docs/business-os/startup-baselines/HEAD-intake-packet.user.md`
- `docs/business-os/startup-baselines/PET-intake-packet.user.md`
- `docs/business-os/startup-baselines/BRIK-intake-packet.user.md`

Observed baseline:
- Canonical lowercase schema keys are missing in all three sample artifacts.
- Legacy keys (`Business`, `Status`, `Owner`, `Updated`) are present in all three.

Interpretation:
- Validation executed successfully and confirms migration/lint scope for TASK-04.

### VC-02 — Deterministic status taxonomy

Pass condition:
- Canonical status set is explicit.
- Legacy mapping is one-to-one.
- Reject list is explicit.

### VC-03 — Registry integration

Pass condition:
- `docs/business-os/startup-loop/artifact-registry.md` references this contract as canonical briefing schema authority.
- Registry validation-rule section includes briefing lint responsibilities.

## References

- `docs/plans/startup-loop-briefing-feedback-loop/fact-find.md`
- `docs/plans/startup-loop-briefing-feedback-loop/plan.md`
- `docs/business-os/startup-loop/artifact-registry.md`
- `docs/business-os/startup-loop/process-registry-v2.md`
- `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`
