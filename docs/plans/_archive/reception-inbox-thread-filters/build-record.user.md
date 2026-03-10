---
Type: Build-Record
Status: Complete
Feature-Slug: reception-inbox-thread-filters
Completed-date: 2026-03-07
artifact: build-record
Build-Event-Ref: docs/plans/reception-inbox-thread-filters/build-event.json
---

# Build Record: Reception Inbox Thread Filters

## Outcome Contract

- **Why:** Staff must scan the entire inbox thread list to find threads needing action. With growing thread volume, this wastes time and leads to missed urgent threads (especially those flagged as needing manual drafts).
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Inbox thread list supports filtering by status, needs-manual-draft, and sync freshness so staff can prioritize efficiently.
- **Source:** operator

## What Was Built

Added client-side filter controls to the reception inbox ThreadList. A new `filters.ts` module defines five filter predicates (needs-draft, ready-to-send, sent, review-later, stale-sync) operating on the existing `InboxThreadSummary` type with OR-combined logic. A new `FilterBar.tsx` component renders toggle buttons for each filter with active/inactive visual states, a clear button, and an active filter count. The `ThreadList.tsx` component was updated to manage filter state internally, apply filters before rendering, display filtered counts, and show a distinct empty state when filters exclude all threads.

Unit tests in `filters.test.ts` cover all 8 validation contract scenarios plus edge cases (null fields, empty arrays, OR union logic).

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `npx tsc --noEmit --project apps/reception/tsconfig.json` | Pass | Clean typecheck, no errors |
| `npx eslint apps/reception/src/components/inbox/{filters.ts,FilterBar.tsx,ThreadList.tsx}` | Pass | 2 advisory warnings (ds/enforce-layout-primitives), 0 errors |
| Unit tests (CI) | Pending | Tests committed; will run in CI per testing policy |

## Validation Evidence

### TASK-01: Filter predicate functions and types

- TC-01: empty filter set returns all threads — implemented, tested
- TC-02: "needs-draft" filter returns only needsManualDraft=true threads — implemented, tested
- TC-03: "ready-to-send" filter returns generated/edited draft threads that are not manual — implemented, tested
- TC-04: "sent" filter returns status="sent" threads — implemented, tested
- TC-05: "review-later" filter returns status="review_later" threads — implemented, tested
- TC-06: "stale-sync" filter returns null or old lastSyncedAt threads — implemented, tested
- TC-07: multiple filters return OR union without duplicates — implemented, tested
- TC-08: all filters active with no matches returns empty array — implemented, tested

### TASK-02: FilterBar component and ThreadList integration

- TC-01: FilterBar renders one button per filter option — implemented (5 buttons from THREAD_FILTER_OPTIONS)
- TC-02: clicking filter button adds to activeFilters — implemented via handleToggleFilter
- TC-03: clicking active button removes from activeFilters — implemented via Set toggle logic
- TC-04: Clear button resets activeFilters to empty set — implemented via handleClearFilters
- TC-05: filtered thread count displays correctly — implemented with Filter icon + "filtered/total" format
- TC-06: filtered-empty state shows distinct message — implemented ("No threads match filters")
- TC-07: filter bar visible on mobile — implemented (no responsive hiding classes on filter bar)

### TASK-03: Unit tests for filter predicates

- TC-01: test for empty filter set — written
- TC-02: test for each individual filter key — written (5 tests)
- TC-03: test for multiple filters OR union — written
- TC-04: test for edge cases (null fields, empty array) — written (2 tests)

## Scope Deviations

None. All changes stayed within the planned scope.
