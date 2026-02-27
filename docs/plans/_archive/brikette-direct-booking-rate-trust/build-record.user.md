# Build Record — Brikette Direct Booking Rate Trust

**Plan:** `brikette-direct-booking-rate-trust`
**Completed:** 2026-02-27
**Track:** code
**Effort:** 6 task units (S + S + M + S + S)

---

## What was done

Four trust-signal gaps in Brikette's direct-booking proposition were fixed and locked in with regression tests:

**1. Fixed the 10%-vs-25% discount inconsistency (18 locales)**
- `offers.perks.discount` in every `modals.json` was corrected from "Up to 10% off" to "Up to 25%" — aligning the hero booking modal with all other surfaces (deals page, directPerks block, room cards).

**2. Repositioned "Why book direct?" perks above the room list on `/book`**
- `DirectPerksBlock` was already above `RoomsSection` in `BookPageContent.tsx` — no change required (confirmed at build time to be a no-op).

**3. Added "Best price guaranteed" badge to room cards**
- New optional `badge?: { text: string; claimUrl: string }` field on `RoomCardPrice` (UI package type).
- `PriceBlock` in the shared UI `RoomCard` renders the badge as an accessible link (`<a>` with claim URL) when the field is present and the room is not sold out.
- Brikette adapter `RoomCard.tsx` populates the badge from `_tokens.bestPriceGuaranteed`, pointing to the existing WhatsApp claim link.

**4. Restored the `/deals` page from empty state**
- Added an evergreen `direct-perks-evergreen` deal (25% off, start 2026-02-27, end 2099-12-31) as `DEALS[0]` and `PRIMARY_DEAL`. The expired `sep20_oct31_15off` deal is preserved in the array (shown in "Past Deals" section).

**5. Added regression tests**
- `i18n-parity-quality-audit.test.ts`: new describe block asserts EN `modals.offers.perks.discount` contains "25". Fails on revert to 10%.
- `ga4-34-deals-page-promotions.test.tsx`: TC-01 updated for 2-deal DEALS array; TC-03 added asserting `getActiveDealCount(DEALS, now) >= 1`.
- `ga4-11-select-item-room-ctas.test.tsx`: new describe block renders UI `RoomCard` directly with `price.badge` set, asserts badge link is present. Fails if PriceBlock badge rendering is removed.

---

## Evidence

- All 14 tests pass (3 test suites, 14 tests, 0 failures).
- Typecheck: clean on `@acme/ui` and `apps/brikette`.
- Lint: clean (tap-target lint fixed with `min-h-11 min-w-11`).

---

## Outcome Contract

- **Intended Outcome:** Increase direct booking share toward 27% P50 target.
- **Measurement proxy:** GA4 CTA click events on `/book` and `/rooms` (pre-Octorate-handoff), measured over 30 days post-deploy.
- **Deploy gate: CLEARED (2026-02-27).** Operator confirmed "up to 25% off" is accurate for the current Octorate rate structure. Plan is production-ready.

---

## Files changed

**Wave 1 (committed in 32503027d5 + 8d61f3217b):**
- `apps/brikette/src/locales/*/modals.json` × 18 — discount claim corrected
- `packages/ui/src/types/roomCard.ts` — `badge` field added
- `packages/ui/src/molecules/RoomCard.tsx` — PriceBlock badge rendering
- `apps/brikette/src/components/rooms/RoomCard.tsx` — badgeText computation
- `apps/brikette/src/routes/deals/deals.ts` — evergreen deal added

**Wave 2 (TASK-05, this commit):**
- `apps/brikette/src/routes/deals/deals.ts` — `getActiveDealCount` helper
- `apps/brikette/src/test/content-readiness/i18n/i18n-parity-quality-audit.test.ts` — TC-01 discount regression test
- `apps/brikette/src/test/components/ga4-34-deals-page-promotions.test.tsx` — TC-01 updated + TC-03 added
- `apps/brikette/src/test/components/ga4-11-select-item-room-ctas.test.tsx` — badge rendering test
