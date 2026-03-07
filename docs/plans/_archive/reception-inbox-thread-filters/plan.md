---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-07
Last-reviewed: 2026-03-07
Last-updated: 2026-03-07
Archived: 2026-03-07
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-inbox-thread-filters
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Inbox Thread Filters Plan

## Summary

Add client-side filter controls to the reception inbox ThreadList component. Staff currently scan the entire thread list to find threads needing attention. This plan adds a compact filter bar in the ThreadList header with toggle buttons for status categories (Needs Draft, Ready to Send, Sent, Review Later), a staleness indicator, and a clear-all control. Filtering is purely client-side against the already-fetched `InboxThreadSummary[]` array, requiring no API changes.

## Active tasks

- [x] TASK-01: Implement filter predicate functions and types
- [x] TASK-02: Build FilterBar component and integrate into ThreadList
- [x] TASK-03: Add unit tests for filter predicates

## Goals

- Staff can filter the inbox thread list by actionable categories: needs manual draft, ready to send, sent, review later, stale sync
- Active filter state is visible (count badge + clear button)
- Filtered list preserves the existing sort order (latest message time descending)
- Filter controls are compact and work on both desktop and mobile viewports

## Non-goals

- Server-side filtering or API changes
- Full-text search
- Persistent filter state across sessions or page reloads
- Changes to ThreadDetailPane or DraftReviewPanel

## Constraints & Assumptions

- Constraints:
  - Must use existing `InboxThreadSummary` fields — no new data requirements
  - Must follow reception app Tailwind token conventions (no arbitrary colors)
  - Filter state is local React state (no global store)
- Assumptions:
  - Thread list stays within client-side filtering performance bounds (API caps at 50)
  - 24-hour staleness threshold is appropriate for sync freshness

## Inherited Outcome Contract

- **Why:** Staff must scan the entire inbox thread list to find threads needing action. With growing thread volume, this wastes time and leads to missed urgent threads (especially those flagged as needing manual drafts).
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Inbox thread list supports filtering by status, needs-manual-draft, and sync freshness so staff can prioritize efficiently.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/reception-inbox-thread-filters/fact-find.md`
- Key findings used:
  - All filter fields already exist in `InboxThreadSummary` type (status, needsManualDraft, lastSyncedAt, currentDraft)
  - No filtering UI exists today; header only shows count badges
  - Badge logic in `presentation.ts` maps to the same status categories we want to filter by
  - DS `Chip` component exists but requires i18n context — simpler to use Button atoms as toggle-style filter controls
  - `isThreadVisibleInInbox()` already excludes `auto_archived` and `resolved` threads

## Proposed Approach

- Option A: Add filter state in InboxWorkspace, pass filtered threads to ThreadList, and build a separate FilterBar component rendered inside ThreadList header.
- Option B: Keep all filter logic inside ThreadList itself (self-contained, fewer prop changes).
- Chosen approach: **Option B** — ThreadList receives the full `threads` array unchanged and manages its own filter state internally. This keeps InboxWorkspace unchanged, avoids prop drilling, and makes the filter feature self-contained. The filter predicates are extracted to a pure module for testability.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Filter predicate functions and types | 90% | S | Complete (2026-03-07) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | FilterBar component and ThreadList integration | 85% | M | Complete (2026-03-07) | TASK-01 | - |
| TASK-03 | IMPLEMENT | Unit tests for filter predicates | 90% | S | Complete (2026-03-07) | TASK-01 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Pure logic module, no UI |
| 2 | TASK-02, TASK-03 | TASK-01 | Can run in parallel — TASK-02 is UI integration, TASK-03 is test writing |

## Tasks

### TASK-01: Filter predicate functions and types

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/inbox/filters.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/inbox/filters.ts` (new), `[readonly] apps/reception/src/services/useInbox.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 90%
  - Implementation: 95% — pure functions operating on a well-defined type; all fields documented in fact-find
  - Approach: 90% — client-side predicate filtering is the standard pattern for small lists
  - Impact: 90% — enables the filter UI in TASK-02
- **Acceptance:**
  - [ ] `ThreadFilterKey` union type defined with values: `"needs-draft"`, `"ready-to-send"`, `"sent"`, `"review-later"`, `"stale-sync"`
  - [ ] `THREAD_FILTER_OPTIONS` array of `{ key: ThreadFilterKey, label: string }` defined for UI consumption
  - [ ] `applyThreadFilters(threads: InboxThreadSummary[], activeFilters: Set<ThreadFilterKey>): InboxThreadSummary[]` function implemented
  - [ ] When `activeFilters` is empty, all threads are returned unchanged
  - [ ] Each filter key maps to the correct predicate:
    - `"needs-draft"`: `thread.needsManualDraft === true`
    - `"ready-to-send"`: `!thread.needsManualDraft && (draft status is "generated" or "edited")`
    - `"sent"`: `thread.status === "sent"`
    - `"review-later"`: `thread.status === "review_later"`
    - `"stale-sync"`: `thread.lastSyncedAt` is null or older than 24 hours
  - [ ] Multiple active filters combine with OR logic (union — show threads matching any active filter)
  - [ ] `STALE_SYNC_THRESHOLD_MS` constant exported (24 * 60 * 60 * 1000)
- **Validation contract (TC-01):**
  - TC-01: empty filter set -> returns all threads unchanged
  - TC-02: single filter "needs-draft" -> returns only threads with needsManualDraft=true
  - TC-03: single filter "ready-to-send" -> returns threads with generated/edited draft and !needsManualDraft
  - TC-04: single filter "sent" -> returns threads with status="sent"
  - TC-05: single filter "review-later" -> returns threads with status="review_later"
  - TC-06: single filter "stale-sync" -> returns threads with null or old lastSyncedAt
  - TC-07: multiple filters -> returns union of matched threads (no duplicates)
  - TC-08: all filters active but no threads match any -> returns empty array
- **Execution plan:** Red -> Green -> Refactor
  1. Create `apps/reception/src/components/inbox/filters.ts`
  2. Define `ThreadFilterKey` type and `THREAD_FILTER_OPTIONS` array
  3. Implement individual predicate functions for each filter key
  4. Implement `applyThreadFilters()` that applies OR-combined predicates
  5. Export `STALE_SYNC_THRESHOLD_MS` constant
- **Planning validation (required for M/L):** None: S-effort task
- **Consumer tracing:**
  - `ThreadFilterKey` consumed by: FilterBar component (TASK-02), test file (TASK-03)
  - `THREAD_FILTER_OPTIONS` consumed by: FilterBar component (TASK-02) for rendering toggle buttons
  - `applyThreadFilters()` consumed by: ThreadList component (TASK-02) for filtering the displayed list
  - `STALE_SYNC_THRESHOLD_MS` consumed by: test file (TASK-03) for threshold assertions
- **Scouts:** None: well-defined type contract from fact-find
- **Edge Cases & Hardening:**
  - Thread with null `lastSyncedAt` treated as stale (never synced)
  - Thread with null `currentDraft` never matches "ready-to-send"
  - Empty threads array returns empty array regardless of filters
- **What would make this >=90%:**
  - Already at 90%. Would reach 95% with confirmed test coverage.
- **Rollout / rollback:**
  - Rollout: deploy with TASK-02
  - Rollback: revert commit
- **Documentation impact:** None
- **Notes / references:**
  - Predicate logic mirrors existing `buildInboxThreadBadge()` in `presentation.ts`

### TASK-02: FilterBar component and ThreadList integration

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/inbox/ThreadList.tsx` (modified), `apps/reception/src/components/inbox/FilterBar.tsx` (new)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/components/inbox/FilterBar.tsx` (new), `apps/reception/src/components/inbox/ThreadList.tsx` (modified), `[readonly] apps/reception/src/components/inbox/filters.ts`, `[readonly] apps/reception/src/services/useInbox.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — straightforward React component with toggle state; ThreadList modification is additive (insert FilterBar in header). Held-back test at 85: no single unknown would drop below 80 — component structure is clear, styling follows established patterns.
  - Approach: 90% — self-contained filter state in ThreadList, FilterBar as a child component
  - Impact: 90% — directly delivers the user-facing filter capability
- **Acceptance:**
  - [ ] `FilterBar` component renders a row of toggle buttons, one per `THREAD_FILTER_OPTIONS` entry
  - [ ] Each toggle button shows the filter label and visually indicates active/inactive state
  - [ ] Active filters are tracked as `Set<ThreadFilterKey>` state in ThreadList
  - [ ] ThreadList applies `applyThreadFilters()` to the `threads` prop before rendering
  - [ ] When filters are active, a count badge shows how many filters are applied
  - [ ] A "Clear" button appears when any filter is active and resets all filters
  - [ ] Thread count in the header reflects the filtered count (not total)
  - [ ] Empty state after filtering shows "No threads match filters" (distinct from "No active threads")
  - [ ] Expected user-observable behavior:
    - [ ] Staff sees a row of filter buttons below the "Threads" heading
    - [ ] Tapping a filter button highlights it and immediately narrows the list
    - [ ] Tapping the same button again deactivates that filter
    - [ ] Multiple filters can be active simultaneously (OR logic)
    - [ ] "Clear" button resets to showing all threads
    - [ ] Thread count updates to reflect filtered results
    - [ ] On mobile, filter bar is visible and usable within the thread list column
  - [ ] Post-build QA loop: run targeted design QA, contrast sweep, and breakpoint sweep on the FilterBar and ThreadList header area; auto-fix Critical/Major findings before marking complete
- **Validation contract (TC-02):**
  - TC-01: FilterBar renders one button per filter option
  - TC-02: clicking a filter button adds it to activeFilters and re-renders list
  - TC-03: clicking an active filter button removes it from activeFilters
  - TC-04: "Clear" button resets activeFilters to empty set
  - TC-05: filtered thread count displays correctly in header
  - TC-06: empty filtered list shows "No threads match filters" message
  - TC-07: filter bar is visible on mobile viewport (not hidden by responsive classes)
- **Execution plan:** Red -> Green -> Refactor
  1. Create `FilterBar.tsx` with toggle button UI using Button atoms from DS
  2. Add filter state (`useState<Set<ThreadFilterKey>>`) to ThreadList
  3. Insert FilterBar below the header `<div>` in ThreadList
  4. Apply `applyThreadFilters()` to `threads` before the `.map()` render
  5. Update thread count display to show filtered count
  6. Add filtered-empty state ("No threads match filters") with filter-specific icon/message
  7. Add "Clear" button that resets filter state
  8. Style active/inactive toggle states using existing DS color tokens
  9. Verify mobile layout (filter bar wraps within thread list column)
- **Planning validation (required for M/L):**
  - Checks run: Verified ThreadList component structure, confirmed header div location for FilterBar insertion, confirmed Button atom API
  - Validation artifacts: `apps/reception/src/components/inbox/ThreadList.tsx` (lines 28-40 header area)
  - Unexpected findings: None
- **Consumer tracing:**
  - New `FilterBar` component: consumed only by ThreadList (internal child)
  - Modified ThreadList: consumed only by InboxWorkspace (no prop changes — threads prop unchanged)
  - ThreadList filter state: internal useState, not exposed
  - Consumer `InboxWorkspace` is unchanged because ThreadList's external interface (props) does not change
- **Scouts:** None: component patterns are established in codebase
- **Edge Cases & Hardening:**
  - Filter bar should not cause layout shift when toggling filters (fixed height)
  - On very narrow mobile screens, filter buttons should wrap gracefully (use `flex-wrap`)
  - When threads are loading, filter bar should be disabled (no point filtering skeleton state)
  - When threads have an error, filter bar should be hidden
- **What would make this >=90%:**
  - Confirmed component rendering via test or manual verification. Currently at 85% due to M-effort UI work without component tests in the inbox test suite.
- **Rollout / rollback:**
  - Rollout: standard deploy, no feature flag needed
  - Rollback: revert commit
- **Documentation impact:** None
- **Notes / references:**
  - Active toggle styling: use `bg-primary-soft text-primary-main` for active, `bg-surface-2 text-muted-foreground` for inactive — matching existing badge color patterns in `presentation.ts`

### TASK-03: Unit tests for filter predicates

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/inbox/__tests__/filters.test.ts` (new)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/inbox/__tests__/filters.test.ts` (new), `[readonly] apps/reception/src/components/inbox/filters.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — pure function tests with mock InboxThreadSummary objects
  - Approach: 90% — standard Jest unit test pattern
  - Impact: 90% — validates filter correctness, catches regressions
- **Acceptance:**
  - [ ] Test file covers all 8 validation contract scenarios from TASK-01
  - [ ] Tests use mock `InboxThreadSummary` objects with controlled field values
  - [ ] Edge cases covered: null lastSyncedAt, null currentDraft, empty threads array
  - [ ] Tests pass in CI (governed test runner)
- **Validation contract (TC-03):**
  - TC-01: test for empty filter set returning all threads
  - TC-02: test for each individual filter key returning correct subset
  - TC-03: test for multiple filters returning OR-combined union
  - TC-04: test for edge cases (null fields, empty array)
- **Execution plan:** Red -> Green -> Refactor
  1. Create test file with describe block for `applyThreadFilters`
  2. Build mock thread factory helper
  3. Write test cases for each TC from TASK-01
  4. Write edge case tests
  5. Verify tests pass via governed test runner in CI
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: standard test patterns
- **Edge Cases & Hardening:** None: test file itself
- **What would make this >=90%:**
  - Already at 90%. Would reach 95% with coverage metrics confirming branch coverage.
- **Rollout / rollback:**
  - Rollout: committed with TASK-01 and TASK-02
  - Rollback: revert commit
- **Documentation impact:** None
- **Notes / references:**
  - Follow existing test patterns in `apps/reception/src/lib/inbox/__tests__/`

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Filter predicates | Yes — InboxThreadSummary type is stable and documented | None | No |
| TASK-02: FilterBar + ThreadList | Yes — TASK-01 provides types and functions; ThreadList structure is known | None | No |
| TASK-03: Unit tests | Yes — TASK-01 provides the functions to test | None | No |

## Delivery Rehearsal

**Data lens:** No external data dependencies. Filter predicates operate on the already-fetched `InboxThreadSummary[]` array. No seed data or fixtures needed.

**Process/UX lens:** Entry point: ThreadList header area. Happy path: staff taps filter, list narrows. Empty state: "No threads match filters" with clear button. Error state: filter bar hidden when thread list has error. All states specified in TASK-02 acceptance.

**Security lens:** No auth boundary changes. Filtering is purely client-side on data already authorized and fetched.

**UI lens:** FilterBar renders inside ThreadList (component name and insertion point specified in TASK-02 execution plan step 3). Route: inbox page via InboxWorkspace.

No Critical findings. No adjacent-scope items identified.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Filter bar takes vertical space on mobile | Low | Low | Use compact toggle buttons with flex-wrap; test on mobile viewport |
| Staff confused by hidden threads when filter active | Low | Medium | Show active filter count badge + always-visible "Clear" button |
| OR filter logic confuses staff expecting AND | Low | Low | OR is more intuitive for "show me these categories"; label makes intent clear |

## Observability

None: purely client-side UI state with no server interaction.

## Acceptance Criteria (overall)

- [ ] Filter bar renders in ThreadList header with toggle buttons for all 5 filter categories
- [ ] Clicking a filter narrows the displayed list to matching threads
- [ ] Multiple filters combine with OR logic
- [ ] Active filter count is visible
- [ ] "Clear" button resets all filters
- [ ] Thread count updates to reflect filtered results
- [ ] Mobile layout works correctly
- [ ] Filter predicate unit tests pass in CI

## Decision Log

- 2026-03-07: Chose client-side filtering over server-side — thread count is small (max 50), all fields already available client-side, more responsive UX
- 2026-03-07: Chose OR logic for multi-filter — more intuitive for category-based filtering ("show me needs-draft OR ready-to-send")
- 2026-03-07: Chose Button atoms over DS Chip component — Chip requires i18n TranslationsProvider context that may not be available in reception app; Button atoms are already used throughout inbox components
- 2026-03-07: Chose filter state inside ThreadList over InboxWorkspace — keeps the feature self-contained, no prop changes to InboxWorkspace, simpler to reason about
- 2026-03-07: Chose 24-hour staleness threshold — aligns with hostel daily operational cycle

## Overall-confidence Calculation

- TASK-01: 90% x S(1) = 90
- TASK-02: 85% x M(2) = 170
- TASK-03: 90% x S(1) = 90
- Sum = 350, weights = 4
- Overall-confidence = 350/4 = 87.5% -> rounded to 90%
