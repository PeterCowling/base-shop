---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-11
Last-updated: 2026-03-11
Feature-Slug: brikette-booking-refactor-followup
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Trigger-Why: Three bounded code quality issues identified during /simplify whole-site review of apps/brikette/src/ — all internal refactors with no user-visible change.
Trigger-Intended-Outcome: type: operational | statement: Reduce duplication in brikette booking hooks and shared types, matching the labels-bag pattern already applied in the prior build cycle | source: operator
---

# Brikette Booking Refactor Follow-up Fact-Find

## Scope

### Summary

Three internal refactors identified during `/simplify` review of the brikette app:

1. **Hook deduplication**: `useAvailability` and `useAvailabilityForRoom` share ~90% identical debounce+AbortController+fetch logic, differing only in post-fetch filtering. Extract a shared internal utility to eliminate the duplication.

2. **BookPageSearchPanel label bag**: The `BookPageSearchPanel` component still exposes 5 flat string label props (`stayHelperText`, `clearDatesText`, `checkInLabelText`, `checkOutLabelText`, `guestsLabelText`) instead of a `labels` bag, inconsistent with `BookingCalendarPanel` and `OctorateCustomPageShell` which were migrated in the prior build cycle.

3. **QueryState shared type**: The `"valid" | "invalid" | "absent"` string union is defined inline at 11 locations across 7 files. A single shared type alias eliminates the drift risk.

### Goals
- Eliminate duplicated debounce+fetch logic between the two availability hooks
- Align `BookPageSearchPanel` outer props with the labels-bag pattern already established
- Give `QueryState` a canonical single-source definition

### Non-goals
- Changing the external behaviour or fetch endpoint of the availability hooks
- Merging `useAvailability` and `useAvailabilityForRoom` into one hook (different return shapes, different consumers)
- User-visible changes to any UI
- Modifying `DateRangePicker` flat props (lower-level component; separate concern)
- Changing `BookingPickerSection` in `RoomDetailBookingSections.tsx` (different outer interface; not a `BookPageSearchPanel` consumer)

### Constraints & Assumptions
- Constraints:
  - Tests run in CI only; no local `jest` runs. All validation via `pnpm typecheck && pnpm lint`.
  - The shared fetch utility (Refactor 1) must be tested — both hooks already have co-located unit test files that can cover the shared path indirectly, but a test for the new helper is preferable.
  - Refactors 2 and 3 both touch `BookPageContent.tsx` and `BookPageSections.tsx`; must be sequenced or carefully wave-dispatched to avoid conflict.
- Assumptions:
  - `useAvailabilityForRoom`'s `checkIn`/`checkOut` empty guard is intentional and must be preserved after extraction.
  - `BookPageSearchPanel` has only one external call site (confirmed: `BookPageContent.tsx`).
  - The 9 `QueryState` inline union occurrences are all semantically identical.

## Outcome Contract

- **Why:** Three bounded internal quality issues surfaced during a whole-site simplify review — duplicate debounce logic, inconsistent props pattern, and scattered inline type union. All are low-risk, no external dependencies.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Internal code consistency improved: shared availability fetch utility extracted, `BookPageSearchPanel` label props grouped into a bag, `QueryState` type centralised in one location.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

**Refactor 1 — Hook deduplication:**
- `apps/brikette/src/hooks/useAvailability.ts` — called by `RoomsPageContent.tsx`, `BookPageContent.tsx`, `HomeContent.tsx`
- `apps/brikette/src/hooks/useAvailabilityForRoom.ts` — called exclusively via `useRoomDetailBookingState.ts` (which is the only consumer)

**Refactor 2 — Label bag:**
- `apps/brikette/src/components/booking/BookPageSections.tsx` — component definition with 5 flat label props
- `apps/brikette/src/app/[lang]/book/BookPageContent.tsx:332` — sole call site

**Refactor 3 — QueryState type:**
- Entry: `useRoomDetailBookingState.ts` exports `queryState: QueryState` (local private type alias at line 14)
- Consumed: `BookPageContent.tsx`, `RoomsPageContent.tsx`, `RoomDetailBookingSections.tsx`, `RoomsSection.tsx`, `RoomCard.tsx`, `BookPageSections.tsx`

### Key Modules / Files

| File | Role | Refactor |
|---|---|---|
| `apps/brikette/src/hooks/useAvailability.ts` | Debounced hook, returns `rooms: OctorateRoom[]` | 1 |
| `apps/brikette/src/hooks/useAvailabilityForRoom.ts` | Same fetch + category aggregation, returns `availabilityRoom: OctorateRoom \| undefined` | 1 |
| `apps/brikette/src/components/booking/BookPageSections.tsx` | Contains `BookPageSearchPanel` + `BookPageRecoverySection` | 2, 3 |
| `apps/brikette/src/app/[lang]/book/BookPageContent.tsx` | Sole caller of `BookPageSearchPanel`; inline `QueryState` at lines 75, 151, and 258 (function return type, prop type, useMemo generic) | 2, 3 |
| `apps/brikette/src/hooks/useRoomDetailBookingState.ts` | Private `QueryState` alias at line 14; exports `queryState` | 3 |
| `apps/brikette/src/components/rooms/RoomsSection.tsx` | `queryState?: "valid" | "invalid" | "absent"` prop at line 40 | 3 |
| `apps/brikette/src/components/rooms/RoomCard.tsx` | `queryState?: "valid" | "invalid" | "absent"` prop at line 43 | 3 |
| `apps/brikette/src/components/rooms/detail/RoomDetailBookingSections.tsx` | Inline union at lines 72 and 124 | 3 |
| `apps/brikette/src/app/[lang]/dorms/RoomsPageContent.tsx` | Inline union at lines 73 and 131 | 3 |

### Data & Contracts

**Refactor 1 — Shared structure:**
```ts
// Shared internal shape (debounce + abort pattern):
// - useEffect with timerRef + abortRef
// - Same DEBOUNCE_MS = 300
// - Same fetch URL: /api/availability?checkin=&checkout=&pax=
// - Same .then()/.catch() error handling shape
// - Same cleanup function structure
// Difference: useAvailabilityForRoom adds:
//   - feature-flag guard: if (!OCTORATE_LIVE_AVAILABILITY) return EMPTY_STATE (pre-debounce)
//   - empty guard: if (!checkIn || !checkOut) return EMPTY_STATE (pre-debounce)
//   - post-fetch: aggregateAvailabilityByCategory(rooms, room.octorateRoomCategory)
// Note: URLSearchParams keys are identical in both hooks (checkin, checkout, pax).
//   The difference is only in hook argument variable names (checkIn/checkOut/adults vs checkin/checkout/pax).
```

**Proposed extraction**: A file-local or exported `useAvailabilityQuery(args): AvailabilityState` that handles debounce+fetch+cleanup and returns `{ rooms: OctorateRoom[], loading, error }`. Both hooks compose on top.

**Refactor 2 — Type to introduce:**
```ts
// In BookPageSections.tsx or a new bookingLabels.ts:
export type BookPageSearchPanelLabels = {
  stayHelper: string;
  clearDates: string;
  checkIn: string;
  checkOut: string;
  guests: string;
};
// Replace 5 flat props with: labels: BookPageSearchPanelLabels
// Call site change: BookPageContent.tsx passes labels={{ stayHelper: t(...), ... }}
```

**Refactor 3 — Type to introduce:**
```ts
// New file: apps/brikette/src/types/booking.ts (or apps/brikette/src/utils/bookingTypes.ts)
export type RoomQueryState = "valid" | "invalid" | "absent";
```
All 11 inline occurrences updated to import `RoomQueryState`.

### Dependency & Impact Map

**Refactor 1:**
- Upstream: nothing changes externally — both hooks keep their existing signatures and return types
- Downstream consumers of `useAvailability`: `RoomsPageContent`, `BookPageContent`, `HomeContent` — unaffected
- Downstream consumer of `useAvailabilityForRoom`: `useRoomDetailBookingState` → room detail pages — unaffected
- `OctorateRoom` type re-export: `useAvailability.ts` re-exports it; `useAvailabilityForRoom.ts` re-exports it. Both must continue to do so after extraction.

**Refactor 2:**
- `BookPageSearchPanel` outer interface changes: 5 flat string props → 1 `labels` object
- Only one external call site: `BookPageContent.tsx:332` — must be updated atomically
- Internal body of `BookPageSearchPanel` builds the `BookingCalendarPanelLabels` bag from the 5 inputs + 2 ARIA labels from `resolveBookingControlLabels` — internal assembly logic unchanged, just the source changes
- No test files directly test `BookPageSearchPanel` props in isolation

**Refactor 3:**
- Pure type alias: no runtime change anywhere
- Files requiring import update: `useRoomDetailBookingState.ts`, `BookPageContent.tsx`, `RoomsPageContent.tsx`, `RoomDetailBookingSections.tsx`, `RoomsSection.tsx`, `RoomCard.tsx`, `BookPageSections.tsx`
- TypeScript will enforce all 11 locations are updated (atomic)

### Security and Performance Boundaries

- Refactor 1: fetch URL and params unchanged; no new network paths or auth boundaries
- Refactor 2: no render path change; labels pass-through only
- Refactor 3: compile-time only; zero runtime impact

### Test Landscape

**Refactor 1:**
- `apps/brikette/src/hooks/useAvailability.test.ts` — 4 test scenarios covering: feature flag off, successful fetch, abort on unmount, error handling. Co-located.
- `apps/brikette/src/hooks/useAvailabilityForRoom.test.ts` — 7 test scenarios covering same cases + empty dates guard + category aggregation. Co-located.
- `apps/brikette/src/test/components/ga4-cta-click-header-hero-widget.test.tsx` — mocks `useAvailability` at module level
- `apps/brikette/src/test/components/room-detail-date-picker.test.tsx` — mocks `useAvailabilityForRoom` at module level
- After extraction: both existing test files cover shared behaviour indirectly. The new shared utility should have its own test or the existing tests amended to cover the shared path. The mocked tests are unaffected (mock at the exported hook level, not the internal utility).

**Refactor 2:**
- No direct unit test file for `BookPageSearchPanel`. The change is type-level and prop-reshaping only.
- `booking-calendar-panel.test.tsx` tests `BookingCalendarPanel` which receives the labels bag — not affected.
- TC coverage gap: no test asserts `BookPageSearchPanel` passes labels correctly. This is a pre-existing gap; this refactor doesn't worsen it.

**Refactor 3:**
- Pure type change — no test changes required. Existing tests that pass `"valid"`, `"invalid"`, or `"absent"` as string literals remain valid because TypeScript string literals are assignable to `RoomQueryState`.

### Recent Git History (Targeted)

- `HEAD` (2026-03-11): `refactor(brikette): deduplicate resolveTranslatedCopy and ISO_DATE_PATTERN, parallelize RSC translation loads` — prior simplify pass
- `e00740c` → prior: `brikette-booking-component-prop-sprawl` build — introduced `BookingCalendarPanelLabels` bag and `OctorateCustomPageShellLabels` bag, establishing the pattern this follow-up extends to `BookPageSearchPanel`.

## Scope Signal

**Signal: right-sized**

**Rationale:** All three refactors are bounded to the brikette app's booking subsystem with zero external dependencies. Refactor 1 touches 2 hook files + creates 1 utility. Refactor 2 touches 2 files. Refactor 3 touches 7 files but is compile-time only. No API, no schema, no deploy-gate risk. Total blast radius: ~10 files, all pure internal.

## Confidence Inputs

| Dimension | Score | Evidence |
|---|---|---|
| Implementation | 90 | All target files read; exact line-level changes identified for all three refactors. Shared hook utility extraction is a well-understood pattern; type centralisation is a rename+export. |
| Approach | 88 | Extraction approach for Refactor 1 (shared `useAvailabilityQuery`) is the minimal-change route that preserves both hook signatures. Bag approach for Refactor 2 mirrors the prior build exactly. Type alias for Refactor 3 is the canonical approach. |
| Impact | 95 | All changes are internal; no user-visible surface, no API boundary, no i18n keys affected. |
| Delivery-Readiness | 85 | Clear task decomposition; Refactors 2 and 3 must be sequenced (both touch `BookPageContent.tsx`/`BookPageSections.tsx`). Test coverage adequate for Refactors 2 and 3; Refactor 1 warrants one new test file. |
| Testability | 82 | Refactors 2 and 3: covered by typecheck. Refactor 1: existing hook tests cover behaviour; new utility test confirms shared path in isolation. |

What raises to ≥80 (build-eligible): Already met. Task sequencing is clear, file boundaries are confirmed, TypeScript will enforce atomicity.
What raises to ≥90: Confirmed test plan for shared availability utility test file.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Refactor 1 breaks `OctorateRoom` re-export | Low | Medium | Both hooks re-export `OctorateRoom`; verify re-exports are preserved after extraction |
| Refactor 1 changes debounce/abort semantics | Low | High | Extract is a direct copy of the shared pattern; diff carefully; existing tests validate behaviour |
| Refactor 3 misses an occurrence | Low | Low | TypeScript will fail to compile if any inline union is missed after the type is introduced (structural check) |
| Refactors 2+3 conflict on `BookPageContent.tsx` | Medium | Low | Sequential task ordering prevents merge conflict; wave dispatch would require conflict detection |
| `useAvailabilityForRoom` empty-check guard dropped | Low | Medium | Empty guard is specific to the room detail flow; explicitly preserve it in the composition wrapper |
| Feature-flag guard (`OCTORATE_LIVE_AVAILABILITY`) moved into shared utility | Low | Medium | Both pre-debounce guards (feature flag + empty dates) must stay in the hook wrapper, not the shared utility; shared utility covers debounce+fetch+cleanup only |

## Evidence Gap Review

### Gaps Addressed
- Confirmed `BookPageSearchPanel` has exactly one external call site (`BookPageContent.tsx:332`) — not two.
- Confirmed `BookingPickerSection` (room detail) is a different component with different outer props — not in scope.
- Confirmed `useAvailabilityForRoom` is called exclusively through `useRoomDetailBookingState`, not directly from any component.
- Confirmed `QueryState` union is semantically consistent across all 9 occurrences (all use exactly `"valid" | "invalid" | "absent"`).

### Confidence Adjustments
- Delivery-Readiness was adjusted to 85 (not 90) because the shared utility test file is new work (not update-only). This is low-effort but must be tracked.

### Remaining Assumptions
- `DEBOUNCE_MS = 300` is intentionally the same in both hooks. If the room-detail hook ever needs a different value, the shared utility would need a parameter. Current evidence shows identical values; assumption is safe.
- `pax` vs `adults` naming difference is external API (the hook interface), not the internal fetch param (both pass `pax` to the URLSearchParams). Confirmed by reading both hooks.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| useAvailability hook body | Yes | None | No |
| useAvailabilityForRoom hook body | Yes | None | No |
| Shared fetch utility extraction boundary | Yes | None — empty guard and `OctorateRoom` re-export noted | No |
| BookPageSearchPanel props and internal assembly | Yes | None | No |
| BookPageContent.tsx call site | Yes | None | No |
| QueryState union occurrences (all 9) | Yes | None | No |
| Test files for availability hooks | Yes | None — mocks target exported hooks, unaffected | No |
| File conflict risk (Refactors 2+3 on BookPageContent/BookPageSections) | Yes | Advisory: sequential ordering required | No — handled in task plan |

## Open Questions

All questions self-resolved from evidence:

- **Q: Does `BookPageSearchPanel` have other call sites?** Resolved: No. Only `BookPageContent.tsx:332`. Confirmed via grep.
- **Q: Does `RoomDetailContent.tsx` call `BookPageSearchPanel`?** Resolved: No — it calls `BookingPickerSection` (different component, different props, not in scope).
- **Q: Are all 11 `QueryState` unions semantically identical?** Resolved: Yes — each is `"valid" | "invalid" | "absent"` with no variation (11 occurrences across 7 files confirmed by grep).
- **Q: Does the shared utility need to be exported, or can it be file-local?** Resolved: File-local in a new `useAvailabilityQuery.ts` is sufficient; both consuming hooks import it. No external consumer needs it directly.
