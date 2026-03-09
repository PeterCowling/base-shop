---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09 (build complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-simplify-backlog
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 97%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Simplify Backlog Plan

## Summary

Add segment-level `error.tsx` error boundaries to 26 reception route segments that currently have none. The root-level `error.tsx` exists and three routes (`bar`, `safe-management`, `till-reconciliation`) already have segment boundaries. Without segment boundaries, any render error in a high-risk route (inbox, checkin, checkout, financial flows) crashes the entire app to the root boundary, destroying navigation context. All three tasks use the same proven template (`bar/error.tsx`) and are independent — they run as a single parallel wave. No architectural decisions required.

## Active tasks
- [x] TASK-01: Add error.tsx to 6 high-risk routes — Complete (2026-03-09)
- [x] TASK-02: Add error.tsx to 6 moderate-risk routes — Complete (2026-03-09)
- [x] TASK-03: Add error.tsx to 14 low-risk routes — Complete (2026-03-09)

## Goals
- Limit crash blast radius to the affected segment for all 26 unguarded routes
- Preserve existing root-level and 3-segment-level boundaries unchanged
- Ship in one wave with full typecheck + lint validation

## Non-goals
- Adding `loading.tsx` or `not-found.tsx` — addressed in a separate pass if needed
- Changing the error UI design — canonical template from `bar/error.tsx` is used as-is
- Adding test coverage for error.tsx files — Next.js framework guarantees boundary behaviour

## Constraints & Assumptions
- Constraints:
  - `"use client"` directive is required — Next.js error boundaries must be client components
  - `api/` and `__tests__` directories correctly excluded (no error.tsx semantics there)
- Assumptions:
  - All 26 route segments are direct children of `apps/reception/src/app/` (confirmed by `ls`)
  - The description string in each file varies only by route name (confirmed by `diff` of existing boundaries)

## Inherited Outcome Contract

- **Why:** Route-level crashes in high-risk segments (inbox, checkin, checkout, financial flows) currently surface the root error boundary, destroying navigation context — users cannot recover without a full reload.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All 26 unguarded reception route segments have a segment-level error boundary, limiting crash blast radius to the affected route rather than the full app.
- **Source:** auto

## Fact-Find Reference
- Related brief: `docs/plans/reception-simplify-backlog/fact-find.md`
- Key findings used:
  - Clusters 1–6 already resolved — scope collapses entirely to cluster 7
  - 26 route segments confirmed by `ls apps/reception/src/app/` output
  - `diff` of existing `bar/error.tsx` vs `safe-management/error.tsx` confirms only route name varies
  - Template body reproduced in fact-find and verified

## Proposed Approach
- Option A: One IMPLEMENT task for all 26 routes — simple but harder to parallelise
- Option B: Three tasks batched by risk tier — enables wave dispatch, easier review per tier
- Chosen approach: Option B (three tasks, Wave 1 parallel). Risk-tier grouping also makes review easier and provides a clear rollback surface per tier.

## Plan Gates
- Foundation Gate: Pass — Deliverable-Type, Execution-Track, Primary-Execution-Skill all set; test landscape noted (no tests for error.tsx); template verified
- Sequenced: Yes — single wave, no dependencies
- Edge-case review complete: Yes — `api/` and `__tests__` correctly excluded; `"use client"` constraint confirmed
- Auto-build eligible: Yes — all tasks IMPLEMENT, confidence ≥80, no blocking DECISION/input gates

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add error.tsx to 6 high-risk routes | 97% | S | Complete (2026-03-09) | - | - |
| TASK-02 | IMPLEMENT | Add error.tsx to 6 moderate-risk routes | 97% | S | Complete (2026-03-09) | - | - |
| TASK-03 | IMPLEMENT | Add error.tsx to 14 low-risk routes | 97% | S | Complete (2026-03-09) | - | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03 | - | All independent — different files, no shared state |

## Tasks

---

### TASK-01: Add error.tsx to 6 high-risk routes
- **Type:** IMPLEMENT
- **Deliverable:** 6 new `error.tsx` files in high-risk route segments
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Build evidence:** All 6 files written and committed in `f2d32b2935`. TC-01-A: typecheck clean. TC-01-B: lint 0 errors. TC-01-C: `"use client"` confirmed on line 1 of all files. TC-01-D: template structure matches canonical.
- **Affects:**
  - `apps/reception/src/app/inbox/error.tsx` (new)
  - `apps/reception/src/app/checkin/error.tsx` (new)
  - `apps/reception/src/app/checkout/error.tsx` (new)
  - `apps/reception/src/app/reconciliation-workbench/error.tsx` (new)
  - `apps/reception/src/app/end-of-day/error.tsx` (new)
  - `apps/reception/src/app/prepayments/error.tsx` (new)
  - `[readonly] apps/reception/src/app/bar/error.tsx` (template reference)
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 97%
  - Implementation: 98% — identical template, diff-proven, 6 known files
  - Approach: 97% — Next.js error.tsx pattern is well-established
  - Impact: 96% — limits crash blast radius for highest-risk routes; no regression risk
- **Acceptance:**
  - All 6 files exist and pass `pnpm --filter @apps/reception typecheck`
  - All 6 files use `"use client"` directive
  - Each file's description string names the route (e.g. "An error occurred in inbox.")
  - `pnpm --filter @apps/reception lint` passes clean
  - Expected user-observable behavior: when a render error occurs in inbox/checkin/checkout/reconciliation-workbench/end-of-day/prepayments, the user sees a route-scoped "Something went wrong" card with a "Try again" button, rather than the full-app root error boundary
- **Validation contract (TC-01):**
  - TC-01-A: `pnpm --filter @apps/reception typecheck` exits 0
  - TC-01-B: `pnpm --filter @apps/reception lint` exits 0 (0 errors)
  - TC-01-C: Each new file contains `"use client"` on line 1
  - TC-01-D: Each new file exports a default `Error` component matching the canonical template structure
- **Execution plan:**
  - Copy canonical template from `apps/reception/src/app/bar/error.tsx`
  - Create 6 files, substituting route name in description string
  - Run typecheck + lint
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** Pre-task: run `ls apps/reception/src/app/` and confirm all 6 target directories still exist before writing files (guards against route rename/removal since fact-find).
- **Edge Cases & Hardening:**
  - `"use client"` must be present — Next.js will throw a build error if missing
  - Route name in description is cosmetic — TypeScript doesn't enforce it
- **What would make this >=90%:** Already ≥90%
- **Rollout / rollback:**
  - Rollout: files are additive — no existing code modified
  - Rollback: delete the 6 new files
- **Documentation impact:** None: error boundaries are self-documenting via the UI
- **Notes / references:**
  - Template: `apps/reception/src/app/bar/error.tsx`
  - Scoped post-build QA: error.tsx renders only on crash — standard contrast/breakpoint sweep is not applicable for crash-fallback UI. Acceptance check TC-01-C/D provides equivalent structural assurance.

---

### TASK-02: Add error.tsx to 6 moderate-risk routes
- **Type:** IMPLEMENT
- **Deliverable:** 6 new `error.tsx` files in moderate-risk route segments
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Build evidence:** All 6 files written and committed in `f2d32b2935`. TC-02-A/B/C/D: all pass.
- **Affects:**
  - `apps/reception/src/app/loan-items/error.tsx` (new)
  - `apps/reception/src/app/rooms-grid/error.tsx` (new)
  - `apps/reception/src/app/real-time-dashboard/error.tsx` (new)
  - `apps/reception/src/app/prime-requests/error.tsx` (new)
  - `apps/reception/src/app/eod-checklist/error.tsx` (new)
  - `apps/reception/src/app/safe-reconciliation/error.tsx` (new)
  - `[readonly] apps/reception/src/app/bar/error.tsx` (template reference)
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 97%
  - Implementation: 98% — identical template, 6 known files
  - Approach: 97% — same pattern as TASK-01
  - Impact: 96% — limits crash blast radius for moderate-risk routes
- **Acceptance:**
  - All 6 files exist and pass `pnpm --filter @apps/reception typecheck`
  - All 6 files use `"use client"` directive
  - Each file's description string names the route
  - `pnpm --filter @apps/reception lint` passes clean
  - Expected user-observable behavior: when a render error occurs in any of the 6 moderate-risk routes, the user sees a route-scoped error card with retry, not the full-app root boundary
- **Validation contract (TC-02):**
  - TC-02-A: `pnpm --filter @apps/reception typecheck` exits 0
  - TC-02-B: `pnpm --filter @apps/reception lint` exits 0 (0 errors)
  - TC-02-C: Each new file contains `"use client"` on line 1
  - TC-02-D: Each file exports a default `Error` component matching canonical template
- **Execution plan:**
  - Copy canonical template from `apps/reception/src/app/bar/error.tsx`
  - Create 6 files with route-specific description strings
  - Run typecheck + lint
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: same template as TASK-01
- **Edge Cases & Hardening:** Same as TASK-01 — `"use client"` required
- **What would make this >=90%:** Already ≥90%
- **Rollout / rollback:**
  - Rollout: additive — no existing code modified
  - Rollback: delete the 6 new files
- **Documentation impact:** None
- **Notes / references:** Template: `apps/reception/src/app/bar/error.tsx`

---

### TASK-03: Add error.tsx to 14 low-risk routes
- **Type:** IMPLEMENT
- **Deliverable:** 14 new `error.tsx` files in low-risk route segments
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Build evidence:** All 14 files written and committed in `f2d32b2935`. TC-03-A/B/C/D: all pass. Final count: `find apps/reception/src/app -name "error.tsx" | wc -l` = 30 (4 existing + 26 new).
- **Affects:**
  - `apps/reception/src/app/alloggiati/error.tsx` (new)
  - `apps/reception/src/app/audit/error.tsx` (new)
  - `apps/reception/src/app/doc-insert/error.tsx` (new)
  - `apps/reception/src/app/email-automation/error.tsx` (new)
  - `apps/reception/src/app/extension/error.tsx` (new)
  - `apps/reception/src/app/ingredient-stock/error.tsx` (new)
  - `apps/reception/src/app/live/error.tsx` (new)
  - `apps/reception/src/app/manager-audit/error.tsx` (new)
  - `apps/reception/src/app/menu-performance/error.tsx` (new)
  - `apps/reception/src/app/prepare-dashboard/error.tsx` (new)
  - `apps/reception/src/app/staff-accounts/error.tsx` (new)
  - `apps/reception/src/app/statistics/error.tsx` (new)
  - `apps/reception/src/app/stock/error.tsx` (new)
  - `apps/reception/src/app/variance-heatmap/error.tsx` (new)
  - `[readonly] apps/reception/src/app/bar/error.tsx` (template reference)
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 97%
  - Implementation: 98% — identical template, 14 known files
  - Approach: 97% — same pattern
  - Impact: 95% — lower-risk routes but still improves resilience uniformly
- **Acceptance:**
  - All 14 files exist and pass `pnpm --filter @apps/reception typecheck`
  - All 14 files use `"use client"` directive
  - Each file's description string names the route
  - `pnpm --filter @apps/reception lint` passes clean
  - Expected user-observable behavior: any crash in the 14 low-risk routes shows a route-scoped error card, not the full-app root boundary
- **Validation contract (TC-03):**
  - TC-03-A: `pnpm --filter @apps/reception typecheck` exits 0
  - TC-03-B: `pnpm --filter @apps/reception lint` exits 0 (0 errors)
  - TC-03-C: Each new file contains `"use client"` on line 1
  - TC-03-D: Each file exports a default `Error` component matching canonical template
- **Execution plan:**
  - Copy canonical template from `apps/reception/src/app/bar/error.tsx`
  - Create 14 files with route-specific description strings
  - Run typecheck + lint
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: same template
- **Edge Cases & Hardening:** Same as TASK-01 — `"use client"` required
- **What would make this >=90%:** Already ≥90%
- **Rollout / rollback:**
  - Rollout: additive — no existing code modified
  - Rollback: delete the 14 new files
- **Documentation impact:** None
- **Notes / references:** Template: `apps/reception/src/app/bar/error.tsx`

---

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: High-risk error.tsx | Yes — template verified, 6 routes confirmed | None | No |
| TASK-02: Moderate-risk error.tsx | Yes — same template | None | No |
| TASK-03: Low-risk error.tsx | Yes — same template, 14 routes confirmed | None | No |

## Risks & Mitigations
- **Missing `"use client"`**: Compile error at build time — caught by TC typecheck
- **Accidental route name typo in description**: Cosmetic only, no functional impact
- **Double-wrapping with root error.tsx**: Additive — segment boundary takes priority by Next.js design, no conflict

## Observability
- Logging: `error.digest` is exposed in the UI for operator debugging
- Metrics: None: error boundary activation is not currently tracked
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [ ] `find apps/reception/src/app -name "error.tsx" | wc -l` outputs 29 (3 existing + 26 new)
- [ ] `pnpm --filter @apps/reception typecheck` passes clean
- [ ] `pnpm --filter @apps/reception lint` passes clean

## Decision Log
- 2026-03-09: Batched into three tasks by risk tier to enable wave dispatch and per-tier review granularity.
- 2026-03-09: [Adjacent: delivery-rehearsal] Loading.tsx and not-found.tsx gaps — out of scope for this plan, no tasks blocked by their absence.

## Overall-confidence Calculation
- All three tasks: S (weight 1) × 97% = 97%
- Overall-confidence: **97%**
