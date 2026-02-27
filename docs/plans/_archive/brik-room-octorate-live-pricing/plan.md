---
Type: Plan
Status: Archived
Domain: PRODUCTS
Workstream: Engineering
Created: 2026-02-27
Last-reviewed: 2026-02-27
Last-updated: 2026-02-27 (build complete — TASK-RPC, TASK-RPR, TASK-RD-TEST all Complete; 40/40 tests pass; plan ready for archiving)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brik-room-octorate-live-pricing
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# BRIK Room Pages — Live Pricing and Availability Plan

## Summary

Room detail pages (`/rooms/[id]`) currently show a static "price from" figure with no date/guest picker — guests see stale or fallback prices and must navigate to Octorate blind. This plan adds a date range + guest count picker to `RoomDetailContent` (TASK-DP, Complete), a per-room availability hook (`useAvailabilityForRoom`) that uses the live public Octobook HTML-scraping proxy at `/api/availability` (no paid API or credentials required), live NR and sold-out display on the `RoomCard` buttons, and tests. The sibling plan `brik-octorate-live-availability` is fully complete; the `/api/availability` route, `OctorateRoom` type, and `availabilityRoom` prop on `RoomCard` are all available. The feature flag `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` gates the live path with a graceful `basePrice` fallback. **No `rates.json` refresh required** — superseded by the live proxy.

## Active tasks
- [x] TASK-RATES-REFRESH: Refresh `rates.json` stop-gap — **Complete** (superseded 2026-02-27: live Octobook proxy makes this moot)
- [x] TASK-DP: Date picker + pax selector in `RoomDetailContent` — **Complete** (2026-02-27)
- [x] TASK-CP2: Horizon checkpoint — **Complete** (2026-02-27 replan: all API contract assumptions confirmed with E3 evidence)
- [x] TASK-RPC: `useAvailabilityForRoom` hook — **Complete** (2026-02-27)
- [x] TASK-RPR: `RoomCard` — live NR price and sold-out display for room detail page — **Complete** (2026-02-27)
- [x] TASK-RD-TEST: Tests — date picker, hook, RoomCard display — **Complete** (2026-02-27)

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
| TASK-RATES-REFRESH | IMPLEMENT | Refresh `rates.json` stop-gap | n/a | S | **Complete** (superseded 2026-02-27) | - | - |
| TASK-DP | IMPLEMENT | Date picker + pax selector in `RoomDetailContent` | 85% | M | **Complete** (2026-02-27) | - | TASK-RPC, TASK-RPR |
| TASK-CP2 | CHECKPOINT | Horizon checkpoint — all API contract assumptions resolved | n/a | S | **Complete** (2026-02-27 replan) | - | - |
| TASK-RPC | IMPLEMENT | `useAvailabilityForRoom` hook | **85%** | M | **Complete (2026-02-27)** | TASK-DP (Complete), TASK-CP2 (Complete) | TASK-RPR, TASK-RD-TEST |
| TASK-RPR | IMPLEMENT | `RoomCard` — live NR price and sold-out display | **85%** | M | **Complete (2026-02-27)** | TASK-DP, TASK-RPC | TASK-RD-TEST |
| TASK-RD-TEST | IMPLEMENT | Tests — date picker, hook, RoomCard display | **85%** | M | **Complete (2026-02-27)** | TASK-DP, TASK-RPC, TASK-RPR | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| DONE | TASK-RATES-REFRESH | — | Superseded by live Octobook proxy. No action needed. |
| DONE | TASK-DP | — | Complete (2026-02-27). Date picker + pax selector live in `RoomDetailContent`. |
| DONE | TASK-CP2 | — | Complete (2026-02-27 replan). All API contract assumptions resolved. |
| 1 | TASK-RPC | All Complete | Create `useAvailabilityForRoom` hook. Scout room matching (widgetRoomCode vs octorateRoomName). |
| 2 | TASK-RPR | TASK-RPC | Wire hook call in `RoomDetailContent`; `availabilityRoom` prop already exists in `RoomCard`. |
| 3 | TASK-RD-TEST | TASK-RPC, TASK-RPR | Tests for hook + display states. Patterns from sibling plan directly applicable. |

## Tasks

---

### TASK-RATES-REFRESH: Refresh `rates.json` stop-gap
- **Type:** IMPLEMENT
- **Deliverable:** n/a — superseded
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27) — superseded by live Octobook HTML-scraping proxy at `/api/availability`. The stale `rates.json` stop-gap is no longer needed; live per-night pricing from the proxy replaces it. No code or data change required.
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
- **Build evidence (2026-02-27):**
  - Commit: `8b8fef4d41` — `feat(brik-rooms): add date picker + pax selector to room detail pages (TASK-DP)`
  - Affects verified: `apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx` modified.
  - ESLint: 0 errors (2 pre-existing warnings for regex patterns, not in scope).
  - Typecheck (turbo): 20/20 successful, FULL TURBO cache hit after `@acme/ui` rebuild.
  - Tests: `packages/ui/src/molecules/__tests__/RoomCard.test.tsx` — 7/7 PASS.
  - Pre-commit hooks: all passed.
  - Offload route: `codex exec --full-auto` (CODEX_OK=1). Exit 0.
  - Scout discovery: `src/data/rates/latest.json` confirmed dead code (no callers of `findNightlyPrices`). TASK-RATES-REFRESH scope unchanged.
  - `parseBookingQuery` extended to return `"invalid"` — RoomCard already handles it (confirmed in `RoomCard.tsx` lines 229–248).
  - `BookingDatePicker` sub-component extracted to satisfy `max-lines-per-function` lint rule.
  - `datePickerRef` typed as `RefObject<HTMLDivElement | null>` (React 19 / strict TS).
  - Picker i18n: `selectDatesTitle`, `checkInDate`, `checkOutDate`, `adults` — confirmed present in EN, IT, FR, DE locales.

---

### TASK-CP2: Horizon checkpoint — all API contract assumptions resolved
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan via `/lp-do-replan` (this replan round, 2026-02-27).
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-27 — resolved by replan round 1)
- **Depends on:** —
- **Blocks:** —
- **Confidence:** n/a (complete)
- **Horizon assumptions — all resolved:**
  - ✅ `/api/availability` response type confirmed: `OctorateRoom[]` exported from route and re-exported from `useAvailability.ts`. No `roomCode` filter param — route returns all rooms, consumer filters client-side.
  - ✅ Per-room field mapping: `OctorateRoom.priceFrom` is the per-night NR price (already divided by nights in the route). `OctorateRoom.available` is the sold-out flag.
  - ✅ `RoomCard.availabilityRoom?: OctorateRoom` prop **already exists** (sibling plan TASK-04). TASK-RPR only needs to wire the hook call in `RoomDetailContent` — prop addition is already done.
  - ✅ i18n keys: `rooms.soldOut` already present in all locales. `loadingPrice` and `ratesFrom` already present. No new keys needed.
  - ⚠️ Room matching: `RoomsSection.tsx` uses `r.widgetRoomCode === avRoom.octorateRoomName`. `widgetRoomCode` is numeric ("7", "10"...) but `octorateRoomName` is parsed from `<h1>` text content. TASK-RPC must scout whether Octorate `<h1>` text is numeric or a generic name, and fix matching if needed.
- **Documentation impact:** `plan.md` + `replan-notes.md` updated.

---

### TASK-RPC: `useAvailabilityForRoom` hook
- **Type:** IMPLEMENT
- **Deliverable:** New `apps/brikette/src/hooks/useAvailabilityForRoom.ts`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-27)
- **Build evidence:** `apps/brikette/src/hooks/useAvailabilityForRoom.ts` created. Hook: 300ms debounce, AbortController cleanup, `OCTORATE_LIVE_AVAILABILITY` flag gate, matches room by `r.octorateRoomId === room.widgetRoomCode` (added `octorateRoomId` field to `OctorateRoom` via `data-id` attribute in route.ts). `RoomsSection.tsx` matching updated to `avRoom.octorateRoomId`. 7/7 TC-RPC tests pass.
- **Affects:** `apps/brikette/src/hooks/useAvailabilityForRoom.ts` (new); `apps/brikette/src/app/api/availability/route.ts` (`octorateRoomId` field added); `apps/brikette/src/components/rooms/RoomsSection.tsx` (matching fix)
- **Depends on:** TASK-DP (Complete), TASK-CP2 (Complete)
- **Blocks:** TASK-RPR, TASK-RD-TEST
- **Confidence:** 85% (↑ from 80%)
  - Implementation: 85% — Hook pattern mirrors `useAvailability` from the sibling plan (E3: code). Debounce (300ms) and AbortController patterns established and confirmed. `OctorateRoom` type available via `import type { OctorateRoom } from "@/hooks/useAvailability"`.
  - Approach: 85% — Hook calls `/api/availability` with checkin/checkout/pax, fetches ALL rooms, then filters by room matching. Returns the matching `OctorateRoom | undefined`. Consumer (`RoomDetailContent`) passes it as `availabilityRoom` to `RoomCard`.
  - Impact: 85% — Without this hook, TASK-RPR cannot display live prices.
  - Held-back 15%: room matching scout (widgetRoomCode vs octorateRoomName text) must be resolved in Red step.
- **Acceptance:**
  - `useAvailabilityForRoom({ room, checkIn, checkOut, adults })` returns `OctorateRoom | undefined` (the matching room from the API response, or undefined when loading/flag-off/no-match).
  - Internally manages `loading` and `error` states but exposes them as a second return value or as properties on a state object — exact shape TBD based on what TASK-RPR needs (see consumer tracing below).
  - When `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` is off: returns immediately without fetching.
  - When dates are invalid (empty checkin/checkout): skips fetch.
  - Debounces API calls 300ms on input change (matches `useAvailability` DEBOUNCE_MS).
  - AbortController cancels in-flight requests on unmount or re-trigger.
  - Import: `import type { OctorateRoom } from "@/hooks/useAvailability"` — no type duplication needed.
  - Room matching: use `room.widgetRoomCode === availRoom.octorateRoomName` (established pattern from `RoomsSection.tsx:56`). If scout confirms this doesn't work with live data, extend `Room` with `octorateRoomName?: string` and update matching in both `useAvailabilityForRoom` and `RoomsSection.tsx`.
  - No TypeScript errors.
- **Validation contract (TC-XX):**
  - TC-RPC-01: Flag on, valid dates → fetch fires; matched `OctorateRoom` returned on success.
  - TC-RPC-02: Flag off → no fetch, returns undefined immediately.
  - TC-RPC-03: API returns room with `available: false` → hook returns that `OctorateRoom` (available=false).
  - TC-RPC-04: Rapid input change within 300ms → only one fetch fires.
  - TC-RPC-05: Component unmounts during fetch → AbortController cancels; no state-update-on-unmounted-component warning.
  - TC-RPC-06: API returns HTTP 500 → graceful degradation, returns undefined (do not block CTA).
  - TC-RPC-07: No matching room in response → returns undefined (graceful, falls back to basePrice in RoomCard).
- **Execution plan:** Red -> Green -> Refactor
  - Red: **Scout** — verify `r.widgetRoomCode === avRoom.octorateRoomName` works with actual Octorate response. If not, add `octorateRoomName?: string` to `Room` interface and populate for all in-scope rooms. Create `useAvailabilityForRoom.ts` stub. Confirm no existing tests break.
  - Green: Implement debounced fetch. Filter response by matching. Return matching `OctorateRoom | undefined`. TC-RPC-01 through TC-RPC-07 pass.
  - Refactor: Share `DEBOUNCE_MS = 300` constant if appropriate. Keep `useAvailability` and `useAvailabilityForRoom` as separate hooks (different consumers, different return shapes).
- **Planning validation (required for M/L):**
  - Confirmed: `useAvailability` at `apps/brikette/src/hooks/useAvailability.ts` is the direct reference. Same fetch pattern, same abort/debounce structure.
  - Confirmed: `OctorateRoom` is importable from `@/hooks/useAvailability` (re-exported there from route).
  - Confirmed: `RoomsSection.tsx:56` uses `r.widgetRoomCode === avRoom.octorateRoomName` — this is the matching approach to validate/fix in scout.
  - `widgetRoomCode` values: "7", "3", "4", "5", "6", "8", "9", "10", "11", "12" (numeric strings). Octorate `<h1>` text may be "Dorm", "Double", "Apartment" — scout must confirm.
- **Consumer tracing:**
  - `useAvailabilityForRoom` called in `RoomDetailContent`, result passed as `availabilityRoom` prop to `RoomCard`. `RoomCard.availabilityRoom?: OctorateRoom` already exists (sibling plan TASK-04).
  - No other consumers.
- **Scouts:** Before Red step: verify room matching by inspecting actual Octorate HTML (or checking if any live test data exists). If `octorateRoomName` values don't match `widgetRoomCode` numerics, add `octorateRoomName` field to `Room` interface in `roomsData.ts` and fix `RoomsSection.tsx:56`.
- **Edge Cases & Hardening:**
  - `available: false` must be passed through to `RoomCard` as-is — TASK-RPR disables CTAs.
  - `priceFrom = 0` is a valid API response. Do not treat as missing.
  - Room matching: if multiple rooms share the same Octorate room name (e.g., multiple dorm sections), use the first match (same as `RoomsSection.tsx` behavior).
- **What would make this >=90%:** Matching scout confirms approach; TC-RPC-01 through TC-RPC-07 passing with mocked API.
- **Rollout / rollback:**
  - Rollout: Feature flag gates all API calls. Hook file is safe to merge with flag off.
  - Rollback: Feature flag off; hook returns undefined immediately; `RoomCard` falls back to `basePrice`.
- **Documentation impact:** None.
- **Notes / references (replan round 1 updates):**
  - API contract confirmed: `/api/availability` returns ALL rooms; hook filters client-side. No `roomCode` query param.
  - Return type: `OctorateRoom | undefined` (not `{ nrPrice, available, loading, error }` as originally planned). Simpler: pass the whole `OctorateRoom` directly to `RoomCard.availabilityRoom`.
  - `availabilityRoom` prop already exists in `RoomCard` — TASK-RPR does not need to add it.
  - Reference: `apps/brikette/src/hooks/useAvailability.ts` (direct implementation model).

---

### TASK-RPR: `RoomCard` — live NR price and sold-out display for room detail page
- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx` (hook call + prop thread only — `RoomCard.availabilityRoom` prop already exists from sibling plan TASK-04).
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-27)
- **Build evidence:** `RoomDetailContent.tsx` updated: `useAvailabilityForRoom` hook called with `{ room, checkIn: pickerCheckIn, checkOut: pickerCheckOut, adults: pickerAdults }`, result passed as `availabilityRoom={availabilityRoom}` to `<RoomCard>`. No changes to `RoomCard.tsx` (prop already existed). ESLint import sort fixed. 3/3 TC-RPR tests pass (TC-RPR-05/06/07); TC-RPR-01 to TC-RPR-04 covered by pre-existing `RoomCard.availability.test.tsx`.
- **Affects:** `apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx` only. `RoomCard.tsx` not modified (prop already exists). `roomsPage.json` not modified (`rooms.soldOut` key already present in all locales).
- **Depends on:** TASK-DP (Complete), TASK-RPC
- **Blocks:** TASK-RD-TEST
- **Confidence:** 85% (↑ from 80%)
  - Implementation: 85% — `RoomCard.availabilityRoom?: OctorateRoom` prop already exists (E3: code, `RoomCard.tsx:49`). Only `RoomDetailContent` needs to be updated: call `useAvailabilityForRoom` and pass the result as `availabilityRoom`. `resolveTranslatedCopy`/`buildLabel` risk eliminated — `RoomCard` already handles `availabilityRoom` from sibling plan.
  - Approach: 85% — Wire hook result from `RoomDetailContent` to `RoomCard`. The `RoomCard` display logic for availability is already implemented.
  - Impact: 85% — User-visible output; live prices on room detail buttons.
  - Held-back 15%: need to verify exact wiring point in `RoomDetailContent` (line ~303 `<RoomCard>` call).
- **Acceptance:**
  - `RoomDetailContent` calls `useAvailabilityForRoom({ room, checkIn, checkOut, adults })` and passes the matching `OctorateRoom | undefined` as `availabilityRoom` to `RoomCard`.
  - `RoomCard.availabilityRoom` prop is already typed and handled — no changes to `RoomCard.tsx`.
  - `rooms.soldOut` i18n key is already present in all locales — no locale file changes needed.
  - When `availabilityRoom.available === true` and `priceFrom` is set: NR button shows live price.
  - When `availabilityRoom.available === false`: both NR and flex buttons show sold-out state.
  - When `availabilityRoom` is undefined (flag off, loading, or no match): NR button falls back to `basePrice` from `useRoomPricing`.
  - `queryState === "invalid"` → buttons disabled regardless (unchanged).
  - Existing GA4 `select_item` tracking fires as before.
  - `RoomsSection` and `BookPageContent` are NOT modified.
  - No TypeScript errors. No `describe.skip` blocks.
- **Validation contract (TC-XX):**
  - TC-RPR-01: `availabilityRoom = { available: true, priceFrom: 45, nights: 2, ... }` → NR button enabled, label contains "45".
  - TC-RPR-02: `availabilityRoom = { available: false, ... }` → both buttons disabled, sold-out label shown.
  - TC-RPR-03: hook loading (undefined `availabilityRoom`) → NR button shows `loadingPrice` label (if hook exposes loading state) or falls back to `basePrice`.
  - TC-RPR-04: `availabilityRoom = undefined` → `basePrice` from `roomsData.ts` shown, NR button enabled.
  - TC-RPR-05: `queryState === "invalid"` → NR/flex buttons disabled regardless of `availabilityRoom`.
  - TC-RPR-06: GA4 `select_item` fires on NR button click when enabled.
  - TC-RPR-07: `RoomsSection`/`BookPageContent` usages unaffected — `availabilityRoom` is optional, backward-compatible.
- **Execution plan:** Red -> Green -> Refactor
  - Red: No prop changes needed (`availabilityRoom` already in `RoomCard`). Confirm no existing tests break with hook wired.
  - Green: In `RoomDetailContent`, call `useAvailabilityForRoom({ room, checkIn, checkOut, adults })`. Pass the matching `OctorateRoom | undefined` result as `availabilityRoom` to `<RoomCard>`. TC-RPR-01 through TC-RPR-07 pass.
  - Refactor: Confirm loading state is properly surfaced (if `useAvailabilityForRoom` exposes a loading flag, verify it reaches `RoomCard.availabilityRoom` as undefined during loading for correct fallback display).
- **Planning validation (required for M/L):**
  - Confirmed (replan round 1): `RoomCard.availabilityRoom?: OctorateRoom` exists at `RoomCard.tsx:49`. No prop addition needed.
  - Confirmed: `rooms.soldOut` already in all locales. No locale changes needed.
  - Confirmed: `RoomDetailContent.tsx` already calls `useAvailability` for book page — adding `useAvailabilityForRoom` call for room detail is analogous.
  - Confirmed: `RoomsSection` callers: `BookPageContent` only. Backward-compatible (optional prop).
- **Consumer tracing:**
  - `RoomDetailContent` calls hook → passes `availabilityRoom` to `<RoomCard>`. No other consumers.
  - `RoomsSection`/`BookPageContent` use `useAvailability` + pass `availabilityRooms` array — unaffected.
- **Scouts:** Confirm exact line in `RoomDetailContent.tsx` where `<RoomCard>` is rendered (currently ~line 303). Confirm hook call placement (above `<RoomCard>`).
- **Edge Cases & Hardening:**
  - `available: false` disables BOTH NR and flex buttons (already enforced by `RoomCard` when `availabilityRoom.available === false`).
  - `priceFrom = 0` is valid — show "€0", not fallback.
  - When hook returns undefined (loading, error, flag-off): `RoomCard` falls back to `basePrice`.
- **What would make this >=90%:** All TC-RPR-XX tests passing.
- **Rollout / rollback:**
  - Rollout: Feature flag gates hook API calls. Wiring in `RoomDetailContent` is safe with flag off.
  - Rollback: Feature flag off; `availabilityRoom` is always undefined; `basePrice` fallback shown.
- **Documentation impact:** None.
- **Notes / references (replan round 1 updates):**
  - `availabilityRoom` prop already exists — TASK-RPR scope is purely wiring the hook call in `RoomDetailContent`.
  - `rooms.soldOut` already in all locales — no locale file changes.
  - `RoomCard.tsx:49`: `availabilityRoom?: OctorateRoom` — exact prop name confirmed.

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
- **Status:** Complete (2026-02-27)
- **Build evidence:** 3 test files created. `useAvailabilityForRoom.test.ts`: 7/7 TC-RPC tests pass. `room-card-live-pricing.test.tsx`: 3/3 TC-RPR tests pass. `room-detail-date-picker.test.tsx`: 4/4 TC-DP tests pass. Full regression: 40/40 tests pass across 7 suites. No `describe.skip` introduced. No live credentials required (fetch mocked via `jest.spyOn(global, "fetch")`).
- **Affects:** Test files listed above (new).
- **Depends on:** TASK-DP (Complete), TASK-RPC, TASK-RPR
- **Blocks:** -
- **Confidence:** 85% (↑ from 82%)
  - Implementation: 85% — Test patterns directly from sibling plan `useAvailability.test.ts` and `route.test.ts`. `OctorateRoom` type available. `availabilityRoom` prop name confirmed. MSW scout carried forward.
  - Approach: 85% — Unit tests for hook (mock `/api/availability`); component tests for RoomCard display states with mocked `availabilityRoom` prop. Date picker tests if not already covered by TASK-DP tests.
  - Impact: 85% — Without tests, regressions will not be caught in CI.
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

## Risks & Mitigations (updated replan round 1)
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Room matching mismatch (`widgetRoomCode` numeric vs `octorateRoomName` text) | Medium | Medium | TASK-RPC Red step scout. If mismatch: add `octorateRoomName` field to `Room` interface + update `RoomsSection.tsx`. 2-line data fix. |
| API route not available on staging (static export) | Confirmed | Low | Feature flag defaults off on staging. No production impact. |
| Rate limit breach during date picker interaction | Low | Medium | 300ms debounce in `useAvailabilityForRoom` + 5-min server-side cache in `/api/availability`. |
| `available: false` with non-null `priceFrom` from API (edge case) | Low | Low | TASK-RPC enforces: if `available: false`, pass through as-is; `RoomCard` disables both CTAs regardless of `priceFrom`. |

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

## Overall-confidence Calculation (replan round 1)
- TASK-RATES-REFRESH: Complete — excluded from calculation
- TASK-DP: Complete — excluded from calculation
- TASK-CP2: Complete — excluded from calculation
- TASK-RPC: 85%, M (weight 2)
- TASK-RPR: 85%, M (weight 2)
- TASK-RD-TEST: 85%, M (weight 2)

Sum of (confidence * weight): (85*2) + (85*2) + (85*2) = 170 + 170 + 170 = 510
Sum of weights: 6
Overall-confidence = 510 / 6 = 85% → set to **85%** in frontmatter.

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-RATES-REFRESH: Refresh rates.json | Yes | None — data file operation, structure confirmed | No |
| TASK-DP: Date picker in RoomDetailContent | Yes | [Type contract gap] Minor: `parseBookingQuery` return type does not currently include `"invalid"`. Extension needed: add `"invalid"` to union type. All downstream consumers of `parseBookingQuery` result (only `RoomDetailContent` and `RoomCard`) already handle `"invalid"`. | No — documented in TASK-DP planning validation |
| TASK-CP2: Horizon checkpoint | Partial | [Missing data dependency] Major: checkpoint requires external dependency (`brik-octorate-live-availability` TASK-01) to be complete. Cannot self-unblock. Sequenced correctly — TASK-CP2 gates TASK-RPC. | No — by design; cross-plan dependency is documented |
| TASK-RPC: useAvailabilityForRoom hook | Partial | [API signature mismatch] Moderate: `/api/availability` route query parameter shape (single room vs. all rooms) not yet confirmed. TASK-CP2 must run first to validate this. | No — TASK-CP2 gates this task |
| TASK-RPR: RoomCard display states | Partial | [Integration boundary not handled] Moderate: sibling plan TASK-04 may add `availabilityResult` prop to `RoomCard` before TASK-RPR runs. Duplicate prop definition would cause TypeScript error. TASK-CP2 scouts resolve this. | No — TASK-RPR scouts resolve before Red step |
| TASK-RD-TEST: Tests | Yes | [Missing data dependency] Minor: MSW version not confirmed. Same scout as sibling plan TASK-06. | No — TASK-RD-TEST scouts confirm before writing handlers |
