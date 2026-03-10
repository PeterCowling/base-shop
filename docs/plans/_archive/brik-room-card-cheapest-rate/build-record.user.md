---
Type: Build-Record
Status: Complete
Feature-Slug: brik-room-card-cheapest-rate
Build-date: 2026-02-28
artifact: build-record
---

# Build Record — Brik Room Card Cheapest Rate

## What was built

Each room card on `/en/rooms` and `/en/book` now shows a single "Check Rates" button
instead of two equal-weight buttons ("Non-Refundable Rates" / "Flexible Room Rates").
Clicking the button navigates directly to the cheapest (non-refundable) rate plan on
Octorate. The "From €X" live price display above the button is unchanged.

## Tasks completed

| Task | Description | Commit |
|---|---|---|
| TASK-01 | Added `singleCtaMode?: boolean` prop to shared `packages/ui` RoomsSection organism | `82ad49b845` |
| TASK-02 | Added `checkRatesSingle` i18n key to all 18 locale files | `82ad49b845` |
| TASK-03 | Wired `singleCtaMode={true}` into the brikette adapter | `9bdcb8f8d1` |
| TASK-04 | Updated GA4-11 test suite (7 button queries) — 8/8 tests pass | `3565226bc7` |

## Files changed

- `packages/ui/src/organisms/RoomsSection.tsx` — new `singleCtaMode` prop, conditional actions array
- `apps/brikette/src/components/rooms/RoomsSection.tsx` — `singleCtaMode={true}` on RoomsSectionBase
- `apps/brikette/src/locales/*/roomsPage.json` (×18) — `checkRatesSingle: "Check Rates"` key added
- `apps/brikette/src/test/components/ga4-11-select-item-room-ctas.test.tsx` — 7 button query updates

## Validation evidence

- `pnpm --filter @acme/ui build` — clean (exit 0)
- `pnpm --filter brikette typecheck` — clean (exit 0)
- `ga4-11-select-item-room-ctas.test.tsx` — 8/8 tests pass (green)
- Pre-commit hooks (typecheck-staged, lint-staged) — all passed on each commit

## Outcome Contract

- **Intended Outcome Statement:** Improve CTA click-through on room cards by reducing
  decision paralysis from two equal-weight buttons. Expected signal: consolidation of
  `select_item` plan events to `"nr"`, and increase in `begin_checkout` rate from room cards.
- **Status:** Change deployed to `dev`. Outcome measurable once pushed to production and
  GA4 data accumulates (~7 days).

## Notes

- Backwards-compatible: `singleCtaMode` is optional; any non-brikette consumer of the
  shared organism gets dual buttons by default (unchanged behaviour).
- `checkRatesSingle` copy is placeholder "Check Rates" for all 18 locales. Operator
  should review the copy for EN/IT/DE/FR primary guest locales before production push.
- Static `basePrice` display on `/rooms` (no-date context) was intentionally deferred out
  of scope — room cards on `/rooms` show the button only, no price label.
