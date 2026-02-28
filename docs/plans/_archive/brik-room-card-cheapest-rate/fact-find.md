---
Feature-Slug: brik-room-card-cheapest-rate
Business: BRIK
Outcome: planning
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
Status: Ready-for-planning
Dispatch-ID: IDEA-DISPATCH-20260228-0002
Created: 2026-02-28
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brik-room-card-cheapest-rate/plan.md
Trigger-Why: TBD
Trigger-Intended-Outcome: TBD
---

# BRIK Room Card Cheapest Rate Display Fact-Find

## Scope

### Summary

Each room card on `/en/rooms` and `/en/book` currently renders two action buttons: "Non-Refundable Rates" and "Flexible Room Rates". The proposal replaces this with a single CTA that surfaces the cheapest available rate — either embedded in the button label ("Book from €45/night") or as a separate price display ("From €45/night") next to a simpler "Check rates" button.

The key question is whether the architecture supports a single-CTA flow without losing the rate-type distinction that Octorate requires to navigate a user to the correct rate plan.

### Goals

- Show the cheapest available rate prominently on each room card on both `/rooms` and `/book`
- Reduce visual noise from the dual-button layout
- Maintain a clear conversion path to Octorate booking for the chosen rate
- Keep GA4 event semantics intact (select_item / begin_checkout)

### Non-goals

- Replacing the Octorate booking engine itself
- Removing rate-type distinction from the deep-link URL (this must be preserved)
- Building a full room detail redesign in this scope
- Making `/rooms` page (no-date context) show live pricing — see rate plan selection discussion below

### Constraints & Assumptions

- Constraints:
  - `buildOctorateUrl` requires an explicit `plan: "nr" | "flex"` and an `octorateRateCode` — the deep-link to Octorate is rate-plan-specific. The current dual-button design forces this choice at the card level.
  - The `/api/availability` endpoint returns `priceFrom` as a per-night numeric value already derived as total / nights. It does not break down by rate type — it surfaces a single cheapest price for the room/dates combination (NR price, since NR is cheaper).
  - `OCTORATE_LIVE_AVAILABILITY` feature flag gates all live price fetches. On `/rooms` the flag is not currently used — only BookPageContent passes `availabilityRooms` to RoomsSection.
  - The `RoomCardPrice` type has `formatted`, `loading`, `soldOut`, `badge`, and `info` fields — it does not currently have a `pricePerNight` numeric field to drive a "Book from €X" CTA label dynamically.
  - Multi-locale support is required: 18 locales. The `ratesFrom` key (`"From €{{price}}"`) already exists in `en/roomsPage.json`. The `checkRatesNonRefundable` and `checkRatesFlexible` keys exist in all 18 locales and would be affected.
- Assumptions:
  - The NR rate is always cheaper than or equal to the flexible rate, so showing the cheapest rate always means showing NR-equivalent pricing.
  - A single CTA that defaults to the NR rate plan and navigates directly to Octorate is acceptable UX — the guest can still switch to flexible on the Octorate page.
  - On the `/rooms` page (no dates), no live price is available; the card should show static `basePrice` from `roomsData.ts` or no price at all, alongside the single CTA.

## Outcome Contract

- **Why:** TBD
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** TBD — expected to improve CTA click-through on room cards by reducing decision paralysis from two equal-weight buttons
- **Source:** auto

## Evidence Audit (Current State)

### Entry Points

- `apps/brikette/src/app/[lang]/rooms/RoomsPageContent.tsx` — renders the rooms listing page; passes `bookingQuery` (from URL params) into `RoomsSection` but does NOT pass `availabilityRooms`. No live pricing on `/rooms` today.
- `apps/brikette/src/app/[lang]/book/BookPageContent.tsx` — renders the booking landing page; calls `useAvailability({ checkin, checkout, pax })` and passes the result as `availabilityRooms` to `RoomsSection`. Live pricing is active here when the feature flag is on.
- `apps/brikette/src/components/rooms/RoomsSection.tsx` — brikette adapter; maps `availabilityRooms` → `roomPrices` (keyed by room.id), handles GA4 `select_item` and `begin_checkout` events, calls `buildOctorateUrl`.
- `packages/ui/src/organisms/RoomsSection.tsx` — shared UI layer; receives `roomPrices?: Record<string, RoomCardPrice>` and `actions` (the two buttons); passes them into each `RoomCard`.
- `packages/ui/src/molecules/RoomCard.tsx` — renders `PriceBlock` (the price display) and `ActionButtons` (the CTA buttons) independently. Price and actions are fully decoupled — the price block renders above the action buttons in the card body.

### Key Modules / Files

- `packages/ui/src/types/roomCard.ts` — defines `RoomCardPrice` (formatted, loading, badge, soldOut, info) and `RoomCardAction` (id, label, onSelect, disabled). The two-button behavior is driven entirely by passing two `RoomCardAction` entries.
- `apps/brikette/src/data/roomsData.ts` — contains `basePrice: { amount, currency }` for all 11 rooms. NR prices: double_room €259.20, room_10 €60.75, room_11 €72.40, room_12 €74.40, rooms 3/4 €55.00, rooms 5/6/9 €66.50, room_8 €78.00, apartment €265.00. Also contains `rateCodes.direct.nr` and `rateCodes.direct.flex` per room for deep-linking.
- `apps/brikette/src/app/api/availability/route.ts` — scrapes the public Octobook HTML endpoint (no auth required). Returns `OctorateRoom[]` with `priceFrom: number | null` (per-night total/nights), `available: boolean`, and `ratePlans: Array<{label}>`. The `ratePlans` labels are scraped `<h4>` text from the Octobook options div — these correspond to NR and Flex labels but are not structured.
- `apps/brikette/src/hooks/useAvailability.ts` — fetches `/api/availability`, debounced 300ms, feature-flagged via `OCTORATE_LIVE_AVAILABILITY`. Returns `AvailabilityState { rooms, loading, error }`.
- `apps/brikette/src/hooks/useAvailabilityForRoom.ts` — per-room variant; used on room detail pages. Not relevant to the room card list.
- `apps/brikette/src/utils/buildOctorateUrl.ts` — pure URL builder requiring `plan: "nr" | "flex"`, `octorateRateCode`, `checkin`, `checkout`, `pax`, `bookingCode`. Returns `{ ok: true, url }` or `{ ok: false, error }`.
- `apps/brikette/src/locales/en/roomsPage.json` — contains existing i18n keys: `checkRatesNonRefundable`, `checkRatesFlexible`, `ratesFrom: "From €{{price}}"`, `moreAboutThisRoom`, `loadingPrice`. The `ratesFrom` key is already there, unused by the current card implementation.

### Patterns & Conventions Observed

- **Price display already exists in RoomCard** — `PriceBlock` in `packages/ui/src/molecules/RoomCard.tsx` renders `price.formatted` as a styled `<span>` above the action buttons. The formatted string is pre-built by the adapter (`"From €${avRoom.priceFrom.toFixed(2)}"` in `apps/brikette/src/components/rooms/RoomsSection.tsx` line 62-63). This string should use the `ratesFrom` i18n key.
- **Adapter pattern** — brikette's `RoomsSection.tsx` wraps the shared `@acme/ui/organisms/RoomsSection`. The `actions` array (the two buttons) is built inside the shared layer (`packages/ui/src/organisms/RoomsSection.tsx` lines 186-189). To change button behavior, either the shared layer's `actions` prop construction must change, or the brikette adapter must override `actions` via a new prop.
- **Action buttons are built in the shared layer** — the shared `RoomsSection` builds the `actions` array (nr + flex) internally from i18n keys. The brikette adapter currently has no mechanism to override or reduce this to one button. This is the primary architectural touch-point for this feature.
- **`queryState` controls navigation mode** — when `queryState === "valid"`, clicking any action button navigates directly to Octorate with the selected rate plan code. When `queryState !== "valid"` (e.g. on `/rooms`), it navigates to `/[lang]/book` instead. A single-button approach for `/rooms` would always fall through to the `/book` fallback.
- **Feature flag gates live pricing** — `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY=1` must be set for `useAvailability` to return data. On `/rooms`, the hook is not called at all; only `/book` uses live availability.
- **`basePrice` is the static fallback** — `roomsData.ts` has `basePrice` for every room. It is not currently rendered on cards (no static price display). It represents the NR price.
- **Rate plan labelling in Octorate response** — `OctorateRoom.ratePlans` contains scraped `<h4>` labels (e.g. "Non Refundable", "Flexible Rate"). These are not structured and are not currently used for anything in the UI. The cheapest rate returned by the API is always the NR rate (lowest price first in Octorate's engine response).

### Data & Contracts

- Types/schemas/events:
  - `RoomCardPrice` — `{ loading?, formatted?, loadingLabel?, skeletonTestId?, soldOut?, soldOutLabel?, info?, badge? }`. No numeric price field; the formatted string is the only price representation passed to the card.
  - `RoomCardAction` — `{ id, label, onSelect, disabled? }`. Currently always two entries: `{ id: "nr" }` and `{ id: "flex" }`.
  - `OctorateRoom` — `{ octorateRoomName, octorateRoomId, available, priceFrom: number|null, nights, ratePlans }`. The `priceFrom` is per-night (total/nights, rounded to 2dp). It represents the cheapest available rate.
  - `BuildOctorateUrlParams` — requires `plan: "nr" | "flex"` and `octorateRateCode`. The NR rate code is `room.rateCodes.direct.nr`.
- Persistence:
  - No server-side persistence. Octorate data is fetched live and cached at the Next.js edge for 5 minutes (`next: { revalidate: 300 }`).
- API/contracts:
  - `/api/availability?checkin&checkout&pax` → `{ rooms: OctorateRoom[], fetchedAt }`. Returns all rooms for the date range. Feature-flagged.
  - Octorate deep-link: `https://book.octorate.com/octobook/site/reservation/result.xhtml?codice=BOOKING_CODE&room=RATE_CODE&date=CHECKIN&checkin=CHECKIN&checkout=CHECKOUT&pax=PAX&adulti=PAX`

### Dependency & Impact Map

- Upstream dependencies:
  - `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` env flag must be enabled for live pricing on the book page
  - Octorate/Octobook HTML structure — scraper is fragile if Octorate changes their markup
- Downstream dependents:
  - Both `/rooms` and `/book` page render room cards. Changes to the shared `RoomsSection` or `RoomCard` propagate to both pages.
  - GA4 `select_item` event passes `plan: "nr" | "flex"` — a single-button approach must still set this correctly (always "nr" for the cheapest rate).
  - GA4 `begin_checkout` event fires when a card CTA is clicked — must still fire with correct items array.
  - 18 locale files have `checkRatesNonRefundable` and `checkRatesFlexible` keys. If the single-CTA approach removes these buttons, new CTA keys will be needed (or the existing ones repurposed).
- Likely blast radius:
  - `packages/ui/src/organisms/RoomsSection.tsx` — action array construction needs to change to support one-button mode
  - `packages/ui/src/molecules/RoomCard.tsx` — no change needed (ActionButtons already handles 1-entry arrays correctly; first action gets the primary style)
  - `apps/brikette/src/components/rooms/RoomsSection.tsx` — must pass a flag or override to reduce to one button and configure the plan to "nr"
  - `apps/brikette/src/locales/*/roomsPage.json` — 18 files need a new i18n key for the single-CTA label (e.g. `checkRatesSingle` or reuse `checkRatesNonRefundable` with updated copy)
  - Existing tests for `RoomsSection` and `RoomCard` — any test asserting two buttons will need updating

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (unit/integration), Playwright (E2E)
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs`
- CI integration: reusable-app.yml

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `useAvailability` | Unit | `apps/brikette/src/hooks/useAvailability.test.ts` | Tests feature-flag path, debounce, abort |
| `/api/availability` | Unit | `apps/brikette/src/app/api/availability/route.test.ts` | Tests HTML parsing, price extraction, sold-out detection |
| `buildOctorateUrl` | Unit | `apps/brikette/src/utils/buildOctorateUrl.test.ts` | Tests URL construction, validation errors |

#### Coverage Gaps

- No existing tests assert the two-button structure in `RoomsSection` directly
- No tests for the `roomPrices` → `RoomCardPrice.formatted` mapping in the brikette adapter
- No E2E tests covering the room card CTA click → Octorate navigation flow

#### Recommended Test Approach

- Unit tests for: the new single-action construction in the shared RoomsSection; price formatting with static basePrice fallback
- Integration tests for: the brikette adapter with single-CTA mode; the price label rendering when `availabilityRooms` is provided vs absent

## Data Flow: Pricing (Detailed)

### Live pricing path (Book page, flag enabled)

```
BookPageContent
  → useAvailability({ checkin, checkout, pax })
      → GET /api/availability?checkin&checkout&pax
          → Octobook HTML scrape
          → parseOctobookHtml → OctorateRoom[] (priceFrom = total/nights, cheapest plan)
  → availabilityRooms: OctorateRoom[]
  → brikette RoomsSection (availabilityRooms prop)
      → useMemo: avRoom.widgetRoomCode → room.id lookup
      → prices[room.id] = { formatted: `From €${avRoom.priceFrom.toFixed(2)}`, soldOut: false }
      → roomPrices: Record<string, RoomCardPrice>
  → shared RoomsSection (roomPrices prop)
      → RoomCard: price={roomPrices?.[room.id]}
          → PriceBlock: renders price.formatted as styled span
```

### Static fallback path (Rooms page, or flag disabled)

```
RoomsPageContent → brikette RoomsSection (no availabilityRooms)
  → shared RoomsSection (roomPrices = undefined)
  → RoomCard: price={undefined} → PriceBlock renders null
```
No price is shown on the `/rooms` page currently. `basePrice` from `roomsData.ts` is not used in the card display — it exists only as machine-layer data.

### Rate type distinction

The Octorate booking URL requires a specific `room` parameter that is the rate plan code (e.g. `433883` for NR, `433894` for flex on the double room). The distinction is encoded in `roomsData.rateCodes.direct.nr` and `.flex`. The `/api/availability` response does not break pricing down by plan — it returns a single `priceFrom` which is always the lowest available rate (NR in practice). The `ratePlans` array in `OctorateRoom` contains scraped labels but no numeric breakdown. Therefore:

- A "cheapest rate" display will always show the NR price
- A single CTA for the cheapest rate can safely hardcode `plan: "nr"` for the Octorate deep-link
- The guest lands on the Octorate result page where they can still choose between NR and Flex before completing the booking
- The rate-type distinction is deferred to the Octorate checkout step, not lost

## UX Options Analysis

### Option A: Single button "Book from €45/night" (price embedded in button label)

**Mechanism**: The `formatted` price string is currently rendered as a separate `PriceBlock` above the buttons. To embed price in the button label, the shared RoomsSection would need to compose the label dynamically using the price value. This requires passing the price amount (not just the formatted string) through to the action label builder — a more invasive change.

**Verdict**: Higher implementation complexity. The `RoomCardPrice.formatted` field is a pre-formatted string (no raw number exposed to the shared layer). The shared layer would need a new prop channel (e.g. `priceAmount` on `RoomCardPrice`) to format the label. Possible, but requires changes in three layers (type, shared organism, brikette adapter). Formatting across 18 locales also adds risk.

### Option B: Price label "From €45/night" + single "Check rates" button (recommended)

**Mechanism**: The `PriceBlock` already renders `price.formatted` above the action buttons. The only change needed is to reduce `actions` from two entries to one. The shared layer's action array construction is the touch-point. The simplest approach: add an optional `singleCtaMode?: boolean` prop (or `ctaMode?: "dual" | "single"`) to the shared `RoomsSection`; when enabled, build only one action (`id: "nr"`, label from a new i18n key like `checkRatesSingle`). The brikette adapter enables this mode and passes it through.

On the `/rooms` page (no live pricing), the price block renders null (no `formatted` string), so the card shows just the single "Check rates" button. On `/book` with valid dates and flag enabled, the price block shows the live "From €X" label above the button. This is a natural progressive enhancement.

**Verdict**: Lowest implementation risk. No changes to `RoomCard` itself. No type-level changes to `RoomCardPrice`. Two action buttons is purely a construction choice in the shared organism. Single-CTA label requires one new i18n key across 18 locales (or repurpose `checkRatesNonRefundable` with updated copy). The `splitActionLabel` function in RoomCard (which handles dash-separated two-line button labels) already handles single-line labels cleanly.

### Option C: Keep dual buttons + add price label above them (least disruptive)

**Mechanism**: Price label is already displayed (when live availability is enabled) via `PriceBlock`. The dual buttons remain unchanged. This is the current state when `OCTORATE_LIVE_AVAILABILITY=1` is set.

**Verdict**: This option is already partially implemented — the `PriceBlock` with `formatted` is already being populated on the Book page. If the goal is just to show "From €X" above the existing buttons, that already works when the feature flag is on. No new code needed. However, it does not address the UX concern about dual buttons creating decision paralysis.

## Simulation Trace: Proposed Option B (Single CTA, Book page)

| Step | Actor | Input | Output | Notes |
|---|---|---|---|---|
| 1 | BookPageContent mount | checkin/checkout/pax state | calls `useAvailability` | Hook debounced 300ms |
| 2 | useAvailability | valid dates | GET /api/availability → OctorateRoom[] | `priceFrom` per night |
| 3 | brikette RoomsSection | `availabilityRooms` prop | `roomPrices[room.id] = { formatted: "From €45.00" }` | Mapping via widgetRoomCode |
| 4 | shared RoomsSection | `roomPrices`, `singleCtaMode=true` | `actions = [{ id: "nr", label: t("checkRatesSingle") }]` | One action per card |
| 5 | RoomCard | `price={formatted: "From €45.00"}`, `actions=[{id:"nr"}]` | PriceBlock renders "From €45.00"; single primary button rendered | No structural change to RoomCard |
| 6 | User clicks button | click event | `onRoomSelect({ roomSku, plan: "nr", index })` | GA4 select_item fires |
| 7 | brikette onRoomSelect | `plan: "nr"`, `queryState="valid"` | `buildOctorateUrl({ plan:"nr", octorateRateCode: room.rateCodes.direct.nr })` → Octorate URL | begin_checkout GA4 event fires |
| 8 | Browser | `window.location.assign(url)` | Lands on Octorate result page pre-filtered to NR | Guest can switch to Flex on Octorate |

| Step | Actor | Input | Output | Notes |
|---|---|---|---|---|
| 1 | RoomsPageContent (no dates) | bookingQuery (absent) | brikette RoomsSection with no `availabilityRooms` | No live price |
| 2 | shared RoomsSection | `roomPrices=undefined`, `singleCtaMode=true` | `actions=[{id:"nr", label:"Check rates"}]`, `price=undefined` | |
| 3 | RoomCard | `price=undefined`, `actions=[{id:"nr"}]` | PriceBlock null; single button rendered | |
| 4 | User clicks | click | `onRoomSelect({ roomSku, plan:"nr" })` | queryState="absent" → navigate to /[lang]/book |

## Open Questions

### Resolved

- Q: Does `priceFrom` from the API represent NR or flex pricing?
  - A: NR (non-refundable), because Octorate's Octobook engine lists the cheapest plan first in the offert div. The API parses the first `€X,XX` match — always the lowest plan, which is NR.
  - Evidence: `apps/brikette/src/app/api/availability/route.ts` `parseTotalPrice()` — extracts the first euro price match from the offert div text.

- Q: Is `basePrice` in `roomsData.ts` available to display as a static price on the `/rooms` page?
  - A: Yes, the data is present for all rooms. However, it is not currently wired to any display. Using it as a static "From €X/night" on the `/rooms` page would require adding a `formatBasePrice` step in the adapter. The value equals the NR per-night price (not multiplied by nights).
  - Evidence: `apps/brikette/src/data/roomsData.ts` — `basePrice: { amount: 60.75, currency: "EUR" }` etc.

- Q: Can the shared RoomsSection already handle a single-action array?
  - A: Yes. `ActionButtons` in `RoomCard.tsx` renders `actions.map(...)` — it works with any array length. The first entry always gets the primary button style (`ROOM_CARD_ACTION_BUTTON_CLASS_PRIMARY`).
  - Evidence: `packages/ui/src/molecules/RoomCard.tsx` lines 186-223.

- Q: Will removing the flex button break any existing GA4 events?
  - A: The `select_item` event fires with `plan: ctx.plan` — when plan is always "nr", the event will always record "nr". The `begin_checkout` event includes items built via `buildRoomItem({ roomSku, plan })`. This changes analytics behavior (no flex events from room cards) but does not break the pipeline.
  - Evidence: `apps/brikette/src/components/rooms/RoomsSection.tsx` lines 102-110.

- Q: Does `ratesFrom` i18n key already exist?
  - A: Yes. `"ratesFrom": "From €{{price}}"` is present in `apps/brikette/src/locales/en/roomsPage.json`. Needs verification across all 18 locales.
  - Evidence: `apps/brikette/src/locales/en/roomsPage.json` line 294.

- Q: Is the `/rooms` page impacted by the feature flag?
  - A: No. The `/rooms` page (`RoomsPageContent`) does not call `useAvailability` and does not pass `availabilityRooms` to the brikette adapter. Live pricing is only active on the `/book` page regardless of flag state.
  - Evidence: `apps/brikette/src/app/[lang]/rooms/RoomsPageContent.tsx` line 74 — `<RoomsSection>` has no `availabilityRooms` prop.

### Open (Operator Input Required)

- Q: Should the `/rooms` page show the static `basePrice` as a "From €X/night" label on each card (no dates required)?
  - Why operator input is required: This is a product/UX decision. The static price may confuse guests if live rates differ significantly. Showing no price (current state) avoids confusion but misses a conversion opportunity.
  - Decision impacted: Whether the brikette adapter on `/rooms` needs to compute a static `formatted` price from `room.basePrice.amount` for the price block.
  - Decision owner: Operator / product owner
  - Default assumption: Static price display on `/rooms` is out of scope for the initial implementation. The single-CTA change proceeds without price on `/rooms`. This is the safer default and matches the current state.

- Q: Should the single CTA label vary between "Book now" (no dates) and "Book from €X" (with live price), or should it always read "Check rates"?
  - Why operator input is required: The label copy is a brand/UX judgment call. A neutral "Check rates" works in both states. "Book now" is more assertive for the no-date case. The operator knows their conversion preference.
  - Decision impacted: i18n key design and whether one or two CTA i18n keys are needed.
  - Decision owner: Operator
  - Default assumption: Use a single new i18n key `checkRatesSingle` with copy "Book Direct" or "Check Rates" in the initial build. Plan should note this is a placeholder pending operator copy review.

## Confidence Inputs

- Implementation: 90% — the code path is fully traced; the change is well-bounded. The main risk is the i18n key rollout across 18 locales.
  - What would raise to 95%: confirming the `ratesFrom` key exists in all 18 locale files and that the single-CTA label copy has been approved.
- Approach: 85% — Option B is clearly the right technical approach; the main uncertainty is whether the operator wants static price display on `/rooms`.
  - What would raise to 90%: operator confirms the `/rooms` page scope (static price or not).
- Impact: 75% — reducing from two buttons to one should simplify the CTA, but without A/B data it is assumed rather than evidenced.
  - What would raise to 80%: any GA4 data showing the flex button click rate vs NR button click rate (if NR dominates, removing flex is lower risk).
- Delivery-Readiness: 90% — all dependencies are present; no new APIs or data sources needed.
- Testability: 85% — the changed components are unit-testable. The GA4 behavioral change (plan always "nr") needs test update but is low risk.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Octorate HTML structure change breaks `priceFrom` parsing | Low | High | Current risk exists independently of this feature; not introduced by it |
| `ratesFrom` i18n key missing in some locales | Medium | Low | Audit all 18 locale files before merge; add missing keys with EN fallback |
| Guest confusion: single NR CTA, then sees Flex option on Octorate | Low | Low | This is expected behavior — Octorate page always shows both plans; the card CTA just picks the cheaper entry point |
| GA4 loss of flex plan signal from room cards | Medium | Low | Flex bookings still tracked on Octorate side; GA4 card signal shifts to 100% "nr" which is acceptable |
| Static basePrice on `/rooms` shows outdated/wrong price | N/A | N/A | Mitigated by defaulting to no static price on `/rooms` (operator decision) |

## Planning Constraints & Notes

- Must-follow patterns:
  - All i18n strings must go through the `t()` function with a `defaultValue`; no hardcoded strings in JSX
  - New i18n keys must be added to all 18 locale files (or handled via `defaultValue` fallback until translation coverage is complete)
  - The shared `packages/ui` layer must remain generic — any brikette-specific logic stays in the adapter
  - `RoomCardAction` and `RoomCardPrice` types live in `packages/ui/src/types/roomCard.ts`; if a new type field is needed it goes there
  - The brikette adapter `apps/brikette/src/components/rooms/RoomsSection.tsx` wraps the shared organism via `RoomsSectionBase` props
  - Follow the writer-lock protocol for commits: `scripts/agents/with-writer-lock.sh`
- Rollout/rollback expectations:
  - The feature is isolated to the room card action array construction. Rollback is changing `singleCtaMode` back to false/dual.
  - The `OCTORATE_LIVE_AVAILABILITY` flag is independent and need not change for this feature.
- Observability expectations:
  - GA4 `select_item` events: `plan` field will shift from mixed "nr"/"flex" to always "nr" for room card CTAs. This is a detectable signal change.
  - No new observability hooks needed.

## Suggested Task Seeds (Non-binding)

1. **Add `singleCtaMode` prop to shared `RoomsSection`** — when true, construct a single-action array using `{ id: "nr", label: t("checkRatesSingle") }` instead of the dual NR/flex array
2. **Add `checkRatesSingle` i18n key** — add to EN locale with copy ("Book Direct" / "Check Rates" TBD); propagate to all 18 locales with EN fallback
3. **Wire `singleCtaMode` in brikette adapter** — pass the flag from `apps/brikette/src/components/rooms/RoomsSection.tsx` to the shared base, with `plan: "nr"` hardcoded for the single-action path
4. **Update GA4 onRoomSelect logic** — verify the single-CTA path still fires `select_item` and `begin_checkout` correctly with `plan: "nr"`
5. **Update/add unit tests** — update any tests asserting two buttons; add test for single-CTA mode with price display
6. **Audit `ratesFrom` key across 18 locales** — ensure the key is present in all files or handle via defaultValue

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - Single CTA button visible on both `/rooms` and `/book` pages
  - Live price "From €X" displayed above single button on `/book` when dates are entered and flag is on
  - GA4 events fire correctly (plan always "nr" for card CTAs)
  - All 18 locales have the new CTA key
  - Existing tests pass; new tests cover single-CTA mode
- Post-delivery measurement plan:
  - Monitor GA4 `select_item` event rate on room cards before/after (expect volume to consolidate on "nr")
  - Monitor `begin_checkout` event rate from room cards — should increase if single CTA reduces friction

## Evidence Gap Review

### Gaps Addressed

- Confirmed that `priceFrom` from the API is per-night, NR pricing (derived from the lowest-price plan in Octorate's response)
- Confirmed that `PriceBlock` already renders above `ActionButtons` in `RoomCard` — the price display is structurally decoupled from the button array
- Confirmed that a single-entry `actions` array renders correctly with the primary button style on the first (only) entry
- Confirmed that `ratesFrom` i18n key already exists in the EN locale
- Confirmed that `rateCodes.direct.nr` is present for all rooms in `roomsData.ts`

### Confidence Adjustments

- Started: 70% (unknown whether price display already existed, unknown whether API returns NR vs flex)
- After investigation: 90% implementation, 85% approach — the architecture is cleaner than expected; `PriceBlock` is already wired and the action array is the only touch-point

### Remaining Assumptions

- The `ratesFrom` key exists in all 18 locales (not verified — only EN checked)
- Octorate always returns NR as the first/cheapest rate plan in the Octobook HTML (inferred from parser behavior; not exhaustively verified)
- The operator is comfortable with the `/rooms` page showing no price (static basePrice fallback is out of scope unless confirmed otherwise)

## Planning Readiness

- Status: Ready-for-planning
- Blocking items:
  - None for the implementation track. Operator copy decision for the single-CTA label is a non-blocker (a default can be used).
- Recommended next step:
  - `/lp-do-plan` — all technical facts are established; the plan can be written with the suggested task seeds above.
