---
Type: BuildRecord
Status: Complete
Feature-Slug: brik-prime-breakfast-order-pipeline
Build-Date: 2026-03-14
---

# BRIK Prime Breakfast Order Pipeline — Build Record

## Outcome Contract

- **Why:** When a guest uses the app to choose their breakfast, their order is saved but it never makes its way to the staff working the bar. The bar screen shows no record of it. Staff have no way to know what was ordered or even that an order was placed. Fixing this closes the loop so that every guest order placed in the app shows up as a clear ticket for bar staff to act on.
- **Intended Outcome:** Every guest breakfast and evening drink order placed in the Prime app appears as a structured bar ticket for bar staff during the service window. The Comp screen can display placed orders. Guests see their orders in human-readable form in the app.
- **Source:** operator

## What Was Built

Four changes ship together to complete the bridge from the guest app to the bar screen:

1. **Type definitions** — Four optional fields added to `PreorderNight` (functions layer), `PreorderNightData` (client types), and the `GuestBookingSnapshot.preorders` inline type: `breakfastTxnId`, `breakfastText`, `drink1Txn`, `drink1Text`. All additions are backward-compatible. Two helper functions were added: `serviceDateToBarPath()` converts an ISO date to Firebase path segments (full English month name, un-padded day), and `generatePreorderTxnId()` produces a compact Rome-timezone timestamp matching Reception's existing transaction ID format.

2. **Order string parser** — New `preorder-parser.ts` with `parseBreakfastOrderString()` and `parseEvDrinkOrderString()` pure functions. These convert the pipe-delimited strings produced by the breakfast and evening drink wizards into structured bar items: food items go to the kitchen line (`kds`), all other items (sides and drinks) go to the bar (`bds`). Malformed input emits a `console.warn` and returns a safe fallback — the order write is never blocked by a parser failure.

3. **Atomic bridge write** — The existing `onRequestPost` handler in the Prime functions layer now uses a single `FirebaseRest.update('/', multiPathPayload)` call instead of `firebase.set(...)`. This simultaneously writes: (a) the full preorder night node with `breakfastTxnId` + `breakfastText` backrefs (breakfast unchanged — the entitlement value is preserved; `drink1` unchanged for the same reason), and (b) a structured bar record at `barOrders/{breakfastPreorders|evDrinkPreorders}/{monthName}/{day}/{txnId}` containing the guest name, order items, and preorder time. If the write fails, the guest sees a 500 error and can retry — no partial state is possible because the write is atomic.

4. **Display fixes** — The Prime "existing orders" view now shows the human-readable order description (`breakfastText ?? breakfast`, `drink1Text ?? drink1`) instead of a raw transaction ID. The Reception Comp screen plan badge now shows "preordered" when a `breakfastTxnId` is present, rather than the old fallback that would have shown a raw token string.

## Engineering Coverage Evidence

| Coverage Area | Evidence |
|---|---|
| UI / visual | `MealOrderPage.existingOrders` reads `breakfastText ?? breakfast` and `drink1Text ?? drink1`. `CompScreen` plan badge checks `breakfastTxnId` presence → shows `"preordered"`. New TC-D01, TC-D02, TC-D03, TC-D04, TC-D06 tests added. Existing `MealOrderPage.test.tsx` and `CompScreen.test.tsx` / `CompScreen.preorder.test.tsx` / `CompScreen.eligibility.test.ts` are not regressed. |
| UX / states | Atomic write eliminates silent-failure: total write failure returns 500 to guest (can retry); no partial-write state where bar ticket is missing but preorder is saved. Drink entitlement preserved — `drink1` is never overwritten. |
| Security / privacy | Bridge write is gated behind existing `validateGuestSessionToken` and `hasServiceEntitlement` checks (unchanged). Guest name written only to internal `barOrders` path. No new auth surface. |
| Logging / observability / audit | `console.error('Error saving preorder:', error)` on atomic write failure (existing catch block; now covers both preorder and bar record). `console.warn` in parser on malformed/empty pipe-string input (TASK-02). |
| Testing / validation | TASK-01: `preorder-helpers.test.ts` — TC-H01 through TC-H04. TASK-02: `preorder-parser.test.ts` — TC-P01 through TC-P07 + edge cases. TASK-03: `preorders.test.ts` — TC-01 updated, TC-05 (breakfast bridge full payload), TC-06 (drink bridge, drink1 unchanged), TC-07 (failure path). TASK-04: `MealOrderPage.test.tsx` — TC-D01, TC-D02, TC-D06; `CompScreen.preorder.test.tsx` — TC-D03, TC-D04. |
| Data / contracts | `PreorderNight` (functions), `PreorderNightData` (src types), `GuestBookingSnapshot.preorders` inline type — all updated with 4 optional fields. `serviceDate` added to `PreorderNightData` (was missing). `BarPreorderRecord` type defined inline in `preorders.ts`. `breakfast` and `drink1` fields never overwritten — all consumers unaffected. |
| Performance / reliability | One `update` call replacing one `set` call — same latency or better. Atomic write eliminates the partial-write failure mode entirely. At hostel scale (<20 orders/morning) this is not a hot path. |
| Rollout / rollback | No feature flag needed. Reception `PreorderButtons` bar screen gains data immediately on Prime CF Pages deploy with no Reception code change required. Reception deploy needed only for `CompScreen` plan badge fix. Rollback: Prime CF Pages redeploy removing bridge write block (no data migration). |

## Workflow Telemetry Summary

- Stages covered: lp-do-plan (1 record), lp-do-build (1 record)
- Modules loaded: `build-code.md`, `build-validate.md`, `plan-code.md`
- Context input bytes across stages: 304,003
- Artifact bytes (plan): 59,328
- Deterministic checks: `scripts/validate-engineering-coverage.sh` — passed (valid, no errors)
- Missing stages: lp-do-ideas, lp-do-fact-find, lp-do-analysis (pre-existing records not captured in telemetry for this feature)
- Token measurement: not captured (infra gap)

## Post-Build Validation

Mode: 2 (Data Simulation — no rendered UI in acceptance criteria)

Attempt: 1
Result: Pass

Evidence:
- `pnpm --filter @apps/prime typecheck` — exit 0, no errors
- `pnpm --filter @apps/reception typecheck` — exit 0, no errors
- `pnpm --filter @apps/prime lint` — exit 0, 0 errors on changed files
- `scripts/validate-engineering-coverage.sh` — `{"valid":true,"skipped":false,"errors":[],"warnings":[]}`
- Data simulation of TC-05 payload: `preorder/.../nightX.breakfast` = `"PREPAID_MP_A"` (unchanged), `preorder/.../nightX.breakfastTxnId` = `txn_\d{17}`, `barOrders/breakfastPreorders/March/16/{txnId}` contains `{guestFirstName, guestSurname, uuid, preorderTime: "09:00", items: [{product:"Eggs (Scrambled)", lineType:"kds"}, ...]}` — all confirmed in test assertions.
- Data simulation of TC-06: `drink1` = `"PREPAID MP B"` (unchanged), `drink1Txn` = `txn_\d{17}`, `barOrders/evDrinkPreorders/May/2/{txnId}` = `{product:"Aperol Spritz", lineType:"bds"}` — confirmed.

Engineering coverage: all 8 Required rows have concrete build evidence above.
Degraded mode: No.
Deferred findings: None.
