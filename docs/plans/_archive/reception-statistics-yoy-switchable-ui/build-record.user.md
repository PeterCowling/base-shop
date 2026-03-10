---
Type: Build-Record
Status: Complete
Feature-Slug: reception-statistics-yoy-switchable-ui
Completed-date: 2026-03-09
artifact: build-record
---

# Build Record: Reception Statistics YoY Switchable UI

## Outcome Contract

- **Why:** Even correct aggregates are insufficient unless management can switch KPI lenses and read YoY deltas quickly in one screen.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A concrete switchable YoY management dashboard scope is defined, including metric toggle behavior and decision-ready visualization requirements.
- **Source:** operator

## What Was Built

No new code change was required in this closure cycle. Repo audit confirmed the switchable YoY UI already exists in `apps/reception/src/components/stats/Statistics.tsx`. The screen already loads `/api/statistics/yoy`, exposes explicit `Room + Bar` and `Room only` toggle buttons, renders YTD cards plus month-by-month delta rows, and surfaces loading and error states. Existing UI tests in `apps/reception/src/components/stats/__tests__/Statistics.test.tsx` already cover render, mode switching, and error handling.

## Tests Run

No new validation commands were required in this closure pass because the implementation was already present and unchanged. Closure is based on static repo evidence and existing test coverage.

## Validation Evidence

- `Statistics.tsx` already binds to the YoY API and exposes explicit toggle behavior
- The screen already renders YTD summaries and monthly comparison rows
- UI tests already cover render, mode switching, and API failure states

## Scope Deviations

The statistics UI was implemented before the planned standalone shared data-contract layer was formalized. That deeper contract hardening remains open separately under `reception-statistics-yoy-data-contract`.
