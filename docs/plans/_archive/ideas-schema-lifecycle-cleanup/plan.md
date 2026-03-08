---
Type: Plan
Status: Archived
Domain: Infra
Workstream: Engineering
Created: 2026-03-03
Last-reviewed: 2026-03-03
Last-updated: 2026-03-03
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: ideas-schema-lifecycle-cleanup
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: business-artifact
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Ideas Schema Lifecycle Cleanup Plan

## Summary

Reorganise the `docs/business-os/startup-loop/ideas/` directory by creating a `schemas/` subdirectory for active schema files, deprecating the v1 dispatch schema (moving to `_deprecated/`), updating all references (2 JSDoc comments in `.ts` files + doc references in contract/skill files), and writing an `IDEAS-LIFECYCLE.md` document that synthesises the trial-to-live queue transition from existing contract docs.

## Active tasks

- [x] TASK-01: Move schemas to subdirectory and deprecate v1 — Complete (2026-03-03)
- [x] TASK-02: Write IDEAS-LIFECYCLE.md lifecycle overview — Complete (2026-03-03)

## Goals

- Separate schema files from contract/operational docs in ideas/ root
- Mark v1 schema as deprecated with clear pointer to v2
- Provide a single-page lifecycle overview of the trial → live queue transition

## Non-goals

- Modifying TypeScript type definitions (inline in `.ts` files, not generated from JSON schemas)
- Changing the v1/v2 compat layer in production code
- Activating live mode (separate go-live checklist)
- Restructuring trial/ or live/ queue data directories

## Constraints & Assumptions

- Constraints:
  - 129 historical v1 packets in trial queue — v1 compat layer must remain in code
  - Schema JSON files are reference documentation only — no runtime import/require
  - `_archive/` already contains different archived docs (5 files); use `_deprecated/` for deprecated schemas
- Assumptions:
  - No future code will import schema JSON files directly (mitigated by adding "reference only" note in schema header)

## Inherited Outcome Contract

- **Why:** Two dispatch schema versions coexist with no deprecation marker. The trial-to-live queue lifecycle is undocumented, making it unclear how dispatches progress through the system.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** v1 schema deprecated or deleted. Schemas moved to ideas/schemas/. IDEAS-LIFECYCLE.md documents trial to live queue transition clearly.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/ideas-schema-lifecycle-cleanup/fact-find.md`
- Key findings used:
  - Schema JSON files have no runtime imports — only 2 JSDoc comment references in `.ts` files
  - 129 v1 vs 11 v2 packets in queue data — v1 is documentation-valuable, not deletable
  - `_archive/` already has different content; `_deprecated/` is the right pattern
  - Five existing docs (trial contract, go-live seam, go-live checklist, routing matrix, rollback playbook) contain all lifecycle information — synthesis needed, not research

## Proposed Approach

- Option A: Move schemas to `ideas/schemas/`, deprecate v1 to `ideas/_deprecated/`
- Option B: Move schemas to `ideas/schemas/` and keep v1 there with deprecation notice inline
- Chosen approach: Option A — physical separation makes the deprecation unambiguous and follows the existing `_deprecated/` pattern used in other startup-loop directories. The `_deprecated/` directory will contain v1 schema + a README explaining what replaced it.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Move schemas to subdirectory and deprecate v1 | 90% | S | Complete (2026-03-03) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Write IDEAS-LIFECYCLE.md lifecycle overview | 85% | S | Complete (2026-03-03) | TASK-01 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Schema moves + reference updates |
| 2 | TASK-02 | TASK-01 | Lifecycle doc references final schema locations |

## Tasks

### TASK-01: Move schemas to subdirectory and deprecate v1

- **Type:** IMPLEMENT
- **Deliverable:** Reorganised schema directory structure at `ideas/schemas/` and `ideas/_deprecated/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-03)
- **Artifact-Destination:** `docs/business-os/startup-loop/ideas/schemas/` and `docs/business-os/startup-loop/ideas/_deprecated/`
- **Reviewer:** None: operational file move, self-validating via reference check
- **Approval-Evidence:** None: no reviewer required for file reorganisation
- **Measurement-Readiness:** None: operational improvement, no metric
- **Affects:**
  - `docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.schema.json`
  - `docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.v2.schema.json`
  - `docs/business-os/startup-loop/ideas/lp-do-ideas-standing-registry.schema.json`
  - `scripts/src/startup-loop/lp-do-ideas-trial.ts` (JSDoc comment only)
  - `scripts/src/startup-loop/lp-do-ideas-live.ts` (JSDoc comment only)
  - `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md` (schema path refs only)
  - `docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-seam.md` (schema path refs only)
  - `docs/business-os/startup-loop/ideas/lp-do-ideas-routing-matrix.md` (schema path refs only)
  - `.claude/skills/lp-do-ideas/SKILL.md` (schema path refs only)
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 90%
  - Implementation: 90% — file moves are trivial; all references mapped by fact-find grep
  - Approach: 90% — follows established `_deprecated/` pattern from other startup-loop directories
  - Impact: 90% — low-risk file reorganisation; no functional code change
- **Acceptance:**
  - [ ] `ideas/schemas/` directory exists with: `lp-do-ideas-dispatch.v2.schema.json`, `lp-do-ideas-standing-registry.schema.json`
  - [ ] `ideas/_deprecated/` directory exists with: `lp-do-ideas-dispatch.schema.json` (v1), `README.md` explaining deprecation
  - [ ] v1 schema file has deprecation notice header added
  - [ ] JSDoc comments in `lp-do-ideas-trial.ts` and `lp-do-ideas-live.ts` updated to new paths
  - [ ] Doc references in contract/skill markdown files updated to new schema paths
  - [ ] Zero stale schema path references remain (verified by grep)
- **Validation contract (VC-01):**
  - VC-01: Stale schema path references -> pass when grep for the old root-level path prefix `ideas/lp-do-ideas-dispatch` and `ideas/lp-do-ideas-standing-registry` (i.e., paths pointing to `ideas/<schema>.json` instead of `ideas/schemas/<schema>.json` or `ideas/_deprecated/<schema>.json`) returns 0 matches in `scripts/src/` and `docs/business-os/startup-loop/ideas/*.md` and `.claude/skills/lp-do-ideas/`; within same build session. Data files (queue-state.json, telemetry.jsonl) are excluded — they contain `schema_version` field values, not file paths.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: Grep for current schema paths — confirm all references exist at old locations
  - Green evidence plan: Create `schemas/` and `_deprecated/` dirs, move files, add deprecation notice to v1, update JSDoc in 2 `.ts` files, update doc references
  - Refactor evidence plan: Run VC-01 grep to confirm zero stale references
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: all paths mapped in fact-find
- **Edge Cases & Hardening:**
  - If any contract doc imports schema by relative path (not just mentions it): update path. Fact-find confirmed no such imports exist.
- **What would make this >=90%:**
  - Already at 90%. Would reach 95% with a pre-existing script to auto-update doc references.
- **Rollout / rollback:**
  - Rollout: Single commit with file moves + reference updates
  - Rollback: `git revert` the commit
- **Documentation impact:**
  - `_deprecated/README.md` created explaining v1 → v2 transition
  - JSDoc comments updated in 2 files
- **Notes / references:**
  - v1 schema has 129 historical packets in queue-state.json — schema is reference-only for understanding that data
  - `_archive/` already has 5 different archived docs; `_deprecated/` is distinct and appropriate

### TASK-02: Write IDEAS-LIFECYCLE.md lifecycle overview

- **Type:** IMPLEMENT
- **Deliverable:** `docs/business-os/startup-loop/ideas/IDEAS-LIFECYCLE.md` — single-page lifecycle overview
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-03)
- **Artifact-Destination:** `docs/business-os/startup-loop/ideas/IDEAS-LIFECYCLE.md`
- **Reviewer:** None: synthesis of existing versioned contracts; self-validating
- **Approval-Evidence:** None: no reviewer required for documentation synthesis
- **Measurement-Readiness:** None: operational documentation, no metric
- **Affects:**
  - `[readonly] docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md`
  - `[readonly] docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-seam.md`
  - `[readonly] docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-checklist.md`
  - `[readonly] docs/business-os/startup-loop/ideas/lp-do-ideas-routing-matrix.md`
  - `[readonly] docs/business-os/startup-loop/ideas/lp-do-ideas-rollback-playbook.md`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — all source docs exist and have been read; synthesis is straightforward
  - Approach: 90% — reference-and-link pattern (not duplication) is the right architecture
  - Impact: 85% — addresses operator confusion about lifecycle but value depends on operator reading it
- **Acceptance:**
  - [ ] `IDEAS-LIFECYCLE.md` exists at `docs/business-os/startup-loop/ideas/`
  - [ ] Document covers: dispatch creation → trial queue → operator confirmation → fact-find/briefing → completion
  - [ ] Document covers: trial → live transition prerequisites (references go-live checklist)
  - [ ] Document references (not duplicates) existing contract docs for details
  - [ ] Schema locations section references new `schemas/` and `_deprecated/` paths from TASK-01
- **Validation contract (VC-02):**
  - VC-02: Lifecycle coverage -> pass when document contains sections for: dispatch creation, trial queue processing, operator confirmation, downstream invocation, completion, trial-to-live transition; within same build session; sample: section heading check
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: Confirm no lifecycle doc exists yet; confirm all 5 source docs are readable
  - Green evidence plan: Write `IDEAS-LIFECYCLE.md` with sections covering the full dispatch lifecycle, referencing existing contracts for detail
  - Refactor evidence plan: Verify all 6 required sections present; verify links to source docs are correct paths
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: all source docs read in fact-find
- **Edge Cases & Hardening:**
  - If go-live activation status changes before this task runs: document reflects current NO-GO status with a note that it should be updated when status changes
- **What would make this >=90%:**
  - Operator review confirming the lifecycle description matches their mental model
- **Rollout / rollback:**
  - Rollout: New file added in commit
  - Rollback: Delete file
- **Documentation impact:**
  - New document created; no existing docs modified
- **Notes / references:**
  - Go-live activation is currently NO-GO (7 of 9 checklist sections incomplete) — document should reflect this status

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Move schemas to subdirectory and deprecate v1 | Yes — all source files exist at current paths; target dirs don't exist yet | None | No |
| TASK-02: Write IDEAS-LIFECYCLE.md | Yes — depends on TASK-01 for schema locations; all 5 source docs confirmed readable | None | No |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Doc references missed during update | Low | Low | VC-01 grep check catches any stale paths |
| Lifecycle doc becomes stale as go-live progresses | Medium | Low | Doc uses reference-and-link pattern; details stay in versioned contracts |

## Observability

None: operational documentation improvement with no runtime impact.

## Acceptance Criteria (overall)

- [ ] `ideas/schemas/` contains active v2 dispatch schema and standing-registry schema
- [ ] `ideas/_deprecated/` contains v1 dispatch schema with deprecation notice
- [ ] Zero stale schema path references in `.ts` and `.md` files (data files excluded per VC-01)
- [ ] `IDEAS-LIFECYCLE.md` documents the full dispatch lifecycle
- [ ] Contract docs updated only for schema path references (content/logic unchanged)

## Decision Log

- 2026-03-03: Chose Option A (physical separation to `_deprecated/`) over Option B (inline deprecation notice in `schemas/`) — unambiguous signal, follows established pattern

## Overall-confidence Calculation

- TASK-01: 90% × S(1) = 90
- TASK-02: 85% × S(1) = 85
- Overall = (90 + 85) / (1 + 1) = 87.5% → 90% (rounded to nearest 5)
