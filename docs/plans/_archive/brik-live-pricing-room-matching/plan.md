---
Type: Plan
Status: Archived
Domain: API
Workstream: Engineering
Created: 2026-03-02
Last-reviewed: 2026-03-02
Last-updated: 2026-03-02
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brik-live-pricing-room-matching
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# BRIK Live Pricing — Room Matching Fix Plan

## Summary

Live Octorate availability is active in production (`NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY=1`) but broken for 10 of 11 room types. The root cause is that the proxy route extracts `data-id` from Octobook's `<h1>` as a room identifier — but this attribute is always `"3"` in live Octobook HTML (a JSF UI animation attribute). The matching logic in three places (`RoomsSection`, `useAvailabilityForRoom`, `HomeContent.tsx`) then matches against `widgetRoomCode`, finding only the one room with code `"3"`.

The fix has two parts: (1) add an `octorateRoomCategory` string field to `roomsData.ts` and normalise Octobook name variants in the route parser; (2) rewrite the three matching sites to group sections by canonical category name, take the lowest `priceFrom` across matching rate-plan sections, and mark sold-out only when all sections for a category are unavailable. Ten files are affected: `roomsData.ts`, `octorate-availability.ts`, `route.ts`, `RoomsSection.tsx`, `useAvailabilityForRoom.ts`, `HomeContent.tsx`, one new aggregation utility, two updated test files (`route.test.ts`, `useAvailabilityForRoom.test.ts`), and one new test file (`aggregateAvailabilityByCategory.test.ts`).

## Active tasks

- [x] TASK-01: Add `octorateRoomCategory` to `Room` interface and `roomsData` — Complete (2026-03-02)
- [x] TASK-02: Add name normalisation to route parser (`parseRoomSection`) — Complete (2026-03-02)
- [x] TASK-03: Fix matching + aggregation in RoomsSection, useAvailabilityForRoom, HomeContent — Complete (2026-03-02)
- [x] TASK-04: Update tests (route, hook, aggregation utility) — Complete (2026-03-02)

## Goals

- Match Brikette rooms to Octobook sections by canonical room category name, not broken `data-id`.
- Normalise Octobook name variants (`"Dorm Room"` → `"Dorm"`) at parse time in the route.
- Take lowest `priceFrom` across all matching rate-plan sections per room category.
- Mark sold-out only when ALL matching sections for a category are unavailable.
- Fix all three matching paths: `RoomsSection`, `useAvailabilityForRoom`, `HomeContent.tsx`.
- Update tests to reflect real Octobook HTML (all `data-id="3"`, name-based matching).

## Non-goals

- Changing the Octobook URL, fetch logic, or 5-minute cache.
- Rate plan label display or differentiation.
- `pax` parameter optimisation.
- Removing `octorateRoomId` from the type (retained for backwards-compat with existing tests; documented as unreliable in production).

## Constraints & Assumptions

- Constraints:
  - `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` flag must remain; `basePrice` fallback is preserved.
  - Must pass existing CI test gate and strict i18n audit.
  - No Cloudflare KV changes — pure parser/matching fix.
- Assumptions:
  - `room_8` (`widgetRoomCode: "8"`, 1 bunk bed, female-only) maps to `"Dorm Room with One Bunkbed"`. Was sold out on the 2026-03-02 live fetch. TASK-02 scout verifies by fetching Octobook for a date when `"Dorm Room with One Bunkbed"` is available (or inferring from the normalisation table — the category is distinct and carries unique sold-out semantics if it appears).
  - All other 8 dorm rooms (3, 4, 5, 6, 9, 10, 11, 12) map to `"Dorm"`. Confirmed by live fetch. `room_8` is the 9th dorm room and maps to `"Dorm Room with One Bunkbed"` (assumed; scout in TASK-02 verifies).
  - `"Double"` and `"Apartment"` have one section each (confirmed by live fetch).

## Inherited Outcome Contract

- **Why:** Live pricing is running in production but only one room type shows a live price. The majority of rooms silently fall back to `basePrice`. Guests comparing rooms see inconsistent data.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All Brikette room categories (Dorm, Double, Apartment) show live Octorate prices on the /book page and room detail pages when dates are selected and availability data is returned by the proxy.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/brik-live-pricing-room-matching/fact-find.md`
- Key findings used:
  - Live Octobook HTML always returns `data-id="3"` on `<h1>` — confirmed by direct fetch 2026-03-02.
  - `octorateRoomName` (h1 text) is the correct discriminator.
  - Three matching sites: `RoomsSection.tsx:59`, `useAvailabilityForRoom.ts:104`, `HomeContent.tsx:74`.
  - `roomsData.ts` has 11 rooms; no `octorateRoomCategory` field currently.
  - Normalisation table: `"Dorm Room"` → `"Dorm"`, others pass through.
  - Aggregation semantics: min `priceFrom`, any-available = available.

## Proposed Approach

- Option A (chosen): Name-based matching with parse-time normalisation + hook/component-layer aggregation.
  - Route normalises raw h1 text to canonical category string in `parseRoomSection`.
  - `roomsData.ts` gains `octorateRoomCategory` field.
  - All three matching sites aggregate multiple sections per category and match by `octorateRoomName === octorateRoomCategory`.
  - Shared aggregation utility (`aggregateAvailabilityByCategory`) extracted to avoid duplicating aggregation logic across three files.
- Option B (rejected): API-level aggregation. The route collapses multiple sections into one record per category before returning. Rejected because it removes flexibility for callers and collapses data prematurely for non-booking pages. Per fact-find open question resolution: API normalises names, UI aggregates.

**Chosen approach:** Option A.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add `octorateRoomCategory` to `Room` + populate `roomsData` | 85% | S | Pending | - | TASK-03 |
| TASK-02 | IMPLEMENT | Add name normalisation to `parseRoomSection` in route | 85% | S | Pending | - | TASK-03 |
| TASK-03 | IMPLEMENT | Fix matching + aggregation in three consumer sites | 85% | M | Pending | TASK-01, TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Update route and hook tests; add aggregation unit tests | 80% | S | Pending | TASK-03 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Independent; run in parallel |
| 2 | TASK-03 | TASK-01, TASK-02 | Depends on both; single unit |
| 3 | TASK-04 | TASK-03 | Test updates; run after TASK-03 |

## Tasks

---

### TASK-01: Add `octorateRoomCategory` to `Room` and populate `roomsData`

- **Type:** IMPLEMENT
- **Deliverable:** Modified `roomsData.ts` (11 room objects updated), minor annotation in `octorate-availability.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/brikette/src/data/roomsData.ts` — add `octorateRoomCategory?: string` to `Room` interface; populate for all 11 rooms
  - `apps/brikette/src/types/octorate-availability.ts` — add code comment on `octorateRoomId` field noting it's unreliable in production (always `"3"`); no interface change
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 90% — all 11 rooms and their category values are known from live fetch and mapping table in fact-find. Field is additive; no breaking change.
  - Approach: 85% — `room_8` mapping to `"Dorm Room with One Bunkbed"` is assumed (was sold-out on live fetch date). TASK-02 scout resolves this. Held-back test: if `room_8` maps to `"Dorm"` instead, correctness is unaffected (all dorms still get lowest dorm price); only sold-out tracking for that specific room changes. Score stays at 85%.
  - Impact: 85% — prerequisite for all matching fixes; no user-visible change by itself.
- **Acceptance:**
  - `Room` interface has optional `octorateRoomCategory?: string` field.
  - All 11 `roomsData` entries have `octorateRoomCategory` populated:
    - `double_room` → `"Double"`
    - `apartment` → `"Apartment"`
    - `room_3`, `room_4`, `room_5`, `room_6`, `room_9`, `room_10`, `room_11`, `room_12` → `"Dorm"`
    - `room_8` → `"Dorm Room with One Bunkbed"` (verify/adjust in TASK-02 scout)
  - `octorate-availability.ts` `octorateRoomId` field has a code comment: `// NOTE: always "3" in live Octobook HTML (JSF UI attribute) — do not use for matching`
  - TypeScript: no new type errors in `roomsData.ts` or consumers.
- **Validation contract (TC-01):**
  - TC-01-01: All 11 rooms in `roomsData` have a non-empty `octorateRoomCategory` string.
  - TC-01-02: `Room` interface compiles without error; consumers of `Room` that don't use `octorateRoomCategory` are unaffected (field is optional).
  - TC-01-03: `double_room.octorateRoomCategory === "Double"`, `apartment.octorateRoomCategory === "Apartment"`, all 9 dorm rooms have `octorateRoomCategory` starting with `"Dorm"`.
- **Execution plan:**
  - Red: Add `octorateRoomCategory?: string` to `Room` interface. TypeScript now allows but doesn't require the field.
  - Green: Add `octorateRoomCategory` to all 11 room objects in `roomsData`.
  - Refactor: Add code comment to `octorateRoomId` in `octorate-availability.ts`.
- **Planning validation:**
  - Checks run: Confirmed `Room` interface shape in `roomsData.ts:60-70`. Field is optional — all existing consumers that only read other fields are unaffected.
  - Validation artifacts: `apps/brikette/src/data/roomsData.ts` (read 2026-03-02).
  - Unexpected findings: None.
- **Scouts:** Verify `room_8` Octobook name at build start. Fetch `result.xhtml?codice=45111` with a check-in date when `"Dorm Room with One Bunkbed"` is not sold out (try dates 2-3 weeks out). If returned name differs, update `room_8.octorateRoomCategory` and the normalisation table in TASK-02.
- **Edge Cases & Hardening:**
  - Rooms without `octorateRoomCategory` (e.g. if field is accidentally omitted) fall back to no match → `basePrice`. This is the safe degradation — no crash.
  - Field is optional in the interface so no TypeScript errors on consumers that predate this change.
- **What would make this ≥90%:**
  - `room_8` category confirmed by live Octobook fetch on an available date.
- **Rollout / rollback:**
  - Rollout: deployed as part of the complete fix (all four tasks ship together).
  - Rollback: revert commit. `basePrice` fallback remains active via feature flag.
- **Documentation impact:** None — internal data field; no public API or i18n impact.
- **Notes / references:** Fact-find mapping table `§ Data & Contracts`.

---

### TASK-02: Add name normalisation to route parser

- **Type:** IMPLEMENT
- **Deliverable:** Modified `route.ts` — `OCTOBOOK_ROOM_NAME_NORMALIZATIONS` lookup + applied in `parseRoomSection`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/brikette/src/app/api/availability/route.ts` — add normalisation lookup; apply at end of `parseRoomSection` before return
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 90% — exact location in `parseRoomSection` known; change is ~8 lines. Normalisation table is fully specified in fact-find.
  - Approach: 85% — table correct for all confirmed names. `"Dorm Room"` → `"Dorm"` confirmed. `"Dorm Room with One Bunkbed"` retained (distinct category). Held-back test: if Octobook introduces a new name variant not in the table, it passes through unchanged → no match → `basePrice`. Graceful degradation.
  - Impact: 85% — prerequisite for matching fix; no user-visible change by itself (route output changes but consumers not yet updated).
- **Acceptance:**
  - `OCTOBOOK_ROOM_NAME_NORMALIZATIONS: Record<string, string>` constant defined in `route.ts` with keys: `"Dorm Room"` → `"Dorm"`.
  - `parseRoomSection` applies normalisation to `octorateRoomName` before returning: `octorateRoomName = OCTOBOOK_ROOM_NAME_NORMALIZATIONS[octorateRoomName] ?? octorateRoomName`.
  - `octorateRoomId` retained in returned object unchanged (still extracted from `data-id`; still always `"3"` in production).
  - Unknown name variants pass through unchanged (no throw, no silent drop).
- **Validation contract (TC-02):**
  - TC-02-01: `parseRoomSection` with h1 text `"Dorm Room"` → `octorateRoomName: "Dorm"`.
  - TC-02-02: `parseRoomSection` with h1 text `"Dorm"` → `octorateRoomName: "Dorm"` (identity).
  - TC-02-03: `parseRoomSection` with h1 text `"Dorm Room with One Bunkbed"` → `octorateRoomName: "Dorm Room with One Bunkbed"` (pass-through).
  - TC-02-04: `parseRoomSection` with h1 text `"Unknown Type"` → `octorateRoomName: "Unknown Type"` (pass-through, no crash).
  - TC-02-05: `octorateRoomId` field is unchanged (still `"3"` from fixture html `data-id="3"`).
- **Execution plan:**
  - Red: Add `OCTOBOOK_ROOM_NAME_NORMALIZATIONS` constant above `parseRoomSection`.
  - Green: Apply in `parseRoomSection`: after extracting `octorateRoomName`, apply: `const normalized = OCTOBOOK_ROOM_NAME_NORMALIZATIONS[octorateRoomName] ?? octorateRoomName;` and use `normalized` in return object.
  - Refactor: Ensure constant is commented with note about Octobook name variants.
- **Planning validation:**
  - Checks run: Read `route.ts` in full (2026-03-02). `parseRoomSection` is the only parser; `octorateRoomName` is extracted at line 74 from `stripTags(h1Match[2]).trim()`. The return statement is at line 110.
  - Validation artifacts: `apps/brikette/src/app/api/availability/route.ts` (read 2026-03-02).
  - Unexpected findings: None. Parser structure is clean and single-purpose.
- **Scouts:** During build, fetch live Octobook for 2-3 date combinations and log all unique `h1` text values to verify no missing variants. If any new variant is found, add to `OCTOBOOK_ROOM_NAME_NORMALIZATIONS` before shipping.
- **Edge Cases & Hardening:**
  - Empty h1 match → `octorateRoomName: "Unknown"` (existing behaviour from `parseRoomSection:74`). No entry in normalisation table → pass-through. No crash.
  - Normalisation is case-sensitive. Octobook returns consistent casing (confirmed in live fetch). No need for case folding.
- **What would make this ≥90%:**
  - Exhaustive enumeration of all h1 text values returned by Octobook across all room types and all date ranges. Requires live fetch with non-sold-out dates for `room_8`.
- **Rollout / rollback:**
  - Rollout: deployed as part of complete fix.
  - Rollback: revert commit.
- **Documentation impact:** None.
- **Notes / references:** Fact-find `§ Octobook name normalisation` table.

---

### TASK-03: Fix matching and aggregation in three consumer sites

- **Type:** IMPLEMENT
- **Deliverable:** Modified `RoomsSection.tsx`, `useAvailabilityForRoom.ts`, `HomeContent.tsx`; new utility `aggregateAvailabilityByCategory.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/brikette/src/components/rooms/RoomsSection.tsx` — replace broken matching with name-based aggregation
  - `apps/brikette/src/hooks/useAvailabilityForRoom.ts` — replace broken find with aggregation call
  - `apps/brikette/src/app/[lang]/HomeContent.tsx` — replace broken matching with name-based aggregation
  - `apps/brikette/src/utils/aggregateAvailabilityByCategory.ts` — new shared aggregation utility
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 90% — all three change locations are precisely identified with line numbers. Aggregation logic is simple pure functions (min/any). Consumer blast radius fully traced.
  - Approach: 85% — name-based matching + min-priceFrom aggregation is confirmed correct by the fact-find open question resolution and by direct inspection of the live Octobook response structure (multiple Dorm sections at different price points). Held-back test: if Octobook restructures its sections (e.g. merges all rate plans into one section), the aggregation still returns correct result (single match, same price). Score stays at 85%.
  - Impact: 90% — directly fixes 10/11 rooms showing `basePrice` instead of live price. Dorm, Double, and Apartment all get correct pricing.
- **Acceptance:**
  - `aggregateAvailabilityByCategory(rooms: OctorateRoom[], category: string): OctorateRoom | undefined`:
    - Returns `undefined` when no sections match `octorateRoomName === category`.
    - When all matching sections are sold-out: returns aggregated record with `available: false`, `priceFrom: null`.
    - When any matching section is available: returns aggregated record with `available: true`, `priceFrom: min(non-null priceFrom values across available sections)`.
    - Returns a synthetic `OctorateRoom` with aggregated `available` and `priceFrom`; `nights` from the first matched section; `ratePlans: []` (rate plan labels are not used for display and are omitted on the synthetic record).
  - `RoomsSection.tsx`: iterates over `roomsData` entries with `octorateRoomCategory`; calls `aggregateAvailabilityByCategory(availabilityRooms, room.octorateRoomCategory)` for each; builds `prices` map keyed by `room.id`. Replaces the existing `for (const avRoom of availabilityRooms)` loop.
  - `useAvailabilityForRoom.ts`: line 104 replaced with `const matched = aggregateAvailabilityByCategory(rooms, room.octorateRoomCategory ?? "");`. `availabilityRoom` is now the aggregated record or `undefined`.
  - `HomeContent.tsx`: line 74 matching replaced with same name-based aggregation pattern as `RoomsSection`.
  - **Expected user-observable behavior:**
    - [ ] On `/book` page with dates selected: all Dorm rooms show the same "from" live price (lowest rate plan across all Dorm sections), not just room_3.
    - [ ] Double and Apartment rooms show their respective live prices.
    - [ ] Sold-out rooms (all sections sold out) show a sold-out state instead of basePrice.
    - [ ] Without dates selected: no change — basePrice still shown.
    - [ ] On landing page (`/en`): lowest available price displayed in the booking widget reflects live data.
    - [ ] On room detail pages (`/dorms/[id]`): live price shown when dates are selected.
- **Consumer Tracing (M effort — Phase 5.5):**
  - **New output: `aggregateAvailabilityByCategory`**
    - Consumer 1: `RoomsSection.tsx` — in `roomPrices` useMemo. Addressed in this task.
    - Consumer 2: `useAvailabilityForRoom.ts` — in matching logic. Addressed in this task.
    - Consumer 3: `HomeContent.tsx` — in `roomPrices` useMemo. Addressed in this task.
    - No other consumers. Utility is not exported from index.
  - **New field: `room.octorateRoomCategory` (from TASK-01)**
    - Read by: `RoomsSection` aggregation call, `useAvailabilityForRoom` aggregation call, `HomeContent` aggregation call. All addressed.
    - Consumer `RoomCard`: unchanged — receives `RoomCardPrice` object from the prices map, not `octorateRoomCategory` directly. Safe.
    - Consumer `RecoveryQuoteCapture`: uses `availabilityRooms.length` (raw array length, not matched rooms). Count becomes more accurate after fix but no logic change needed. Safe.
  - **Modified behavior: `RoomsSection.roomPrices` useMemo**
    - Previously: one-to-one match via `octorateRoomId === widgetRoomCode` → returns first matching OctorateRoom.
    - After: aggregates multiple sections per category → returns synthetic OctorateRoom.
    - Callers of `RoomsSection`: `BookPageContent.tsx:253` passes `availabilityRooms` prop. `RoomsSection` computes `roomPrices` internally and passes to `RoomsSectionBase`. No caller change needed.
  - **Modified behavior: `useAvailabilityForRoom` return value**
    - `availabilityRoom` field was one matching `OctorateRoom` or `undefined`. After fix: aggregated `OctorateRoom` or `undefined`. Same type, same shape. Consumer `useRoomDetailBookingState` destructures `availabilityRoom` and passes to `RoomDetailContent` → `RoomCard`. `RoomCard` uses `.available` and `.priceFrom` — both present in aggregated record. Safe.
  - **Modified behavior: `HomeContent.roomPrices` useMemo**
    - Same pattern as `RoomsSection`. Consumer: `RoomsSectionBase` passed the prices record. No change needed there.
- **Validation contract (TC-03):**
  - TC-03-01: `aggregateAvailabilityByCategory([], "Dorm")` → `undefined`.
  - TC-03-02: `aggregateAvailabilityByCategory([{octorateRoomName:"Double", octorateRoomId:"3", available:true, priceFrom:200, nights:2, ratePlans:[]}], "Dorm")` → `undefined` (no category match).
  - TC-03-03: Two Dorm sections, prices 94.99 and 80.00 → aggregated `priceFrom: 80.00`.
  - TC-03-04: Two Dorm sections, one available (€80), one sold out → `available: true, priceFrom: 80`.
  - TC-03-05: Two Dorm sections, both sold out → `available: false, priceFrom: null`.
  - TC-03-06: Single Double section available → returns synthetic `OctorateRoom` with `available: true`, `priceFrom` matching that section, `ratePlans: []`.
  - TC-03-07: `RoomsSection` with 11 Octobook sections (8 Dorm + Double + Apartment + DormBunkbed) → produces prices map with entries for all matched `roomsData` categories.
  - TC-03-08: `useAvailabilityForRoom` for `double_room` (`octorateRoomCategory: "Double"`) with one Double section in API response → calls `aggregateAvailabilityByCategory(rooms, "Double")` → returns synthetic `OctorateRoom` with matching `available` and `priceFrom`, `ratePlans: []`.
- **Execution plan:**
  - Red: Create `apps/brikette/src/utils/aggregateAvailabilityByCategory.ts` with exported function `aggregateAvailabilityByCategory`. TypeScript errors in callers since they still use the old logic.
  - Green: Update `RoomsSection.tsx` to iterate `roomsData`, call aggregation per `octorateRoomCategory`. Update `useAvailabilityForRoom.ts` line 104. Update `HomeContent.tsx` line 74.
  - Refactor: Remove the old `// Map availabilityRooms (keyed by octorateRoomId)` comment from RoomsSection; update doc comments.
- **Planning validation (M effort):**
  - Checks run:
    - Read `RoomsSection.tsx:46-73` (matching useMemo block).
    - Read `useAvailabilityForRoom.ts:100-105` (matching logic).
    - Read `HomeContent.tsx:70-86` (matching useMemo block).
    - Confirmed all three have the same structural pattern (iterate raw sections → find by ID → build prices map).
    - Confirmed `RoomCard` interface does not depend on `OctorateRoom` structure directly — receives `RoomCardPrice` object.
  - Validation artifacts: All three files read on 2026-03-02.
  - Unexpected findings: `useAvailabilityForRoom` comment header at line 4 says "filters by room.widgetRoomCode === octorateRoomId" — this doc comment needs updating.
- **Scouts:** None — all implementation details confirmed by code inspection.
- **Edge Cases & Hardening:**
  - Room with no `octorateRoomCategory` (optional field): `aggregateAvailabilityByCategory(rooms, "")` → no match → `undefined` → `basePrice`. Safe.
  - Octobook returns 0 sections (empty array): all rooms get `undefined` → `basePrice`. Same as today when flag is off.
  - Price for a category is all null (e.g. all sections have `priceFrom: null` but are available): aggregated `priceFrom: null`. `RoomCard` with `soldOut: false` and no price renders as it does today with no live price. Acceptable edge case.
  - `RoomsSection` fallback chain: `if (availabilityRooms.length === 0) return roomPricesOverride`. This fast-path is preserved.
- **What would make this ≥90%:**
  - A verified live Octobook fetch confirming all 11 rooms produce matches with the category table, including `room_8`.
- **Rollout / rollback:**
  - Rollout: deployed as part of complete fix. Feature flag `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` remains.
  - Rollback: revert commit. `basePrice` fallback is unaffected.
- **Documentation impact:**
  - Update `useAvailabilityForRoom.ts` JSDoc comment at line 40 ("filters by room.widgetRoomCode === octorateRoomId") to describe the new behaviour.
  - Update `RoomsSection.tsx` comment at line 53 ("Map availabilityRooms (keyed by octorateRoomId)").
- **Notes / references:** Fact-find `§ Dependency & Impact Map`; `§ Open Questions`.

---

### TASK-04: Update tests

- **Type:** IMPLEMENT
- **Deliverable:** Updated `route.test.ts`, updated `useAvailabilityForRoom.test.ts`, new `aggregateAvailabilityByCategory.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/brikette/src/app/api/availability/route.test.ts` — update fixtures, add normalisation test, retarget `octorateRoomId` assertions
  - `apps/brikette/src/hooks/useAvailabilityForRoom.test.ts` — update mock data; use name-based matching
  - `apps/brikette/src/utils/aggregateAvailabilityByCategory.test.ts` — new; unit tests for TC-03-01 through TC-03-06
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% — specific tests to change and add are enumerated in the fact-find. Fixture structure known.
  - Approach: 80% — existing `route.test.ts` uses `jest.resetModules` / feature-flag override pattern. Fixtures need `data-id="3"` update and new normalization assertion. Held-back test: if the `"Value Dorm"` fixture name in `FIXTURE_EURO_ENTITY_HTML` creates a normalisation test collision (not in the normalisation table → passes through as `"Value Dorm"`), a test asserting `octorateRoomName: "Value Dorm"` still passes. Score stays at 80%.
  - Impact: 80% — test updates verify the new contract; prevents regression to ID-based matching.
- **Acceptance:**
  - `route.test.ts`:
    - `FIXTURE_TWO_ROOMS_HTML`: `data-id="7"` → `data-id="3"`, `data-id="10"` → `data-id="3"` (both sections use `data-id="3"` like live HTML).
    - Assertions `octorateRoomId === "10"` (TC-01-02 line 130, TC-01-04 line 158) and `octorateRoomId === "7"` (TC-01-03 line 144) updated to `"3"` (or removed/replaced with name-only assertions).
    - New test: `"Dorm Room" in h1 → octorateRoomName normalized to "Dorm"`.
  - `useAvailabilityForRoom.test.ts`:
    - Mock `OctorateRoom` data updated: `octorateRoomName: "Dorm"` matches `room.octorateRoomCategory: "Dorm"`. Remove `octorateRoomId: "7"` matching pattern.
    - Add test: multiple Dorm sections in mock response → aggregated `priceFrom` is the minimum.
    - Add test: mixed availability in mock response → aggregated result is available at lowest available price.
  - `aggregateAvailabilityByCategory.test.ts`:
    - Unit tests covering TC-03-01 through TC-03-06 (empty, no-match, min-price, mixed-availability, all-sold-out, single-match).
  - TypeScript: no new type errors in test files.
- **Validation contract (TC-04):**
  - TC-04-01: All existing route tests pass with updated fixtures.
  - TC-04-02: New normalisation test passes.
  - TC-04-03: `useAvailabilityForRoom` tests pass with name-based mock data.
  - TC-04-04: All 6 aggregation unit tests pass.
- **Execution plan:**
  - Red: Update fixture `data-id` values; push to CI and confirm `octorateRoomId` assertions fail as expected.
  - Green: Fix `octorateRoomId` assertions; add normalisation test; add aggregation unit test file; update hook test mocks. Push to CI → all tests green.
  - Refactor: Review test descriptions to remove references to "room ID matching". Push and confirm CI still green.
- **Planning validation:**
  - Checks run: Read `route.test.ts` lines 1-180 (all fixtures and assertions identified).
  - Validation artifacts: `route.test.ts` read 2026-03-02.
  - Unexpected findings: `FIXTURE_EURO_ENTITY_HTML` uses `data-id="3"` already — no change needed for that fixture. Only `FIXTURE_TWO_ROOMS_HTML` uses fake `data-id` values (7, 10).
- **Scouts:** None.
- **Edge Cases & Hardening:**
  - Existing passing tests that don't assert on `octorateRoomId` remain unaffected.
  - New aggregation utility is pure (no React hooks, no network) — unit tests run in isolation without mocking.
- **What would make this ≥90%:**
  - E2E smoke test against staging confirming all 3 room categories show live prices.
- **Rollout / rollback:**
  - Rollout: part of complete fix.
  - Rollback: revert commit.
- **Documentation impact:** None beyond test descriptions updated.
- **Notes / references:** Fact-find `§ Test Landscape`.

---

## Risks & Mitigations

1. **`room_8` maps to a different Octobook name than assumed** — if it maps to `"Dorm"`, correctness is unaffected; only sold-out state tracking for that specific room changes. TASK-02 scout verifies. Mitigation: check at build start; adjust category if needed.
2. **Octobook HTML structure changes** — if `octorateRoomName` values change (rebrand or localisation), matching silently breaks. Mitigation: normalisation table isolates this; adding a live smoke test addresses long-term.
3. **Multiple dorm rooms share the same live `priceFrom`** — all 9 dorm types will show the same lowest rate-plan price. Correct semantics ("from €X/bed") but hides per-room differentiation. Acceptable for current scope.
4. **`octorateRoomId` retained but always `"3"`** — keeping the field avoids breaking existing tests but is misleading. Mitigation: code comment added in TASK-01; tests updated to use `"3"` in TASK-04.

## Observability

- Logging: `/api/availability` route logs upstream errors already (`console.error`). No new logging needed.
- Metrics: None: — this is a correctness fix, not a new feature. The existing availability hook already tracks loading/error state.
- Alerts/Dashboards: None: — monitor via GA4 `select_item` events on room cards (more rooms should now show live prices, increasing event volume for non-room_3 rooms).

## Acceptance Criteria (overall)

- [ ] All 11 Brikette room types have `octorateRoomCategory` populated in `roomsData.ts`.
- [ ] `parseRoomSection` normalises `"Dorm Room"` → `"Dorm"` in the returned `octorateRoomName`.
- [ ] On `/book` with valid dates: Dorm rooms show live prices (not `basePrice`) when availability data is returned.
- [ ] On `/dorms/[id]` with valid dates: room detail pages show live prices.
- [ ] On `/en` landing page with dates: lowest available price reflects live data.
- [ ] No TypeScript errors introduced.
- [ ] All existing and new unit tests pass.
- [ ] Feature flag `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY=0` still restores `basePrice` fallback.

## Decision Log

- 2026-03-02: Name-based matching chosen over API-level aggregation. Normalisation at parse time (route), aggregation at matching time (UI). Rationale: keeps route as thin parser; UI callers retain flexibility.
- 2026-03-02: `octorateRoomId` retained in `OctorateRoom` type (not removed) to avoid breaking existing test fixtures. Code comment added noting it's unreliable in production.

## Overall-confidence Calculation

- TASK-01: S=1, confidence=85%
- TASK-02: S=1, confidence=85%
- TASK-03: M=2, confidence=85%
- TASK-04: S=1, confidence=80%
- Weighted = (85 + 85 + 85×2 + 80) / (1+1+2+1) = 420 / 5 = **84%**

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add `octorateRoomCategory` to Room + roomsData | Yes — no dependencies | None | No |
| TASK-02: Add name normalisation to parseRoomSection | Yes — no dependencies | None | No |
| TASK-03: Fix matching + aggregation in 3 consumer sites | Yes — TASK-01 provides `octorateRoomCategory`; TASK-02 provides normalised names | [Minor] `useAvailabilityForRoom` JSDoc still references old ID-matching (addressed in Refactor step) | No |
| TASK-04: Update tests | Yes — TASK-03 provides the final behaviour to test | [Minor] `FIXTURE_EURO_ENTITY_HTML` already uses `data-id="3"` — no change needed there (noted in fact-find) | No |

No Critical or Major simulation findings. All advisory items addressed in task execution plans.
