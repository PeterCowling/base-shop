---
Status: Complete
Feature-Slug: brikette-smoke-view-item-list
Completed-date: 2026-02-26
artifact: build-record
---

# Build Record — Brikette Smoke — view_item_list Assertion

## What Was Built

**TASK-01:** `"view_item_list"` was added to the `REQUIRED_EVENTS` constant in
`apps/brikette/scripts/e2e/ga4-funnel-smoke.mjs` at line 30.

Before: `const REQUIRED_EVENTS = ["select_item", "begin_checkout"];`
After:  `const REQUIRED_EVENTS = ["view_item_list", "select_item", "begin_checkout"];`

The change was a one-line array literal edit. It reuses all existing smoke test infrastructure:
the `parseGA4Events()` function already captures `view_item_list` events from intercepted
`g/collect` requests; the captured event now also appears in the assertion loop alongside
`select_item` and `begin_checkout`. No other files were modified.

The change landed in commit `d23f167a85` (feat(reception): Phase 4 UI polish — Wave 0+1 complete)
via a parallel build session. The smoke test will now fail automatically if `view_item_list`
stops reaching GA4's collection endpoint in production.

## Tests Run

| Check | Result |
|---|---|
| `grep "REQUIRED_EVENTS" apps/brikette/scripts/e2e/ga4-funnel-smoke.mjs` | `["view_item_list", "select_item", "begin_checkout"]` ✓ |
| `git show d23f167a85 -- apps/brikette/scripts/e2e/ga4-funnel-smoke.mjs` | Diff confirms array change ✓ |

TC-01 (run smoke against production) is manual-only and not CI-gated. The event was confirmed
firing in TASK-38 (`docs/plans/brikette-cta-sales-funnel-ga4/build-record.user.md`). The
presence assertion mechanism is already proven by the existing `select_item` and `begin_checkout`
assertions in prior smoke runs.

## Validation Evidence

- TASK-01 acceptance criterion 1: `REQUIRED_EVENTS` contains `"view_item_list"` — confirmed by grep ✓
- TASK-01 acceptance criterion 2: Change is in HEAD (`d23f167a85`) — confirmed ✓
- No other required events broken — `select_item` and `begin_checkout` remain in the array ✓

## Scope Deviations

None. Change was exactly one line in one file as planned.

## Outcome Contract

- **Why:** The smoke test captured `view_item_list` in its diagnostic log but did not assert it —
  a regression in the event would go undetected. Operator escalated from "defer" to act.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `view_item_list` is in `REQUIRED_EVENTS` in
  `ga4-funnel-smoke.mjs`; smoke test fails if the event stops firing in production.
- **Source:** operator
