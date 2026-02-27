---
Type: Results-Review
Status: Draft
Feature-Slug: brik-live-pricing-baseline
Review-date: 2026-02-27
artifact: results-review
---

# Results Review

## Observed Outcomes

- `select_item` is now fired from `RoomCard.tsx` on NR and Flex CTA clicks (room detail pages), using `fireEventAndNavigate` with `item_list_id: "room_detail"`. Before this build, no `select_item` events were fired from the room detail surface.
- 6 Jest tests in `RoomCard.ga4.test.tsx` verify the wiring: correct event fires on valid/absent query states, does not fire on the invalid (scroll-to-picker) path, and canonical GA4 item fields are present.
- Pre-activation GA4 baseline is now officially recorded in `docs/plans/brik-live-pricing-baseline/baseline-numbers.md`: select_item=0, begin_checkout=1, view_item=0, page_view=269 (90-day window ending 2026-02-26). This document anchors the Intended Outcome Check for the brik-octorate-live-availability results-review.

## Standing Updates

- `docs/plans/brik-live-pricing-baseline/baseline-numbers.md`: New baseline record created. Downstream consumer is `docs/plans/brik-octorate-live-availability/` results-review. No update to existing standing artifacts required; this build creates a new versioned record.
- No changes to existing standing Layer A artifacts (GA4 instrumentation guide, ga4-events.ts schema are unchanged).

## New Idea Candidates

- Post-activation GA4 verification step for room detail select_item | Trigger observation: Baseline shows 0 select_item from room_detail; after deploying to production and activating `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY`, a follow-up query (28-day window from activation date) should confirm non-zero select_item counts from `room_detail`. This is the measurement step the baseline enables. | Suggested next action: create card (part of brik-octorate-live-availability results-review)
- None for new standing data source, new open-source package, new loop process, or AI-to-mechanistic.

## Standing Expansion

No standing expansion: this build wires existing instrumentation (`ga4-events.ts` functions) to an existing component. The `ITEM_LIST_NAME["room_detail"]` entry was already present in `ga4-events.ts`; no new standing data is introduced.

## Intended Outcome Check

- **Intended:** Produce a documented pre-activation baseline (select_item event count from all room surfaces) and add select_item instrumentation to the room detail RoomCard CTAs (item_list_id = `room_detail`) so post-activation uplift from that surface is measurable.
- **Observed:** Both sub-goals met. `baseline-numbers.md` captures the pre-activation event counts (select_item=0 across all surfaces in 90 days). `RoomCard.tsx` now fires `select_item` on NR and Flex CTA clicks via `fireEventAndNavigate` with `item_list_id: "room_detail"`. 6 passing tests enforce correctness. Production deploy is the remaining step (outside this plan's scope, handled by `brik-octorate-live-availability`).
- **Verdict:** Met
- **Notes:** Production verification (confirming non-zero select_item events after deploy and flag activation) is intentionally deferred to the brik-octorate-live-availability plan. The instrumentation and baseline are complete as of this build.
