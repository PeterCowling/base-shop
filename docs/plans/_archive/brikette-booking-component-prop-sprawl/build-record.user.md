---
Type: Build-Record
Status: Complete
Feature-Slug: brikette-booking-component-prop-sprawl
Completed-date: 2026-03-11
artifact: build-record
---

# Build Record: Booking Component Prop Sprawl

## Outcome Contract

- **Why:** Flat 14-16 prop components force every call site to enumerate the same 7-10 string labels individually, creating repetition and misconfiguration risk. Grouping labels into typed objects reduces call-site noise and makes the component contract self-documenting.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `BookingCalendarPanel` and `OctorateCustomPageShell` each accept a `labels` typed bag; call sites pass a single object rather than 7-10 individual strings. All call sites updated, typecheck passes.
- **Source:** auto

## What Was Built

**TASK-01 — BookingCalendarPanel labels bag:** Defined and exported `BookingCalendarPanelLabels` (7 fields: `stayHelper`, `clearDates`, `checkIn`, `checkOut`, `guests`, `decreaseGuests`, `increaseGuests`) in `BookingCalendarPanel.tsx`. Replaced 7 flat label string props with `labels: BookingCalendarPanelLabels`. Updated all 7 internal body usages. Updated all 6 call sites: `RoomsPageContent.tsx`, `DoubleRoomBookContent.tsx`, `ApartmentBookContent.tsx`, `RoomDetailBookingSections.tsx` (assembled from parent flat props + internal `t(...)` ARIA resolution), `BookPageSections.tsx` (assembled from parent flat props + `resolveBookingControlLabels`), `BookingWidget.tsx` (assembled from `resolveTranslatedCopy(...)` calls).

**TASK-02 — OctorateCustomPageShell + SecureBookingPageClient labels bag:** Defined and exported `OctorateCustomPageShellLabels` (10 fields: `continue`, `heading`, `loading`, `ready`, `fallbackTitle`, `fallbackBody`, `security`, `step`, `supporting`, `widgetHost`) in `OctorateCustomPageShell.tsx`. Replaced 10 flat label string props with `labels: OctorateCustomPageShellLabels`; updated all 10 body usages. Updated `SecureBookingPageClient.tsx` to import the type, replace its 10 individual label props with `labels: OctorateCustomPageShellLabels`, and pass `labels={labels}` to the inner shell. Updated `secure-booking/page.tsx` (RSC) to assemble the bag from `resolveLabel(tBook, ...)` calls; `continueLabel` retained as a local variable because it is also used in the `<noscript>` block. Updated test fixture in `octorate-custom-page-shell.test.tsx`: all 10 label fields moved from the flat `COPY` object into a nested `labels` sub-object; 5 test assertions updated from `COPY.continueLabel` etc. to `COPY.labels.continue` etc.; all 5 spread renders (`{...COPY}`) remain valid because `COPY` now includes `labels` as a single top-level key.

Both tasks executed in Wave 1 (parallel) — no shared affected files.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter brikette typecheck` | Pass | 0 errors |
| `pnpm --filter brikette lint` | Pass | 0 errors |

## Validation Evidence

### TASK-01
- TC-01: `BookingCalendarPanel.tsx` Props type has `labels: BookingCalendarPanelLabels`; 7 individual label props absent — confirmed by reading updated file.
- TC-02: All 6 call sites compile without type errors — `pnpm --filter brikette typecheck` passes.
- TC-03: `BookPageSections.BookPageSearchPanel` constructs bag inline from its 5 parent props + 2 from `resolveBookingControlLabels` — confirmed by reading updated file.

### TASK-02
- TC-01: `OctorateCustomPageShell.tsx` Props type has `labels: OctorateCustomPageShellLabels`; 10 individual label props absent — confirmed by reading updated file.
- TC-02: `SecureBookingPageClient.tsx` Props type has `labels: OctorateCustomPageShellLabels`; 10 individual label props absent — confirmed by reading updated file.
- TC-03: `secure-booking/page.tsx` assembles and passes `labels` bag as single prop — confirmed by reading updated file.
- TC-04: Test COPY fixture uses `labels: { ... }` sub-object; all 5 test renders compile — `pnpm --filter brikette typecheck` passes.

## Scope Deviations

None. All 11 affected files were within the plan scope. The outer `BookPageSearchPanelProps` and `BookingPickerSection` parent interfaces were kept unchanged (only the internal BCP call was updated), consistent with the plan's non-goal of avoiding parent interface churn.
