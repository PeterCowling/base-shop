---
Type: Build-Record
Plan: brikette-booking-refactor-followup
Build-date: 2026-03-12
Status: Complete
---

# Build Record — Brikette Booking Refactor Follow-up

## Outcome Contract
- **Why:** Three bounded internal quality issues surfaced during a whole-site simplify review — duplicate debounce logic, inconsistent props pattern, and scattered inline type union. All are low-risk, no external dependencies.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Internal code consistency improved: shared availability fetch utility extracted, `BookPageSearchPanel` label props grouped into a bag, `RoomQueryState` type centralised in one location.
- **Source:** operator

## Build Summary

Three internal refactors to the brikette booking subsystem, delivered in two waves. No user-visible change.

### Wave 1 — TASK-01 + TASK-02 (commit `f0ffeedb45`)

**TASK-01: Extract `useAvailabilityQuery` shared fetch hook**
- Created `apps/brikette/src/hooks/useAvailabilityQuery.ts` with `enabled` param handling both pre-debounce guards (feature flag + empty dates). Hook encapsulates debounce, AbortController, fetch, and cleanup — ~70 lines of near-identical logic removed from the two consuming hooks.
- `useAvailability.ts` simplified to a one-call delegate: `enabled = OCTORATE_LIVE_AVAILABILITY`.
- `useAvailabilityForRoom.ts` simplified: computes `enabled = OCTORATE_LIVE_AVAILABILITY && !!checkIn && !!checkOut`, delegates fetch, applies `aggregateAvailabilityByCategory` on result. All guards and re-exports preserved.
- Created `useAvailabilityQuery.test.ts` with 5 TCs: disabled returns EMPTY_STATE; enabled fetches successfully; unmount before debounce fires (no fetch); abort on unmount during fetch; non-ok response returns error state.

**TASK-02: Migrate `BookPageSearchPanel` to labels bag**
- Exported `BookPageSearchPanelLabels` type from `BookPageSections.tsx` (fields: `stayHelper`, `clearDates`, `checkIn`, `checkOut`, `guests`).
- Replaced 5 flat string props with `labels: BookPageSearchPanelLabels` in component definition.
- Updated sole call site in `BookPageContent.tsx` atomically. TypeScript enforced no other consumers exist.

### Wave 2 — TASK-03 (commit `4205d94a94`)

**TASK-03: Centralise `RoomQueryState` shared type**
- Created `apps/brikette/src/types/booking.ts` exporting `RoomQueryState = "valid" | "invalid" | "absent"`.
- Removed private `type QueryState` from `useRoomDetailBookingState.ts`.
- Replaced all 11 inline union occurrences across 7 files with `import type { RoomQueryState } from "@/types/booking"`.
- Grep confirms zero inline unions remain outside the canonical definition.

## Validation Evidence
- `pnpm --filter @apps/brikette typecheck` — passes (all 3 tasks, confirmed before each commit)
- `pnpm --filter @apps/brikette lint` — passes (all 3 tasks, import sort auto-fixed in Wave 1)
- `grep -r '"valid" | "invalid" | "absent"' apps/brikette/src` — returns only `types/booking.ts` (canonical definition)
- CI test validation: `gh run watch --exit-status` after push to verify new `useAvailabilityQuery.test.ts` suite passes (tests run in CI only)

## Files Changed
- NEW: `apps/brikette/src/hooks/useAvailabilityQuery.ts`
- NEW: `apps/brikette/src/hooks/useAvailabilityQuery.test.ts`
- NEW: `apps/brikette/src/types/booking.ts`
- UPDATED: `apps/brikette/src/hooks/useAvailability.ts`
- UPDATED: `apps/brikette/src/hooks/useAvailabilityForRoom.ts`
- UPDATED: `apps/brikette/src/components/booking/BookPageSections.tsx`
- UPDATED: `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`
- UPDATED: `apps/brikette/src/hooks/useRoomDetailBookingState.ts`
- UPDATED: `apps/brikette/src/app/[lang]/dorms/RoomsPageContent.tsx`
- UPDATED: `apps/brikette/src/components/rooms/detail/RoomDetailBookingSections.tsx`
- UPDATED: `apps/brikette/src/components/rooms/RoomsSection.tsx`
- UPDATED: `apps/brikette/src/components/rooms/RoomCard.tsx`
