---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-11
Last-reviewed: 2026-03-11
Last-updated: 2026-03-12
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-booking-refactor-followup
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 91%
Confidence-Method: min(Implementation,Approach,Impact) per task; overall = mean(task confidence × S-weight=1)
Auto-Build-Intent: plan+auto
Related-Analysis: None: no analysis phase — fact-find was decision-grade; all approach decisions resolved in fact-find
---

# Brikette Booking Refactor Follow-up Plan

## Summary

Three bounded internal refactors to the brikette booking subsystem, all with no user-visible change. Refactor 1 extracts a shared `useAvailabilityQuery` hook to eliminate near-identical debounce+fetch+cleanup logic duplicated across `useAvailability` and `useAvailabilityForRoom`. Refactor 2 collapses five flat label props on `BookPageSearchPanel` into a `labels` bag, matching the pattern already applied to `BookingCalendarPanel` and `OctorateCustomPageShell`. Refactor 3 centralises the `"valid" | "invalid" | "absent"` string union (11 inline occurrences across 7 files) into a single exported `RoomQueryState` type.

## Active tasks
- [x] TASK-01: Extract `useAvailabilityQuery` shared fetch hook
- [x] TASK-02: Migrate `BookPageSearchPanel` to labels bag
- [x] TASK-03: Centralise `RoomQueryState` shared type

## Goals
- Eliminate duplicated debounce+AbortController+fetch logic between the two availability hooks
- Align `BookPageSearchPanel` outer props with the labels-bag pattern already established
- Give `RoomQueryState` a canonical single-source definition

## Non-goals
- Changing the external behaviour or fetch endpoint of the availability hooks
- Merging `useAvailability` and `useAvailabilityForRoom` into one hook (different return shapes)
- Any user-visible UI change
- Modifying `DateRangePicker` flat props (lower-level component, separate concern)

## Constraints & Assumptions
- Constraints:
  - Tests run in CI only; validate locally with `pnpm --filter @apps/brikette typecheck && pnpm --filter @apps/brikette lint`.
  - TASK-02 and TASK-03 both modify `BookPageContent.tsx` and `BookPageSections.tsx` — must be sequenced (TASK-02 first, then TASK-03).
  - `useAvailabilityForRoom`'s two pre-debounce guards (feature flag + empty-dates) must stay in the hook wrapper, not in the shared utility.
  - Both hooks re-export `OctorateRoom` — re-exports must be preserved after extraction.
- Assumptions:
  - `DEBOUNCE_MS = 300` is intentionally identical in both hooks.
  - URL param keys (`checkin`, `checkout`, `pax`) are identical in both hooks — confirmed.
  - `BookPageSearchPanel` has exactly one external call site (`BookPageContent.tsx:332`) — confirmed by grep.
  - All 11 `RoomQueryState` inline unions are semantically identical — confirmed.

## Inherited Outcome Contract
- **Why:** Three bounded internal quality issues surfaced during a whole-site simplify review — duplicate debounce logic, inconsistent props pattern, and scattered inline type union. All are low-risk, no external dependencies.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Internal code consistency improved: shared availability fetch utility extracted, `BookPageSearchPanel` label props grouped into a bag, `RoomQueryState` type centralised in one location.
- **Source:** operator

## Analysis Reference
- Related analysis: None — plan proceeds directly from fact-find (decision-grade, all options self-resolved)
- Selected approach inherited:
  - Refactor 1: shared internal hook `useAvailabilityQuery({ checkin, checkout, pax, enabled })` with `enabled` flag to handle pre-debounce guards from both consumers
  - Refactor 2: `BookPageSearchPanelLabels` type with 5 fields; `labels` bag prop replaces 5 flat string props
  - Refactor 3: `export type RoomQueryState = "valid" | "invalid" | "absent"` in `apps/brikette/src/types/booking.ts`
- Key reasoning used:
  - Hook extraction via `enabled` param avoids conditional hook calls while preserving each hook's pre-debounce guard semantics
  - Bag pattern for Refactor 2 matches existing `BookingCalendarPanelLabels` precedent
  - New `types/booking.ts` fits the existing `src/types/` directory pattern

## Selected Approach Summary
- What was chosen: Extract, bag-migrate, and centralise — all minimal-change approaches that preserve existing external interfaces
- Why planning is not reopening option selection: Fact-find self-resolved all design questions with evidence; no operator-only forks remain

## Fact-Find Support
- Supporting brief: `docs/plans/brikette-booking-refactor-followup/fact-find.md`
- Evidence carried forward:
  - Both hooks confirmed at `DEBOUNCE_MS = 300` with identical fetch URL and `.then/.catch` shape
  - `BookPageSearchPanel` single call site at `BookPageContent.tsx:332` confirmed
  - 11 inline union occurrences across 7 files confirmed; TypeScript enforces all are updated

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Extract `useAvailabilityQuery` shared fetch hook | 88% | S | Complete (2026-03-12) | - | - |
| TASK-02 | IMPLEMENT | Migrate `BookPageSearchPanel` to labels bag | 90% | S | Complete (2026-03-12) | - | TASK-03 |
| TASK-03 | IMPLEMENT | Centralise `RoomQueryState` shared type | 95% | S | Complete (2026-03-12) | TASK-02 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Independent — TASK-01 touches only hooks; TASK-02 touches booking components |
| 2 | TASK-03 | TASK-02 complete | TASK-03 touches `BookPageContent.tsx` and `BookPageSections.tsx`; must follow TASK-02 to avoid edit conflicts |

## Tasks

---

### TASK-01: Extract `useAvailabilityQuery` shared fetch hook
- **Type:** IMPLEMENT
- **Deliverable:** New `apps/brikette/src/hooks/useAvailabilityQuery.ts`; updated `useAvailability.ts` and `useAvailabilityForRoom.ts`; new `useAvailabilityQuery.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Build evidence:** Commit `f0ffeedb45`. `useAvailabilityQuery.ts` created with `enabled` param; both hook wrappers simplified to compose the utility. `useAvailabilityQuery.test.ts` added (5 TCs: disabled, success, unmount-before-debounce, abort-on-unmount, non-ok error). `pnpm --filter @apps/brikette typecheck && pnpm --filter @apps/brikette lint` — both pass.
- **Affects:**
  - `apps/brikette/src/hooks/useAvailabilityQuery.ts` (new)
  - `apps/brikette/src/hooks/useAvailabilityQuery.test.ts` (new)
  - `apps/brikette/src/hooks/useAvailability.ts`
  - `apps/brikette/src/hooks/useAvailabilityForRoom.ts`
  - `[readonly] apps/brikette/src/hooks/useAvailability.test.ts`
  - `[readonly] apps/brikette/src/hooks/useAvailabilityForRoom.test.ts`
  - `[readonly] apps/brikette/src/test/components/ga4-cta-click-header-hero-widget.test.tsx`
  - `[readonly] apps/brikette/src/test/components/room-detail-date-picker.test.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 88%
  - Implementation: 90% — shared pattern is direct copy of identical sections; `enabled` flag cleanly handles pre-debounce guards
  - Approach: 88% — `enabled` param avoids conditional hook call constraint; both consumer hooks compose cleanly on top
  - Impact: 95% — zero external surface change; existing tests validate behaviour end-to-end
- **Acceptance:**
  - `useAvailabilityQuery.ts` exists with signature `useAvailabilityQuery({ checkin, checkout, pax, enabled }): { rooms: OctorateRoom[], loading: boolean, error: Error | null }`
  - `useAvailability.ts` no longer contains local `DEBOUNCE_MS`, `abortRef`, `timerRef`, or fetch logic — composes `useAvailabilityQuery` instead
  - `useAvailabilityForRoom.ts` no longer contains local `DEBOUNCE_MS`, `abortRef`, `timerRef`, or fetch logic — composes `useAvailabilityQuery` + `aggregateAvailabilityByCategory` instead
  - Both hooks still re-export `OctorateRoom`
  - `useAvailabilityForRoom`'s feature-flag guard (`!OCTORATE_LIVE_AVAILABILITY`) and empty-dates guard (`!checkIn || !checkOut`) remain in the hook wrapper (passed via `enabled`)
  - `pnpm --filter @apps/brikette typecheck && pnpm --filter @apps/brikette lint` pass
  - `useAvailabilityQuery.test.ts` exists and covers: disabled returns EMPTY_STATE; enabled fetches; aborts on unmount; debounces; handles fetch error
  - CI: after committing and pushing the task branch, run `gh run watch --exit-status` to tail the triggered CI run and confirm the brikette app test suite passes (tests run in CI only — do not run jest locally)
- **Validation contract:**
  - TC-01: `useAvailabilityQuery({ enabled: false, ... })` → returns `{ rooms: [], loading: false, error: null }` immediately, no fetch
  - TC-02: `useAvailabilityQuery({ enabled: true, checkin: "2026-04-01", checkout: "2026-04-03", pax: 2 })` → fetches `/api/availability?checkin=2026-04-01&checkout=2026-04-03&pax=2`, returns `{ rooms: [...], loading: false, error: null }`
  - TC-03: Unmount before debounce fires → no fetch, no setState call
  - TC-04: Unmount during in-flight fetch → `AbortController.abort()` called; no setState after unmount
  - TC-05: Fetch returns non-ok response → `{ rooms: [], loading: false, error: Error }` returned
  - TC-06: `useAvailability.test.ts` passes in CI — these tests import `useAvailability` directly and validate its external behaviour (return value shape, fetch calls, abort on unmount); the extraction does not change any exported API or return value, so all existing assertions remain valid
  - TC-07: `useAvailabilityForRoom.test.ts` passes in CI — same reasoning: tests validate external hook behaviour through direct import; extraction does not alter the hook's public interface, return shape, or guard semantics
- **Execution plan:**
  - Red: Create `useAvailabilityQuery.ts` with correct signature and stubbed `return EMPTY_STATE` body; update both hooks to import it (typecheck fails — hooks still have local logic creating duplicate declarations)
  - Green: Implement `useAvailabilityQuery` with `enabled` flag, `useEffect` debounce+fetch+cleanup pattern. Remove local debounce/abort/fetch logic from both hooks; replace with `useAvailabilityQuery` call. `useAvailability` passes `enabled = OCTORATE_LIVE_AVAILABILITY`. `useAvailabilityForRoom` passes `enabled = OCTORATE_LIVE_AVAILABILITY && !!checkIn && !!checkOut`, then pipes `rooms` through `aggregateAvailabilityByCategory`. Write `useAvailabilityQuery.test.ts`.
  - Refactor: Verify both re-exports of `OctorateRoom` are present. Confirm feature-flag/empty-date guards are only in hook wrappers. Run `pnpm --filter @apps/brikette typecheck && pnpm --filter @apps/brikette lint`.
- **Scouts:** Both hooks confirmed identical `DEBOUNCE_MS = 300` and fetch URL — safe to extract. `OctorateRoom` re-export confirmed in both; must be preserved explicitly.
- **Edge Cases & Hardening:**
  - `enabled` transitions from `true` to `false` mid-render: hook must cancel in-flight request and return EMPTY_STATE
  - `pax` passed as both `string` and `number` in `useAvailability` (arg type `string | number`) — `String(pax)` call must be preserved in utility
- **What would make this >=90%:** Confirmed that the `enabled: false` short-circuit returns EMPTY_STATE immediately without setting `loading: true` first (avoids flicker in consumers)
- **Rollout / rollback:**
  - Rollout: Single commit; no deploy step required (internal code change only)
  - Rollback: Revert commit; no data or config side-effects
- **Documentation impact:** None: internal hook only; no public API change
- **Notes / references:**
  - `useAvailability.ts` line 52: feature-flag guard; line 58: loading true; line 65: debounce start
  - `useAvailabilityForRoom.ts`: feature-flag guard + empty-dates guard both pre-debounce; both handled via `enabled` computation in the wrapper

---

### TASK-02: Migrate `BookPageSearchPanel` to labels bag
- **Type:** IMPLEMENT
- **Deliverable:** Updated `BookPageSections.tsx` (new `BookPageSearchPanelLabels` type + bag prop); updated `BookPageContent.tsx` call site
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Build evidence:** Commit `f0ffeedb45` (wave 1 shared commit). `BookPageSearchPanelLabels` type exported from `BookPageSections.tsx`; 5 flat props replaced with `labels: BookPageSearchPanelLabels`; `BookPageContent.tsx` call site updated atomically. TypeScript enforced atomic update — no other consumers exist.
- **Affects:**
  - `apps/brikette/src/components/booking/BookPageSections.tsx`
  - `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 92% — one definition file, one call site; pattern is an exact mirror of `BookingCalendarPanelLabels` migration
  - Approach: 90% — labels bag is the established pattern in the prior build cycle; no design decision required
  - Impact: 95% — no runtime change; pure prop reshaping; TypeScript enforces atomic update
- **Acceptance:**
  - `BookPageSearchPanelLabels` type exported from `BookPageSections.tsx` with fields: `stayHelper`, `clearDates`, `checkIn`, `checkOut`, `guests`
  - `BookPageSearchPanelProps` replaced 5 flat string props with `labels: BookPageSearchPanelLabels`
  - `BookPageContent.tsx:332` call site updated to pass `labels={{ stayHelper: t(...), clearDates: t(...), checkIn: t(...), checkOut: t(...), guests: t(...) }}`
  - Internal body of `BookPageSearchPanel` reads `labels.stayHelper`, `labels.clearDates`, etc. instead of the flat prop names
  - `pnpm --filter @apps/brikette typecheck && pnpm --filter @apps/brikette lint` pass
- **Validation contract:**
  - TC-01: `BookPageSearchPanel` component accepts `labels: BookPageSearchPanelLabels` and rejects the 5 flat props — TypeScript compile-time enforcement
  - TC-02: Call site `BookPageContent.tsx:332` builds labels bag inline and passes to panel — typecheck validates correct key names and types
  - TC-03: `pnpm --filter @apps/brikette typecheck` exits 0 with no errors in these files
- **Execution plan:**
  - Red: Remove 5 flat props from `BookPageSearchPanelProps`; add `labels: BookPageSearchPanelLabels`. TypeScript immediately reports errors at `BookPageContent.tsx:332` (flat props no longer accepted).
  - Green: Export `BookPageSearchPanelLabels` type. Update component destructuring to use `labels.stayHelper`, etc. Update `BookPageContent.tsx` call site to pass `labels={{ stayHelper: ..., ... }}`.
  - Refactor: Verify internal `BookingCalendarPanel.labels` assembly is still correct. Run `pnpm --filter @apps/brikette typecheck && pnpm --filter @apps/brikette lint`.
- **Scouts:**
  - Confirmed single call site at `BookPageContent.tsx:332` — no other tsx consumers
  - `BookingCalendarPanel` already uses a `labels` bag; this refactor makes `BookPageSearchPanel` consistent
  - Internal assembly at `BookPageSections.tsx:81-89` maps the 5 props to `BookingCalendarPanelLabels` — mapping logic unchanged; only the source changes
- **Edge Cases & Hardening:**
  - `selectDatesPromptText` and `showSelectDatesPrompt` remain as flat props (they are not label strings) — do not include them in the labels bag
- **What would make this >=95%:** Zero — confidence is limited by the single manual call site update; TypeScript enforces correctness
- **Rollout / rollback:**
  - Rollout: Single commit; no deploy step required
  - Rollback: Revert commit; no data or config side-effects
- **Documentation impact:** None: internal prop interface change; no public API
- **Notes / references:**
  - `BookPageSections.tsx:16-35` — current flat prop definitions to be replaced
  - `BookPageContent.tsx:342-346` — five call-site props to be replaced with `labels={{}}`
  - Pattern reference: `BookingCalendarPanelLabels` in `BookingCalendarPanel.tsx`

---

### TASK-03: Centralise `RoomQueryState` shared type
- **Type:** IMPLEMENT
- **Deliverable:** New `apps/brikette/src/types/booking.ts`; 11 inline union occurrences replaced with import across 7 files
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Build evidence:** Commit `4205d94a94`. `types/booking.ts` created with `RoomQueryState`. Private `QueryState` alias removed from `useRoomDetailBookingState.ts`. All 11 inline union occurrences replaced across 7 files. `grep -r '"valid" | "invalid" | "absent"' apps/brikette/src` returns only the canonical definition. `pnpm --filter @apps/brikette typecheck && pnpm --filter @apps/brikette lint` — both pass.
- **Affects:**
  - `apps/brikette/src/types/booking.ts` (new)
  - `apps/brikette/src/hooks/useRoomDetailBookingState.ts`
  - `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`
  - `apps/brikette/src/app/[lang]/dorms/RoomsPageContent.tsx`
  - `apps/brikette/src/components/rooms/detail/RoomDetailBookingSections.tsx`
  - `apps/brikette/src/components/rooms/RoomsSection.tsx`
  - `apps/brikette/src/components/rooms/RoomCard.tsx`
  - `apps/brikette/src/components/booking/BookPageSections.tsx`
- **Depends on:** TASK-02
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — pure type alias replacement; TypeScript enforces 100% coverage atomically
  - Approach: 95% — centralised type alias is the canonical and only viable approach
  - Impact: 99% — zero runtime impact; compile-time only
- **Acceptance:**
  - `apps/brikette/src/types/booking.ts` exists and exports `RoomQueryState = "valid" | "invalid" | "absent"`
  - No inline `"valid" | "invalid" | "absent"` string union remains in any of the 7 affected files (grep confirms 0 matches)
  - `useRoomDetailBookingState.ts` local private `type QueryState` removed; replaced with import of `RoomQueryState`
  - All 3 occurrences in `BookPageContent.tsx` (lines 75, 151, 258) replaced with `RoomQueryState`
  - `pnpm --filter @apps/brikette typecheck && pnpm --filter @apps/brikette lint` pass
- **Validation contract:**
  - TC-01: `grep -r '"valid" | "invalid" | "absent"' apps/brikette/src` returns 0 matches after the change
  - TC-02: `pnpm --filter @apps/brikette typecheck` exits 0 — TypeScript validates all 11 import replacements are correct
  - TC-03: All existing tests that pass `"valid"`, `"invalid"`, or `"absent"` as string literals remain valid (assignable to `RoomQueryState`)
- **Execution plan:**
  - Red: Create `apps/brikette/src/types/booking.ts` with `export type RoomQueryState`. Remove the private `type QueryState = "valid" | "invalid" | "absent"` from `useRoomDetailBookingState.ts` without replacing it — typecheck errors surface in all consumers of `QueryState`.
  - Green: Add `import type { RoomQueryState } from "@/types/booking"` to all 7 files. Replace all 11 inline union occurrences and the local `QueryState` alias with `RoomQueryState`.
  - Refactor: Run `pnpm --filter @apps/brikette typecheck && pnpm --filter @apps/brikette lint`. Run `grep` to confirm 0 inline union occurrences remain. Verify `useRoomDetailBookingState.ts` still exports `queryState` with the correct type shape.
- **Scouts:** All 11 occurrences confirmed semantically identical via grep. `types/booking.ts` doesn't exist yet — creating it follows the existing `src/types/` naming pattern.
- **Edge Cases & Hardening:**
  - `BookPageContent.tsx` has 3 occurrences (lines 75, 151, 258) — all must be replaced; grep validation confirms this
  - String literals `"valid"`, `"invalid"`, `"absent"` in existing tests and component usage remain valid (TypeScript structural compatibility)
- **What would make this >=99%:** Nothing — TypeScript provides compile-time atomicity guarantee
- **Rollout / rollback:**
  - Rollout: Single commit; no deploy step required
  - Rollback: Revert commit; no data or config side-effects
- **Documentation impact:** None: internal type alias; no public API
- **Notes / references:**
  - Target files: `useRoomDetailBookingState.ts`, `BookPageContent.tsx` (3 occurrences), `RoomsPageContent.tsx` (2), `RoomDetailBookingSections.tsx` (2), `RoomsSection.tsx`, `RoomCard.tsx`, `BookPageSections.tsx`
  - TASK-02 must complete first — both TASK-02 and TASK-03 edit `BookPageContent.tsx` and `BookPageSections.tsx`

---

## Risks & Mitigations
- Feature-flag guard (`OCTORATE_LIVE_AVAILABILITY`) moved into shared utility: Low likelihood / Medium impact — mitigation: utility accepts `enabled` param; guards stay in hook wrappers
- `OctorateRoom` re-export dropped from either hook after extraction: Low / Medium — mitigation: Acceptance criteria explicitly requires both re-exports
- Refactors 2+3 conflict on `BookPageContent.tsx`: Medium / Low — mitigation: Wave 2 enforces TASK-02 completes before TASK-03 starts
- TASK-03 misses an occurrence: Low / Low — mitigation: TypeScript compile failure + grep validation in Refactor step

## Observability
- Logging: None: internal refactors, no logging paths affected
- Metrics: None: no behaviour change
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [ ] `pnpm --filter @apps/brikette typecheck && pnpm --filter @apps/brikette lint` pass across all 3 tasks
- [ ] `grep -r '"valid" | "invalid" | "absent"' apps/brikette/src` returns 0 matches
- [ ] `useAvailabilityQuery.ts` and `useAvailabilityQuery.test.ts` exist
- [ ] `apps/brikette/src/types/booking.ts` exists and exports `RoomQueryState`
- [ ] `BookPageSearchPanel` accepts `labels: BookPageSearchPanelLabels` (no flat label props)
- [ ] Both availability hooks re-export `OctorateRoom`
- [ ] No user-visible UI change (pure internal refactors)

## Decision Log
- 2026-03-11: Chose `enabled` param on `useAvailabilityQuery` to handle both pre-debounce guards (feature flag + empty dates) without conditional hook calls
- 2026-03-11: Placed `RoomQueryState` in `apps/brikette/src/types/booking.ts` (new file) to match existing `src/types/` pattern
- 2026-03-11: Sequenced TASK-01 and TASK-02 in Wave 1 (independent); TASK-03 in Wave 2 (sequential after TASK-02 to avoid BookPageContent.tsx conflict)

## Overall-confidence Calculation
- TASK-01: 88%, S-effort (weight 1)
- TASK-02: 90%, S-effort (weight 1)
- TASK-03: 95%, S-effort (weight 1)
- Overall-confidence = (88 + 90 + 95) / 3 = **91%**

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Extract useAvailabilityQuery | Yes — both source files read, pattern confirmed | Advisory: `enabled=false` must skip setting `loading: true` to avoid flicker. Note in Acceptance. | No — noted in Edge Cases |
| TASK-02: Migrate BookPageSearchPanel labels bag | Yes — definition file and sole call site read, field names confirmed | None | No |
| TASK-03: Centralise RoomQueryState | Partial — TASK-02 must complete first (sequential edit conflict on BookPageContent.tsx and BookPageSections.tsx) | None beyond the sequencing dependency | No — captured in dependency |
