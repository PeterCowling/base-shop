---
Type: Baseline-Record
Feature-Slug: brik-live-pricing-baseline
Captured-Date: 2026-02-27
GA4-Property-ID: "474488225"
Activation-Gate: pre-activation (NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY not yet enabled)
---

# BRIK Live Pricing — Pre-Activation GA4 Baseline Numbers

## Capture Methodology

- **Script:** `scripts/src/brikette/ga4-run-report.ts`
- **GA4 Property ID:** 474488225
- **Service account key:** `.secrets/ga4/brikette-web-2b73459e229a.json`
- **Run command:**
  ```
  node --import tsx/esm scripts/src/brikette/ga4-run-report.ts \
    --window 28daysAgo..yesterday --events select_item,begin_checkout,view_item
  node --import tsx/esm scripts/src/brikette/ga4-run-report.ts \
    --window 90daysAgo..yesterday --events select_item,begin_checkout,view_item,page_view
  ```
- **Capture date:** 2026-02-27
- **Windows queried:**
  - 28 days (2026-01-30 to 2026-02-26, via `28daysAgo..yesterday`)
  - 90 days (2026-11-29 to 2026-02-26, via `90daysAgo..yesterday`)

Note: The trigger contract specifies a 30-day baseline window. `28daysAgo` is the GA4 Data API's
built-in shorthand for the closest available 28-day window. Both the 28-day and 90-day windows
returned zero `select_item` events, making the 28/30-day distinction immaterial for this baseline.

## Baseline Numbers

| Event | 28-day count | 90-day count | Notes |
|---|---|---|---|
| `select_item` | 0 | 0 | All surfaces (rooms_index, book_rooms, room_detail) |
| `begin_checkout` | 1 | 1 | room_detail via StickyBookNow CTA |
| `view_item` | 0 | 0 | room_detail |
| `page_view` | — | 269 | All pages (90-day window) |

## Interpretation

### `select_item` = 0 (all surfaces)

- **`room_detail` surface:** Instrumentation gap — `fireSelectItem` / `fireEventAndNavigate` was
  not yet wired to `RoomCard.tsx` CTAs prior to this plan. This is the gap this plan closes.
- **`rooms_index` surface:** `select_item` is implemented (`RoomsSection.tsx`), but zero events
  reflects low organic traffic to the `/rooms` index during this window.
- **`book_rooms` surface:** `select_item` is implemented (`RoomsSection.tsx`), but zero events
  reflects low traffic navigating through the `/book` flow during this window.

### `begin_checkout` = 1 (90-day)

One production checkout attempt was observed via the StickyBookNow CTA on the room detail page.
This confirms the room detail page is live and receiving at least some real traffic.

### `view_item` = 0 (all windows)

The `view_item` event fires on the room detail page mount. Zero events is consistent with the
`IS_PROD` gate in `apps/brikette/src/app/layout.tsx` — GA4 only loads on the production domain.
This means view_item events were only loaded for production traffic; the 1 `begin_checkout` event
confirms GA4 was active for at least one session, but `view_item` may have been blocked by the
same session's ad-blocker.

## Activation Gate

This baseline was captured **before** activating `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` on
production. The flag is defined in `apps/brikette/src/config/env.ts` and is build-time inlined.

**Post-activation measurement:**
After activating the flag and deploying to production via `wrangler pages deploy`:
1. Re-run the GA4 query with a 28-day window starting from the activation date.
2. Compare `select_item` counts from `room_detail` vs this baseline (0).
3. Any non-zero `select_item` count from `room_detail` is attributed to the instrumentation
   added by this plan.

The post-activation results-review for `brik-octorate-live-availability` should reference this
document as the anchored pre-activation baseline.

## References

- Fact-find: `docs/plans/brik-live-pricing-baseline/fact-find.md`
- Plan: `docs/plans/brik-live-pricing-baseline/plan.md`
- Downstream consumer: `docs/plans/brik-octorate-live-availability/` (results-review, to be created)
- Related plan: `docs/plans/brik-octorate-live-availability/plan.md`
