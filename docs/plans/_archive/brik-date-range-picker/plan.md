---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-02-28
Last-reviewed: 2026-02-28
Last-updated: 2026-02-28
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brik-date-range-picker
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall effort-weighted
Auto-Build-Intent: plan+auto
---

# Brik Date Range Picker Plan

## Summary

Replace the two separate `<input type="date">` elements on all four Brikette booking surfaces (`BookPageContent`, `BookingWidget`, `RoomDetailContent`, `ApartmentBookContent`) with a single `react-day-picker` v9 Range Mode calendar. State moves from two independent ISO strings to a `DateRange { from: Date | undefined; to: Date | undefined }` shape; a TZ-safe `parseIsoToLocalDate` helper enables round-trip conversion without UTC shift. Min-stay (2 nights) and max-stay (8 nights) are enforced at the picker level using DayPicker's `disabled` Matcher, replacing silent HTML attribute enforcement. A derived summary (`DD MMM → DD MMM (N nights)`) and "2–8 nights" inline helper appear on every surface. `ApartmentBookContent` gains the previously missing max-stay cap. All downstream consumers (GA4, Octorate URL builder, availability hooks) continue to receive ISO strings.

## Active tasks

- [x] TASK-01: Install react-day-picker + create DateRangePicker component
- [x] TASK-02: Extend dateUtils.ts with parseIsoToLocalDate + formatDisplayDate
- [x] TASK-07: Add i18n keys for helper text, summary, and clear action
- [x] TASK-03: Migrate BookPageContent to DateRangePicker
- [x] TASK-04: Migrate BookingWidget to DateRangePicker
- [x] TASK-05: Migrate RoomDetailContent (BookingDatePicker) to DateRangePicker
- [x] TASK-06: Migrate ApartmentBookContent to DateRangePicker
- [x] TASK-08: Add/update tests — DateRangePicker component + dateUtils helpers (BookPage/Widget/Apartment test coverage via individual task validation contracts)

## Goals

- One-interaction range selection (first click = check-in, second click = check-out) on all four booking surfaces.
- Min 2 / max 8 night enforcement at the picker level — disabled days, not silent HTML min/max.
- DD MMM → DD MMM (N nights) summary displayed adjacent to every picker.
- "2–8 nights" inline helper and "Clear dates" action on every surface.
- Consistent enforcement across all surfaces; `ApartmentBookContent` gets the previously missing max-stay cap.

## Non-goals

- Replacing the guest/pax count input.
- Blocking unavailable dates from the Octorate availability API (separate `brik-octorate-live-availability` plan).
- Adding popover/drawer UI to the `BookingWidget` (inline calendar chosen; see Decision Log).
- Consolidating with or modifying the design-system `DatePicker` molecule (wraps `react-datepicker`, unrelated use case).
- Converting non-EN i18n translations in this work item (placeholder strings acceptable at initial ship).

## Constraints & Assumptions

- Constraints:
  - `bookingDateRules.ts` constants are the authoritative source for min/max values — no hardcoding in picker.
  - All downstream consumers expect ISO `YYYY-MM-DD` strings — picker must convert before passing.
  - All four surfaces are already `"use client"` — DayPicker rendering constraint already satisfied.
  - CSS for DayPicker must use CSS modules (`react-day-picker/dist/style.module.css`) — do not import global CSS that conflicts with Tailwind v4.
  - ISO → Date conversion must use `parseIsoToLocalDate` (TASK-02) not `new Date(isoString)` (UTC parse risk).
- Assumptions:
  - react-day-picker v9.13.0 already in workspace lockfile; `pnpm add` promotes to direct dep without conflict.
  - Inline calendar in `BookingWidget` (default, no popover library needed).
  - Non-EN locale placeholder strings acceptable at initial ship.

## Inherited Outcome Contract

- **Why:** Two-field native date inputs give no visual range feedback, no min/max stay enforcement at the picker level, and require two separate gestures. A range calendar picker removes friction at the most critical booking funnel entry point.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All four Brikette booking-date surfaces replaced with DayPicker Range Mode; 2-night min / 8-night max enforced at selection; DD MMM → DD MMM (N nights) summary and "2–8 nights" helper visible on all surfaces.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/brik-date-range-picker/fact-find.md`
- Key findings used:
  - All four surfaces use native `<input type="date">`; no shared **range** picker exists — evidence: direct file reads. (`packages/design-system/src/molecules/DatePicker.tsx` exists but wraps `react-datepicker` for single-date selection only; not applicable here.)
  - `bookingDateRules.ts` already has `HOSTEL_MIN_STAY_NIGHTS = 2`, `HOSTEL_MAX_STAY_NIGHTS = 8`, and all clamping functions — no new rule logic needed.
  - `ApartmentBookContent` does NOT import `bookingDateRules`; missing max-stay cap.
  - `formatDate(date)` in `dateUtils.ts` uses local time (safe for ISO output). `new Date("YYYY-MM-DD")` is TZ-unsafe — new `parseIsoToLocalDate` helper required.
  - E2E uses Playwright (`apps/brikette/e2e/availability-smoke.spec.ts`), not Cypress.
  - Design-system `DatePicker` wraps `react-datepicker` (single-date only, no Range Mode) — do not extend.
  - react-day-picker v9.13.0 already in workspace lockfile as transitive dep.

## Proposed Approach

- Option A: Extend the design-system `DatePicker` molecule to support Range Mode.
- Option B: Install `react-day-picker` directly in `apps/brikette` and create a purpose-built `DateRangePicker` component.
- **Chosen approach: Option B.** The design-system `DatePicker` wraps `react-datepicker` (single-date API, fundamentally different from `react-day-picker` Range Mode). Merging Range Mode into an unrelated library's wrapper would add complexity to a shared package affecting all apps. Creating a focused `DateRangePicker` in `apps/brikette` keeps the change scoped, lets it be deleted or replaced cheaply, and doesn't pollute the design system.

## Plan Gates

- Foundation Gate: **Pass** — `Deliverable-Type`, `Execution-Track`, `Primary-Execution-Skill`, `Startup-Deliverable-Alias`, `Delivery-Readiness` (88%), test landscape, and testability (82%) all present in fact-find.
- Sequenced: **Yes**
- Edge-case review complete: **Yes**
- Auto-build eligible: **Yes** — all IMPLEMENT tasks at ≥80%, no blocking DECISION tasks, no unresolved Needs-Input items.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Install react-day-picker + create DateRangePicker | 80% | M | Complete (2026-02-28) | — | TASK-03, TASK-04, TASK-05, TASK-06, TASK-08 |
| TASK-02 | IMPLEMENT | Extend dateUtils with parseIsoToLocalDate + formatDisplayDate | 85% | S | Complete (2026-02-28) | — | TASK-03, TASK-04, TASK-05, TASK-06, TASK-08 |
| TASK-07 | IMPLEMENT | Add i18n keys (helper, summary, clear) | 80% | S | Complete (2026-02-28) | — | TASK-03, TASK-04, TASK-05, TASK-06 |
| TASK-03 | IMPLEMENT | Migrate BookPageContent to DateRangePicker | 80% | M | Complete (2026-02-28) | TASK-01, TASK-02, TASK-07 | TASK-08 |
| TASK-04 | IMPLEMENT | Migrate BookingWidget to DateRangePicker | 80% | M | Complete (2026-02-28) | TASK-01, TASK-02, TASK-07 | TASK-08 |
| TASK-05 | IMPLEMENT | Migrate RoomDetailContent BookingDatePicker | 80% | M | Complete (2026-02-28) | TASK-01, TASK-02, TASK-07 | TASK-08 |
| TASK-06 | IMPLEMENT | Migrate ApartmentBookContent to DateRangePicker | 80% | S | Complete (2026-02-28) | TASK-01, TASK-02, TASK-07 | TASK-08 |
| TASK-08 | IMPLEMENT | Tests — new component + updated existing | 80% | S | Complete (2026-02-28) | TASK-01, TASK-02, TASK-05 | — |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-07 | — | Fully parallel; no inter-dependencies |
| 2 | TASK-03, TASK-04, TASK-05, TASK-06 | All of Wave 1 | Fully parallel; each surface is independent |
| 3 | TASK-08 | TASK-01, TASK-02, TASK-05 (for test rewrite) | Tests; some can start after TASK-01 + TASK-02 |

---

## Tasks

---

### TASK-01: Install react-day-picker and create DateRangePicker component

- **Type:** IMPLEMENT
- **Deliverable:** `apps/brikette/src/components/booking/DateRangePicker.tsx` + CSS module import; `apps/brikette/package.json` updated with `react-day-picker` direct dependency.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-28)
- **Affects:**
  - `apps/brikette/src/components/booking/DateRangePicker.tsx` (new)
  - `apps/brikette/package.json`
  - `[readonly] apps/brikette/src/utils/bookingDateRules.ts`
  - `[readonly] apps/brikette/src/utils/dateUtils.ts`
- **Depends on:** — (TASK-01 and TASK-02 run in parallel Wave 1; `DateRangePicker` accepts a `DateRange` prop directly — callers convert ISO→Date using `parseIsoToLocalDate` from TASK-02 before passing. TASK-01 itself does not call `parseIsoToLocalDate` internally.)
- **Blocks:** TASK-03, TASK-04, TASK-05, TASK-06, TASK-08
- **Confidence:** 80%
  - Implementation: 90% — DayPicker v9 Range Mode API is well-documented; `disabled` Matcher pattern established; CSS module import is a known strategy.
  - Approach: 80% — CSS module integration with Tailwind v4 not yet tested in this repo. Held-back test: if CSS cascade conflict occurs, switch to DayPicker's unstyled API + Tailwind class names via `classNames` prop. Recoverable within TASK-01 scope; does not kill the task.
  - Impact: 85% — foundational component all migrations depend on.
- **Acceptance:**
  - `apps/brikette/package.json` lists `react-day-picker` as a direct dependency.
  - `DateRangePicker` renders a DayPicker in `mode="range"` with a `selected` prop of `DateRange`.
  - Selecting a `from` date disables all `to` dates outside `[from + HOSTEL_MIN_STAY_NIGHTS, from + HOSTEL_MAX_STAY_NIGHTS]`.
  - Summary `"DD MMM → DD MMM (N nights)"` displays when both `from` and `to` are set.
  - "2–8 nights" helper text visible when no range or partial range selected.
  - "Clear dates" button resets `selected` to `{ from: undefined, to: undefined }` and calls `onRangeChange(undefined)`.
  - CSS does not conflict with existing Tailwind v4 styles (spot-check in dev).
- **Validation contract:**
  - TC-01: Render with no initial range → calendar visible, helper "2–8 nights" visible, no summary.
  - TC-02: Click day 1 (from) → partial range shown, days outside [+2, +8] from `from` are disabled.
  - TC-03: Click valid day (from + 3) as to → summary `"DD MMM → DD MMM (3 nights)"` visible.
  - TC-04: Attempt click on disabled day (from + 1) → no selection change.
  - TC-05: Click "Clear dates" → range resets, summary hidden, helper shows again.
  - TC-06: Provide `initialRange` prop with valid `DateRange` (`{ from: Date, to: Date }`) → calendar shows pre-selected range. (Callers convert ISO→Date via `safeParseIso` from TASK-02 before passing; the component accepts `DateRange` only, not ISO strings.)
- **Execution plan:** Red → Green → Refactor
  - Red: Scaffold `DateRangePicker.tsx` with TypeScript types, prop interface, DayPicker `mode="range"` render. Add `react-day-picker` to `package.json`.
  - Green: Implement `disabled` Matcher using `bookingDateRules.ts` functions. The Matcher receives a `Date` object directly from DayPicker — use `formatDate(date)` to convert to ISO string to call `getMinCheckoutForStay`/`getMaxCheckoutForStay`, then compare. No `parseIsoToLocalDate` needed inside the component itself; that utility is used by callers to set the `selected` prop. Add summary display. Add "2–8 nights" helper. Add "Clear dates" button. Import CSS module.
  - Refactor: Extract the disabled-day predicate to a named function. Ensure `data-cy` attributes on day cells and clear button.
- **Planning validation (required for M):**
  - Checks run: Confirmed react-day-picker v9.13.0 in `pnpm-lock.yaml`; confirmed CSS module at `react-day-picker/dist/style.module.css` (v9 ships both global and module CSS).
  - Validation artifacts: `pnpm-lock.yaml` grep result confirming v9.13.0 present.
  - Unexpected findings: design-system `DatePicker` wraps `react-datepicker` (not this library) — no collision.
- **Scouts:**
  - Verify CSS module import works without Tailwind v4 cascade conflict by rendering picker in dev before merging.
  - Confirm DayPicker v9 `classNames` prop is available if unstyled approach becomes necessary.
- **Edge Cases & Hardening:**
  - `from` selected, user clicks `from` again → should reset to partial range with new `from` (DayPicker default behavior).
  - Range that spans a month boundary → ensure DayPicker renders both months or allows navigation.
  - `initialRange` with only `from` (no `to`) → render partial range (check-in only state).
- **What would make this >=90%:**
  - CSS integration confirmed working in dev (removes CSS cascade risk from Approach score).
- **Rollout / rollback:**
  - Rollout: Component is new; no existing behavior changes in this task.
  - Rollback: Delete `DateRangePicker.tsx`, remove `react-day-picker` from `package.json`.
- **Documentation impact:** None required — component is internal to `apps/brikette`.
- **Notes / references:**
  - DayPicker v9 docs: `daypicker.dev`. Range Mode: `mode="range"`, `selected: DateRange`, `onSelect: (range?: DateRange) => void`.
  - CSS module: `import styles from "react-day-picker/dist/style.module.css"` then `<DayPicker classNames={styles} />`.

---

### TASK-02: Extend dateUtils.ts with parseIsoToLocalDate and formatDisplayDate

- **Type:** IMPLEMENT
- **Deliverable:** Three new exported functions in `apps/brikette/src/utils/dateUtils.ts`: `parseIsoToLocalDate`, `safeParseIso`, `formatDisplayDate`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-28)
- **Affects:**
  - `apps/brikette/src/utils/dateUtils.ts`
- **Depends on:** —
- **Blocks:** TASK-03, TASK-04, TASK-05, TASK-06, TASK-08
- **Confidence:** 85%
  - Implementation: 95% — pure utility functions with no external deps.
  - Approach: 95% — split-on-dash local Date construction is idiomatic and TZ-safe.
  - Impact: 85% — required for all migration tasks; small but critical.
- **Acceptance:**
  - `parseIsoToLocalDate("2026-03-15")` returns `new Date(2026, 2, 15)` (local time, March 15).
  - `parseIsoToLocalDate` called with an ISO string that would shift under UTC never returns the wrong day.
  - `formatDisplayDate(new Date(2026, 2, 3))` returns `"03 Mar"` (zero-padded day, 3-letter month).
  - Existing `dateUtils.ts` exports are unchanged (no breaking changes).
- **Validation contract:**
  - TC-01: `parseIsoToLocalDate("2026-01-01")` → `getFullYear()=2026, getMonth()=0, getDate()=1`.
  - TC-02: `parseIsoToLocalDate("2026-12-31")` → `getFullYear()=2026, getMonth()=11, getDate()=31`.
  - TC-03: `formatDisplayDate(new Date(2026, 0, 5))` → `"05 Jan"`.
  - TC-04: `formatDisplayDate(new Date(2026, 11, 31))` → `"31 Dec"`.
  - TC-05: Round-trip `formatDate(parseIsoToLocalDate("2026-06-15"))` → `"2026-06-15"`.
  - TC-06: `safeParseIso("2026-03-15")` → valid `Date` with `getDate()=15`.
  - TC-07: `safeParseIso("not-a-date")` → `undefined`.
  - TC-08: `safeParseIso("")` → `undefined`.
- **Execution plan:** Red → Green → Refactor
  - Red: Add failing tests for `parseIsoToLocalDate` and `formatDisplayDate`.
  - Green: Implement all three exported functions: (1) `parseIsoToLocalDate` as `const [y,m,d] = iso.split("-").map(Number); return new Date(y, m-1, d)`; (2) `safeParseIso` as `const d = parseIsoToLocalDate(iso); return isNaN(d.getTime()) ? undefined : d`; (3) `formatDisplayDate` using `getDate()` (zero-padded) + abbreviated month array. All migration tasks (TASK-03/04/05/06) import `safeParseIso` from `dateUtils.ts`.
  - Refactor: Inline JSDoc for both functions.
- **Planning validation:** `dateUtils.ts` read; `formatDate` confirmed to use local-time accessors; no existing `parseIsoToLocalDate` function present.
- **Scouts:** None required — pure functions.
- **Edge Cases & Hardening:** Invalid ISO string input to `parseIsoToLocalDate` → returns `Invalid Date`. The exported `safeParseIso` wrapper (also in TASK-02 deliverable) handles this guard once — all migration tasks import and use `safeParseIso` rather than repeating the `isNaN` check locally.
- **What would make this >=90%:** N/A — already close; held at 85% due to impact uncertainty before real usage.
- **Rollout / rollback:** Additive export — no rollback needed.
- **Documentation impact:** None.

---

### TASK-07: Add i18n keys for range picker UI

- **Type:** IMPLEMENT
- **Deliverable:** New keys in `apps/brikette/src/locales/en/{bookPage,modals,roomsPage}.json` and placeholder entries in all non-EN locale files.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-28)
- **Affects:**
  - `apps/brikette/src/locales/en/bookPage.json`
  - `apps/brikette/src/locales/en/modals.json`
  - `apps/brikette/src/locales/en/roomsPage.json`
  - `apps/brikette/src/locales/{ar,da,de,es,fr,hi,hu,it,ja,ko,no,pl,pt,ru,sv,vi,zh}/bookPage.json` (and modals + roomsPage equivalents — 17 non-EN locales confirmed in `apps/brikette/src/locales/`)
- **Depends on:** —
- **Blocks:** TASK-03, TASK-04, TASK-05, TASK-06
- **Confidence:** 80%
  - Implementation: 95% — JSON file edits; additive only.
  - Approach: 90% — mirrors existing i18n key patterns in the codebase.
  - Impact: 80% — without these keys, UI shows key strings instead of text.
- **Acceptance:**
  - `bookPage.date.stayHelper` → `"2–8 nights"` in EN.
  - `bookPage.date.clearDates` → `"Clear dates"` in EN.
  - `bookPage.date.nightsSummary` → `"{{from}} → {{to}} ({{nights}} nights)"` interpolation template (or equivalent; adapt to the app's i18n interpolation syntax).
  - Same keys added to `modals` namespace (for `BookingWidget`) and `roomsPage` namespace (for `RoomDetailContent`).
  - Non-EN locales have the same keys with EN fallback values (prefixed `[EN]` or identical EN string — match existing placeholder convention in the codebase).
- **Validation contract:**
  - TC-01: `t("bookPage:date.stayHelper")` returns `"2–8 nights"` in EN locale.
  - TC-02: `t("bookPage:date.clearDates")` returns `"Clear dates"` in EN locale.
  - TC-03: All 17 non-EN locale files (`ar,da,de,es,fr,hi,hu,it,ja,ko,no,pl,pt,ru,sv,vi,zh`) contain the same key paths (no missing key errors in i18n parity audit).
- **Execution plan:** Red → Green → Refactor
  - Red: Add key paths to EN files; observe missing-key fallbacks.
  - Green: Verify EN keys resolve. Add placeholder entries to non-EN locales (EN value as placeholder).
  - Refactor: Run i18n parity audit if available to confirm no missing keys.
- **Planning validation:** Reviewed `bookPage.json`, `modals.json`, `roomsPage.json` namespace structures; identified existing interpolation syntax (`{{variable}}`).
- **Scouts:** Confirm interpolation variable syntax (e.g., `{{nights}}` vs `{nights}`) by checking an existing interpolated key in the codebase.
- **Edge Cases & Hardening:** If nights === 1 (which should not occur given min=2, but guard anyway): use plural key or hardcode the nights label as "nights" for now — single-night is blocked by picker.
- **What would make this >=90%:** N/A — straightforward JSON edit.
- **Rollout / rollback:** Additive JSON keys — no rollback needed. Non-EN placeholders are acceptable degradation.
- **Documentation impact:** None.

---

### TASK-03: Migrate BookPageContent to DateRangePicker

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-28)
- **Affects:**
  - `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`
  - `[readonly] apps/brikette/src/components/booking/DateRangePicker.tsx` (TASK-01)
  - `[readonly] apps/brikette/src/utils/dateUtils.ts` (TASK-02)
  - `[readonly] apps/brikette/src/utils/bookingDateRules.ts`
  - `[readonly] apps/brikette/src/utils/ga4-events.ts`
- **Depends on:** TASK-01, TASK-02, TASK-07
- **Blocks:** TASK-08
- **Confidence:** 80%
  - Implementation: 85% — current state fully read; state shape migration fully mapped; downstream consumers all accept ISO strings.
  - Approach: 85% — pattern established in TASK-01; applying consistently.
  - Impact: 80% — primary funnel entry point; most user-visible surface. Held-back test: what single unknown drops below 80? The `fireSearchAvailability` debounce/dedup logic wired to `[checkin, checkout, pax]` must be rewired to `[range.from, range.to, pax]` — straightforward but requires care. Not a dropping concern; 80% stands.
- **Acceptance:**
  - Two `<input type="date">` elements replaced by `<DateRangePicker>`.
  - State shape: `range: DateRange` instead of separate `checkin/checkout: string`.
  - `writeCanonicalBookingQuery` still called with ISO strings derived from `range.from/to` via `formatDate`. When range is cleared (`from`/`to` = undefined), `writeCanonicalBookingQuery` must delete (or set to `""`) the `checkin`/`checkout` URL params rather than setting empty strings — update `writeCanonicalBookingQuery` to use `url.searchParams.delete("checkin")` / `url.searchParams.delete("checkout")` when values are empty/undefined.
  - `bookingQuery` prop to `RoomsSection` still receives `{ checkIn: string, checkOut: string, pax: string, queryString: string }` in ISO format.
  - `fireSearchAvailability` fires with ISO strings; debounce/dedup logic preserved.
  - Room card CTAs remain disabled until valid range is selected (`roomQueryState` logic preserved using `isValidStayRange`).
  - Summary `"DD MMM → DD MMM (N nights)"` visible when both dates set.
  - "2–8 nights" helper visible when no range or partial range.
  - "Clear dates" resets range to `{ from: undefined, to: undefined }` and clears URL params.
- **Validation contract:**
  - TC-01: Load `/book` with `?checkin=2026-03-10&checkout=2026-03-13` → picker shows pre-selected range; summary shows "10 Mar → 13 Mar (3 nights)".
  - TC-02: Select `from` = Mar 10 → days before Mar 12 and after Mar 18 are disabled.
  - TC-03: Select valid `to` = Mar 13 → `roomQueryState` becomes "valid"; room card CTAs enabled.
  - TC-04: Click "Clear dates" → URL params cleared; room CTAs return to unavailable state.
  - TC-05: URL is updated via `replaceState` after range selection (no page navigation).
  - TC-06: `fireSearchAvailability` fires once per debounce period after range changes, with correct ISO `checkin`/`checkout`.
- **Execution plan:** Red → Green → Refactor
  - Red: Replace `<input type="date">` refs in JSX with `<DateRangePicker>`. TypeScript will error on `checkin`/`checkout` string state usage.
  - Green: Import `safeParseIso` from `dateUtils.ts` (TASK-02). Change state to `const [range, setRange] = useState<DateRange>({ from: safeParseIso(initialCheckin), to: safeParseIso(initialCheckout) })`. Derive ISO strings: `const checkinIso = range.from ? formatDate(range.from) : ""; const checkoutIso = range.to ? formatDate(range.to) : ""`. Thread ISO strings to all existing consumers unchanged. Rewire `fireSearchAvailability` to `[checkinIso, checkoutIso, pax]`.
  - Refactor: Remove now-unused `getMinCheckoutForStay`, `ensureMinCheckoutForStay` from imports (enforcement moves to picker). Remove `minCheckout` memo. Keep `isValidStayRange` for `roomQueryState`.
- **Planning validation:**
  - Read `BookPageContent.tsx` — confirmed: state shape, `writeCanonicalBookingQuery`, `bookingQuery`, `fireSearchAvailability` call sites, `roomQueryState` computation.
  - Consumer check: `RoomsSection` receives `bookingQuery` with ISO strings — unchanged.
  - Consumer check: `fireSearchAvailability` receives ISO strings — converted before call; unchanged signature.
  - Consumer check: `writeCanonicalBookingQuery` receives ISO strings — unchanged.
  - No circular state dependency introduced.
- **Scouts:** Confirm `initialCheckinRaw` guard logic (invalid ISO fallback to `todayIso`) works via `parseIsoToLocalDate` — invalid ISO returns `Invalid Date`; guard must check validity before using.
- **Edge Cases & Hardening:**
  - Partial range (only `from` set): `checkoutIso` = `""` → `roomQueryState` = "invalid" — correct.
  - SSR initial render: `range` state initialised server-side; no `window` access in `useState` init (unlike `BookingWidget`). Safe.
  - URL params with out-of-range checkout → initial state includes invalid checkout; DayPicker renders partial range (only `from` shows as selected); user must reselect `to`.
- **What would make this >=90%:** No remaining unknowns after TASK-01 CSS validation; existing debounce tests for BookPageContent would raise testability confidence.
- **Rollout / rollback:** Revert single file. No DB changes.
- **Documentation impact:** None.

---

### TASK-04: Migrate BookingWidget to DateRangePicker

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/brikette/src/components/landing/BookingWidget.tsx`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-28)
- **Affects:**
  - `apps/brikette/src/components/landing/BookingWidget.tsx`
  - `[readonly] apps/brikette/src/components/booking/DateRangePicker.tsx` (TASK-01)
  - `[readonly] apps/brikette/src/utils/dateUtils.ts` (TASK-02)
- **Depends on:** TASK-01, TASK-02, TASK-07
- **Blocks:** TASK-08
- **Confidence:** 80%
  - Implementation: 85% — `BookingWidget` fully read; URL-hydration pattern and submit handler fully understood.
  - Approach: 80% — inline calendar chosen (no popover library); fits existing always-visible panel. Held-back test: will inline calendar layout break above-fold design on mobile? Verifiable in dev; not a task-killing concern.
  - Impact: 80% — landing page entry point; significant UX improvement for the first funnel touchpoint.
- **Acceptance:**
  - Two `<input type="date">` elements replaced by `<DateRangePicker>` inline within the widget panel.
  - URL hydration on mount still reads `?checkin=`/`?checkout=` ISO params and seeds `range` state via `parseIsoToLocalDate`.
  - URL sync `useEffect` still writes ISO strings via `formatDate(range.from/to)`.
  - Submit handler converts `range.from/to` to ISO strings and passes to `router.push`.
  - Submission blocked when `range` is undefined or `isValidStayRange` fails (using ISO strings).
  - `landingPage.bookingWidget.invalidDateRange` error label replaced by the picker's own inline enforcement; consider removing the error label or retaining as a submit-time fallback.
  - "2–8 nights" helper and "Clear dates" button visible in widget.
- **Validation contract:**
  - TC-01: Load landing page with `?checkin=2026-03-10&checkout=2026-03-13` → widget shows pre-selected range.
  - TC-02: Complete range selection → "Check Availability" button enabled.
  - TC-03: Click "Check Availability" with valid range → navigates to `/[lang]/book?checkin=...&checkout=...&pax=...`.
  - TC-04: URL updates via `replaceState` as range changes (no navigation).
  - TC-05: "Clear dates" → range resets; submit button disabled.
  - TC-06: Widget with no initial URL params → calendar renders empty, helper "2–8 nights" visible.
- **Execution plan:** Red → Green → Refactor
  - Red: Replace `<input type="date">` with `<DateRangePicker>`. TypeScript errors on existing string state.
  - Green: Import `safeParseIso` from `dateUtils.ts`. Change state to `range: DateRange`. Update `hasHydrated` mount effect to seed from URL via `safeParseIso`. Update URL-sync `useEffect` to serialize `range.from/to` to ISO via `formatDate`. Update submit handler. Remove `ensureMinCheckoutForStay` import (min enforcement moves to picker). **Keep `isValidStayRange` import** — required for submit-time block: `BookingWidget` submit must be gated on a valid range (`isValidStayRange(fromIso, toIso)`) to prevent navigation with invalid state. `BookingWidget` does NOT have `roomQueryState` — that's a `BookPageContent` concept.
  - Refactor: Evaluate whether `invalidDateRange` i18n key can be removed or repurposed as submit-time fallback.
- **Planning validation:** Read `BookingWidget.tsx`; confirmed `hasHydrated` mount pattern, URL-sync effect, and submit handler. Confirmed `BOOKING_FIELD_IDS` constants no longer needed post-migration.
- **Consumer tracing:** `router.push` receives ISO string query params — unchanged.
- **Scouts:** Confirm calendar width fits within widget panel on mobile (375px) — DayPicker single-month calendar is ~300px wide by default; may need responsive sizing.
- **Edge Cases & Hardening:** Widget with no URL params → `range = { from: undefined, to: undefined }`; DayPicker renders current month with no selection. Users can start picking immediately.
- **What would make this >=90%:** CSS integration verified; mobile layout confirmed; submit button disabling verified.
- **Rollout / rollback:** Revert single file.
- **Documentation impact:** None.

---

### TASK-05: Migrate RoomDetailContent (BookingDatePicker) to DateRangePicker

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/brikette/src/app/[lang]/dorms/[id]/RoomDetailContent.tsx`; updated `apps/brikette/src/test/components/room-detail-date-picker.test.tsx`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-28)
- **Affects:**
  - `apps/brikette/src/app/[lang]/dorms/[id]/RoomDetailContent.tsx`
  - `apps/brikette/src/test/components/room-detail-date-picker.test.tsx`
  - `[readonly] apps/brikette/src/components/booking/DateRangePicker.tsx` (TASK-01)
  - `[readonly] apps/brikette/src/utils/dateUtils.ts` (TASK-02)
  - `[readonly] apps/brikette/src/utils/buildOctorateUrl.ts`
- **Depends on:** TASK-01, TASK-02, TASK-07
- **Blocks:** TASK-08
- **Confidence:** 80%
  - Implementation: 85% — local `BookingDatePicker` sub-component fully read; `onDateChange` prop contract understood.
  - Approach: 85% — same pattern as TASK-03.
  - Impact: 80% — room detail is the deepest funnel step; date selection here directly precedes Octorate handoff.
- **Acceptance:**
  - Local `BookingDatePicker` inline component removed.
  - `<DateRangePicker>` renders in its place.
  - `onDateChange(checkin, checkout, adults)` callback still called with ISO string `checkin`/`checkout` — contract unchanged for parent state.
  - `buildOctorateUrl` still receives ISO strings — unchanged.
  - `StickyBookNow` `octorateUrl` prop still receives a built Octorate URL — unchanged.
  - `data-min-nights`/`data-max-nights` data attributes removed (enforcement now in picker).
  - `room-detail-date-picker.test.tsx` TC-DP-02 and TC-DP-03 rewritten for DayPicker interaction model.
  - All 4 existing test cases pass after rewrite (or updated equivalents cover the same scenarios).
- **Validation contract:**
  - TC-01: (was TC-DP-01) No URL params on load → `router.replace` seeded with today as from, today+2 as to, pax=1.
  - TC-02: (was TC-DP-02, rewrite) Simulate selecting a new `from` date via DayPicker click → `router.replace` called with updated `checkin` param.
  - TC-03: (was TC-DP-03, rewrite) Range where `from === to` (0 nights) is not selectable via DayPicker (disabled); `RoomCard` receives `queryState="invalid"` if initial URL params create this state.
  - TC-04: (was TC-DP-04) With `pax=1`, "Decrease adults" button remains disabled.
- **Execution plan:** Red → Green → Refactor
  - Red: Delete `BookingDatePicker` local function. Replace JSX with `<DateRangePicker>`. TypeScript errors on `pickerCheckIn`/`pickerCheckOut` string state.
  - Green: Change state to `pickerRange: DateRange` with `from = safeParseIso(checkIn)`, `to = safeParseIso(checkOut)` (where `safeParseIso` guards against `Invalid Date` by returning `undefined`). In `handleDateChange`, derive ISO strings via `formatDate`. Rewire `buildOctorateUrl` call. Remove `normalizeCheckoutForStay` import. Rewrite test cases TC-DP-02/03.
  - Refactor: Remove `BookingDatePickerProps` type. Remove `data-min-nights`/`data-max-nights` attributes. Clean up now-unused date rule imports.
- **Planning validation:** Read `RoomDetailContent.tsx`; confirmed: `BookingDatePicker` prop interface, `onDateChange` signature, `buildOctorateUrl` call site, `data-min-nights`/`data-max-nights` attributes, Sticky CTA wiring.
- **Consumer tracing:** `buildOctorateUrl({ checkin, checkout, pax, ... })` — receives ISO strings from `handleDateChange`. Unchanged signature. `fireHandoffToEngine` — receives ISO strings. Unchanged.
- **Scouts:** Confirm `data-cy` prop can be threaded through `DateRangePicker` to individual day cells — required for TC-DP-02 test interaction.
- **Edge Cases & Hardening:** Adults count state (`pickerAdults`) is independent of `DateRangePicker` — adults stepper unchanged by this migration.
- **What would make this >=90%:** Playwright E2E smoke spec updated to use DayPicker selectors; TC-DP-02/03 rewritten and confirmed passing in CI.
- **Rollout / rollback:** Revert two files (component + test).
- **Documentation impact:** None.

---

### TASK-06: Migrate ApartmentBookContent to DateRangePicker

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/brikette/src/app/[lang]/private-rooms/book/ApartmentBookContent.tsx`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-28)
- **Affects:**
  - `apps/brikette/src/app/[lang]/private-rooms/book/ApartmentBookContent.tsx`
  - `[readonly] apps/brikette/src/components/booking/DateRangePicker.tsx` (TASK-01)
  - `[readonly] apps/brikette/src/utils/dateUtils.ts` (TASK-02)
  - `[readonly] apps/brikette/src/utils/bookingDateRules.ts`
- **Depends on:** TASK-01, TASK-02, TASK-07
- **Blocks:** TASK-08
- **Confidence:** 80%
  - Implementation: 85% — `ApartmentBookContent` fully read; sessionStorage restore path documented.
  - Approach: 85% — consistent with TASK-03/05 pattern.
  - Impact: 80% — apartment booking is a distinct flow; this change also fixes a correctness gap (missing max-stay enforcement).
- **Acceptance:**
  - Two `<input type="date">` elements replaced by `<DateRangePicker>`.
  - `HOSTEL_MAX_STAY_NIGHTS` enforcement now active on apartment booking (was previously missing).
  - `buildOctorateLink` local function still receives ISO strings — unchanged.
  - `fireHandoffToEngine` still receives ISO strings — unchanged.
  - `begin_checkout` `value: nights * 265` still computed from correct nights count.
  - sessionStorage save/restore path still stores and reads ISO strings: `{ checkin: formatDate(range.from), checkout: formatDate(range.to) }`; restored via `parseIsoToLocalDate`.
  - `modals:booking2.selectDatesTitle`, `modals:booking2.checkInDate`, `modals:booking2.checkOutDate` keys may be replaced by `DateRangePicker`'s own helper/summary UI — evaluate and clean up unused keys.
- **Validation contract:**
  - TC-01: Initial render → picker shows today as `from`, today+2 as `to` (matching current default `getDatePlusTwoDays`).
  - TC-02: Select `from` → days outside [+2, +8] disabled.
  - TC-03: Select valid `to` → "Reserve Apartment" button enabled.
  - TC-04: sessionStorage restore on remount → picker shows restored range.
  - TC-05: `nights * 265` correct for selected range (e.g. 3 nights → 795).
- **Execution plan:** Red → Green → Refactor
  - Red: Replace `<input type="date">` with `<DateRangePicker>`. TypeScript errors on string state.
  - Green: Change state to `range: DateRange` with `from = safeParseIso(getTodayIso())`, `to = safeParseIso(getDatePlusTwoDays(getTodayIso()))` (guarded against `Invalid Date`). Add `bookingDateRules` import for min/max constants. Update sessionStorage restore path to use `safeParseIso`. Update `buildOctorateLink` and `fireHandoffToEngine` to use ISO strings from `range.from/to` via `formatDate`. Update `nights` computation from range diff.
  - Refactor: Remove now-unused `booking2.checkInDate`/`checkOutDate` i18n keys if replaced by picker UI. Remove `pax` stepper complexity if unchanged.
- **Planning validation:** Read `ApartmentBookContent.tsx`; confirmed: sessionStorage pattern, `buildOctorateLink` function signature, `fireHandoffToEngine` call, `begin_checkout` value computation, pax state (2 | 3 toggle unchanged).
- **Consumer tracing:** `buildOctorateLink` receives `{ checkin: string, checkout: string, pax: number, ... }` — ISO strings unchanged. `fireHandoffToEngine` — same.
- **Scouts:** Confirm `nights` is correctly derived: `Math.round((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24))` — same result as ISO string difference.
- **Edge Cases & Hardening:** sessionStorage may contain old-format `{ checkin, checkout }` ISO strings from a previous session — restore path parses these via `parseIsoToLocalDate` without issue.
- **What would make this >=90%:** Apartment E2E test (none exists) or at least a unit test for the sessionStorage restore path.
- **Rollout / rollback:** Revert single file. The max-stay enforcement addition is a correctness fix — no UX regression on rollback.
- **Documentation impact:** None.

---

### TASK-08: Tests — new DateRangePicker unit tests + updated room-detail tests

- **Type:** IMPLEMENT
- **Deliverable:** `apps/brikette/src/test/components/date-range-picker.test.tsx` (new); `apps/brikette/src/test/utils/dateUtils.test.ts` additions; `apps/brikette/src/test/components/room-detail-date-picker.test.tsx` (updated, handled in TASK-05 but final verification here).
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-28)
- **Affects:**
  - `apps/brikette/src/test/components/date-range-picker.test.tsx` (new)
  - `apps/brikette/src/test/utils/dateUtils.test.ts` (additions)
  - `[readonly] apps/brikette/src/components/booking/DateRangePicker.tsx` (TASK-01)
  - `[readonly] apps/brikette/src/utils/dateUtils.ts` (TASK-02)
- **Depends on:** TASK-01, TASK-02, TASK-05
- **Blocks:** —
- **Confidence:** 80%
  - Implementation: 85% — RTL patterns established; `data-cy` requirement documented; existing test structure confirmed.
  - Approach: 85% — follows exact same Jest + RTL pattern as existing `room-detail-date-picker.test.tsx`.
  - Impact: 80% — necessary for CI gate; provides regression protection.
- **Acceptance:**
  - `date-range-picker.test.tsx`: ≥4 test cases covering: initial render (no range), from-selection (partial range + disabled days), full range selection (summary visible), clear-dates action.
  - `dateUtils.test.ts` additions: tests for `parseIsoToLocalDate` (TC-01 to TC-05 from TASK-02 acceptance criteria) and `formatDisplayDate`.
  - All new tests pass in CI (`pnpm -w run test:governed`).
  - `room-detail-date-picker.test.tsx` TC-DP-02/03 rewrites (done in TASK-05) confirmed passing.
- **Validation contract:**
  - TC-01: `DateRangePicker` renders with no initial range → helper "2–8 nights" visible.
  - TC-02: `parseIsoToLocalDate("2026-03-15")` → `getDate() === 15 && getMonth() === 2` (March).
  - TC-03: `formatDisplayDate(new Date(2026, 2, 3))` → `"03 Mar"`.
  - TC-04: Round-trip ISO string through `parseIsoToLocalDate` → `formatDate` → original string.
- **Execution plan:** Red → Green → Refactor
  - Red: Write failing test stubs for `DateRangePicker` and new `dateUtils` helpers.
  - Green: Tests pass after TASK-01/02 components are built.
  - Refactor: Ensure `data-cy` selectors are correct; remove any duplicate coverage.
- **Planning validation:** `jest.setup.ts` confirms `testIdAttribute: "data-cy"`. Existing `room-detail-date-picker.test.tsx` confirms RTL + mock patterns.
- **Scouts:** Confirm DayPicker renders day cells with accessible ARIA roles or `data-cy` attributes that RTL `userEvent.click` can target.
- **Edge Cases & Hardening:** Tests must not use real `Date.now()` — mock current date to a fixed value to avoid flaky test behavior based on calendar month.
- **What would make this >=90%:** DayPicker click simulation confirmed working via RTL `userEvent.click` on day cells before writing full test suite.
- **Rollout / rollback:** Test files only — no production impact.
- **Documentation impact:** None.

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Install + DateRangePicker | Yes — no deps | [Integration boundary] [Moderate]: CSS module import with Tailwind v4 unverified. Mitigation: dev verification scout in TASK-01. Advisory only. | No |
| TASK-02: dateUtils helpers | Yes — no deps | None | No |
| TASK-07: i18n keys | Yes — no deps | [Missing domain coverage] [Minor]: interpolation variable syntax not confirmed. Scout in TASK-07 addresses this. | No |
| TASK-03: Migrate BookPageContent | Yes — TASK-01, 02, 07 complete | [Type contract gap] [Minor]: `initialCheckinRaw` is validated via `getMinCheckoutForStay()` guard (null check) in current code; after migration, guard uses `safeParseIso` (returns `undefined` on invalid) — centralized in TASK-02. | No |
| TASK-04: Migrate BookingWidget | Yes — TASK-01, 02, 07 complete | [Ordering inversion] [Minor]: `hasHydrated` mount effect reads URL ISO strings and must convert via `parseIsoToLocalDate` — dependency on TASK-02 confirmed in `Depends on` field. | No |
| TASK-05: Migrate RoomDetailContent | Yes — TASK-01, 02, 07 complete | [Ordering inversion] [Minor]: test rewrite (TC-DP-02/03) must be in same PR as component migration — same task handles both. Confirmed. | No |
| TASK-06: Migrate ApartmentBookContent | Yes — TASK-01, 02, 07 complete | None | No |
| TASK-08: Tests | Yes — TASK-01, 02, 05 complete | [Missing precondition] [Minor]: DayPicker day cell `data-cy` attribute availability confirmed as scout item in TASK-08. Advisory. | No |

No Critical simulation findings. All issues are advisory (Moderate/Minor). Plan proceeds to Active.

---

## Risks & Mitigations

- **CSS cascade conflict (Tailwind v4 + DayPicker CSS module):** Medium likelihood, Medium impact. Mitigation: dev verification in TASK-01 scout before any migration task begins. Fallback: unstyled DayPicker + Tailwind `classNames` prop.
- **`BookingWidget` inline calendar layout breaks above-fold:** Low likelihood (inline is standard for always-visible widgets), Low-Medium impact. Mitigation: responsive width constraint on `DateRangePicker` container.
- **TZ-unsafe ISO→Date conversion used elsewhere:** Low likelihood (TASK-02 adds `parseIsoToLocalDate`; planning constraints document the rule), Medium impact. Mitigation: planning constraints explicitly prohibit `new Date(isoString)`.
- **Design-system DatePicker divergence:** Low likelihood, Low impact. Two date picker libraries now exist in monorepo; acceptable given different use cases (single-date DS vs range brikette).

## Observability

- Logging: None required.
- Metrics: `fireSearchAvailability` event rate — compare 7 days pre/post deploy via GA4 DebugView as a proxy for date selection completion rate.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)

- [ ] All four booking surfaces render DayPicker calendar in Range Mode (verified via manual staging check; Playwright smoke spec covers `/en/book` — the other three surfaces are out of scope for smoke extension in this work item).
- [ ] Selecting `from` disables all `to` dates outside `[from+2, from+8]` on all four surfaces.
- [ ] DD MMM → DD MMM (N nights) summary and "2–8 nights" helper visible on all surfaces.
- [ ] "Clear dates" resets to empty range on all surfaces.
- [ ] GA4 `search_availability` fires correctly after range selection on `/book` page.
- [ ] All existing tests pass; new `date-range-picker.test.tsx` and `dateUtils` additions pass in CI.
- [ ] `ApartmentBookContent` enforces max 8-night cap (was missing before).
- [ ] `parseIsoToLocalDate` and `formatDate` used for all ISO ↔ Date conversions (no `new Date(isoString)` in picker code paths).

## Decision Log

- 2026-02-28: Chose Option B (install `react-day-picker` directly in `apps/brikette`) over extending design-system `DatePicker` (wraps `react-datepicker`, no Range Mode, different library).
- 2026-02-28: Chose inline calendar layout for `BookingWidget` (no popover library needed; widget is always-visible panel). Popover can be retrofitted post-ship if operator requests.

## Overall-confidence Calculation

- TASK-01: M (weight 2), confidence 80%
- TASK-02: S (weight 1), confidence 85%
- TASK-07: S (weight 1), confidence 80%
- TASK-03: M (weight 2), confidence 80%
- TASK-04: M (weight 2), confidence 80%
- TASK-05: M (weight 2), confidence 80%
- TASK-06: S (weight 1), confidence 80%
- TASK-08: S (weight 1), confidence 80%

Overall = (80×2 + 85×1 + 80×1 + 80×2 + 80×2 + 80×2 + 80×1 + 80×1) / (2+1+1+2+2+2+1+1) = (160+85+80+160+160+160+80+80) / 12 = 965/12 ≈ **80%**
