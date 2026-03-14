---
Type: Pattern-Reflection
Feature-Slug: reception-roomgrid-gap-highlight
Completed: 2026-03-14
---

# Short Gap Highlighting — Pattern Reflection

## What worked well

**Data-layer injection pattern.** Adding a new status to `MyLocalStatus` and letting it flow through the existing `statusColors` → `theme["date.status"]` → `Day` rendering pipeline required zero changes to `ReservationGrid`, `Row`, or `RowCell`. The pattern is reusable for any future derived cell states (e.g. "maintenance window", "minimum stay violation").

**`getDayParams` special-case.** The existing `"disabled"` special-case provided a clear precedent for `"gap"`. The pattern: check status before checking position. This is the correct extension point for any status that needs to override the default start/middle/end shape logic.

**Codemoot critique caught real issues.** Round 1 found: (1) `getDayParams` would have produced wrong shapes without the special-case, (2) occupancy strip would have inflated without the `NON_OCCUPIED_STATUSES` fix, (3) entry-point path was wrong. All three were genuine bugs caught before implementation.

## What to watch

**Synthetic `TBookingPeriod` shape.** Gap periods carry placeholder values (`bookingRef: ""`, `occupantId: ""`). Any future code that iterates periods and uses `bookingRef`/`occupantId` without a `status !== "gap"` guard could behave unexpectedly. Convention: always guard period loops with `period.status !== "gap"` when processing booking-specific fields.

**`NON_OCCUPIED_STATUSES` is a static Set.** Adding any new non-booking status to `MyLocalStatus` in future requires checking `OccupancyStrip.tsx` explicitly — there is no compile-time enforcement. Consider a comment annotation on the Set as a reminder.

## Reusable patterns for future work

1. **New derived cell status**: add to `MyLocalStatus` union → add to `statusColors` → optionally add special-case in `getDayParams` → update `NON_OCCUPIED_STATUSES` → guard any loops that process booking fields.
2. **Critique on fact-finds**: run codemoot before planning to catch rendering pipeline assumptions early.
