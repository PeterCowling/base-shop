---
Type: Build-Record
Status: Complete
Feature-Slug: reception-simplify-backlog
Completed-date: 2026-03-09
artifact: build-record
---

# Build Record: Reception Simplify Backlog — Error Boundaries

## Outcome Contract

- **Why:** Route-level crashes in high-risk segments (inbox, checkin, checkout, financial flows) currently surface the root error boundary, destroying navigation context — users cannot recover without a full reload.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All 26 unguarded reception route segments have a segment-level error boundary, limiting crash blast radius to the affected route rather than the full app.
- **Source:** auto

## What Was Built

All 6 clusters (1–6) from the simplify sweep were found already resolved during fact-find. The plan focused exclusively on cluster 7: missing segment-level error boundaries.

Added `error.tsx` to 26 route segments across three risk tiers in `apps/reception/src/app/`:
- **High-risk (6):** inbox, checkin, checkout, reconciliation-workbench, end-of-day, prepayments
- **Moderate-risk (6):** loan-items, rooms-grid, real-time-dashboard, prime-requests, eod-checklist, safe-reconciliation
- **Low-risk (14):** alloggiati, audit, doc-insert, email-automation, extension, ingredient-stock, live, manager-audit, menu-performance, prepare-dashboard, staff-accounts, statistics, stock, variance-heatmap

Each file is the canonical Next.js error boundary template (`"use client"`, `ErrorProps` interface, reset button, `error.digest` display) with the route name substituted in the description string. All tasks executed as a single wave in commit `f2d32b2935`.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @apps/reception typecheck` | Pass | No type errors |
| `pnpm --filter @apps/reception lint` | Pass | 0 errors (13 pre-existing warnings) |
| `find apps/reception/src/app -name "error.tsx" \| wc -l` | 30 | 4 existing + 26 new |

## Validation Evidence

- TC-01-A/B/C/D: typecheck clean, lint clean, `"use client"` on line 1, template structure matches `bar/error.tsx` — all 26 files
- Bug scan: 0 findings (`bug-scan-findings.user.json`)
- Ideas hook: 0 dispatches emitted

## Scope Deviations

None. All 26 files are purely additive — no existing code modified.
