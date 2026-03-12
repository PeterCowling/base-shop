---
Type: Plan
Status: Archived
Domain: BOS
Workstream: Operations
Created: 2026-03-12
Last-reviewed: 2026-03-12
Last-updated: 2026-03-12
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: process-improvements-snooze-buttons
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Dispatch-ID: IDEA-DISPATCH-20260312153000-0001
Related-Analysis: docs/plans/process-improvements-snooze-buttons/analysis.md
---

# Process Improvements Snooze Buttons Plan

## Summary

Add "Snooze for 3 days" and "Snooze for 7 days" buttons to each active-plan card on `/process-improvements/in-progress`. When clicked, the card is hidden immediately and reappears automatically on the next 30-second auto-refresh after the period elapses. Snooze state is stored in `localStorage` under the key `bos:plan-snooze:v1` (keyed by plan slug). No new API routes, no DB migration, no new packages. All changes are isolated to `InProgressInbox.tsx` and its test file. The new-ideas Defer and operator-action Snooze mechanisms are untouched.

## Active tasks
- [x] TASK-01: Add snooze state + UI to `InProgressInbox.tsx` — Complete (2026-03-12)
- [x] TASK-02: Tests for snooze behavior in `InProgressInbox.test.tsx` — Complete (2026-03-12)

## Goals
- Operator can snooze any card on `/process-improvements/in-progress` for 3 or 7 days.
- The snoozed card hides immediately on click and reappears automatically when the period elapses (up to 30s after expiry, on next auto-refresh).
- No new DB migration, no new API routes, no new server-side infrastructure.
- Existing formal Defer/Snooze semantics on new-ideas are not altered.

## Non-goals
- Adding snooze to pages other than `/process-improvements/in-progress`.
- Replacing the formal Defer/Decline/Do queue semantics for new-ideas queue items.
- Multi-device snooze synchronisation.
- Persisting active-plan execution progress or status.
- Adding active plans to the D1 database.
- Changing the new-ideas Defer button label or adding quick-pick snooze buttons to new-ideas (pending operator input; TASK-03 is out of scope for this plan).

## Constraints & Assumptions
- Constraints:
  - Active plans are filesystem-derived; `active-plans.ts` has no DB dependency and no snooze field. `ActivePlanProgress.slug` is the only stable identifier (plan directory name).
  - The existing operator-action snooze and queue Defer mechanisms on new-ideas must not be broken.
  - BOS is a single-operator tool. Per-device persistence is explicitly acceptable.
  - CI is the test authority; no local Jest runs.
- Assumptions:
  - The 30-second auto-refresh on `/process-improvements/in-progress` (via `/api/process-improvements/items`) returns the full `activePlans[]` list on each poll; the client-side snooze filter re-evaluates expiry without extra API changes.
  - The `isMounted` guard approach is chosen to suppress hydration flash: the plan list is not rendered until after the first client hydration cycle. During the pre-mount window, the component must render `null` (not the `InProgressSection` empty-state path), to avoid falsely flashing "No plans currently in progress" on every page load. This means: when `isMounted === false`, `InProgressInbox` renders `null` for the section area (or a neutral placeholder) rather than delegating to `InProgressSection` which would display the empty-state copy. Once mounted, normal render proceeds and the snooze filter is applied.
  - Stale localStorage entries (for plans that have been completed or renamed) are silently ignored during filtering — entries for slugs not in the current `activePlans[]` list simply do not match any card and are not rendered. The stale entries remain in `localStorage` but have no effect. No write-back / cleanup of `localStorage` is performed; entries expire naturally when the browser storage is cleared or the operator snoozes again with the same slug.

## Inherited Outcome Contract

- **Why:** The operator has active plans that are lower priority right now but not ignorable. Without a snooze, the in-progress board becomes noisy and the operator must either scroll past irrelevant items or make formal decisions they are not ready to make.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Operator can snooze any card on `/process-improvements/in-progress` for 3 or 7 days. The card hides immediately on click and reappears on the next auto-refresh cycle after the period elapses (up to 30 seconds after expiry), requiring no manual action. The new-ideas page already has equivalent defer/snooze capability for both item types — no new capability is needed there; any new-ideas UI changes are optional and pending operator input on labelling preference. The feature does not alter any existing formal decision semantics.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/process-improvements-snooze-buttons/analysis.md`
- Selected approach inherited:
  - Option A — localStorage-backed snooze. Store `{ [slug]: isoTimestamp }` in `localStorage` under key `bos:plan-snooze:v1`. Filter active plans client-side in `InProgressInbox` before rendering. Re-check on each 30s auto-refresh poll. No API, no DB, no new file.
- Key reasoning used:
  - Active plans are filesystem-derived with no DB backing; server-side storage would require handling plan lifecycle transitions (completion, rename, archive) disproportionate to the feature.
  - BOS is explicitly single-operator, single-device — localStorage matches the documented assumption exactly.
  - Known costs (SSR header count includes snoozed plans; up to 30s reappearance lag; hydration flash suppressed by mount guard) are all low-impact for a single-operator internal tool.
  - Rollback is a single revert commit with no residual server state.

## Selected Approach Summary
- What was chosen:
  - localStorage key `bos:plan-snooze:v1` holding `Record<string, string>` (slug → ISO expiry timestamp).
  - Inline snooze logic added directly to `InProgressInbox.tsx` (no separate hook file — the logic is small and self-contained).
  - `isMounted` state guard suppresses hydration flash: plan list not rendered until after first `useEffect` fires.
  - Stale entry pruning on every render: entries for slugs not in current `activePlans[]` are silently ignored.
- Why planning is not reopening option selection:
  - Analysis decision is decisive; both Option B (JSONL ledger) and Option C (extend operator-actions ledger) were ruled out with code evidence.

## Fact-Find Support
- Supporting brief: `docs/plans/process-improvements-snooze-buttons/fact-find.md`
- Evidence carried forward:
  - `InProgressInbox.tsx` has zero action buttons (confirmed by full read). `ActivePlanCard` receives a single `plan` prop with no click handlers.
  - Auto-refresh hook `useInProgressAutoRefresh` calls `/api/process-improvements/items` every 30s and calls `setActivePlans(data.activePlans)` — the full list is returned on every poll.
  - `plan.slug` is used as React `key` at `InProgressInbox.tsx:354`; stable identifier confirmed.
  - `InProgressInbox.test.tsx` exists with 3 tests (TC-07, TC-08, TC-09) using `@testing-library/react` with `jsdom` environment. Infrastructure is ready to extend.
  - No existing `localStorage` usage in `apps/business-os/src/` — this is the first use.
  - `Button` and `Tag` are imported from `@acme/design-system/atoms` in `NewIdeasInbox.tsx`; `Button` with `tone="outline"` is available for snooze button styling.
  - `ActivePlanProgress` type has no snooze field; no type changes needed.
  - SSR page header count (`inProgressCount` in `page.tsx:16`) comes from `loadActivePlans()` — will include snoozed plans. Accepted known limitation.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add snooze state + UI to `InProgressInbox.tsx` | 85% | M | Complete (2026-03-12) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Tests for snooze behavior in `InProgressInbox.test.tsx` | 85% | S | Complete (2026-03-12) | TASK-01 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | Add "Snooze for 3 days" / "Snooze for 7 days" buttons to `ActivePlanCard`. Buttons use `Button` component from `@acme/design-system/atoms` with `tone="outline"` matching existing BOS card action style. Post-build contrast sweep and design QA required. | TASK-01 | Snoozed cards are absent — no snoozed indicator. |
| UX / states | Four states: pre-mount (null — no section rendered), shown (cards + buttons), snoozed (filtered from list — absent), reappeared (expiry passed, back on next refresh). `isMounted` guard renders `null` pre-hydration (not the empty-state copy) to prevent the misleading "No plans currently in progress" flash. Empty-list copy only shown when mounted AND filter result is empty. | TASK-01 | SSR header count includes snoozed plans — accepted known limitation, noted in plan. |
| Security / privacy | N/A — BOS is admin-only (`getCurrentUserServer` auth). localStorage is client-only and not authoritative; no new security surface introduced. | - | No action needed. |
| Logging / observability / audit | N/A — no audit trail by design. Snooze is lightweight "remind me later" semantics, not a formal decision event. Acceptable for single-operator internal tool. | - | Explicit omission. Correct. |
| Testing / validation | Unit tests extend `InProgressInbox.test.tsx`: button renders, click writes correct expiry, snoozed card filtered, expired snooze causes reappearance on next refresh render, stale entry pruning. localStorage mocked via `jest.spyOn(window, 'localStorage', 'get')` or `Object.defineProperty`. Post-build contrast/breakpoint/design-QA sweeps for UI. | TASK-02 | CI is test authority; no local Jest runs. |
| Data / contracts | N/A — `ActivePlanProgress` type unchanged. localStorage key `bos:plan-snooze:v1` is new but isolated to `InProgressInbox.tsx`. No downstream consumers affected. | - | Zero contract changes. |
| Performance / reliability | N/A — localStorage reads are synchronous and sub-millisecond. Filtering is O(n) on typically <20 items. 30s auto-refresh already in place; no new polling needed. | - | Negligible impact. |
| Rollout / rollback | Rollback is a single revert commit. No DB migration to reverse. Stale localStorage entries after rollback are harmless (key `bos:plan-snooze:v1` is read-only to the code; silently ignored after rollback). | TASK-01 | Cleanest rollback path of the three options considered. |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Implementation. No dependencies. |
| 2 | TASK-02 | TASK-01 complete | Tests extend the just-implemented component. Must run after TASK-01 to reference real implementation patterns. |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| In-progress snooze | Operator clicks "Snooze for 3 days" or "Snooze for 7 days" on an `ActivePlanCard` | (1) Click handler computes expiry timestamp = `Date.now() + days * 86400000`; (2) Reads current `bos:plan-snooze:v1` from localStorage (defaults to `{}`); (3) Writes `{ ...existing, [slug]: expiryIsoString }` back to localStorage; (4) Component state triggers re-render; (5) `filteredActivePlans` re-evaluates — cards whose slug is in snooze map with a future expiry are excluded; (6) On each subsequent 30s auto-refresh, `setActivePlans` fires, `filteredActivePlans` re-evaluates — cards past expiry reappear on the next refresh cycle. Stale entries (slug not in current `activePlans[]`) are silently ignored during filter evaluation. | TASK-01 | SSR header count includes snoozed plans (cosmetic). Reappearance up to 30s after expiry. Snooze lost on browser data clear (acceptable). |

## Tasks

---

### TASK-01: Add snooze state + UI to `InProgressInbox.tsx`
- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/business-os/src/components/process-improvements/InProgressInbox.tsx` — snooze state logic, filter integration, and snooze buttons on `ActivePlanCard`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/business-os/src/components/process-improvements/InProgressInbox.tsx`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 85%
  - Implementation: 85% — the change is isolated to a single `"use client"` component; the pattern (useState + localStorage read/write + filter in useMemo) is standard React. `Button` import path confirmed from `NewIdeasInbox.tsx`. No unknown API. Held-back test: the one unresolved unknown is which exact Tailwind utility classes produce the intended button sizing — could require minor adjustment during build. This does not threaten correctness, only aesthetics. Downward bias rule applied: 85 not 90.
  - Approach: 90% — localStorage approach is decisive from analysis; no option reselection required. `isMounted` guard pattern is established in the codebase (`useBoardAutoRefresh.ts` uses `isMounted.current` ref). Held-back test: no single unknown would drop this below 80.
  - Impact: 85% — outcome statement is clear and directly achievable. Held-back test: SSR header count including snoozed plans is a known cosmetic gap; it could be perceived as confusing by the operator. But the outcome contract explicitly accepts this. No impact risk here.
- **Acceptance:**
  - [ ] `bos:plan-snooze:v1` is read from localStorage on component mount; parse errors (invalid JSON, `null`) are handled gracefully — snooze state defaults to `{}`.
  - [ ] "Snooze for 3 days" and "Snooze for 7 days" buttons appear on every `ActivePlanCard`.
  - [ ] Clicking a snooze button writes `{ [plan.slug]: expiryIsoTimestamp }` to `bos:plan-snooze:v1` in localStorage.
  - [ ] The snoozed plan card is absent from the rendered list immediately after click (no page reload required).
  - [ ] After the snooze period elapses, the card reappears on the next auto-refresh cycle (up to 30s after expiry).
  - [ ] Stale localStorage entries (slug not in the current `activePlans[]` list) do not cause errors; they are ignored during filter evaluation and remain in `localStorage` (no write-back or cleanup performed).
  - [ ] When all plans are snoozed, the section shows the empty-list state ("No plans currently in progress").
  - [ ] `isMounted` guard: when `isMounted === false` (pre-hydration), the component renders `null` for the in-progress section — not the empty-state "No plans currently in progress" copy. The empty-state is only shown when `isMounted === true` AND the filtered plan list is empty. This prevents a false "no plans" flash on every page load.
  - [ ] TypeScript compiles with no errors on `apps/business-os`. Lint passes.
  - **Expected user-observable behavior:**
    - [ ] Operator opens `/process-improvements/in-progress` — all non-snoozed plans visible, each with two snooze buttons.
    - [ ] Operator clicks "Snooze for 3 days" on a plan card — card disappears immediately.
    - [ ] Operator refreshes the page — snoozed card is still absent (localStorage persists across reload).
    - [ ] 3 days later (or with localStorage entry manually edited to a past timestamp), the card reappears on the next auto-refresh.
    - [ ] Operator snoozes all plans — page shows "No plans currently in progress".
- **Engineering Coverage:**
  - UI / visual: Required — Add `Button` components with `tone="outline"` to `ActivePlanCard`. Import `Button` from `@acme/design-system/atoms` (already available in BOS). Snooze buttons are rendered inside the card content area below existing activity summary. Post-build: run `lp-design-qa`, `tools-ui-contrast-sweep`, `tools-ui-breakpoint-sweep` on `/process-improvements/in-progress`.
  - UX / states: Required — Four states: pre-mount (null rendered — no section visible), shown (cards + buttons visible), snoozed (card absent), reappeared (after expiry on next refresh). `isMounted` guard renders `null` pre-hydration — NOT the empty-state copy — to prevent a false "No plans currently in progress" flash on every page load. Empty-state copy only shown when `isMounted === true` AND filtered list is empty. Snoozed cards have no visible indicator.
  - Security / privacy: N/A — localStorage is client-only and not authoritative. BOS is admin-only. No security surface added.
  - Logging / observability / audit: N/A — Lightweight "remind me later" feature; no audit trail by design.
  - Testing / validation: Required — TASK-02 covers. Snooze state is testable via localStorage mock in Jest.
  - Data / contracts: N/A — `ActivePlanProgress` type unchanged. No API contract changes. localStorage key isolated to this component.
  - Performance / reliability: N/A — localStorage reads are sub-millisecond. Filtering O(n) on <20 items. No new polling.
  - Rollout / rollback: Required — Rollback is a revert commit. Stale localStorage entries left behind are harmless after rollback.
- **Validation contract (TC-01 through TC-07):**
  - TC-01: Render `InProgressInbox` with one plan → "Snooze for 3 days" and "Snooze for 7 days" buttons are present in the DOM.
  - TC-02: Click "Snooze for 3 days" → `localStorage.setItem` called with key `bos:plan-snooze:v1`; parsed value contains `[plan.slug]` with an ISO timestamp approximately 3 days in the future (within 1 second tolerance).
  - TC-03: Snoozed slug in localStorage with future expiry → `filteredActivePlans` excludes that plan card from the rendered output.
  - TC-04: Snoozed slug in localStorage with past expiry (expired) → `filteredActivePlans` includes the plan card; card is rendered.
  - TC-05: localStorage contains slug not in current `activePlans[]` → no error thrown; stale entry is silently ignored.
  - TC-06: localStorage returns `null` or invalid JSON for `bos:plan-snooze:v1` → component renders all plans without error; snooze state defaults to `{}`.
  - TC-07: All plans snoozed → `InProgressSection` renders the empty-state message "No plans currently in progress".
- **Execution plan:** Red (write failing TC test for snooze button presence) → Green (add snooze state + buttons to `InProgressInbox.tsx`) → Refactor (extract snooze read/write into named helpers inside the file for readability; no separate file needed for S-scale logic).
- **Planning validation (required for M/L):**
  - Checks run:
    - Confirmed `Button` import path in BOS: `NewIdeasInbox.tsx:7` — `import { Button } from "@acme/design-system/atoms"`.
    - Confirmed `filteredActivePlans` is already a `useMemo` in `InProgressInbox.tsx:407-413` — snooze filter can be appended to the existing filter chain without restructuring.
    - Confirmed `useInProgressAutoRefresh` calls `setActivePlans(data.activePlans)` on each poll — triggering re-render and snooze re-evaluation automatically.
    - Confirmed `isMounted` ref pattern exists in BOS (`useBoardAutoRefresh.ts:59`); using `useState(false)` with `useEffect(() => setIsMounted(true), [])` is the simpler client-guard pattern.
    - Confirmed `InProgressInbox.test.tsx` uses `jsdom` environment — `localStorage` is available via `window.localStorage`.
  - Validation artifacts: `apps/business-os/src/components/process-improvements/InProgressInbox.tsx` (full read), `apps/business-os/src/components/process-improvements/NewIdeasInbox.tsx` (button import confirmed).
  - Unexpected findings: None — component structure is straightforward and the change surface is narrow.
- **Scouts:**
  - Scout 1: `filteredActivePlans` in `InProgressInbox.tsx` uses a `useMemo` that already applies two filters (business filter and incomplete-tasks filter). Adding snooze filter to this memo is the correct placement — confirmed by reading the memo body at lines 407-413.
  - Scout 2: `InProgressInbox.test.tsx` mocks no external modules currently. localStorage mock strategy: `Object.defineProperty(window, 'localStorage', { value: mockStorage, writable: true })` or `jest.spyOn` on `window.localStorage`. Both patterns work in jsdom.
- **Edge Cases & Hardening:**
  - localStorage unavailable (private browsing without permission): wrap all localStorage access in `try/catch`; default to empty snooze state. Card buttons still render but clicks produce no persistent snooze (acceptable degraded behavior).
  - Concurrent tabs: BOS is single-operator; concurrent tab scenario is out of scope. No special handling needed.
  - Plan slug contains characters invalid for JSON object keys: slugs are kebab-case directory names (e.g. `process-improvements-snooze-buttons`); all valid JSON string keys.
- **What would make this >=90%:**
  - Post-build visual evidence showing the buttons render correctly with correct Tailwind token resolution (contrast sweep pass).
  - Confirmed by CI passing on the test assertions.
- **Rollout / rollback:**
  - Rollout: Standard deploy. No feature flag. No migration. localStorage key is new and isolated.
  - Rollback: Single revert commit. Stale `bos:plan-snooze:v1` entries in localStorage after rollback are harmless — the key is simply not read after the code is reverted.
- **Documentation impact:**
  - Known limitation: SSR page header count (`inProgressCount` on the `/process-improvements/in-progress` hero banner) includes snoozed plans. This is a cosmetic gap documented in this plan and accepted in the outcome contract. No doc changes required beyond this plan.
- **Notes / references:**
  - Design system `Button` component: `apps/business-os/src/components/process-improvements/NewIdeasInbox.tsx` — see `ActionButton` sub-component (lines 833-860) for `tone="outline"` button usage pattern.
  - Hydration guard pattern reference: `apps/business-os/src/components/board/useBoardAutoRefresh.ts` (isMounted ref pattern).

---

### TASK-02: Tests for snooze behavior in `InProgressInbox.test.tsx`
- **Type:** IMPLEMENT
- **Deliverable:** Extended `apps/business-os/src/components/process-improvements/InProgressInbox.test.tsx` — new test cases covering snooze button rendering, localStorage write on click, filter behavior, expiry, and stale entry pruning.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/business-os/src/components/process-improvements/InProgressInbox.test.tsx`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — Test infrastructure is confirmed present (`jsdom` environment, `@testing-library/react`, existing `activePlan` fixture). Pattern for localStorage mock in jsdom is well-established. Held-back test: if TASK-01 implementation uses a `useEffect`-gated render (`isMounted` guard), tests must use `act()` or `waitFor()` to let the effect fire before asserting card presence. This is a known pattern but requires care. Could cap at 80 if the isMounted guard complicates assertions — apply downward bias → 85.
  - Approach: 85% — Extending existing test file is correct per analysis. localStorage mock via `jest.spyOn` or `Object.defineProperty` is the right seam. Held-back test: no single unknown drops this below 80.
  - Impact: 90% — Tests are the CI gate for snooze correctness. Clear contract between test assertions and acceptance criteria.
- **Acceptance:**
  - [ ] TC-01: "Snooze for 3 days" and "Snooze for 7 days" buttons render on each `ActivePlanCard`.
  - [ ] TC-02: Clicking "Snooze for 3 days" calls `localStorage.setItem` with `bos:plan-snooze:v1` containing the plan slug mapped to an ISO timestamp ≈3 days from `Date.now()` (within 1 second tolerance using fake timers).
  - [ ] TC-03: When `bos:plan-snooze:v1` in localStorage contains a future expiry for a plan slug, that plan card is not rendered.
  - [ ] TC-04: When `bos:plan-snooze:v1` in localStorage contains a past expiry for a plan slug, that plan card is rendered.
  - [ ] TC-05: When `bos:plan-snooze:v1` in localStorage contains a slug not in `initialActivePlans`, no error is thrown; the component renders normally.
  - [ ] TC-06: When `localStorage.getItem('bos:plan-snooze:v1')` returns `null`, all plans are rendered without error.
  - [ ] TC-07: When all plans are snoozed with future expiry, "No plans currently in progress" empty-state text is rendered.
  - [ ] Existing TC-07, TC-08, TC-09 in the test file continue to pass — they must be updated to use `waitFor` or `act` to allow the `isMounted` guard `useEffect` to fire before asserting card content is present.
  - **Expected user-observable behavior:** N/A — test-only task. Covered by TASK-01.
- **Engineering Coverage:**
  - UI / visual: N/A — tests verify DOM rendering but do not validate visual design tokens or layout.
  - UX / states: Required — Tests cover the three card states: shown, snoozed (absent), reappeared (past expiry shown). Empty-list state covered by TC-07.
  - Security / privacy: N/A — no security surface in tests.
  - Logging / observability / audit: N/A.
  - Testing / validation: Required — this task IS the testing coverage. All TC cases map to acceptance criteria from TASK-01.
  - Data / contracts: N/A — tests confirm `localStorage` write format; no shared type contract changes.
  - Performance / reliability: N/A — unit test, not a load test.
  - Rollout / rollback: N/A — tests are checked in with implementation; revert removes both together.
- **Validation contract (TC-01 through TC-07):** (Same as TASK-01 TC-01 through TC-07 — this task implements those test cases.)
  - TC-01: `render(<InProgressInbox initialActivePlans={[activePlan]} />)` → buttons "Snooze for 3 days" and "Snooze for 7 days" present in DOM.
  - TC-02: Mock `localStorage`, click "Snooze for 3 days", assert `setItem` called with JSON containing `{ [slug]: <future-iso> }`.
  - TC-03: Pre-populate `localStorage` mock with future expiry for slug, render → plan card absent from DOM.
  - TC-04: Pre-populate `localStorage` mock with past expiry for slug, render → plan card present in DOM.
  - TC-05: Pre-populate `localStorage` mock with unknown slug, render two plans → no error; both plans visible.
  - TC-06: `localStorage.getItem` returns `null`, render → both plans visible, no error.
  - TC-07: Pre-populate `localStorage` mock with future expiry for all plan slugs → empty-state text rendered.
- **Execution plan:** Red (write failing test stubs for TC-01 through TC-07) → Green (assertions pass against TASK-01 implementation) → Refactor (consolidate mock setup into `beforeEach` where shared).
- **Planning validation:** N/A — S effort; reasoning-only planning validation applies. Infrastructure confirmed at TASK-01 validation stage.
- **Scouts:**
  - The `isMounted` guard in TASK-01 will gate plan list rendering behind a `useEffect`. Tests using `render()` synchronously will see the empty state until the effect fires. Must wrap assertions in `waitFor(() => expect(...).toBeInTheDocument())` or use `act()` after render for ALL tests that assert plan card presence — including the three existing tests (TC-07, TC-08, TC-09) which must be updated accordingly. Failure to update existing tests will cause them to silently pass on a vacuous assertion (asserting text present when the component is in the pre-mount empty state). Use `waitFor` for all card-content assertions.
- **Edge Cases & Hardening:**
  - The existing `activePlan` fixture in the test file has `slug: "process-improvements-active-plan-activity-ring"`. New snooze tests should use the same fixture slug or define a local `planA` / `planB` with distinct slugs for multi-plan tests.
- **What would make this >=90%:**
  - CI green on first push without amendment.
- **Rollout / rollback:**
  - Rollout: Tests ship alongside TASK-01 implementation in the same commit or sequential commits in the same PR.
  - Rollback: Tests revert with the implementation.
- **Documentation impact:** None.
- **Notes / references:**
  - `docs/testing-policy.md` — CI is test authority; no local Jest runs.
  - Existing test pattern: `jest.useFakeTimers().setSystemTime(new Date(...))` used in TC-07 and TC-09 for time-dependent assertions — same pattern required for TC-02 (snooze expiry timestamp precision).

---

## Risks & Mitigations
- `isMounted` guard briefly hides all cards on every page visit until hydration completes: Acceptable for single-operator internal tool. Brief (sub-100ms for typical BOS deployment). Mitigation: accepted.
- SSR page header count includes snoozed plans: Cosmetic only. Accepted. Plan note documents this to prevent it being raised as a bug.
- Stale localStorage entry after plan rename/archive: Low likelihood. Mitigated by filtering against current slugs on every render cycle.
- `InProgressInbox.test.tsx` `isMounted` guard interaction: Tests must use `waitFor` or `act` to allow the mount guard to fire. Known pattern; implementation risk is Minor.
- localStorage unavailable (private browsing): Graceful degradation via `try/catch`. Buttons still render but snooze state is ephemeral.

## Observability
- Logging: None by design — lightweight feature.
- Metrics: None — single-operator tool.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)
- [ ] "Snooze for 3 days" and "Snooze for 7 days" buttons appear on each `ActivePlanCard` at `/process-improvements/in-progress`.
- [ ] Clicking either button hides the card immediately (no page reload).
- [ ] Snoozed cards persist across page reload (localStorage).
- [ ] Snoozed cards reappear on the next auto-refresh cycle after expiry (within 30s).
- [ ] Empty-list state renders correctly when all plans are snoozed.
- [ ] TypeScript compiles with no errors on `apps/business-os`. Lint passes.
- [ ] CI passes: existing TC-07, TC-08, TC-09 updated to use `waitFor`/`act` for `isMounted` guard and passing; new TC-01 through TC-07 pass.
- [ ] Post-build contrast sweep: no Critical or Major accessibility findings on `/process-improvements/in-progress`.
- [ ] New-ideas Defer and operator-action Snooze mechanisms are unaffected (no regressions).

## Decision Log
- 2026-03-12: Chose localStorage (Option A) over JSONL ledger (Option B) and operator-actions extension (Option C). Rationale: active plans are filesystem-derived; server-side storage adds disproportionate lifecycle complexity for a "remind me later" feature. Documented in analysis.md.
- 2026-03-12: Chose `isMounted` guard over accepting hydration flash. Rationale: eliminates the brief card flash on every page load; brief absence of all cards is less confusing than unexpected card appearance then disappearance.
- 2026-03-12: TASK-01 and TASK-02 kept as separate tasks (not merged). Rationale: sequential dependence is real — TASK-02 tests the implementation patterns produced in TASK-01 (e.g. localStorage key format, isMounted guard timing). Merging would make the test task ambiguous about what to test before implementation exists.
- 2026-03-12: New-ideas Defer label change (TASK-03) is out of scope. Pending operator input. Default assumption is no change.
- 2026-03-12 (critique Round 1): Clarified stale localStorage entry behavior — entries are silently ignored during filter evaluation, not written back (cleaned up) to `localStorage`. These are different behaviors; the plan now consistently uses "ignored" throughout. No write-back is performed.
- 2026-03-12 (critique Round 1): Clarified that the `isMounted` guard requires updating existing TC-07, TC-08, TC-09 tests (not just new tests) to use `waitFor`/`act`. Plan updated; TASK-02 acceptance now explicitly includes this requirement.
- 2026-03-12 (critique Round 2): Explicitly specified that during the pre-mount window (`isMounted === false`), the component must render `null` for the in-progress section — not the empty-state copy — to prevent a misleading "No plans currently in progress" flash on every page load. Plan, Engineering Coverage, and Rehearsal Trace updated accordingly.
- 2026-03-12: Inline snooze logic inside `InProgressInbox.tsx` (no separate hook file). Rationale: the logic is small (<30 lines including helpers). Extracting to a separate file adds overhead for no concrete benefit at this scale.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add snooze state + UI | Yes — `Button` import available; `filteredActivePlans` useMemo identified as correct insertion point; `useInProgressAutoRefresh` confirmed to call `setActivePlans` on each poll triggering snooze re-evaluation | [Minor] The `Button` component's `tone="outline"` rendering in BOS may require a specific `size` prop to fit inside the card layout — not confirmed statically; likely requires a one-line tweak during build. [Resolved: Major] `isMounted` null-render requirement explicitly specified: pre-mount renders `null` (not the empty-state copy) to prevent false "No plans currently in progress" flash. | No — all blocking findings resolved in plan |
| TASK-02: Tests for snooze behavior | Partial — `InProgressInbox.test.tsx` infrastructure confirmed; `isMounted` guard in TASK-01 requires `waitFor`/`act` for ALL tests asserting card content — including the three existing tests TC-07, TC-08, TC-09 which must be updated (not just the new tests) | [Major — resolved] Existing tests assert card content synchronously after `render()`; with the `isMounted` guard those assertions will fail or pass vacuously unless updated to use `waitFor`. This is resolved in the plan: TASK-02 Acceptance explicitly requires updating TC-07/08/09, and the Scouts section documents the `waitFor` pattern. | No — resolved in plan |

## Overall-confidence Calculation
- S=1, M=2, L=3
- TASK-01: 85%, effort M=2
- TASK-02: 85%, effort S=1
- Overall-confidence = (85 × 2 + 85 × 1) / (2 + 1) = 255 / 3 = **85%**
