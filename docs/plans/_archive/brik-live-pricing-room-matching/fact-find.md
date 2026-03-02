---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: API
Workstream: Engineering
Created: 2026-03-02
Last-updated: 2026-03-02
Feature-Slug: brik-live-pricing-room-matching
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brik-live-pricing-room-matching/plan.md
Trigger-Why: Live pricing is running in production but only shows a price for one room type (whichever Brikette room has widgetRoomCode "3"). All other rooms silently fall back to basePrice.
Trigger-Intended-Outcome: type: operational | statement: All Brikette room types (Dorm, Double, Apartment) show live Octorate prices on the /book page and room detail pages when dates are selected and availability exists. | source: operator
---

# BRIK Live Pricing — Room Matching Fix

## Scope

### Summary

The live Octorate availability feature (`NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY=1`) is running in production but room matching is broken. The proxy route (`/api/availability`) parses the `data-id` attribute on Octobook's `<h1>` element as `octorateRoomId`. In live Octobook HTML this attribute is always `"3"` (a JSF UI animation attribute, not a room type code). The matching logic in `RoomsSection` and `useAvailabilityForRoom` compares `octorateRoomId === room.widgetRoomCode`, which only matches the one Brikette room that happens to have `widgetRoomCode: "3"`. All other rooms get no match and fall back silently to `basePrice`.

Octobook differentiates room types by the `<h1>` text content (`octorateRoomName`): `"Dorm"`, `"Double"`, `"Apartment"`, `"Dorm Room with One Bunkbed"`. Multiple sections per type represent rate plan variants (NR, Flex, breakfast included, etc.) at different price points.

### Goals
- Match Brikette rooms to Octobook sections by room category name, not by the broken `data-id` value.
- Normalise Octobook name variants to canonical categories at parse time in the route (see Data & Contracts).
- For each room, take the lowest `priceFrom` across all matching rate-plan sections.
- Mark a room as sold-out only when ALL matching sections are unavailable.
- Fix all three matching paths: `RoomsSection` (book page), `useAvailabilityForRoom` (room detail page), and `HomeContent.tsx` (landing page lowest-price computation).
- Update tests to reflect real Octobook HTML structure (all `data-id="3"`, category by name).

### Non-goals
- Changing the Octobook URL, fetch logic, or 5-minute cache.
- Rate plan label display (out of scope for this fix).
- `pax` parameter optimisation.

### Constraints & Assumptions
- Constraints:
  - `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` flag must remain; fallback to `basePrice` is preserved.
  - No Cloudflare KV changes — this is a pure parser/matching fix.
  - Must pass existing CI test gate and strict i18n audit.
- Assumptions:
  - Octobook room name `"Dorm"` covers all 9 dorm room types (rooms 3–6, 8–12). Confirmed by live fetch: all dorm sections return `octorateRoomName: "Dorm"` or `"Dorm Room"` or `"Dorm Room with One Bunkbed"`.
  - `room_8` (`widgetRoomCode: "8"`, 1 bunk bed, female-only) likely maps to `"Dorm Room with One Bunkbed"` — this needs to be verified and the mapping codified in `roomsData.ts`.
  - Multiple rate-plan sections per room type: lowest `priceFrom` is the correct display price ("from" semantics).

## Outcome Contract

- **Why:** Live pricing is running in production but only one room type shows a live price. The majority of rooms silently fall back to basePrice. Guests comparing rooms see inconsistent data.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All Brikette room categories (Dorm, Double, Apartment) show live Octorate prices on the /book page and room detail pages when dates are selected and availability data is returned by the proxy.

## Access Declarations

None — all changes are to internal application code and data. No external service credentials required beyond what is already configured for the Octobook proxy.

## Evidence Audit (Current State)

### Entry Points

| Entry point | Role |
|---|---|
| `apps/brikette/src/app/[lang]/book/BookPageContent.tsx:253` | Calls `useAvailability()`, passes `availabilityRooms` array to `RoomsSection` |
| `apps/brikette/src/hooks/useRoomDetailBookingState.ts:111` | Calls `useAvailabilityForRoom()` for room detail page |

### Key Modules / Files

| File | Role | Bug location |
|---|---|---|
| `apps/brikette/src/app/api/availability/route.ts` | Fetches and parses Octobook HTML; extracts `octorateRoomId` from `<h1 data-id>` | Root cause: `data-id` is always `"3"` in live HTML |
| `apps/brikette/src/types/octorate-availability.ts` | `OctorateRoom` type with `octorateRoomId` and `octorateRoomName` fields | `octorateRoomId` field is correct by type but carries wrong value at runtime |
| `apps/brikette/src/data/roomsData.ts` | Room catalogue — 11 rooms with `widgetRoomCode`, no `octorateRoomCategory` field | Missing `octorateRoomCategory` mapping |
| `apps/brikette/src/components/rooms/RoomsSection.tsx:59` | Matches `avRoom.octorateRoomId === room.widgetRoomCode` | Broken match |
| `apps/brikette/src/hooks/useAvailabilityForRoom.ts:104` | Matches `rooms.find(r => r.octorateRoomId === room.widgetRoomCode)` | Broken match |
| `apps/brikette/src/hooks/useAvailability.ts` | Top-level hook — fetches all rooms, no matching logic here | No bug here |
| `apps/brikette/src/app/api/availability/route.test.ts` | Tests use fixture HTML with fake `data-id` values (7, 10) | Fixtures don't reflect live structure |
| `apps/brikette/src/hooks/useAvailabilityForRoom.test.ts` | Tests use `octorateRoomId: "7"` matching `widgetRoomCode: "7"` | Tests pass but represent wrong contract |

### Data & Contracts

**Live Octobook HTML structure (confirmed by fetch 2026-03-02):**
- All room sections: `<h1 class="animated fadeInDownShort" data-id="3">RoomName</h1>`
- `data-id` on `<h1>` is always `"3"` — JSF UI animation attribute, not room ID
- Room differentiation is solely by h1 text content (`octorateRoomName`)
- Octobook names observed: `"Dorm"`, `"Dorm Room"`, `"Double"`, `"Apartment"`, `"Dorm Room with One Bunkbed"`
- Multiple sections per room type = rate plan variants (NR, Flex, board options)
- Lowest section `priceFrom` = the "from" price to display

**Octobook name normalisation (applied in `parseRoomSection` in the route):**

To avoid exact-string fragility across Octobook variants, the route normalises raw h1 text to a canonical category before returning:

| Raw Octobook h1 text | Canonical `octorateRoomName` |
|---|---|
| `"Dorm"` | `"Dorm"` |
| `"Dorm Room"` | `"Dorm"` |
| `"Dorm Room with One Bunkbed"` | `"Dorm Room with One Bunkbed"` |
| `"Double"` | `"Double"` |
| `"Apartment"` | `"Apartment"` |
| Any other | pass through unchanged |

The normalisation is a simple lookup applied in `parseRoomSection`. This keeps the matching layer simple (exact string equality) and isolates name-variant handling to one place.

**Brikette room → Octobook category mapping:**

| Brikette id | widgetRoomCode | Octobook name | Confirmed? |
|---|---|---|---|
| `double_room` | `"7"` | `"Double"` | Yes (live fetch) |
| `apartment` | `"14"` | `"Apartment"` | Yes (live fetch) |
| `room_3` | `"3"` | `"Dorm"` | Yes (8-bed female dorm) |
| `room_4` | `"4"` | `"Dorm"` | Yes (8-bed female dorm) |
| `room_5` | `"5"` | `"Dorm"` | Yes (6-bed sea view) |
| `room_6` | `"6"` | `"Dorm"` | Yes (7-bed sea view) |
| `room_9` | `"9"` | `"Dorm"` | Yes (3-bed courtyard) |
| `room_10` | `"10"` | `"Dorm"` | Yes (6-bed) |
| `room_11` | `"11"` | `"Dorm"` | Yes (6-bed sea view terrace) |
| `room_12` | `"12"` | `"Dorm"` | Yes (6-bed sea view private bath) |
| `room_8` | `"8"` | `"Dorm Room with One Bunkbed"` | Assumed — needs verification |

**`OctorateRoom` type (current):**
```ts
interface OctorateRoom {
  octorateRoomName: string;   // h1 text — correct, used for matching fix
  octorateRoomId: string;     // h1 data-id — always "3" in production
  available: boolean;
  priceFrom: number | null;
  nights: number;
  ratePlans: Array<{ label: string }>;
}
```

**`Room` interface (current):** No `octorateRoomCategory` field.

### Dependency & Impact Map

**Consumers of `availabilityRoom` / `availabilityRooms`:**
- `RoomCard` — receives `availabilityRoom?: OctorateRoom`; uses `.available` and `.priceFrom` for sold-out state and price display. No change needed to RoomCard itself.
- `RoomsSection` (line 59) — builds `roomPricesOverride` map; currently matches one-to-one via broken ID. After fix: matches by name, aggregates multiple rate-plan sections.
- `HomeContent.tsx` (line 74) — computes lowest available price across all rooms for landing page display. Currently matches `widgetRoomCode === availabilityRoom.octorateRoomId` — **broken, needs same fix**.
- `useRoomDetailBookingState` (line 111, via `useAvailabilityForRoom`) — passes `availabilityRoom` return to `RoomDetailContent` → `RoomCard`. No consumer-layer change beyond the hook fix.
- `RecoveryQuoteCapture` — receives `availabilityRooms.length` count to decide whether to render. This becomes more accurate after the fix (currently may show 11 rooms but only 1 matches; after fix, count reflects actual matches). No logic change needed.

**No changes to:**
- Octobook fetch URL, pax parameter, or cache logic
- `buildOctorateUrl.ts`
- i18n strings or translation files

### Test Landscape

**Existing tests:**
- `apps/brikette/src/app/api/availability/route.test.ts` — fixture-based HTML parser tests. Fixtures use artificial `data-id` values (7, 10) that don't match live structure. Tests for `octorateRoomId` assertions (lines 130, 144, 158) are valid for the parser but mislead about production contract.
- `apps/brikette/src/hooks/useAvailabilityForRoom.test.ts` — hook tests using `octorateRoomId: "7"` matching `widgetRoomCode: "7"`. Tests pass but contract is wrong.

**Tests to update:**
- `route.test.ts`: Update fixtures to use `data-id="3"` on all sections (realistic). Add test for name normalization in parser (`"Dorm Room"` → `"Dorm"` in parsed output). Remove or retarget `octorateRoomId` assertions if field is deprecated. Note: aggregation (`min priceFrom` across sections) is not tested here — it belongs in the matching layer.
- `useAvailabilityForRoom.test.ts`: Update mock response to use `octorateRoomName: "Dorm"` matching `room.octorateRoomCategory: "Dorm"` instead of ID-based match. Add aggregation tests here (multiple Dorm sections → lowest priceFrom, mixed availability → available at lowest price).

**Test coverage gaps after fix:** need at least one test per path:
- Multiple matching sections → lowest priceFrom wins
- All matching sections sold out → room sold out
- Mixed available/sold-out sections → room available at lowest available price
- Room with no matching sections → falls back to basePrice (returns undefined)

### Recent Git History (Targeted)

- `36843c7072` (2026-02-27): "add useAvailabilityForRoom hook + fix room matching" — introduced current broken matching (`widgetRoomCode === octorateRoomId`). The commit title says "fix room matching" but the fix was from `octorateRoomName` → `octorateRoomId`, which swapped one wrong key for another wrong key. Root cause of `data-id` always being `"3"` was not detected at that point.
- `2b4a988b84`: TASK-01 — initial Octobook HTML-scraping proxy. `octorateRoomId` field added here.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Route parser — `octorateRoomName` extraction | Yes | None — h1 text content extraction is correct | No |
| Route parser — `octorateRoomId` extraction | Yes | `data-id` on h1 is always `"3"` in live HTML | No (fix is in matching layer, not parser) |
| Matching layer — `RoomsSection` | Yes | Line 59 uses `octorateRoomId` | No — addressed by fix |
| Matching layer — `useAvailabilityForRoom` | Yes | Line 104 uses `octorateRoomId` | No — addressed by fix |
| `roomsData.ts` — category field | Yes | Missing `octorateRoomCategory` field | No — addressed by fix |
| Aggregation — multiple rate-plan sections per room | Yes | No aggregation today; first-match wins | No — addressed by fix |
| `room_8` Octobook name | Partial | Assumed `"Dorm Room with One Bunkbed"` — not confirmed by live fetch on sold-out date | No — assumption documented; verified at build time |
| Test fixtures — realistic HTML structure | Yes | Fixtures use fake `data-id` values | No — tests still valid for parser; matching tests need update |
| Consumer blast radius — `RoomCard`, `RecoveryQuoteCapture` | Yes | No interface changes required | No |

## Scope Signal

**Signal: right-sized**

**Rationale:** Six files to change (route normalization, types, data, three matching locations — `RoomsSection`, `useAvailabilityForRoom`, `HomeContent.tsx` — and tests). No new external dependencies. The route's `parseRoomSection` gains a small name-normalization lookup table (`OCTOBOOK_ROOM_NAME_NORMALIZATIONS`); this is the only change to the parser. The fix is additive (`octorateRoomCategory` field) with a backwards-compatible fallback (rooms without the field continue to return no match → `basePrice`). Aggregation logic (min priceFrom, combined availability) stays in the matching layer (hooks/components) and is simple and bounded.

## Confidence Inputs

| Dimension | Score | Justification |
|---|---|---|
| Implementation | 92% | All 6 files and change locations identified precisely: route normalization, types, data, three matching locations (`RoomsSection`, `useAvailabilityForRoom`, `HomeContent.tsx`), and tests. Matching change is a one-line substitution at each site plus aggregation. No ambiguity. |
| Approach | 88% | Name-based matching confirmed correct from live Octobook data. One assumption: `room_8` maps to `"Dorm Room with One Bunkbed"` — verifiable at build start with a fresh Octobook fetch for that specific room type. |
| Impact | 90% | Fixes 10/11 rooms showing `basePrice` instead of live price. Direct improvement to pricing accuracy on the book page and room detail pages. |
| Delivery-Readiness | 92% | No unknowns blocking implementation. `room_8` mapping is verifiable without operator input. |
| Testability | 88% | Fixture-based tests remain valid. Aggregation logic is pure and unit-testable without network. |

**Overall-confidence: 90%** (min of implementation, approach, impact; weighted by effort M).

## Risks

1. **`room_8` maps to a different Octobook name than assumed** — if `room_8` maps to `"Dorm"` rather than `"Dorm Room with One Bunkbed"`, the mapping is still correct (all dorms show lowest dorm price). Risk: none to correctness, minor to sold-out tracking for that specific room.
2. **Octobook HTML structure changes** — Octobook is a third-party JSF app. If `octorateRoomName` values change (e.g. localisation or rebrand), matching silently breaks. Mitigation: document category values and add a smoke test against live endpoint.
3. **Multiple dorm types get the same `priceFrom`** — all 9 dorm rooms will show the same lowest-rate-plan price. This is correct semantics ("from €X/bed") but hides per-room pricing differentiation. Acceptable for current scope.
4. **`octorateRoomId` retained in type but unused** — keeping the field avoids breaking test fixtures but is confusing. Mitigation: add a code comment noting it's unreliable in production.

## Evidence Gap Review

### Gaps Addressed
- Root cause of matching failure: confirmed by live Octobook fetch (all `data-id="3"`).
- Correct discriminator: `octorateRoomName` (h1 text) — already extracted by parser.
- All consumers identified: `RoomsSection`, `useAvailabilityForRoom` / `useRoomDetailBookingState`, `HomeContent.tsx`.
- Test landscape: existing tests identified; update scope bounded.

### Confidence Adjustments
- None needed. Evidence is direct from live HTML and code inspection.

### Remaining Assumptions
- `room_8` → `"Dorm Room with One Bunkbed"` mapping (verifiable at build start).
- All 9 dorm Brikette rooms map to `"Dorm"` or its variants — live fetch confirms this for the 8 non-sold-out dorm sections.

## Open Questions

All resolved:

| Question | Resolution |
|---|---|
| Is `data-id` on h1 ever a real room code? | No — live Octobook HTML always returns `data-id="3"` for all 11 sections across two different pax searches. |
| What is the correct room discriminator? | `octorateRoomName` (h1 text content) — already correctly extracted by the parser. |
| Should matching happen at API level or hook level? | **Explicit boundary:** API layer (`parseRoomSection` in route.ts) normalizes Octobook name variants to canonical strings (e.g. `"Dorm Room"` → `"Dorm"`). Hook/component layer aggregates sections by canonical name (min price, combined availability) and maps to `roomsData`. The API returns all sections; callers aggregate. This separation keeps the route a thin parser and keeps aggregation strategy in UI code. |
| How to handle multiple rate-plan sections for same room type? | Take min `priceFrom` across all matching sections. Room is available if ANY section is available. |
| Does RoomCard need changes? | No — it receives a single `OctorateRoom` (or undefined). The aggregated result can be constructed as a synthetic `OctorateRoom` at the matching layer. |
