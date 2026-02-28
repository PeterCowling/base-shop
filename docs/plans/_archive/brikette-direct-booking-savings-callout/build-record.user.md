---
Status: Complete
Feature-Slug: brikette-direct-booking-savings-callout
Completed-date: 2026-02-27
artifact: build-record
---

# Build Record — BRIK Direct Booking Savings Callout

## What Was Built

**Wave 1 (commit `fff8afa5c3`):** `DirectPerksBlock.tsx` was extended with two optional props, `savingsEyebrow?: string` and `savingsHeadline?: string`. A `showSavingsBanner` guard renders a small eyebrow `<p>` and a bold headline `<p>` above the existing "Why book direct?" `<h3>` when both props are non-empty strings. The EN locale file `bookPage.json` received a new `hostel.directSavings` sub-object with `eyebrow: "Book direct and save"` and `headline: "Up to 25% less than Booking.com"`. This is consistent with the existing `apartment.directSavings` block already in production.

**Wave 2 (commit `caca6b26fc`):** `BookPageContent.tsx` was updated to pass the two new i18n values as props to `<DirectPerksBlock>`. The existing `useTranslation("bookPage")` on line 75 was used; no new hook call was needed. Both `t()` calls use `defaultValue` with an i18n-exempt comment (`/* i18n-exempt -- BRIK-005 [ttl=2026-03-15] */`). The same Wave 2 commit propagated the EN fallback keys to all 17 non-EN locale `bookPage.json` files (`ar da de es fr hi hu it ja ko no pl pt ru sv vi zh`) using a Python `json.load`/`json.dumps(ensure_ascii=False)` script to safely add keys without re-encoding non-Latin characters.

**Wave 3 (commit `7432317a75`):** A new unit test file `direct-perks-block-savings.test.tsx` covers TC-04-01 through TC-04-04 (both props present → savings block renders before heading; no props → no savings block; empty-string props → no savings block; only one prop → no savings block). The existing `book-page-perks-cta-order.test.tsx` was extended with an updated `DirectPerksBlock` mock that accepts and renders the new savings props, plus TC-04-05 asserting that the savings eyebrow text appears before `RoomsSection` in DOM order on the `BookPageContent` page.

## Tests Run

```
pnpm -w run test:governed -- jest -- \
  --config=apps/brikette/jest.config.cjs \
  --testPathPattern="direct-perks-block-savings|book-page-perks-cta-order" \
  --no-coverage
```

Result: **8 / 8 PASS**

- `direct-perks-block-savings.test.tsx`: 4 tests — TC-04-01, TC-04-02, TC-04-03, TC-04-04 all PASS
- `book-page-perks-cta-order.test.tsx`: 4 tests — existing 3 ordering tests + new TC-04-05 all PASS

Pre-commit hooks (typecheck-staged + lint-staged) passed on all three wave commits.

Post-wave validation:

```
pnpm --filter brikette run typecheck
```

Result: **PASS** (all three waves; confirmed by hook output on each commit)

## Validation Evidence

| Task | Contract | Evidence |
|---|---|---|
| TASK-01 | TC-01-01 to TC-01-04 | Covered by `direct-perks-block-savings.test.tsx` TC-04-01 through TC-04-04 (tests target the same conditions; task-level TCs collapsed into TASK-04 test suite per plan) |
| TASK-02 | TC-02-01, TC-02-02 | `node -e` spot-check: `data.hostel.directSavings.eyebrow === "Book direct and save"` ✓; `data.hostel.directSavings.headline === "Up to 25% less than Booking.com"` ✓ |
| TASK-03 | TC-03-01, TC-03-02 | Covered by TC-04-05 in `book-page-perks-cta-order.test.tsx` — `savingsEyebrow` prop value ("Book direct and save") resolved via `useTranslation` mock and present in DOM before `RoomsSection` |
| TASK-04 | TC-04-01 to TC-04-05 | 8/8 tests PASS (see Tests Run above) |
| TASK-05 | TC-05-01, TC-05-02 | `node -e` spot-check on `de` and `zh` locale files confirmed `hostel.directSavings.eyebrow` and `hostel.directSavings.headline` present; JSON valid for all 17 files |

## Scope Deviations

None. All task-scoped files only. No controlled scope expansions were required.

## Outcome Contract

- **Why:** Guests landing on the hostel booking page have no named-OTA price anchor. The apartment page already provides this. Adding parity closes a minor conversion gap for the higher-volume hostel product.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Named-OTA savings headline visible on the hostel `/book` page before the room grid; GA4 `view_item_list` and `search_availability` events continue to fire without regression; no locale fallback warnings in production builds
- **Source:** operator
