---
Status: Complete
Feature-Slug: ideas-schema-lifecycle-cleanup
Completed-date: 2026-03-03
artifact: build-record
Build-Event-Ref: docs/plans/ideas-schema-lifecycle-cleanup/build-event.json
---

# Build Record — ideas-schema-lifecycle-cleanup

## What Was Built

**TASK-01: Schema reorganisation and v1 deprecation.** Created `ideas/schemas/` directory with the active v2 dispatch schema and standing-registry schema. Created `ideas/_deprecated/` directory with the v1 dispatch schema (marked deprecated in both title and description) plus a README explaining the deprecation context. Removed the three schema JSON files from the `ideas/` root. Updated JSDoc comments in `lp-do-ideas-trial.ts` and `lp-do-ideas-live.ts` to reference new schema paths. Updated schema path references in `lp-do-ideas-trial-contract.md`, `lp-do-ideas-routing-matrix.md`, `lp-do-ideas-go-live-seam.md`, and `.claude/skills/lp-do-ideas/SKILL.md`.

**TASK-02: IDEAS-LIFECYCLE.md lifecycle overview.** Wrote a single-page lifecycle document covering all six required stages: dispatch creation, trial queue processing, operator confirmation, downstream invocation, completion, and trial-to-live transition. The document references (not duplicates) five existing contract docs for details. Schema locations section references the new `schemas/` and `_deprecated/` paths from TASK-01. Current go-live status (NO-GO) is accurately reflected.

## Tests Run

No tests required — all changes are documentation/reference files. Schema JSON files are not imported by any code (confirmed by grep; only JSDoc comments reference them).

## Validation Evidence

- **VC-01 (Stale schema path references):** grep for old root-level path prefix `ideas/lp-do-ideas-dispatch` and `ideas/lp-do-ideas-standing-registry` in `scripts/src/startup-loop/*.ts`, `docs/business-os/startup-loop/ideas/*.md`, and `.claude/skills/lp-do-ideas/` returns 0 matches. PASS.
- **VC-02 (Lifecycle coverage):** `IDEAS-LIFECYCLE.md` contains sections for: dispatch creation (## 1), trial queue processing (## 2), operator confirmation (## 3), downstream invocation (## 4), completion (## 5), trial-to-live transition (## 6). PASS.

## Scope Deviations

None.

## Outcome Contract

- **Why:** Two dispatch schema versions coexist with no deprecation marker. The trial-to-live queue lifecycle is undocumented, making it unclear how dispatches progress through the system.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** v1 schema deprecated or deleted. Schemas moved to ideas/schemas/. IDEAS-LIFECYCLE.md documents trial to live queue transition clearly.
- **Source:** operator
