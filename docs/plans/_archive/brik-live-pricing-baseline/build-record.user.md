---
Type: Build-Record
Status: Complete
Feature-Slug: brik-live-pricing-baseline
Completed-date: 2026-02-27
artifact: build-record
---

# Build Record: BRIK Live Pricing Baseline

## Outcome Contract

- **Why:** Before activating the live pricing flag, the select_item baseline on BRIK room pages must be captured to close the Intended Outcome Check in the results-review for brik-octorate-live-availability. Without it, the post-activation uplift cannot be measured.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Produce a documented pre-activation baseline (select_item event count from all room surfaces) and add select_item instrumentation to the room detail RoomCard CTAs (item_list_id = `room_detail`) so post-activation uplift from that surface is measurable.
- **Source:** operator

## What Was Built

**TASK-01 — select_item wired to RoomCard.tsx CTA callbacks.** Added `fireEventAndNavigate`, `buildRoomItem`, and `resolveItemListName` imports to `apps/brikette/src/components/rooms/RoomCard.tsx`. Hoisted the `title` computation (previously at line 383, after the callbacks) to above `openNonRefundable` to prevent a temporal dead zone. Replaced direct navigation (`window.location.href = nrOctorateUrl` and `router.push`) in both `openNonRefundable` and `openFlexible` with `fireEventAndNavigate` calls that fire `select_item` with `item_list_id: "room_detail"` and the correct `item_variant` (`"nr"` / `"flex"`) before navigation. Both Octorate URL and fallback `router.push` branches fire the event. The `queryState === "invalid"` early-return guard ensures the event does not fire on the scroll-to-picker path. Updated `useCallback` deps for both callbacks to include `title` and `room`. TypeScript: clean.

**TASK-03 — pre-activation GA4 baseline documented.** Created `docs/plans/brik-live-pricing-baseline/baseline-numbers.md` with the official pre-activation GA4 event counts (select_item=0, begin_checkout=1, view_item=0, page_view=269), capture methodology, and interpretation notes. The document is the anchored pre-activation reference for the brik-octorate-live-availability results-review.

**TASK-02 — test coverage for room detail select_item.** Created `apps/brikette/src/components/rooms/RoomCard.ga4.test.tsx` with 6 test cases (TC-01 through TC-06) using a purpose-built `@acme/ui/molecules` mock that renders action buttons. Tests verify: select_item fires with correct `item_list_id`, `item_list_name`, `item_variant`, `item_category`, `affiliation`, and `currency` on NR and Flex CTA clicks; does not fire when `queryState="invalid"`. All 6 tests passed in the governed Jest runner.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs --testPathPattern=RoomCard.ga4 --no-coverage` | Pass | 6/6 tests passed |
| `pnpm --filter brikette exec tsc --noEmit --skipLibCheck` | Pass | 0 TypeScript errors after TASK-01 changes |
| Pre-commit hook: typecheck-staged + lint-staged (brikette) | Pass | All hooks green on both commits |

## Validation Evidence

### TASK-01

- TC-01 (queryState=valid, NR click → select_item with item_list_id=room_detail, item_variant=nr): Code trace confirms `openNonRefundable` calls `fireEventAndNavigate` with `item_list_id: "room_detail"` and `buildRoomItem({ plan: "nr" })` whenever `queryState !== "invalid"` and `nrOctorateUrl` is set. Verified by TASK-02 TC-01 test pass.
- TC-02 (queryState=absent, NR click, no Octorate URL → select_item fires): Fallback branch in `openNonRefundable` also calls `fireEventAndNavigate` before `router.push`. Verified by TASK-02 TC-02 test pass.
- TC-03 (queryState=valid, Flex click → item_variant=flex): `openFlexible` uses `buildRoomItem({ plan: "flex" })`. Verified by TASK-02 TC-03 test pass.
- TC-04 (queryState=invalid, NR click → no select_item): `queryState === "invalid"` returns early before any `fireEventAndNavigate` call. Verified by TASK-02 TC-04 test pass.
- TC-05 (queryState=invalid, Flex click → no select_item): Same guard in `openFlexible`. Verified by TASK-02 TC-05 test pass.
- TC-06 (canonical payload fields): `buildRoomItem` produces `item_category: "hostel"`, `affiliation: "Hostel Brikette"`, `currency: "EUR"`; `resolveItemListName("room_detail")` produces `item_list_name: "Room detail"`. Verified by TASK-02 TC-06 test pass.

### TASK-02

- TC-01 through TC-06: All 6 tests pass in governed Jest runner (6 passed, 0 failed, 0 skipped).

### TASK-03

- File exists at `docs/plans/brik-live-pricing-baseline/baseline-numbers.md` (non-empty).
- Contains select_item count of 0 and begin_checkout count of 1.
- References property `474488225` and capture date `2026-02-27`.

## Scope Deviations

None: all tasks executed within plan scope. No controlled scope expansions required.
