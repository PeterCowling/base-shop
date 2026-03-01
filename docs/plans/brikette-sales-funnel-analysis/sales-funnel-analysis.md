# Brikette Sales Funnel Analysis
**Date**: 2026-03-01
**Status**: Current state — all pricing fixes applied including homepage
**Audit-Ref**: working-tree (HEAD `df378c84e306adaa5166abcfeb4b900d107940f1`)

> ⚠️ This audit was performed against the working tree, which contains uncommitted changes. Results may differ from committed state.

---

## Fix Summary (Applied This Session)

### Pricing infrastructure
1. ✅ **Feature flag wiring** — `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` is consumed by app env config and the production CI build command. (Staging build command does not set it by default.)
2. ✅ **`/en/dorms` availability** — `RoomsPageContent.tsx` now calls `useAvailability` and passes `availabilityRooms` to `RoomsSection`.
3. ✅ **Apartment excluded from dorms listing** — `apartment` added to `DORMS_EXCLUDE_IDS` in `RoomsPageContent.tsx` (private room, not a dorm).

### Apartment rate data
4. ✅ **`widgetRoomCode`** — set to `"14"` (Octorate room ID), enabling apartment mapping in the live availability room-ID join.
5. ✅ **OTA rate codes** — `ota.nr: "804935"`, `ota.flex: "804932"` (were `"TODO"`). All per-pax variants documented in comments (3 pax: 805559/805578/805560/805579; 4 pax: 875201/875200/875199/875198).

### Homepage pricing (I-01, I-02, I-03)
6. ✅ **Widget state lifted** — `BookingWidget` now exposes dates/pax via `onDatesChange` callback; `HomeContent` receives them.
7. ✅ **`useAvailability` on homepage** — `HomeContent` calls `useAvailability` with widget dates; `CarouselSlides` now accepts and displays `roomPrices`.
8. ⚠️ **Date carry-forward is partial** — Homepage room card "Check Rates" carries `?checkin=…&checkout=…&pax=…`, but homepage "More About This Room" links currently do not append booking query params.

---

## Strategic Opportunity (No Paid Octorate API)

### Commercial constraint
- Octorate API pricing (several thousand EUR) is currently a non-starter.
- This funnel strategy therefore assumes **no paid API/webhook access**.

### Target operating model (realistic now)
- Brikette owns as much **pre-checkout** flow as possible: discovery, date/pax capture, room/rate comparison, trust/perks messaging, and handoff intent measurement.
- Octorate remains only for:
  - final transactional checkout and confirmation UI
  - operational source data via export/backoffice flows

### What we can realistically do without API
1. Minimize user-visible Octobook steps before payment by improving first-party selection/decision surfaces.
2. Normalize all handoff CTAs to one canonical behavior and one canonical analytics event (`handoff_to_engine`).
3. Add no-API reconciliation (GA4 handoff aggregates + Octorate booking exports) for weekly conversion closure.
4. Improve reliability around export parsing/session health so ops is less fragile.

### What is not realistic without API
- Deterministic per-booking attribution from click to confirmed booking in real time.
- Authoritative booking-status sync in Brikette (changes/cancel state) without export lag.
- Full replacement of Octorate transactional checkout without taking on payment/compliance scope.

---

## Funnel Routes Overview

```
/en (homepage)
  └─ Booking widget (check-in + check-out + guests)
  └─ Widget "Check Availability" → /en/book?checkin=…&checkout=…&pax=…
  └─ Room card "Check Rates" → /en/book?checkin=…&checkout=…&pax=… (dates carried)
  └─ Room card "More About This Room" → /en/dorms/[room-slug] (no booking params appended)

/en/dorms (rooms listing — excludes double_room + apartment; filter defaults to mixed "all")
  └─ Room card "Check Rates" → /en/book (always fallback; queryState not set to valid on this route)
  └─ Room card "More About This Room" → /en/dorms/[room-slug]?… (current URL query string is preserved when present)

/en/dorms/[room-slug] (room detail — standalone or slide-over)
  └─ Date picker + ±1 pax counter (seeds defaults into URL on load)
  └─ Sticky "Book Now" → Octorate direct (NR; explicit result URL when valid, calendar fallback otherwise)

/en/book (booking page — full date picker)
  └─ DateRangePicker + guests input
  └─ Room card "Check Rates" (queryState=valid) → Octorate direct (NR rate)
  └─ Room card "Check Rates" (queryState=invalid) → disabled
  └─ Room card "More About This Room" → /en/dorms/[room-slug]?checkin=…&checkout=…&pax=…
```

---

## Route-by-Route Analysis

### Route 1: `/en` — Homepage

**What it shows:**
- Hero with booking widget (check-in date, check-out date, guests, "Check Availability" button)
- Room carousel (6 rooms) below the fold

**CTAs and their behaviour:**
| CTA | State | Destination |
|-----|-------|-------------|
| Widget "Check Availability" | Dates filled | `/en/book?checkin=…&checkout=…&pax=…` |
| Widget "Check Availability" | Dates empty | `/en/book?pax=1` |
| Room card "Check Rates" | Dates in widget | `/en/book?checkin=…&checkout=…&pax=…` |
| Room card "Check Rates" | No dates | `/en/book?pax=1` |
| Room card "More About This Room" | Dates in widget | `/en/dorms/[room-slug]` |
| Room card "More About This Room" | No dates | `/en/dorms/[room-slug]` |

**Pricing on room cards:** ✅ Live pricing is computed both before and after widget selection. Before explicit date input, homepage availability falls back to today/+2 days/1 pax; widget changes then update pricing.

**Remaining issues:** None at High/Medium priority.

---

### Route 2: `/en/dorms` — Rooms Listing

**What it shows:**
- Page heading
- Filters (All / Private / Dorms)
- Grid of room cards (excludes `double_room` and `apartment`)
- Each card: photo, title, single "Check Rates" CTA, "More About This Room" link

**Availability and pricing:**
- `useAvailability` is currently called with today + 2 days / 1 guest defaults on this route because `bookingQuery` is not populated by the route wrapper.
- URL query params may still be present in the address bar and preserved in detail links, but they are not currently wired into `/en/dorms` availability fetch inputs.

**CTAs and their behaviour:**
| CTA | State | Destination |
|-----|-------|-------------|
| Room card "Check Rates" | Any | `/en/book` (`queryState` always absent — no date picker, no valid-state mechanism) |
| Room card "More About This Room" | Dates in URL | `/en/dorms/[room-slug]?checkin=…&checkout=…&pax=…` |
| Room card "More About This Room" | No URL params | `/en/dorms/[room-slug]` |

**Issues:**
- **I-04 (High)**: `/en/dorms` does not currently bind URL booking params into either `queryState` or availability inputs. Result: "Check Rates" always falls through to `/en/book` and route-level prices remain on default dates.
  - **Fix**: Parse booking params on `/en/dorms`, pass validated `bookingQuery` and `queryState` into `RoomsSection`, and feed the same params into `useAvailability`.
- **I-05 (Medium)**: No date picker on the page. Users arriving without dates see indicative pricing but have no way to change dates without leaving to `/en/book`.
  - **Fix**: Add a compact date/pax widget above the room grid, or a "Prices shown for [dates] — change" label linking to `/en/book`.
- **I-06 (Low)**: Filter defaults to "all" which shows both `perBed` and `perRoom` rooms on what is labelled the dorms page.

---

### Route 3: `/en/dorms/[room-slug]` — Room Detail

**What it shows:**
- Room title + hero content
- Social proof strip
- Date picker + ±1 pax counter (embedded in the page)
- `RoomCard` — shows "From €X.XX" or sold-out state per this room
- Amenities, features, outline, related guides
- Sticky "Book Now" button

**Availability and pricing:**
- `useAvailabilityForRoom` called for this room with picker dates.
- On arrival without URL params, page seeds today + 2 days / 1 guest immediately via `router.replace` — sticky CTA is always active.

**CTAs and their behaviour:**
| CTA | State | Destination |
|-----|-------|-------------|
| Sticky "Book Now" | Any (defaults seeded) | Octorate direct (NR rate) |
| In-page RoomCard "Check Rates" (NR/Flex) | `queryState=valid` | Octorate direct (NR/Flex) |
| In-page RoomCard "Check Rates" (NR/Flex) | `queryState=absent` | `/en/book` |
| In-page date picker | Any | Updates URL params, re-fetches availability |

**Issues:**
- **I-07 (Medium)**: Sticky CTA is NR-only. Flex exists on the in-page RoomCard, but the primary floating CTA does not expose a flex path.
- **I-08 (Low)**: Sticky "Book Now" CTA doesn't display the price. Room card in the page body shows "From €X.XX" but the sticky button (primary conversion action) does not.

---

### Route 4: `/en/book` — Booking Page

**What it shows:**
- Social proof strip
- Page heading + subheading
- `DateRangePicker` + guests input
- Direct booking perks block
- Full room grid with live pricing

**Availability and pricing:**
- `useAvailability` called with date picker state — prices update 300ms after any change.
- `queryState="valid"` → "Check Rates" goes direct to Octorate.
- `queryState="invalid"` → CTAs disabled.

**CTAs and their behaviour:**
| CTA | State | Destination |
|-----|-------|-------------|
| Room card "Check Rates" | `queryState=valid` | Octorate direct (NR rate) |
| Room card "Check Rates" | `queryState=invalid` | Disabled |
| Room card "More About This Room" | Any | `/en/dorms/[room-slug]?checkin=…&checkout=…&pax=…` |

**Issues:**
- **I-10 (Medium)**: The apartment (private room, 2–4 pax) appears in the rooms grid alongside shared dorm beds. With `widgetRoomCode: "14"` now set, pricing will resolve — but it's a different product category and may confuse users looking at dorms. Product decision: move to a dedicated private rooms booking flow or keep it here.
- **I-11 (Low)**: `useAvailability` exposes `loading`, but `/en/book` currently does not surface that loading state into room price rendering, so live-refresh state is implicit.
- **I-12 (Low)**: Pax selector is a plain `<input type="number">`. Room detail has ± stepper buttons. Inconsistent UX.

---

## Cross-Cutting Issues

- **I-14 (Medium)**: NR-only direct booking is enforced on list/grid routes (`singleCtaMode`) and sticky CTA. Flex exists on the room-detail in-page card, so rate-plan availability is inconsistent across funnel surfaces.
- **I-15 (High)**: Handoff analytics are still mixed across legacy (`begin_checkout`) and canonical (`handoff_to_engine`) events, which blocks clean no-API reconciliation and hides true handoff volume.
- **I-16 (High)**: No persistent first-party click ID is carried through handoff URLs and exported booking workflows, so booking closure remains aggregate/probabilistic only.
- **I-17 (Medium)**: Handoff endpoint semantics are inconsistent across flows (`result.xhtml` vs `calendar.xhtml`), which complicates instrumentation interpretation and UX consistency.
- **I-18 (Medium)**: Ops completion closure currently depends on manual Octorate export/session workflows; this creates weekly reporting fragility.

---

## Funnel Step Summary

| Step | Date Picker | Prices Shown | Direct-to-Octorate CTA |
|------|-------------|--------------|----------------------|
| `/en` homepage | ✅ (widget, wired to carousel) | ✅ (defaults + widget updates) | ❌ (CTAs → `/en/book`) |
| `/en/dorms` listing | ❌ (no picker) | ✅ (today/+2 default in current code) | ❌ (always → `/en/book`, I-04) |
| `/en/dorms/[slug]` detail | ✅ (full picker) | ✅ (per-room) | ✅ (sticky → Octorate NR) |
| `/en/book` booking page | ✅ (full picker) | ✅ (full grid) | ✅ (queryState=valid → Octorate NR) |

---

## Remaining Issues

| ID | Priority | Issue | Suggested Fix |
|----|----------|-------|---------------|
| I-04 | High | `/en/dorms` does not bind URL booking params into availability/queryState, so prices stay default and "Check Rates" always falls back to `/en/book` | Parse + validate booking params in `/en/dorms`, pass `bookingQuery` + `queryState` to `RoomsSection`, and feed same params to `useAvailability` |
| I-15 | High | Mixed legacy/canonical handoff events reduce decision-grade measurement | Standardize all handoff CTAs on `handoff_to_engine`; keep `begin_checkout` only as bounded compatibility |
| I-16 | High | No click-level join key for no-API booking closure | Add `brik_click_id` to all handoff URLs + event payloads, then use weekly export-side probabilistic join with confidence bands |
| I-05 | Medium | No date picker on `/en/dorms` — users can't change dates | Compact date widget or "Prices for [dates] — change" label above the grid |
| I-07 | Medium | Room detail sticky CTA is NR-only while flex is only available via in-page card CTA | Add sticky secondary CTA (or sticky rate toggle) for Flex, or explicitly document intentional NR-first strategy |
| I-10 | Medium | Apartment (private room) mixed into dorms grid on `/en/book` | Move to dedicated private rooms flow, or accept as-is with pricing now working |
| I-17 | Medium | Mixed handoff endpoints (`result.xhtml` vs `calendar.xhtml`) across flows | Define endpoint policy by route class, then align CTA URL builders + event params to that policy |
| I-18 | Medium | Manual export/session dependency for completion reporting | Add weekly no-API reconciliation runbook, parser validation, and stale-session alerting |
| I-06 | Low | Dorms page filter defaults to "all" (shows perRoom rooms alongside dorms) | Default filter to "dorms" on the dorms route |
| I-08 | Low | Sticky "Book Now" doesn't show price | Show "From €X.XX" in sticky CTA label |
| I-11 | Low | Live availability refresh state is implicit on `/en/book` | Thread `useAvailability.loading` into room-card price placeholder behavior |
| I-12 | Low | `/en/book` pax selector is plain `<input>`, room detail has ± buttons | Standardise to ± steppers |
| I-14 | Low | NR/Flex offering differs by surface (list/grid/sticky vs room-detail card) | Align rate-plan exposure strategy across all booking entry points |

---

## 30-Day No-API Execution Focus

### Week 1 (instrumentation + consistency)
1. Ship canonical `handoff_to_engine` across every handoff CTA.
2. Add `brik_click_id` generation + propagation on every handoff URL.
3. Normalize handoff endpoint policy (`result` vs `calendar`) and keep event params in sync.

### Week 2 (funnel ownership before handoff)
1. Fix `I-04`: bind/validate booking params on `/en/dorms` and enable direct handoff when valid.
2. Add date-change affordance on `/en/dorms` (`I-05`).
3. Clarify private-room positioning in `/en/book` (`I-10` decision).

### Week 3 (no-API closure operations)
1. Define and run weekly reconciliation pack: GA4 handoff totals vs Octorate export bookings.
2. Publish coverage and confidence bands (aggregate + probabilistic; no deterministic claim).

### Week 4 (ops hardening)
1. Add export schema checks and failure alerts for reconciliation inputs.
2. Add session-health preflight for Octorate operator workflow to reduce manual failure risk.
