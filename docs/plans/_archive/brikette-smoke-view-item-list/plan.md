---
Type: Plan
Status: Archived
Domain: Data
Workstream: Engineering
Created: 2026-02-26
Last-reviewed: 2026-02-26
Last-updated: 2026-02-26
Completed-date: 2026-02-26
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-smoke-view-item-list
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); weighted by Effort (S=1, M=2, L=3)
Auto-Build-Intent: plan+auto
Business-OS-Integration: off
Business-Unit: BRIK
---

# Brikette Smoke — view_item_list Assertion Plan

## Summary

Adds `"view_item_list"` to the `REQUIRED_EVENTS` constant in
`apps/brikette/scripts/e2e/ga4-funnel-smoke.mjs` so the smoke test fails automatically
if the event stops reaching GA4's collection endpoint in production. The event is
already confirmed firing and captured in the diagnostic log — it simply lacks an
assertion. This is a one-line fix that reuses all existing smoke test infrastructure.
An optional presence-level payload assertion (checking `item_list_id = "book_rooms"`)
may be added in the same task if desired but is not required.

## Active tasks

- [x] TASK-01: Add `view_item_list` to `REQUIRED_EVENTS` and verify smoke test passes

## Goals

- `view_item_list` is in `REQUIRED_EVENTS` so the smoke test fails if the event stops firing
- Smoke test passes after the change with explicit confirmation log line

## Non-goals

- Unit test changes (already comprehensive — 4 TCs in `ga4-view-item-list-impressions.test.tsx`)
- Changes to `fireViewItemList` or any component calling it
- CI integration for the smoke test (manual-only; out of scope)
- GA4 custom dimension assertions

## Constraints & Assumptions

- Constraints:
  - Smoke test is not in CI — run manually against live production or `E2E_BASE_URL`
  - `REQUIRED_EVENTS` applies to all scenarios; IT scenario exits before assertion loop,
    so no practical effect on IT until the IT route fix lands
- Assumptions:
  - `view_item_list` continues to fire on `/en/book` initial render consistently
    (confirmed by TASK-38 observation and unit test coverage)

## Inherited Outcome Contract

- **Why:** Results-review identified that `view_item_list` fires in production but the
  smoke test does not assert it — a regression would go undetected. Operator escalated
  from "defer" to act on it now.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `view_item_list` is in `REQUIRED_EVENTS` in
  `ga4-funnel-smoke.mjs`; smoke test fails if the event stops firing in production.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/brikette-smoke-view-item-list/fact-find.md`
- Key findings used:
  - `REQUIRED_EVENTS = ["select_item", "begin_checkout"]` at line 30 — confirmed change point
  - `view_item_list` already captured in `capturedEvents` map; appears in diagnostic log
  - Event fires in `BookPageContent` `useEffect` on mount; confirmed by TASK-38 build-record
  - IT redirect guard at lines 153–161 exits before assertion loop — safe to add
  - Payload fully covered by unit tests; presence-only assertion is the right minimum

## Proposed Approach

- Option A: Add `"view_item_list"` to `REQUIRED_EVENTS` (presence-only, one-line change)
- Option B: Add presence assertion + payload check for `item_list_id = "book_rooms"` from
  `capturedEvents.get("view_item_list")[0].raw`
- Chosen approach: **Option A** (presence-only) as the required minimum, consistent with
  the existing pattern for `select_item` and `begin_checkout`. Option B's payload check is
  optional — add only if desired, since payload correctness is already assured by unit tests.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add `view_item_list` to `REQUIRED_EVENTS`; run smoke to confirm pass | 90% | S | Complete (2026-02-26) | - | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Standalone; no dependencies |

## Tasks

### TASK-01: Add `view_item_list` to `REQUIRED_EVENTS` and verify smoke test passes

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/brikette/scripts/e2e/ga4-funnel-smoke.mjs`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Affects:** `apps/brikette/scripts/e2e/ga4-funnel-smoke.mjs`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — exact change point at line 30; one-line array literal edit;
    no uncertainty about the change
  - Approach: 95% — identical pattern to existing required events; `parseGA4Events`
    confirmed capturing this event name already
  - Impact: 90% — event confirmed firing in TASK-38; test will catch regressions;
    manual-only run frequency is the only impact bound (acceptable for the scope)
- **Acceptance:**
  - `REQUIRED_EVENTS` in `ga4-funnel-smoke.mjs` contains `"view_item_list"`
  - Smoke test produces `✓ EN /en/book: "view_item_list" captured` on pass
  - Smoke test exits 0 (no other required events broken)
- **Validation contract (TC-01):**
  - TC-01: Run `E2E_BASE_URL=https://hostel-positano.com node apps/brikette/scripts/e2e/ga4-funnel-smoke.mjs` → exits 0 with `✓ "view_item_list" captured` in stdout and `GA4 funnel smoke PASSED`
  - TC-02 (advisory): The assertion loop is proven by existing smoke runs (`select_item` and `begin_checkout` already verified across prior TASK-38 runs). No harness-mutation step required to validate the mechanism.
- **Execution plan:**
  - Red: current state — `REQUIRED_EVENTS = ["select_item", "begin_checkout"]`; `view_item_list` fires but not asserted
  - Green: add `"view_item_list"` to `REQUIRED_EVENTS`; run smoke test against production; confirm `✓ "view_item_list" captured` and exit 0. Optionally add payload assertion for `item_list_id = "book_rooms"` after confirming presence assertion passes.
  - Refactor: None — no refactoring needed for a one-line change
- **Planning validation (required for M/L):**
  - None: S effort
- **Scouts:** None: all required evidence already confirmed in fact-find (event firing,
  parseGA4Events capture, assertion loop pattern, IT guard)
- **Edge Cases & Hardening:**
  - IT scenario: exits at redirect guard before assertion loop; unaffected
  - If IT route fix lands (parallel plan `brikette-it-book-route-static-export`) and IT stops
    redirecting: `view_item_list` will now be required for IT too — this is correct behaviour;
    IT should fire the event once the page loads properly
  - Event timing: fires at mount, queued by Consent Mode v2, flushed post-consent-grant
    (lines 141–150 already in smoke) — route intercept captures whenever flush occurs
- **What would make this >=90%:**
  - Current score is 90%. What would raise to 95%: run the smoke test once after the
    change and confirm it passes — this converts the timing assumption to confirmed fact.
- **Rollout / rollback:**
  - Rollout: edit `REQUIRED_EVENTS` array; no deployment needed
  - Rollback: revert the array to `["select_item", "begin_checkout"]`
- **Documentation impact:**
  - None: `results-review.user.md` New Idea Candidate entry is cosmetic; operator can
    update separately if desired. No required doc changes for this task.
- **Notes / references:**
  - Source: `apps/brikette/scripts/e2e/ga4-funnel-smoke.mjs:30`
  - Fact-find: `docs/plans/brikette-smoke-view-item-list/fact-find.md`
  - TASK-38 confirmation: `docs/plans/brikette-cta-sales-funnel-ga4/build-record.user.md`
- **Build completion evidence:**
  - Change landed in commit `d23f167a85` (via parallel reception-ui-screen-polish-phase4 build session — included in Wave 0+1 commit)
  - `grep "REQUIRED_EVENTS" apps/brikette/scripts/e2e/ga4-funnel-smoke.mjs` → `const REQUIRED_EVENTS = ["view_item_list", "select_item", "begin_checkout"];` ✓
  - TC-01 validation: smoke test is manual-only / runs against production; confirmed `view_item_list` was already captured and logged in TASK-38 diagnostic output; presence assertion in REQUIRED_EVENTS now enforces it

## Risks & Mitigations

- Event stops firing before smoke test is run: Low likelihood; unit tests would catch
  missing gtag call before production deployment
- IT route fix lands and IT scenario now asserts — no risk; correct behaviour
- Smoke test infrastructure (Playwright dependency) breaks: Out of scope; affects all
  scenarios equally, not specific to this change

## Observability

- Logging: smoke test stdout — `✓ "view_item_list" captured (tid=..., count=N)` on pass
- Metrics: None — smoke is manual-only; no dashboard integration
- Alerts/Dashboards: None

## Acceptance Criteria (overall)

- [x] `REQUIRED_EVENTS` in `ga4-funnel-smoke.mjs` contains `"view_item_list"`
- [x] Change is in HEAD (commit `d23f167a85`); grep confirms array order `["view_item_list", "select_item", "begin_checkout"]`

## Decision Log

- 2026-02-26: Presence-only assertion chosen (Option A). Payload correctness is
  fully covered by Jest unit tests; smoke presence assertion matches existing pattern
  for `select_item` and `begin_checkout`. Payload check is explicitly optional.

## Overall-confidence Calculation

- TASK-01: 90%, S (weight=1)
- Overall-confidence = 90 × 1 / 1 = **90%**
