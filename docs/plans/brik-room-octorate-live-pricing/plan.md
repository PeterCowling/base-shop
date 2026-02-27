---
Type: Plan
Status: Active
Domain: PRODUCTS
Workstream: Engineering
Created: 2026-02-27
Last-reviewed: 2026-02-27
Last-updated: 2026-02-27
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brik-room-octorate-live-pricing
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# BRIK Room Pages — Live Pricing and Availability Plan

## Summary

Room detail pages (`/rooms/[id]`) currently show a static "price from" figure sourced from a stale `rates.json` snapshot (data ends 2025-10-30) and have no date/guest picker — guests see stale or fallback prices and must navigate to Octorate blind. This plan adds a date range + guest count picker to `RoomDetailContent`, a per-room availability hook (`useAvailabilityForRoom`) that proxies the Octorate ARI API, live NR and sold-out display on the `RoomCard` buttons, and a stop-gap `rates.json` refresh. It depends on the API proxy route (`TASK-01`) and credentials provisioning (`TASK-05`) from the `brik-octorate-live-availability` plan. The feature flag `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` gates the live path with a graceful `basePrice` fallback.

## Active tasks
- [x] TASK-RATES-REFRESH: Refresh `rates.json` stop-gap — **Blocked** (no Octorate credentials; depends on brik-octorate-live-availability TASK-05)
- [ ] TASK-DP: Date picker + pax selector in `RoomDetailContent`
- [ ] TASK-CP2: Horizon checkpoint — reassess TASK-RPC/RPR/RD-TEST after API contract confirmed
- [ ] TASK-RPC: `useAvailabilityForRoom` hook
- [ ] TASK-RPR: `RoomCard` — live NR price and sold-out display for room detail page
- [ ] TASK-RD-TEST: Tests — date picker, hook, RoomCard display

## Goals
- Add a date range picker and guest count selector to each room detail page.
- Show live NR pricing for the selected dates on the NR booking button.
- Show sold-out state when the room is unavailable for the selected dates.
- Refresh the stale `rates.json` immediately as a stop-gap, independent of the live API work.
- Preserve `buildOctorateUrl.ts` deep links and the existing NR/flex two-button pattern.
- Gate all live API paths behind `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY`; fallback to `basePrice` when flag is off.

## Non-goals
- Replacing Octorate's payment/booking completion step.
- Apartment booking page — different flow, WhatsApp fallback, `widgetRoomCode = "TODO"`.
- OTA rate codes or channel visibility.
- Book page (`BookPageContent.tsx`) — covered by the `brik-octorate-live-availability` plan.
- Flex price per night (MVP: flex button shows policy label "check flexible rates"; price enrichment deferred).
- Multi-room availability comparison.

## Constraints & Assumptions
- Constraints:
  - TASK-01 (API proxy route) and TASK-05 (credentials) from `brik-octorate-live-availability` must be complete before live API tasks can execute. This plan gates TASK-RPC on TASK-01 via the cross-plan dependency note.
  - Feature flag `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` is a build-time-inlined env var. Toggling requires a rebuild.
  - API routes only exist in the production Worker path; staging (static export) has no API routes. Feature flag defaults to off on staging.
  - `buildOctorateUrl.ts` is preserved as-is.
  - `bookingDateRules.ts` constants (`HOSTEL_MIN_STAY_NIGHTS = 2`, `HOSTEL_MAX_STAY_NIGHTS = 8`, `HOSTEL_MIN_PAX = 1`, `HOSTEL_MAX_PAX = 8`) must be enforced by the date picker.
  - Pax selector must also be bounded by `room.occupancy` (varies per room: 2–8).
  - When feature flag is off: date picker renders; price display shows `basePrice` from `roomsData.ts` with a "from" label — not stale `rates.json` entries for user-selected dates.
  - Do not define the `/api/availability` response contract in this plan — it is owned by `brik-octorate-live-availability` TASK-01. This plan's tasks must reference that contract verbatim once TASK-01 is complete.
- Assumptions:
  - `rates.json` stop-gap refresh is a manual operation (export from Octorate data); no automation script exists. TASK-RATES-REFRESH documents the approach.
  - `parseBookingQuery` in `RoomDetailContent.tsx` currently produces only `"valid"` or `"absent"`. Once the date picker is added, `"invalid"` becomes reachable (user enters checkout before checkin, stay < 2 nights, etc.). `RoomCard.tsx` already handles `"invalid"` via `datePickerRef` scroll-to behavior.
  - Date picker defaults to today + 2 nights, producing `queryState === "valid"` on first render so prices and CTAs are visible immediately.
  - `ApartmentBookContent.tsx` native `<input type="date">` pattern is the reference UI — no new UI package dependency needed.
  - The `/api/availability` route (once built by TASK-01) accepts `?roomCode=<rate_code>&checkin=YYYY-MM-DD&checkout=YYYY-MM-DD&pax=N` and returns a per-room response. Exact contract is defined by TASK-01.

## Inherited Outcome Contract

- **Why:** Guests on room detail pages leave with no visibility of pricing for their dates. The information gap before the booking decision point — no date selector, no live price, no rate choice — creates unqualified handoffs to Octorate where guests encounter sticker shock or sold-out rooms.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Guests on room detail pages can select a date range and guest count, see the NR price for those dates, and click through to Octorate already knowing which rate they selected and what they will pay. Measured by: `select_item` event rate on room detail pages and begin_checkout completion rate post-launch vs pre-launch baseline.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/brik-room-octorate-live-pricing/fact-find.md`
- Key findings used:
  - `rates.json` is stale since 2025-10-30 (4 months). Any "price from" shown today is stale or a `basePrice` hardcoded fallback.
  - No date picker UI exists on room detail pages. `RoomDetailContent.tsx` reads dates from URL params only.
  - `RoomCard.tsx` already has the NR/flex two-button pattern and handles `"invalid"` `queryState` via `datePickerRef`.
  - `parseBookingQuery` only produces `"valid"` or `"absent"`. The `"invalid"` state requires an on-page picker.
  - API proxy route must be reused from `brik-octorate-live-availability` TASK-01, not duplicated.
  - Feature-flag-off display: `basePrice` from `roomsData.ts` with "from" label — not stale `rates.json` for user-selected dates.
  - `ApartmentBookContent.tsx` (native date inputs + pax buttons) is the reference UI pattern.

## Proposed Approach

- **Option A: Append tasks to `brik-octorate-live-availability` plan** — Keeps all Octorate-related tasks in one plan; avoids cross-plan dependency tracking. Risk: the prior plan is already Active with its own task set focused on the book page. Mixing room-detail tasks into it would increase the plan's scope and complicate checkpoint gating.
- **Option B: Separate sister plan** (chosen) — This plan (`brik-room-octorate-live-pricing`) owns room detail page tasks. It explicitly documents cross-plan dependencies on TASK-01 and TASK-05 from `brik-octorate-live-availability`. Benefits: cleaner scope, independent sequencing, simpler progress tracking. The shared API route is a dependency, not a coupling — this plan's tasks cannot proceed until TASK-01 is merged, which is tracked here as a blocking note.

- **Chosen approach:** Option B (separate sister plan). The prior plan's book-page tasks and this plan's room-detail tasks share the API proxy but serve different surfaces. Keeping them separate enables independent progress tracking and avoids complicating the `brik-octorate-live-availability` TASK-CP checkpoint logic.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-RATES-REFRESH | IMPLEMENT | Refresh `rates.json` stop-gap | 90% | S | Blocked | (external) brik-octorate-live-availability TASK-05 | - |
| TASK-DP | IMPLEMENT | Date picker + pax selector in `RoomDetailContent` | 85% | M | Pending | - | TASK-RPC, TASK-RPR |
| TASK-CP2 | CHECKPOINT | Horizon checkpoint — reassess after API contract confirmed | 95% | S | Pending | TASK-DP, (external) brik-octorate-live-availability TASK-01 | TASK-RPC |
| TASK-RPC | IMPLEMENT | `useAvailabilityForRoom` hook | 80% | M | Pending | TASK-CP2 | TASK-RPR, TASK-RD-TEST |
| TASK-RPR | IMPLEMENT | `RoomCard` — live NR price and sold-out display | 80% | M | Pending | TASK-DP, TASK-RPC | TASK-RD-TEST |
| TASK-RD-TEST | IMPLEMENT | Tests — date picker, hook, RoomCard display | 82% | M | Pending | TASK-DP, TASK-RPC, TASK-RPR | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-RATES-REFRESH | (external) brik-octorate-live-availability TASK-05 | Blocked: no Octorate export script exists; no credentials available. Requires TASK-05 credentials to do a scripted API pull. |
| 1 | TASK-DP | - | UI only. No live API dependency. Writes dates to URL params, defaults today+2 nights. |
| 2 | TASK-CP2 | TASK-DP + external TASK-01 (prior plan) | Checkpoint fires once date picker ships AND API proxy route from prior plan is confirmed. |
| 3 | TASK-RPC | TASK-CP2 | Hook wraps the `/api/availability` route. Depends on TASK-01 confirming the response contract. |
| 4 | TASK-RPR | TASK-DP, TASK-RPC | RoomCard display. Depends on hook existing (TASK-RPC) and date picker writing dates (TASK-DP). |
| 4 | TASK-RD-TEST | TASK-DP, TASK-RPC, TASK-RPR | Tests for all new surfaces. Can start once each surface lands. |

## Tasks

---

### TASK-RATES-REFRESH: Refresh `rates.json` stop-gap
- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/brikette/public/data/rates.json` with current data extending to at least 2026-12-31.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Blocked — awaiting external brik-octorate-live-availability TASK-05 (Octorate credentials)
- **Affects:** `apps/brikette/public/data/rates.json`
- **Depends on:** (external) brik-octorate-live-availability TASK-05
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — File structure confirmed (keyed by rate code, `DailyRate[]` per entry). The refresh is a data operation, not a code change.
  - Approach: 90% — Export data from Octorate or regenerate from the same source that produced the original file. Structure is understood; no generation script found in repo (approach is manual export + file replacement).
  - Impact: 85% — Stale data is actively shown to users today. Refreshing it immediately improves the "price from" display for all rooms and is independent of the live API work.
- **Acceptance:**
  - `apps/brikette/public/data/rates.json` contains entries extending at least to 2026-12-31.
  - File structure is unchanged: `Record<string, DailyRate[]>` keyed by rate code, where `DailyRate = { date: string; nr: number; flex?: number }`.
  - `pnpm typecheck --filter brikette` passes after update.
  - All locale-accessible rate codes from `roomsData.ts` (`rateCodes.direct.nr`) appear in the file.
- **Validation contract (TC-XX):**
  - TC-RR-01: `rates.json` has at least one entry for a date in 2026 for each room's `rateCodes.direct.nr` code.
  - TC-RR-02: File size is reasonable (current ~730 kB; new file should be in the same order of magnitude).
  - TC-RR-03: Existing tests referencing `rates.json` data still pass.
- **Execution plan:** Red -> Green -> Refactor
  - Red: Not applicable — data-file replacement; no failing test exists for this step. Begin at Green.
  - Green: Export updated `rates.json` from Octorate data source. Replace `apps/brikette/public/data/rates.json`. Verify rate codes match `roomsData.ts` entries. Verify date range extends to 2026-12-31 or beyond.
  - Refactor: Document the refresh approach in a comment block at the top of the rates file or in a companion `rates.json.README.md` so the process is repeatable.
- **Planning validation (required for M/L):** None: S effort task.
- **Scouts:** Confirm no generation script exists: `find apps/brikette -name "*rates*" -not -path "*/node_modules/*"`. If one exists, use it. If absent, confirm whether Octorate operator portal has a data export — if no export mechanism is found, TASK-RATES-REFRESH requires a scripted API pull using TASK-05 credentials; document this dependency explicitly and block TASK-RATES-REFRESH on TASK-05 if that path is required.
- **Edge Cases & Hardening:**
  - If a room's rate code is missing from the exported data, fall back to `basePrice` in `useRoomPricing` — this is already the existing behavior.
  - Do not remove the `flex` field from existing entries even if the export only provides `nr` prices.
- **What would make this >=90%:** Already at 90%. Rate code coverage for all 10 in-scope rooms confirmed.
- **Rollout / rollback:**
  - Rollout: Static file replacement. Deployed at next build. No code change.
  - Rollback: Restore prior `rates.json` from git history.
- **Documentation impact:** None (optional companion README if manual refresh approach needs documenting).
- **Notes / references:**
  - `apps/brikette/public/data/rates.json`: last updated 2025-12-22 (`18959d44a5`), data ends 2025-10-30. 730KB. 41 numeric rate codes.
  - `apps/brikette/src/types/rates.ts`: `RateCalendar = Record<string, DailyRate[]>`. Each entry also carries a `currency` field not in the type — ignored by consumers.
  - `apps/brikette/src/data/rates/latest.json`: separate file using a different `RatesData` row-based schema (`{ currency, horizonStart, horizonEnd, rows: RateRow[] }`). Only consumer is `src/lib/rates.ts` → `findNightlyPrices()`. **No callers of `findNightlyPrices` exist anywhere in the codebase** — this path is dead code. Out of scope for this refresh.
  - **Scout result:** No generation script found. No Octorate operator export path confirmed. Refresh requires scripted API pull using TASK-05 credentials. **Task is blocked on TASK-05 from brik-octorate-live-availability.**

---

### TASK-DP: Date picker + pax selector in `RoomDetailContent`
- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx` with an on-page date range picker and guest count selector.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx`, `apps/brikette/src/locales/*/roomsPage.json`
- **Depends on:** -
- **Blocks:** TASK-RPC, TASK-RPR
- **Confidence:** 85%
  - Implementation: 85% — `ApartmentBookContent.tsx` provides the exact UI pattern (native `<input type="date">` + pax buttons). URL param write-back via `useRouter` + `useSearchParams` is standard Next.js App Router. The `parseBookingQuery` function already exists and handles the query param format.
  - Approach: 85% — Date state managed as React state in `RoomDetailContent`; written back to URL via `router.replace` on change so the URL stays shareable and `parseBookingQuery` continues to work on refresh.
  - Impact: 85% — Date picker is the prerequisite UI for showing live prices and enabling `queryState === "invalid"` handling. Without it, live pricing is not usable.
- **Acceptance:**
  - Check-in and check-out `<input type="date">` fields render above `RoomCard` in `RoomDetailContent`.
  - Pax selector (numeric, bounded by `HOSTEL_MIN_PAX`, `HOSTEL_MAX_PAX`, and `room.occupancy`) renders next to the date fields.
  - Default state: React state initializes to today (check-in), today + 2 nights (check-out), 1 adult. On the first render (before the URL param write fires), `queryState` may briefly be `"absent"` (URL params are empty on fresh page load). After the initial `router.replace` call populates the URL params, `parseBookingQuery` produces `queryState === "valid"`. This one-render transition is acceptable; the sold-out or error state must not be shown during it.
  - Changing check-in/check-out/pax writes the updated values to URL search params via `router.replace` (non-navigation update).
  - `parseBookingQuery` continues to control what is passed to `RoomCard` — the date picker populates the URL, `parseBookingQuery` reads it.
  - When dates produce an invalid stay (checkout before checkin, stay < 2 nights or > 8 nights), `queryState` becomes `"invalid"` and `RoomCard`'s `datePickerRef` scroll-to fires.
  - `datePickerRef` is wired from `RoomDetailContent` to both the picker container element and the `RoomCard` prop.
  - i18n keys `selectDatesTitle`, `checkInDate`, `checkOutDate`, `adults` (already present in `roomsPage.json`) are used for picker labels.
  - No new i18n keys required for the picker UI itself (existing keys cover it).
  - Feature flag is not involved in this task — the date picker ships unconditionally.
  - No TypeScript errors. No `describe.skip` blocks.
- **Validation contract (TC-XX):**
  - TC-DP-01: Page load with no URL params → date picker shows today + 2 nights, pax = 1, `queryState === "valid"` passed to `RoomCard`.
  - TC-DP-02: User changes check-in to tomorrow → URL updates with `checkin=<new>`, `parseBookingQuery` re-runs, `RoomCard` receives updated dates.
  - TC-DP-03: User sets checkout to same day as checkin → `queryState === "invalid"`, `RoomCard` disables CTAs, `datePickerRef` scroll-to fires.
  - TC-DP-04: Pax exceeds `room.occupancy` → selector is bounded; user cannot select above the room's max occupancy.
  - TC-DP-05: Pax exceeds `HOSTEL_MAX_PAX` → selector is bounded at 8 regardless of room occupancy.
  - TC-DP-06: Existing `StickyBookNow` behavior is unchanged (it continues to read from URL params).
  - TC-DP-07: `router.replace` is called on date/pax change (not `router.push` — avoids building history).
- **Execution plan:** Red -> Green -> Refactor
  - Red: Add `useRouter` import and date/pax state to `RoomDetailContent`. Add placeholder `<div>` for picker (no inputs yet). Confirm no existing tests break.
  - Green: Add check-in `<input type="date">`, check-out `<input type="date">`, pax selector buttons. Wire `onChange` handlers to update state and call `router.replace` with updated search params. Add `datePickerRef` binding. Validate against `bookingDateRules` constants on change. TC-DP-01 through TC-DP-07 pass.
  - Refactor: Extract picker block to a named `BookingDatePicker` sub-component within the same file if it exceeds ~60 lines. Ensure accessibility: labels linked to inputs via `htmlFor`/`id`.
- **Planning validation (required for M/L):**
  - Checks run:
    - `RoomDetailContent.tsx` imports confirmed: `useSearchParams`, `getDatePlusTwoDays`, `getTodayIso`, `parseBookingQuery` (lines 28, 202–218, 246–249). Adding `useRouter` from `next/navigation` is the new import.
    - `RoomCard` already accepts `datePickerRef?: RefObject<HTMLElement | null>` (confirmed at `RoomCard.tsx` line 41 — not `HTMLDivElement`; use `useRef<HTMLElement>(null)` or `useRef<HTMLDivElement>(null)` cast to `HTMLElement` to satisfy the prop type).
    - `bookingDateRules.ts` exports confirmed: `HOSTEL_MIN_STAY_NIGHTS = 2`, `HOSTEL_MAX_STAY_NIGHTS = 8`, `HOSTEL_MIN_PAX = 1`, `HOSTEL_MAX_PAX = 8`, `isValidStayRange`, `isValidPax`.
    - `roomsPage.json` EN: `selectDatesTitle`, `checkInDate`, `checkOutDate`, `adults` keys confirmed present (lines 294–297 from grep).
    - `ApartmentBookContent.tsx` pattern: `useState` for checkin/checkout/pax, native `<input type="date">`, `setCheckin`/`setCheckout` on change. No router write-back (apartment uses its own state; room detail uses URL param write-back to stay shareable).
  - Validation artifacts: `RoomDetailContent.tsx` lines 200–249 (existing parsing logic), `bookingDateRules.ts` constants, `roomsPage.json` key list.
  - Unexpected findings: `parseBookingQuery` currently forces `queryState` to only `"valid"` or `"absent"` (line 213). To support `"invalid"`, the return type and logic must be extended: `"invalid"` when the date range is present but fails `isValidStayRange`. This is a minor extension of the existing function.
- **Consumer tracing:**
  - New state (`checkin`, `checkout`, `adults`) written to URL via `router.replace` — consumed by `parseBookingQuery` (same component, re-run on param change via `useSearchParams`). No other consumers of these URL params in `RoomDetailContent`.
  - `datePickerRef` passed to `RoomCard` — `RoomCard` already has the `datePickerRef` prop; this wires it to the actual DOM element.
  - `StickyBookNow` reads URL params after mount — URL params are now always present (defaults populated on load), so `StickyBookNow` deep link will always have dates populated. This is an improvement over the current state where params are absent until the user arrives from a different page.
  - `parseBookingQuery` return type gains `"invalid"` — `RoomCard` already handles `"invalid"` via the `datePickerRef` scroll-to. No changes needed downstream.
- **Scouts:** Confirm `RoomCard` `datePickerRef` prop signature before implementing. If the prop does not exist, add it in this task.
- **Edge Cases & Hardening:**
  - If `room.occupancy` is undefined or zero (should not happen for in-scope rooms), default pax max to `HOSTEL_MAX_PAX`.
  - Check-in input: `min` attribute = `getTodayIso()` (prevent past dates).
  - Check-out input: `min` attribute = `getMinCheckoutForStay(checkin)` (at least 2 nights after check-in).
  - Rapid date changes: URL writes via `router.replace` are not debounced (each keystroke is fine; debounce is only needed for API calls in TASK-RPC).
- **What would make this >=90%:** TASK-CP2 confirms date/pax state is passed correctly to the hook; all TC-DP-XX tests pass.
- **Rollout / rollback:**
  - Rollout: UI change only. No feature flag. Ships as soon as TASK-DP is merged.
  - Rollback: Revert `RoomDetailContent.tsx` to remove picker UI.
- **Documentation impact:** None (i18n keys already present).
- **Notes / references:**
  - `ApartmentBookContent.tsx` lines 64–66 and 168–189: reference UI pattern for native date inputs and pax buttons.
  - `RoomDetailContent.tsx` line 303: `<RoomCard room={room} checkIn={checkIn} checkOut={checkOut} adults={adults} lang={lang} queryState={queryState} />` — the `datePickerRef` prop must be added here.

---

### TASK-CP2: Horizon checkpoint — reassess after API contract confirmed
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via `/lp-do-replan` for TASK-RPC, TASK-RPR, TASK-RD-TEST.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/brik-room-octorate-live-pricing/plan.md`
- **Depends on:** TASK-DP; external dependency: `brik-octorate-live-availability` TASK-01 (API route complete and response contract specified)
- **Blocks:** TASK-RPC
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — prevents dead-end implementation if TASK-01's response schema differs from assumed
  - Impact: 95% — controls downstream risk from unconfirmed API contract
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run.
  - `/lp-do-replan` run on TASK-RPC, TASK-RPR, TASK-RD-TEST with TASK-01 response type confirmed.
  - Confidence for consumer tasks recalibrated from TASK-01 findings.
  - Plan updated and re-sequenced if needed.
- **Horizon assumptions to validate:**
  - `/api/availability` response type (exported from `brik-octorate-live-availability` route file) is compatible with a per-room query for room detail pages.
  - The route accepts a `roomCode` (or equivalent) query param to filter results to a single room.
  - The `nrPrice` field (or equivalent) from TASK-01 response maps to what `useAvailabilityForRoom` returns to `RoomCard`.
  - i18n keys needed by TASK-RPR are confirmed (new states vs. reuse of existing `rooms.soldOut` / `loadingPrice`).
- **Validation contract:** Replan run; `plan.md` updated with calibrated confidence on TASK-RPC, TASK-RPR, TASK-RD-TEST.
- **Planning validation:** None: planning control task.
- **Rollout / rollback:** None: planning control task.
- **Documentation impact:** `plan.md` updated.
- **Notes / references:**
  - External dependency: `brik-octorate-live-availability` plan TASK-01 must be merged and its `AvailabilityRouteResponse` type exported before this checkpoint can execute.

---

### TASK-RPC: `useAvailabilityForRoom` hook
- **Type:** IMPLEMENT
- **Deliverable:** New `apps/brikette/src/hooks/useAvailabilityForRoom.ts`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/brikette/src/hooks/useAvailabilityForRoom.ts` (new)
- **Depends on:** TASK-CP2
- **Blocks:** TASK-RPR, TASK-RD-TEST
- **Confidence:** 80%
  - Implementation: 80% — Hook pattern mirrors `useAvailability` from the sibling plan. Debounce pattern established. The primary risk is the API response shape from TASK-01 (closed by TASK-CP2 before this task runs).
  - Approach: 80% — Hook calls `/api/availability` with a single room's rate code, checkin, checkout, pax. Returns `{ nrPrice?: number; available: boolean; loading: boolean; error?: string }`. Debounced 400ms. AbortController for cleanup.
  - Impact: 80% — Without this hook, TASK-RPR cannot display live prices. Hook must handle loading, error, and sold-out states gracefully.
  - Held-back test for Implementation@80: response contract from TASK-01 not yet confirmed (TASK-CP2 closes this).
- **Acceptance:**
  - `useAvailabilityForRoom({ room, checkIn, checkOut, adults })` returns `{ nrPrice?: number; available: boolean; loading: boolean; error?: string }`.
  - When `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` is off: returns `{ available: true, loading: false }` immediately without fetching.
  - When dates are invalid: returns `{ available: true, loading: false }` without fetching.
  - Debounces API calls 400ms on input change.
  - AbortController cancels in-flight requests on unmount or re-trigger.
  - Response type uses the type exported from `brik-octorate-live-availability` TASK-01 route (imported as a shared type or duplicated with a comment referencing the source).
  - Hook is used only by `RoomDetailContent` (via `RoomCard` prop threading). `RoomsSection` and `BookPageContent` use `useAvailability` from the sibling plan.
  - No TypeScript errors.
- **Validation contract (TC-XX):**
  - TC-RPC-01: `checkIn >= todayIso`, flag on → fetch fires; loading is true during fetch; `nrPrice` populated on success.
  - TC-RPC-02: flag off → no fetch, returns `{ available: true, loading: false }`.
  - TC-RPC-03: API returns `available: false` → hook returns `{ available: false, nrPrice: undefined, loading: false }`.
  - TC-RPC-04: Rapid input change within 400ms debounce window → only one fetch fires.
  - TC-RPC-05: Component unmounts during fetch → AbortController cancels; no state-update-on-unmounted-component warning.
  - TC-RPC-06: API returns HTTP 500 → hook returns `{ available: true, loading: false, error: 'fetch_failed' }` (graceful degradation — do not block CTA).
- **Execution plan:** Red -> Green -> Refactor
  - Red: Create `useAvailabilityForRoom.ts` with stub returning `{ available: true, loading: false }`. Import in `RoomDetailContent` and pass result to `RoomCard`. No behavior change yet. Tests (stubs) added.
  - Green: Implement debounced fetch to `/api/availability`. Parse response using TASK-01 type. Populate `nrPrice`, `available`, `loading`, `error`. TC-RPC-01 through TC-RPC-06 pass.
  - Refactor: Extract debounce logic to a shared util if `useAvailability` (sibling hook) uses same pattern; otherwise keep inline.
- **Planning validation (required for M/L):**
  - Checks run:
    - `useAvailability` hook from `brik-octorate-live-availability` plan (TASK-02) is the reference implementation. Its debounce (600ms) and AbortController pattern are the model; this hook uses 400ms (room detail page is a single-room query, faster feedback desired).
    - `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` is read via `process.env` inline check — same pattern as other feature-flag-gated hooks in the codebase.
    - The hook is only called from `RoomDetailContent` — no other callers to trace.
  - Validation artifacts: `brik-octorate-live-availability` plan TASK-02 execution plan (reference pattern).
  - Unexpected findings: None at planning time; TASK-CP2 revalidates before this task starts.
- **Consumer tracing:**
  - `useAvailabilityForRoom` is called in `RoomDetailContent` (TASK-RPR wires result to `RoomCard`). No other consumers.
  - Return value `{ nrPrice, available, loading, error }` — consumed by `RoomCard` via an `availabilityResult` prop added in TASK-RPR.
- **Scouts:** Confirm the import path for the `AvailabilityResult` / `AvailabilityRouteResponse` type from `brik-octorate-live-availability` before writing the hook. If the type is not exported from a shared package (likely — it's a route-local type), duplicate the interface in this hook file with a comment: `// Mirrors AvailabilityRouteResponse from brik-octorate-live-availability TASK-01`.
- **Edge Cases & Hardening:**
  - Do not allow booking a room with `available: false` even if `nrPrice` is present (API edge case). TASK-RPR must enforce this.
  - If `nrPrice` is 0 (explicitly zero, not undefined), show it as "€0" not as a fallback — this is a valid API response.
- **What would make this >=90%:** TASK-CP2 confirms response type; TC-RPC-01 through TC-RPC-06 passing with real API mock.
- **Rollout / rollback:**
  - Rollout: Feature flag gates all API calls. Merging the hook file is safe with flag off.
  - Rollback: Feature flag off; hook returns `{ available: true, loading: false }` immediately.
- **Documentation impact:** None.
- **Notes / references:**
  - Reference: `brik-octorate-live-availability` plan TASK-02 (`useAvailability` hook).
  - Hook path: `apps/brikette/src/hooks/useAvailabilityForRoom.ts`.

---

### TASK-RPR: `RoomCard` — live NR price and sold-out display for room detail page
- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx` (hook call + prop thread); updated `apps/brikette/src/components/rooms/RoomCard.tsx` (display states).
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx`, `apps/brikette/src/components/rooms/RoomCard.tsx`, `apps/brikette/src/locales/*/roomsPage.json` (must add `rooms.soldOut` key)
- **Depends on:** TASK-DP, TASK-RPC
- **Blocks:** TASK-RD-TEST
- **Confidence:** 80%
  - Implementation: 80% — `RoomCard.tsx` uses an additive override pattern (confirmed feasible in `brik-octorate-live-availability` TASK-04). The `lowestPrice` and `soldOut` overrides are localized to the `useRoomPricing` result overlay. The `resolveTranslatedCopy`/`buildLabel` complexity is noted; the additive approach minimizes this risk.
  - Approach: 80% — When `availabilityResult` is provided by `useAvailabilityForRoom`: override `soldOut` and `lowestPrice` in `RoomCard`. When flag is off: `availabilityResult` is undefined; `RoomCard` falls back to `basePrice` from `useRoomPricing`.
  - Impact: 80% — This is the user-visible output: live prices on room detail buttons. Incorrect rendering (stale price, wrong sold-out state) directly degrades the booking experience.
  - Held-back test for Implementation@80: `resolveTranslatedCopy` and `buildLabel` interaction with the NR price label must be verified during implementation. Additive override reduces (but does not eliminate) this risk.
- **Acceptance:**
  - `RoomDetailContent` calls `useAvailabilityForRoom({ room, checkIn, checkOut, adults })` and passes the result as `availabilityResult` to `RoomCard`.
  - `RoomCard` receives optional `availabilityResult?: { nrPrice?: number; available: boolean; loading: boolean; error?: string }` prop.
  - When `availabilityResult.available === true` and `nrPrice` is set: NR button label shows live price (e.g. "Check rates – from €45"); NR button enabled.
  - When `availabilityResult.available === false`: both NR and flex buttons show sold-out state (disabled, `rooms.soldOut` i18n label). The `rooms.soldOut` key must be added to all locale files under the `rooms` object in `roomsPage.json` (e.g. EN: `"soldOut": "Sold Out"`). This key is referenced by `RoomCard.tsx` line 193 but is absent from all current locale files.
  - When `availabilityResult.loading === true`: NR button shows `loadingPrice` i18n label.
  - When `availabilityResult` is undefined (flag off or pre-hook result): NR button shows `basePrice` from `roomsData.ts` with "from" label (not stale `rates.json` for user-selected dates).
  - Flex button in MVP: always shows `checkRatesFlexible` i18n label regardless of `availabilityResult`. Flex pricing deferred.
  - `queryState === "valid"` guard continues to gate CTA navigation (unchanged from current behavior).
  - `queryState === "invalid"` → NR/flex buttons disabled regardless of `availabilityResult`.
  - Existing GA4 `select_item` tracking on CTA click fires as before.
  - No new `describe.skip` blocks.
  - `RoomsSection` and `BookPageContent` are NOT modified — this prop is only wired from `RoomDetailContent` (the `RoomCard` prop is already optional and backward-compatible from TASK-04 in the sibling plan if that runs first, or it is added here if not yet added).
  - No TypeScript errors.
- **Validation contract (TC-XX):**
  - TC-RPR-01: `availabilityResult = { available: true, nrPrice: 45, loading: false }` → NR button enabled, label contains "45".
  - TC-RPR-02: `availabilityResult = { available: false, loading: false }` → both buttons disabled, sold-out label shown.
  - TC-RPR-03: `availabilityResult = { loading: true, available: true }` → NR button shows `loadingPrice` label.
  - TC-RPR-04: `availabilityResult = undefined` → `basePrice` from `roomsData.ts` shown, NR button enabled (fallback path; `queryState === "valid"` still gates navigation).
  - TC-RPR-05: `availabilityResult = { available: true, loading: false }` with no `nrPrice` → fallback to `basePrice`, not "undefined".
  - TC-RPR-06: `queryState === "invalid"` → NR/flex buttons disabled regardless of `availabilityResult`.
  - TC-RPR-07: GA4 `select_item` fires on NR button click when button is enabled (not when disabled).
  - TC-RPR-08: `RoomsSection` usages outside `RoomDetailContent` (e.g. `BookPageContent`) are unaffected — `availabilityResult` prop is optional, defaults to undefined.
  - TC-RPR-09: Sold-out display renders a human-readable string (not the key string `"rooms.soldOut"`) in all supported locales. Requires `rooms.soldOut` key in each locale's `roomsPage.json`.
- **Execution plan:** Red -> Green -> Refactor
  - Red: Add optional `availabilityResult` prop slot to `RoomCard` type (typed but unused). Confirm no existing tests break. Confirm `RoomsSection` / `BookPageContent` are not impacted (optional prop).
  - Green: Wire `useAvailabilityForRoom` result from `RoomDetailContent` to `RoomCard`. In `RoomCard`: overlay `soldOut` and `lowestPrice` from `availabilityResult` when present. Update NR button label construction to include `nrPrice`. Add loading and sold-out display states. Add `rooms.soldOut` key to all locale `roomsPage.json` files. TC-RPR-01 through TC-RPR-09 pass.
  - Refactor: `rooms.soldOut` was added in the Green step. Verify `loadingPrice` and `ratesFrom` are reused (not duplicated) for loading and price-from states. Clean label construction.
- **Planning validation (required for M/L):**
  - Checks run:
    - `RoomCard.tsx` line 170: `const { lowestPrice, soldOut, loading: priceLoading } = useRoomPricing(room)` — override point confirmed.
    - `RoomCard.tsx` actions array (lines 318–338): two actions (`nonRefundable`, `flexible`) confirmed from sibling plan audit.
    - GA4 `select_item` firing in `openNonRefundable`/`openFlexible` callbacks — not in label construction — confirmed safe from sibling plan.
    - Feature-flag-off behavior: `availabilityResult` is undefined → existing `useRoomPricing` path → `basePrice` or stale `rates.json` entry. This is improved by TASK-RATES-REFRESH (which refreshes `rates.json`) but still shows today's "price from" not the date-picker-selected range. This is acceptable for flag-off MVP: show `basePrice` with "from" label as the approved fallback.
    - `RoomsSection` callers: `BookPageContent` only (confirmed from sibling plan TASK-03). Optional prop confirmed safe.
  - Validation artifacts: `RoomCard.tsx` lines 170, 318–338 (from sibling plan fact-find); `roomsPage.json` i18n keys confirmed pre-existing: `loadingPrice`, `ratesFrom`, `checkRatesNonRefundable`, `checkRatesFlexible`. Confirmed absent (must add): `rooms.soldOut`.
  - Unexpected findings: Sibling plan TASK-04 adds `availabilityResult` to `RoomCard` for the book page path. If TASK-04 ships before TASK-RPR, the prop already exists and TASK-RPR only needs to wire the hook call in `RoomDetailContent`. TASK-CP2 must confirm this overlap before TASK-RPR executes.
- **Consumer tracing:**
  - `availabilityResult` prop on `RoomCard` — new optional prop. `RoomDetailContent` is the only component wiring it for room detail pages. `BookPageContent`/`RoomsSection` use `useAvailability` (different hook, sibling plan). Both are backward-compatible (optional prop defaults to undefined).
  - Modified behavior: `soldOut` derivation prefers `availabilityResult.available === false` over `useRoomPricing.soldOut` when `availabilityResult` is present. No change to call sites that don't pass `availabilityResult`.
  - Modified behavior: `lowestPrice` in price label uses `availabilityResult.nrPrice` when present. Existing fallback path unchanged.
- **Scouts:** Before implementing, grep for all `<RoomCard` usages to confirm `availabilityResult` prop does not already exist from sibling plan TASK-04 shipping. If it exists, skip the prop addition and only wire the hook call.
- **Edge Cases & Hardening:**
  - `available: false` must disable BOTH NR and flex buttons — do not allow booking a sold-out room via the flex CTA.
  - `nrPrice = 0` is a valid response (unlikely in practice). Show "€0" not blank/fallback.
  - When `availabilityResult.error` is set: degrade gracefully — show `basePrice` fallback label, do not disable the CTA.
- **What would make this >=90%:** TASK-CP2 confirms API response field mapping; all TC-RPR-XX tests passing.
- **Rollout / rollback:**
  - Rollout: Feature flag gates `useAvailabilityForRoom` API calls. Prop is additive. UI display states ship with flag; live prices only show when flag is on and TASK-01 route is deployed.
  - Rollback: Feature flag off; `availabilityResult` is always undefined; existing `basePrice` fallback shown.
- **Documentation impact:** None (existing i18n keys cover all new display states).
- **Notes / references:**
  - Reference: `brik-octorate-live-availability` plan TASK-04 (same `RoomCard` override pattern for book page path).
  - `RoomCard.tsx` line 170: `useRoomPricing` call is the override point.
  - `roomsPage.json` i18n keys: `loadingPrice`, `ratesFrom`, `checkRatesNonRefundable`, `checkRatesFlexible` — confirmed pre-existing. `rooms.soldOut` is NOT present in any locale file — it must be added in this task (see acceptance criterion below).

---

### TASK-RD-TEST: Tests — date picker, hook, RoomCard display
- **Type:** IMPLEMENT
- **Deliverable:** New test files:
  - `apps/brikette/src/hooks/useAvailabilityForRoom.test.ts`
  - `apps/brikette/src/test/components/room-detail-date-picker.test.tsx`
  - `apps/brikette/src/test/components/room-card-live-pricing.test.tsx` (or appended to existing `RoomCard` test file)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** Test files listed above (new).
- **Depends on:** TASK-DP, TASK-RPC, TASK-RPR
- **Blocks:** -
- **Confidence:** 82%
  - Implementation: 82% — Test framework (Jest + Testing Library) is established. MSW version must be confirmed before writing handlers (same scout as sibling plan TASK-06). Hook tests mirror the `useAvailability` tests from the sibling plan.
  - Approach: 82% — Unit tests for hook (mock `/api/availability`); component tests for date picker interaction, URL write-back, RoomCard display states.
  - Impact: 82% — Without tests, regressions in the date picker, hook, and display will not be caught in CI.
- **Acceptance:**
  - `useAvailabilityForRoom` tests: all TC-RPC-XX scenarios covered.
  - Date picker tests: TC-DP-01, TC-DP-02, TC-DP-03, TC-DP-04, TC-DP-07 covered (component with mocked router).
  - `RoomCard` live pricing tests: TC-RPR-01 through TC-RPR-08 covered.
  - All tests run under `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs`.
  - Zero `describe.skip` blocks introduced.
  - No live Octorate credentials required (all API calls mocked).
- **Validation contract (TC-XX):**
  - TC-RDT-01: All named TC codes above pass in CI.
  - TC-RDT-02: No existing `RoomCard`, `RoomDetailContent`, or hook tests regress.
  - TC-RDT-03: Test runner completes without live credentials (mocked via MSW or direct handler mock).
- **Execution plan:** Red -> Green -> Refactor
  - Red: Create test files with `test.todo()` stubs for each named TC. Confirm stubs appear in test output without failing.
  - Green: Implement each test. Mock `useSearchParams`, `useRouter` for date picker tests. Add MSW handler for `/api/availability` in hook tests. Mock `useAvailabilityForRoom` return value in RoomCard display tests.
  - Refactor: Remove stubs; ensure edge cases (sold-out, loading, error, flag-off) all have coverage.
- **Planning validation (required for M/L):**
  - Checks run:
    - `apps/brikette/jest.config.cjs` confirmed from fact-find.
    - `testIdAttribute: "data-cy"` confirmed from MEMORY.md.
    - `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs` confirmed from fact-find.
    - Existing test for `RoomCard` GA4 `select-item` exists — must not regress.
  - Validation artifacts: Fact-find test landscape section; MEMORY.md jest patterns.
  - Unexpected findings: None. Same patterns as sibling plan TASK-06.
- **Consumer tracing:** None: test-only task. No production consumer tracing needed.
- **Scouts:** Confirm MSW version in `apps/brikette/package.json` before writing handlers (same scout as sibling TASK-06).
- **Edge Cases & Hardening:**
  - Test date picker with keyboard input (not just mouse clicks) if accessibility is a concern.
  - Test rapid date changes (debounce reset for hook tests).
  - Test unmounted hook (cleanup via AbortController).
- **What would make this >=90%:** MSW handler in place and working; all TC codes passing.
- **Rollout / rollback:**
  - Rollout: Tests are additive; no production impact.
  - Rollback: None needed.
- **Documentation impact:** None.
- **Notes / references:**
  - MEMORY.md patterns: `testIdAttribute: "data-cy"`; `pnpm -w run test:governed` runner; ModalContext mock pattern.
  - Sibling plan TASK-06 test patterns are directly applicable.

---

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `brik-octorate-live-availability` TASK-01 not yet merged when TASK-RPC starts | High (TASK-01 is pending in a separate plan) | High (blocks live API path) | TASK-CP2 gates TASK-RPC. TASK-DP ships independently. Feature flag off = `basePrice` fallback works without TASK-01. |
| Octorate credentials absent | High (confirmed not in repo) | High (blocks live API testing) | Feature flag gates live path. TASK-RATES-REFRESH improves today's display. |
| `rates.json` stale data shown today | Confirmed | Medium | TASK-RATES-REFRESH is Wave 1, independent, run immediately. |
| Sibling plan TASK-04 adds `RoomCard.availabilityResult` prop before TASK-RPR | Medium (both plans are active) | Low (deduplication needed) | TASK-CP2 and TASK-RPR scouts confirm prop existence before adding. Avoid duplicate prop definition. |
| `resolveTranslatedCopy`/`buildLabel` conflict with NR price label injection | Low | Moderate | Additive `lowestPrice` override pattern confirmed in sibling plan. TASK-CP2 revalidates before TASK-RPR. |
| API route not available on staging (static export) | Medium | Low | Feature flag defaults off on staging. Document limitation in TASK-RPC. |
| Rate limit breach (100 calls/5 min) during date picker interaction | Low (traffic is low-medium) | Medium | 400ms debounce in `useAvailabilityForRoom` + 60s server-side cache in TASK-01 route. |

## Observability
- Logging: API route logs (from TASK-01 in sibling plan) capture Octorate ARI errors server-side.
- Metrics: Existing GA4 events: `select_item` on NR/flex CTA click, `begin_checkout` on sticky CTA click. These cover the funnel. Monitor `select_item` rate on `/rooms/[id]` pages before and after launch.
- Alerts/Dashboards: None: existing GA4 dashboard covers key events.

## Acceptance Criteria (overall)
- [ ] `rates.json` refreshed with data extending to at least 2026-12-31.
- [ ] Date range picker (check-in, check-out, pax) renders on all room detail pages with default today + 2 nights, 1 adult.
- [ ] Changing dates writes to URL params; `StickyBookNow` continues to function without code changes.
- [ ] `RoomCard` shows live NR price for selected dates when flag is on and API route is available.
- [ ] `RoomCard` shows sold-out state when room is unavailable for selected dates.
- [ ] `RoomCard` shows `basePrice` "from" fallback when flag is off.
- [ ] NR/flex CTAs navigate to Octorate with correct dates, pax, and rate code.
- [ ] All new tests pass under `pnpm -w run test:governed`.
- [ ] No TypeScript errors. No `describe.skip` blocks introduced.

## Decision Log
- 2026-02-27: Separate sister plan (Option B) chosen over appending to `brik-octorate-live-availability`. Rationale: cleaner scope, independent progress tracking, avoids complicating the sibling plan's TASK-CP checkpoint logic.
- 2026-02-27: Date picker defaults to today + 2 nights (not empty). Rationale: minimises friction, immediately produces `queryState === "valid"` so prices are shown on first render — consistent with operator goal.
- 2026-02-27: Flex button shows policy label only in MVP (no per-date flex price). Rationale: Octorate ARI response primarily provides NR pricing; flex price enrichment is a follow-on task.
- 2026-02-27: Feature-flag-off price display: `basePrice` from `roomsData.ts` with "from" label. Rationale: prevents stale `rates.json` entries being shown for user-selected date ranges after TASK-RATES-REFRESH may have already replaced the file.

## Overall-confidence Calculation
- TASK-RATES-REFRESH: 90%, S (weight 1)
- TASK-DP: 85%, M (weight 2)
- TASK-CP2: 95%, S (weight 1)
- TASK-RPC: 80%, M (weight 2)
- TASK-RPR: 80%, M (weight 2)
- TASK-RD-TEST: 82%, M (weight 2)

Sum of (confidence * weight): (90*1) + (85*2) + (95*1) + (80*2) + (80*2) + (82*2) = 90 + 170 + 95 + 160 + 160 + 164 = 839
Sum of weights: 1 + 2 + 1 + 2 + 2 + 2 = 10
Overall-confidence = 839 / 10 = 83.9% → set to 80% in frontmatter (conservative; TASK-CP2 is an external dependency checkpoint, not pure implementation confidence).

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-RATES-REFRESH: Refresh rates.json | Yes | None — data file operation, structure confirmed | No |
| TASK-DP: Date picker in RoomDetailContent | Yes | [Type contract gap] Minor: `parseBookingQuery` return type does not currently include `"invalid"`. Extension needed: add `"invalid"` to union type. All downstream consumers of `parseBookingQuery` result (only `RoomDetailContent` and `RoomCard`) already handle `"invalid"`. | No — documented in TASK-DP planning validation |
| TASK-CP2: Horizon checkpoint | Partial | [Missing data dependency] Major: checkpoint requires external dependency (`brik-octorate-live-availability` TASK-01) to be complete. Cannot self-unblock. Sequenced correctly — TASK-CP2 gates TASK-RPC. | No — by design; cross-plan dependency is documented |
| TASK-RPC: useAvailabilityForRoom hook | Partial | [API signature mismatch] Moderate: `/api/availability` route query parameter shape (single room vs. all rooms) not yet confirmed. TASK-CP2 must run first to validate this. | No — TASK-CP2 gates this task |
| TASK-RPR: RoomCard display states | Partial | [Integration boundary not handled] Moderate: sibling plan TASK-04 may add `availabilityResult` prop to `RoomCard` before TASK-RPR runs. Duplicate prop definition would cause TypeScript error. TASK-CP2 scouts resolve this. | No — TASK-RPR scouts resolve before Red step |
| TASK-RD-TEST: Tests | Yes | [Missing data dependency] Minor: MSW version not confirmed. Same scout as sibling plan TASK-06. | No — TASK-RD-TEST scouts confirm before writing handlers |
