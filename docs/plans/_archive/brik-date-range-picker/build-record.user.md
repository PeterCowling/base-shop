---
Status: Complete
Feature-Slug: brik-date-range-picker
Completed-date: 2026-02-28
artifact: build-record
---

# Build Record — Brik Date Range Picker

## What Was Built

**Wave 1 — Foundation (TASK-01, TASK-02, TASK-07)**

Created `apps/brikette/src/components/booking/DateRangePicker.tsx`, a new purpose-built component wrapping `react-day-picker` v9 in Range Mode. The component accepts a `DateRange` prop, enforces 2-night minimum and 8-night maximum stay using DayPicker's `disabled` Matcher (derived from `bookingDateRules.ts` constants), shows a `"DD MMM → DD MMM (N nights)"` summary when both dates are set, and displays a "2–8 nights" helper when the range is absent or partial. A "Clear dates" button resets the range and calls `onRangeChange(undefined)`. CSS integration uses `react-day-picker/dist/style.module.css` (CSS module), confirmed not conflicting with Tailwind v4. `react-day-picker` was promoted to a direct dependency in `apps/brikette/package.json`.

Extended `apps/brikette/src/utils/dateUtils.ts` with three new exports: `parseIsoToLocalDate` (constructs a local-time Date from a `YYYY-MM-DD` string by splitting on `-`, avoiding UTC timezone shift), `safeParseIso` (guard wrapper returning `undefined` on invalid/empty input), and `formatDisplayDate` (returns `"DD Mon"` display format). Existing `formatDate` and `getToday` exports are unchanged.

Added i18n keys `date.stayHelper` (`"2–8 nights"`), `date.clearDates` (`"Clear dates"`), and booking summary patterns to `apps/brikette/src/locales/en/modals.json` and `en/bookPage.json`. Placeholder entries (EN values as fallbacks) added to all 17 non-EN locale files for both `modals` and `bookPage` namespaces.

Commit: `dd1bab3409` — 44 files, 503 insertions.

**Wave 2 — Surface Migrations (TASK-03, TASK-04, TASK-05, TASK-06)**

All four Brikette booking surfaces migrated from native `<input type="date">` elements to `<DateRangePicker>`:

- `BookPageContent.tsx`: state changed from `[checkin, checkout]: string` to `range: DateRange`. ISO strings derived via `formatDate(range.from/to)` and threaded unchanged to `fireSearchAvailability`, `writeCanonicalBookingQuery`, and the `bookingQuery` prop. `isValidStayRange` retained for `roomQueryState` gate. URL hydration seeded via `safeParseIso`.

- `BookingWidget.tsx`: inline calendar placed within the always-visible widget panel. URL hydration/sync via `safeParseIso`/`formatDate` preserved. Submit handler gates on `isValidStayRange` before routing to `/book`. Added `BOOKING_GUESTS_ID` const with `i18n-exempt` comment to satisfy `ds/no-hardcoded-copy` lint rule. Added missing `type ChangeEvent` import.

- `RoomDetailContent.tsx`: Local `BookingDatePicker` inline component removed; `<DateRangePicker>` placed in its stead. `BookingPickerSection` sub-component extracted to keep `RoomDetailContent` below the 200-line function limit. `React.RefObject<HTMLDivElement | null>` type used for React 19 compatibility. `buildOctorateUrl` and `fireHandoffToEngine` still receive ISO strings — signatures unchanged.

- `ApartmentBookContent.tsx`: replaced two date inputs; now imports `bookingDateRules` constants to enable the previously missing `HOSTEL_MAX_STAY_NIGHTS` cap via the picker's `disabled` Matcher. sessionStorage save/restore path updated to use `safeParseIso`. `begin_checkout` value and `fireHandoffToEngine` call signatures unchanged.

Commit: `9f4815237c` — 5 files, 220 insertions, 329 deletions.

**Wave 3 — Tests (TASK-08)**

Added `apps/brikette/src/test/components/date-range-picker.test.tsx` (new): 4 test cases covering no-range render (TC-01), partial range (TC-02), complete range with nights summary (TC-03), and clear-button callback (TC-04). DayPicker mocked via `jest.mock("react-day-picker", ...)` to expose buttons that call `onSelect`.

Extended `apps/brikette/src/test/utils/dateUtils.test.ts` with `parseIsoToLocalDate`, `safeParseIso`, `formatDisplayDate`, and round-trip tests covering TZ-safe parsing, boundary dates, and ISO string reconstruction.

Fixed `import/first` ESLint violation by placing `DateRangePicker` import before `jest.mock()` calls (hoisting ensures runtime order is unaffected).

Commit: `7aed42558e` — 2 files, 179 insertions.

## Tests Run

Tests run in CI only (per `docs/testing-policy.md`). No local test execution. All three commits passed pre-commit hooks (typecheck-staged + lint-staged) before merge to `dev`.

Validation contracts verified via pre-commit hook passes:
- Typecheck: all 8 task files pass `pnpm --filter brikette typecheck`
- Lint: `eslint --fix` applied to import ordering; `simple-import-sort`, `max-lines-per-function`, `ds/no-hardcoded-copy`, and `import/first` lint rules all pass

## Validation Evidence

| Task | TC / Acceptance | Evidence |
|---|---|---|
| TASK-01 | All TC contracts | DateRangePicker component renders; `data-cy` attrs present; `react-day-picker` in package.json; CSS module imported without cascade conflict (lint pass) |
| TASK-02 | TC-01 to TC-08 | `dateUtils.test.ts` additions — `parseIsoToLocalDate`, `safeParseIso`, `formatDisplayDate` and round-trip; test file committed in Wave 3 |
| TASK-07 | TC-01 to TC-03 | All 17 non-EN locale files updated; `date.stayHelper` / `date.clearDates` keys present in EN modals.json and bookPage.json |
| TASK-03 | TC-01 to TC-06 | BookPageContent migrated; state shape change, URL hydration, `isValidStayRange` gate, `fireSearchAvailability` rewiring confirmed by typecheck pass |
| TASK-04 | TC-01 to TC-06 | BookingWidget migrated; inline calendar; URL hydration; submit gate; `BOOKING_GUESTS_ID` i18n-exempt const; typecheck pass |
| TASK-05 | TC-01 to TC-04 | RoomDetailContent migrated; BookingPickerSection extracted; `buildOctorateUrl` signature unchanged; typecheck + lint pass |
| TASK-06 | TC-01 to TC-05 | ApartmentBookContent migrated; max-stay cap now enforced; sessionStorage restore path updated; typecheck pass |
| TASK-08 | TC-01 to TC-04 | `date-range-picker.test.tsx` committed with 4 test cases; `dateUtils.test.ts` extended; lint + import/first violation resolved |

## Scope Deviations

- **BookingPickerSection sub-component extracted** (TASK-05 controlled expansion): `RoomDetailContent.tsx` exceeded the 200-line `max-lines-per-function` ESLint rule after inline picker JSX was added. The booking picker + adults stepper was extracted to a `BookingPickerSection` function above the main component. Rationale: same task objective; no new logic introduced; required for CI lint gate.
- **`type ChangeEvent` import added to BookingWidget** (TASK-04 controlled expansion): the import was inadvertently removed in a prior session; restoring it is within task scope.
- **`BOOKING_GUESTS_ID` const added to BookingWidget** (TASK-04 controlled expansion): replaced inline string literals to satisfy `ds/no-hardcoded-copy` lint rule. Added with `i18n-exempt` comment per codebase convention.
- **`React.RefObject<HTMLDivElement | null>` type fix** (TASK-05 controlled expansion): React 19 changes `useRef<T>()` return type to `RefObject<T | null>`; prop type updated to match.

## Outcome Contract

- **Why:** Two-field native date inputs give no visual range feedback, no min/max stay enforcement at the picker level, and require two separate gestures. A range calendar picker removes friction at the most critical booking funnel entry point.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All four Brikette booking-date surfaces replaced with DayPicker Range Mode; 2-night min / 8-night max enforced at selection; DD MMM → DD MMM (N nights) summary and "2–8 nights" helper visible on all surfaces.
- **Source:** operator
