---
Type: Build-Record
Feature-Slug: bos-process-improvements-page-split
Build-Date: 2026-03-12
Status: Complete
---

# Build Record — Process Improvements Page Split

## Outcome Contract

- **Why:** The #new-ideas and #in-progress sections need to be separate pages so each can be focused, navigated to directly, and not compete for vertical space.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** #new-ideas and #in-progress each live at their own URL; navigation links point to each; root /process-improvements redirects or shows a landing.
- **Source:** operator

## What Was Delivered

Decomposed the monolithic `ProcessImprovementsInbox` (~1,750 lines) into two focused, independent client components — `InProgressInbox` and `NewIdeasInbox` — each with their own Next.js App Router sub-route and page-level server component.

- `/process-improvements/in-progress` — focused page for active plan monitoring, loads only `loadActivePlans()` server-side
- `/process-improvements/new-ideas` — focused page for queue triage (WorkItems + Deferred + Recently Actioned), loads `loadProcessImprovementsProjection()` + `collectInProgressDispatchIds()` server-side
- Root `/process-improvements` redirects to `/process-improvements/new-ideas` via `redirect()` from `next/navigation`
- `ProcessImprovementsSubNav` client component added (uses `usePathname` for exact-match active tab highlighting), rendered by a shared `layout.tsx`
- Global nav link stays at `/process-improvements`; `startsWith("/process-improvements")` isActive check highlights both sub-routes correctly
- Monolithic `ProcessImprovementsInbox.tsx` and its test deleted; replaced by `InProgressInbox.test.tsx` (TC-07–09) and `NewIdeasInbox.test.tsx` (TC-01–06)
- Pre-existing `active-plans.ts` complexity lint error suppressed with a ticket-referenced `eslint-disable-next-line` comment (BOS-PI-103)

## Tasks Completed

| Task | Status | Evidence |
|---|---|---|
| TASK-01: Extract InProgressInbox + in-progress sub-route | Complete (2026-03-12) | `InProgressInbox.tsx`, `in-progress/page.tsx`, `InProgressInbox.test.tsx` created |
| TASK-02: Extract NewIdeasInbox + new-ideas sub-route + delete monolith | Complete (2026-03-12) | `NewIdeasInbox.tsx`, `new-ideas/page.tsx`, `NewIdeasInbox.test.tsx` created; monolith deleted |
| TASK-03: Add layout.tsx sub-nav + root redirect | Complete (2026-03-12) | `layout.tsx`, `ProcessImprovementsSubNav.tsx` created; root `page.tsx` replaced with redirect |

## Engineering Coverage Evidence

| Coverage Area | Status | Notes |
|---|---|---|
| UI / visual | Covered | Sub-nav renders active tab; hero cross-links; `<Link>` used throughout |
| UX / states | Covered | Each page owns independent state; no cross-section coupling |
| Security / privacy | N/A | No API route changes; same access model |
| Logging / observability | N/A | No changes to logging |
| Testing / validation | Covered | 9 TCs ported across two test files; monolith test deleted |
| Data / contracts | Covered | `in-progress/page.tsx` calls `loadActivePlans()` only; `new-ideas/page.tsx` calls both loader functions |
| Performance / reliability | Covered | `export const dynamic = "force-dynamic"` on both new pages |
| Rollout / rollback | N/A | Clean PR revert restores monolith |

`scripts/validate-engineering-coverage.sh` passed on `plan.md`.

## Build Commit

Commit: `35ef69a5d7`
Branch: `dev`

## Workflow Telemetry Summary

- Feature slug: `bos-process-improvements-page-split`
- Records: 1
- Token measurement coverage: 0.0%

| Stage | Records | Avg modules | Avg context bytes | Avg artifact bytes | Token coverage |
|---|---:|---:|---:|---:|---:|
| lp-do-build | 1 | 2.00 | 114419 | 0 | 0.0% |

### Totals

- Context input bytes: 114,419
- Modules counted: 2
- Deterministic checks: 1 (`scripts/validate-engineering-coverage.sh`)
