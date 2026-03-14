---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brik-prime-breakfast-order-pipeline
Dispatch-ID: IDEA-DISPATCH-20260314203000-BRIK-001
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 83%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/brik-prime-breakfast-order-pipeline/analysis.md
---

# BRIK Prime Breakfast Order Pipeline — Plan

## Summary

Guest breakfast and evening drink orders placed in the Prime app are saved to Firebase but never reach bar staff — the bar screen reads from a different Firebase path that Prime never writes to. This plan delivers an atomic multi-path Firebase write inside the existing `onRequestPost` handler that simultaneously creates a structured bar ticket at `barOrders/{type}/{monthName}/{day}/{txnId}` and updates the preorder node with a txnId backref and human-readable text field. Four tasks implement the complete pipeline: type definitions and format helpers, the pipe-string parser, the atomic bridge write with tests, and display updates in both the Prime guest UI and the Reception CompScreen plan badge.

## Active tasks

- [x] TASK-01: Type definitions, format helpers, txnId generator — Complete 2026-03-14, commit 5005a893b2
- [x] TASK-02: Pipe-string order parser — Complete 2026-03-14, commit fdd799e6b7
- [x] TASK-03: Atomic bridge write + integration tests — Complete 2026-03-14, commit 1f52408b59
- [x] TASK-04: Prime existing-orders display + CompScreen plan badge — Complete 2026-03-14, commit 939bafd90b

## Goals

1. Every guest breakfast or evening-drink order placed in Prime appears as a bar ticket at `barOrders/{breakfastPreorders|evDrinkPreorders}/{monthName}/{day}/{txnId}` during the service window.
2. `preorder/{guestUuid}/{nightKey}.breakfastTxnId` holds the generated txnId after a breakfast order; `preorder/{guestUuid}/{nightKey}.breakfast` retains its current pipe-string or entitlement value (not overwritten). For drinks: `preorder/{guestUuid}/{nightKey}.drink1Txn` holds the txnId; `drink1` is left unchanged.
3. The written record satisfies both `placedPreorderSchema` (`{ preorderTime, items }`) and the runtime fields `PreorderButtons` reads (`guestFirstName`, `guestSurname`, `uuid`).
4. The Prime "existing orders" view continues to show human-readable text via `breakfastText` / `drink1Text` dual fields.
5. The `CompScreen` plan badge correctly labels Prime-sourced breakfast orders. The badge interpretation uses `breakfastTxnId` presence to show `"preordered"`.
6. Month/day RTDB path segments produced by Prime match the un-padded format from Reception's `getItalyLocalDateParts`.

**Note on `ModalPreorderDetails` modal lookup:** A pre-existing date alignment mismatch exists between `serviceDate` (stored in `preorder/.../nightKey`) and the date `ModalPreorderDetails` derives from `addDays(checkInDate, nightIndex)`. For `night1`, the modal computes `checkIn + 1 day` but the actual service date for night1 is `checkInDate` itself. This misalignment predates this plan and means `ModalPreorderDetails` cannot reliably look up Prime-originated breakfast preorders by txnId via the current `breakfastTxnId` approach. Full modal lookup support for Prime-originated preorders is **out of scope** for this feature — it requires a separate fix to `ModalPreorderDetails` date derivation. The bar screen ticket display and CompScreen plan badge changes are deliverable and correct.

## Non-goals

- Changing the wizard UI in Prime.
- Changing bar staff order-taking flow (PreorderButtons single-click / double-click handling).
- Replacing the pipe-delimited string format as the order submission encoding.
- Adding pricing to Prime-originated preorders (all complimentary; `price: 0`).
- Internationalisation of order item names.
- Handling the `drink2` slot (no Prime UI exposes it).
- Full Comp modal support for evening drinks (drink `ModalPreorderDetails` lookup is out of scope; `drink1Txn` is written for future use only).

## Constraints & Assumptions

- Constraints:
  - Prime functions layer runs as Cloudflare Pages Functions — no persistent compute, no scheduled tasks.
  - Firebase RTDB is the only persistence layer in scope.
  - The `txnId` must conform to `txn_YYYYMMDDhhmmssfff` (Rome timezone, 17 chars after prefix) to be locatable by `usePlacedPreorder` and `useCompletedOrder`. No random suffix — format matches Reception's `generateTransactionId()` exactly.
  - All RTDB writes from Prime go through `FirebaseRest`.
  - Month/day path segments must be un-padded (e.g. `"1"`, `"14"`), matching Reception's `getItalyLocalDateParts` output.
  - `drink1` must not be overwritten with a txnId — it is used as the drink-tier entitlement marker by `detectDrinkTier()`.
  - `breakfast` field must NOT be overwritten with a txnId. `useMealPlanEligibility` reads `preorders[0].breakfast` (the entitlement night) as `occupantBreakfastType` to derive `hasPrepaidMealPlan` and `drinksAllowed`. Test fixture `preorders.test.ts:38-44` confirms `night1.breakfast = "PREPAID_MP_A"` on a real service night. Overwriting ANY night's `breakfast` with a txnId risks corrupting entitlement classification. Instead: store the backref in a new separate field `breakfastTxnId` (alongside existing `breakfastText`). This is safe because `ModalPreorderDetails` reads `nightValue.breakfast` to detect txnId (lines 84–86) — that detection would fail for `breakfastTxnId`; modal lookup is therefore out of scope (see Goal 2 note above).
  - The preorder node write must include the full `PreorderNight` object (all five fields: `night`, `breakfast`, `drink1`, `drink2`, `serviceDate`), with `breakfast` unchanged.
  - `ModalPreorderDetails` date derivation (`addDays(checkInDate, nightIndex)`) is off-by-one relative to stored `serviceDate` (night1 maps to checkIn+1 day in modal but serviceDate=checkInDate). This is a pre-existing misalignment. Full modal lookup for Prime-originated preorders is out of scope for this plan.
- Assumptions:
  - `FirebaseRest.update('/', multiPathPayload)` supports fan-out atomic writes — confirmed by `createPrimeRequestWritePayload` pattern.
  - CF Workers support `Intl.DateTimeFormat` with `Europe/Rome` timezone and `Date.now()` — sufficient to implement the txnId timestamp format without the Reception-only `getItalyTimestampCompact`.
  - `getItalyTimestampCompact` is not exported from a shared package; TASK-01 will confirm and implement inline using `Intl.DateTimeFormat`.
  - For guests placing breakfast orders via Prime, the ordering night's `breakfast` field currently holds the pipe-string value (previously set by the same Prime function), not the entitlement marker. The entitlement marker (`"PREPAID_MP_A"` etc.) lives on `night1` which is written by Reception at check-in. TASK-03 must confirm this separation holds in the RTDB data model before proceeding.

## Inherited Outcome Contract

- **Why:** When a guest uses the app to choose their breakfast, their order is saved but it never makes its way to the staff working the bar. The bar screen shows no record of it. Staff have no way to know what was ordered or even that an order was placed. Fixing this closes the loop so that every guest order placed in the app shows up as a clear ticket for bar staff to act on.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Every guest breakfast and evening drink order placed in the Prime app appears as a structured bar ticket for bar staff during the service window. The Comp screen can display placed orders. Guests see their orders in human-readable form in the app.
- **Source:** operator

## Analysis Reference

- Related analysis: `docs/plans/brik-prime-breakfast-order-pipeline/analysis.md`
- Selected approach inherited:
  - Option A — Atomic multi-path write in `onRequestPost`: generate txnId before the write, replace `firebase.set(preorderPath, nextNight)` with a single `FirebaseRest.update('/', multiPathPayload)` call.
- Key reasoning used:
  - Matches the `createPrimeRequestWritePayload` fan-out pattern already in the codebase.
  - Eliminates the half-written-state failure mode entirely.
  - `drink1` must remain unchanged (entitlement marker for `detectDrinkTier()`); separate `drink1Txn` field for backref.
  - Dual-field strategy (`breakfastText` / `drink1Text`) preserves human-readable display on the Prime guest side.

## Selected Approach Summary

- What was chosen:
  - Atomic multi-path write: `FirebaseRest.update('/', { [preorderPath]: fullNextNightObject, [barPath]: barRecord })`.
  - txnId generated before any write using `Intl.DateTimeFormat` with `Europe/Rome`.
  - Breakfast: `breakfast` unchanged (retains pipe-string or entitlement value); `breakfastTxnId = txnId` (new backref field); `breakfastText = pipeString`. Drinks: `drink1Txn = txnId`, `drink1Text = pipeString`, `drink1` unchanged.
  - Bar record includes `preorderTime`, `items`, `guestFirstName`, `guestSurname`, `uuid` to satisfy both `placedPreorderSchema` and `PreorderButtons` runtime reads.
  - `ModalPreorderDetails` modal lookup is out of scope — a pre-existing date alignment mismatch (`addDays(checkInDate, nightIndex)` vs `serviceDate`) makes reliable lookup impossible without a separate fix to that component.
- Why planning is not reopening option selection:
  - Analysis resolved architecture questions. The plan now additionally scopes down the modal lookup goal in response to a pre-existing code contract mismatch discovered during critique. Bar screen ticket display (the primary operational need) is unaffected. Option A remains the correct approach.

## Fact-Find Support

- Supporting brief: `docs/plans/brik-prime-breakfast-order-pipeline/fact-find.md`
- Evidence carried forward:
  - `onRequestPost` at `apps/prime/functions/api/firebase/preorders.ts:124` is the single write point.
  - `PreorderButtons` reads `guestFirstName`, `guestSurname`, `uuid`, `items[]` from the barOrder node at runtime — these are not in `placedPreorderSchema` but must be written.
  - Month/day format: `getItalyLocalDateParts` uses `String(Number(...))` → un-padded day (e.g. `"1"` not `"01"`).
  - `CompScreen.plan` at line 258 reads `occPre[tonightKey]?.breakfast ?? "NA"`. TASK-04 adds a `breakfastTxnId` check before this fallback — if `breakfastTxnId` is present, the plan badge shows `"preordered"`. `breakfast` is not overwritten with txnId so the existing plan badge logic continues to work correctly for non-Prime orders.
  - `MealOrderPage.existingOrders` reads `night.breakfast` or `night.drink1` directly — must be updated to `breakfastText ?? breakfast`.
  - TC-01 in `preorders.test.ts` currently asserts `setSpy` called once; post-bridge it must assert `updateSpy` with the full multi-path payload.

## Plan Gates

- Foundation Gate: Pass — analysis is Ready-for-planning, all operator questions resolved, no design spec required (backend-only changes in TASK-01/02/03; TASK-04 has two small UI display changes with no design spec required per analysis).
- Sequenced: Yes — TASK-01 → TASK-02 → TASK-03 (serial dependency); TASK-03 and TASK-04 can run in parallel after TASK-01+02.
- Edge-case review complete: Yes — see edge case notes per task below.
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Type definitions, format helpers (monthName/day), txnId generator | 88% | M | Pending | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Pipe-string order parser (`parseBreakfastOrderString`, `parseEvDrinkOrderString`) | 85% | M | Pending | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Atomic bridge write in `onRequestPost` + TC-05/TC-06 integration tests | 85% | M | Pending | TASK-01, TASK-02 | - |
| TASK-04 | IMPLEMENT | Prime existing-orders display + CompScreen plan badge | 82% | M | Pending | TASK-01 | - |

## Engineering Coverage

| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | `MealOrderPage.existingOrders` reads `breakfastText ?? breakfast` (and `drink1Text ?? drink1`). `CompScreen` plan badge checks `breakfastTxnId` field presence → renders `"preordered"`. `breakfast` field is not overwritten with txnId so entitlement values are preserved. | TASK-04 | Existing tests in `MealOrderPage.test.tsx`, `CompScreen.test.tsx`, `CompScreen.preorder.test.tsx` must pass without regression. `ModalPreorderDetails` modal lookup for Prime-originated preorders is out of scope (pre-existing date alignment mismatch). |
| UX / states | Atomic write eliminates silent-failure state — guest sees error response on total write failure and can retry. Bar ticket appears during service window as soon as atomic write completes. Drink entitlement preserved because `drink1` is left unchanged. | TASK-03 | No silent-failure state remains after TASK-03. |
| Security / privacy | Bridge write executes only after `validateGuestSessionToken` and `hasServiceEntitlement` pass (existing gates; unchanged). `guestFirstName`, `guestSurname` written to internal `barOrders` path only (staff tool). | TASK-03 | No additional security surface introduced. |
| Logging / observability / audit | Single `console.error` on multi-path write failure covers all paths together. `console.warn` on malformed pipe-string parser input. | TASK-02, TASK-03 | Replaces three separate `console.error` calls (sequential write approach). |
| Testing / validation | Unit tests for parser, month/day helper, txnId generator. TC-01 updated to assert `updateSpy` with full multi-path payload. TC-05 (breakfast bridge) and TC-06 (drink bridge) added. Existing `MealOrderPage.test.tsx`, `CompScreen.test.tsx`, `CompScreen.preorder.test.tsx`, `CompScreen.eligibility.test.ts` must not regress. | TASK-01, TASK-02, TASK-03, TASK-04 | Bridge path had zero test coverage before this plan. |
| Data / contracts | Four type definitions updated with new optional fields `breakfastTxnId`, `breakfastText`, `drink1Txn`, `drink1Text`: (a) `PreorderNight` interface in `preorders.ts:27`; (b) `PreorderNightData` in `apps/prime/src/types/preorder.ts:7`; (c) inline preorder night shape in `useGuestBookingSnapshot.ts:21–30`; (d) `NightData` interface in `CompScreen.tsx` (add `breakfastTxnId?: string`). Bar record type `BarPreorderRecord` defined in TASK-03. `breakfast` and `drink1` fields are NOT overwritten — consumer regressions avoided. | TASK-01, TASK-03, TASK-04 | All new fields are optional — not a breaking change. `ModalPreorderDetails` txnId lookup is out of scope. |
| Performance / reliability | One REST call replacing the current single `set` call — same or better latency. Atomic write reduces RTDB contention vs. sequential writes. At hostel scale (<20 orders/morning) not a hot path. | TASK-03 | Atomic write is both faster and more reliable than the sequential alternative. |
| Rollout / rollback | No feature flag needed — change is additive from Reception's perspective. Reception `PreorderButtons` bar screen requires no code changes. Only `CompScreen` plan badge and `MealOrderPage` require Reception + Prime redeploys. Rollback: Prime CF Pages redeploy removing bridge write block. Residual: `preorder` nodes holding txnId in `breakfast` will display "Breakfast transaction not found" in Comp modal until overwritten by fresh order — acceptable. | TASK-03, TASK-04 | Two apps must deploy for full correctness (Prime CF Pages + Reception). |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Types and helpers; unblocks everything else |
| 2 | TASK-02 | TASK-01 complete | Parser depends on types from TASK-01 |
| 3a | TASK-03 | TASK-01, TASK-02 complete | Bridge write; consumes helpers and parser |
| 3b | TASK-04 | TASK-01 complete | Display changes; can run in parallel with TASK-02 and TASK-03 once TASK-01 is done |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| Prime guest order write (breakfast) | Guest confirms breakfast order in Prime app | (1) `onRequestPost` validates auth + entitlement → (2) txnId generated via `Intl.DateTimeFormat` Rome timezone → (3) `parseBreakfastOrderString(value)` produces `SalesOrderItem[]` → (4) `serviceDateToBarPath(serviceDate)` returns `{ monthName, day }` → (5) `FirebaseRest.update('/', { [preorderPath]: { ...nextNight, breakfastTxnId: txnId, breakfastText: value } /* breakfast UNCHANGED */, [barPath]: { preorderTime, items, guestFirstName, guestSurname, uuid } })` | TASK-01, TASK-02, TASK-03 | Rollback: remove bridge write block + Prime CF Pages redeploy |
| Prime guest order write (drinks) | Guest confirms evening drinks order | Same multi-path write: preorder node gets `drink1Txn: txnId`, `drink1Text: value`; `drink1` field left unchanged as entitlement marker | TASK-01, TASK-02, TASK-03 | `drink1` must not be overwritten — explicit guard in TASK-03 build contract |
| Bar screen ticket display | Atomic write completes (above) | `PreorderButtons` RTDB listener receives new node at `barOrders/{type}/{monthName}/{day}/{txnId}` → renders guest name, items, preorder time as an action ticket during service window | TASK-03 (write only) | No Reception code changes needed; bar path format must match exactly |
| Comp screen modal lookup (breakfast) | N/A (out of scope) | `ModalPreorderDetails` reads `nightValue.breakfast?.startsWith("txn_")`. Since this plan does NOT overwrite `breakfast` with txnId (uses separate `breakfastTxnId` field), the modal lookup is not activated for Prime-originated orders. Pre-existing date alignment mismatch (`addDays(checkInDate, nightIndex)` vs `serviceDate`) makes reliable lookup impossible in any case. Modal continues to show text fallback for Prime-originated breakfast orders. Full modal lookup support requires a separate fix to `ModalPreorderDetails` date derivation. | Out of scope | Pre-existing `ModalPreorderDetails` off-by-one date bug must be fixed in a separate feature |
| CompScreen plan badge | Same atomic write | `CompScreen.buildRow` reads `occPre[tonightKey]?.breakfastTxnId` first; if present → `"preordered"`; else falls back to `occPre[tonightKey]?.breakfast ?? "NA"` (existing logic unchanged) | TASK-04 | Small Reception-side change; `NightData` interface in `CompScreen.tsx` must add `breakfastTxnId?: string`; existing CompScreen tests must not regress |
| Prime existing-orders display | Same atomic write | `MealOrderPage.existingOrders` reads `night.breakfastText ?? night.breakfast` (and `night.drink1Text ?? night.drink1`); human-readable text displayed | TASK-04 | `MealOrderPage.test.tsx` must be extended to cover new field reads |

## Tasks

---

### TASK-01: Type definitions, format helpers, txnId generator

- **Type:** IMPLEMENT
- **Deliverable:** Updated type definitions in `apps/prime/functions/api/firebase/preorders.ts`, `apps/prime/src/types/preorder.ts`, and `apps/prime/src/hooks/dataOrchestrator/useGuestBookingSnapshot.ts`; new helper functions `serviceDateToBarPath(serviceDate: string): { monthName: string; day: string }` and `generatePreorderTxnId(): string`; unit tests at `apps/prime/functions/api/firebase/__tests__/preorder-helpers.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/prime/functions/api/firebase/preorders.ts`, `apps/prime/src/types/preorder.ts`, `apps/prime/src/hooks/dataOrchestrator/useGuestBookingSnapshot.ts`, `apps/prime/functions/api/firebase/__tests__/preorder-helpers.test.ts` (new)
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 88%
  - Implementation: 90% — Type additions are additive (all optional fields); format helper pattern is clear from `getItalyLocalDateParts` evidence; CF Workers `Intl.DateTimeFormat` confirmed available.
  - Approach: 88% — `getItalyTimestampCompact` availability to confirm at build time; fallback is inline `Intl.DateTimeFormat` which is well-understood.
  - Impact: 85% — No visible user impact; unblocks TASK-02 and TASK-03 which carry the primary impact.
- **Acceptance:**
  - `PreorderNight` interface in `preorders.ts` has optional fields: `breakfastTxnId?: string`, `breakfastText?: string`, `drink1Txn?: string`, `drink1Text?: string`.
  - `PreorderNightData` in `apps/prime/src/types/preorder.ts` has same four optional fields plus `serviceDate?: string`.
  - `GuestBookingSnapshot.preorders` inline type in `useGuestBookingSnapshot.ts:21–30` has same four optional fields plus `serviceDate?: string`.
  - `serviceDateToBarPath("2026-03-01")` returns `{ monthName: "March", day: "1" }` (un-padded day).
  - `serviceDateToBarPath("2026-03-14")` returns `{ monthName: "March", day: "14" }`.
  - `generatePreorderTxnId()` returns a string matching `/^txn_\d{17}$/` — format is exactly `txn_` + 17-digit compact timestamp (`YYYYMMDDHHmmssfff` where `fff` = milliseconds) in Rome timezone. No random suffix — matches Reception's `generateTransactionId()` format exactly. Same-millisecond uniqueness is not required (hostel-scale, <20 orders/morning; clock resolution is sufficient).
  - Unit tests assert un-padded day for both single-digit and two-digit input dates.
  - TypeScript compiles cleanly in `apps/prime` after type changes.
- **Engineering Coverage:**
  - UI / visual: N/A — no UI changes in this task; type definitions are internal.
  - UX / states: N/A — no user-visible states changed.
  - Security / privacy: N/A — helpers are pure functions with no auth or data exposure.
  - Logging / observability / audit: N/A — no log changes in this task.
  - Testing / validation: Required — unit tests for `serviceDateToBarPath` asserting un-padded day output (`"1"` for March 1, `"14"` for March 14); unit tests for `generatePreorderTxnId` asserting `txn_` prefix and Rome-timezone timestamp format. Tests live at `apps/prime/functions/api/firebase/__tests__/preorder-helpers.test.ts`.
  - Data / contracts: Required — three type definitions updated with new optional fields; all additions are backward-compatible (optional). `ProcessedPreorder` in `src/types/preorder.ts` does not need updating (display-only type, not used in the write path).
  - Performance / reliability: N/A — pure helper functions; no I/O.
  - Rollout / rollback: N/A — type-only changes are fully backward compatible.
- **Validation contract:**
  - TC-H01: `serviceDateToBarPath("2026-03-01")` → `{ monthName: "March", day: "1" }` (day is "1" not "01")
  - TC-H02: `serviceDateToBarPath("2026-12-31")` → `{ monthName: "December", day: "31" }`
  - TC-H03: `serviceDateToBarPath("2026-03-14")` → `{ monthName: "March", day: "14" }`
  - TC-H04: `generatePreorderTxnId()` returns string matching `/^txn_\d{17}$/` (exactly 17 digits after `txn_`)
- **Execution plan:** Red → Green → Refactor: Write failing tests for helpers first; implement helpers to pass; refactor for readability; update type definitions; verify TypeScript compilation.
- **Planning validation:**
  - Checks run: Read `apps/prime/functions/api/firebase/preorders.ts:27-33` (PreorderNight interface at lines 27–33), `apps/prime/src/types/preorder.ts:7-14`, `apps/prime/src/hooks/dataOrchestrator/useGuestBookingSnapshot.ts:21-30`. All three confirmed missing `breakfastText`, `drink1Txn`, `drink1Text`, `serviceDate` (partially).
  - Validation artifacts: `apps/reception/src/utils/dateUtils.ts:461` confirms `String(Number(...))` un-padded pattern.
  - Unexpected findings: `PreorderNightData` in `src/types/preorder.ts:7` is missing `serviceDate` entirely — must add it as well. `ProcessedPreorder` type does not need updating (not in the write/read path for this feature).
- **Scouts:**
  - Confirm `getItalyTimestampCompact` is not exported from `@acme/lib` or any shared package before implementing inline. If exported, import instead.
- **Edge Cases & Hardening:**
  - `serviceDateToBarPath` must handle leap-day dates (Feb 29) and single-digit months.
  - `generatePreorderTxnId` format is deterministic (Rome timezone `YYYYMMDDHHmmssfff`) — no random suffix needed at hostel scale.
- **What would make this >=90%:**
  - Confirming `getItalyTimestampCompact` is not in shared package (removes 1 decision branch).
- **Rollout / rollback:**
  - Rollout: Type-only changes; deployed as part of Prime CF Pages function bundle. No migration required.
  - Rollback: Remove new optional fields (non-breaking; existing consumers ignore unknown optional fields).
- **Documentation impact:**
  - None required beyond inline type comments.
- **Notes / references:**
  - `apps/reception/src/utils/dateUtils.ts:461` — `getItalyLocalDateParts` un-padded day pattern.
  - `apps/reception/src/utils/generateTransactionId.ts` — Reception `txn_YYYYMMDDhhmmssfff` format reference.

---

### TASK-02: Pipe-string order parser

- **Type:** IMPLEMENT
- **Deliverable:** New pure functions `parseBreakfastOrderString(value: string): { preorderTime: string; items: SalesOrderItem[] }` and `parseEvDrinkOrderString(value: string): { preorderTime: string; items: SalesOrderItem[] }` in `apps/prime/functions/api/firebase/preorder-parser.ts` (new file); unit tests at `apps/prime/functions/api/firebase/__tests__/preorder-parser.test.ts` (new file)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/prime/functions/api/firebase/preorder-parser.ts` (new), `apps/prime/functions/api/firebase/__tests__/preorder-parser.test.ts` (new)
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 88% — `buildBreakfastOrderValue` format is deterministic and well-tested; parsing is the reverse of a known format. Parser is a pure function with no external dependencies.
  - Approach: 85% — Segment count varies by food type (Pancakes and non-Eggs foods have no sides segment); parser must handle variable segment counts correctly.
  - Impact: 82% — Parser output feeds directly into bar ticket items; incorrect items would show wrong food names to bar staff.
- **Acceptance:**
  - `parseBreakfastOrderString("Eggs (Scrambled) | Bacon, Ham, Toast | Americano, Oat Milk, No Sugar | 09:00")` returns `{ preorderTime: "09:00", items: [{ product: "Eggs (Scrambled)", count: 1, lineType: "kds", price: 0 }, { product: "Bacon", count: 1, lineType: "bds", price: 0 }, { product: "Ham", count: 1, lineType: "bds", price: 0 }, { product: "Toast", count: 1, lineType: "bds", price: 0 }, { product: "Americano, Oat Milk, No Sugar", count: 1, lineType: "bds", price: 0 }] }`.
  - `parseBreakfastOrderString("Pancakes (Nutella Chocolate Sauce) | Green Tea | 08:30")` returns `{ preorderTime: "08:30", items: [{ product: "Pancakes (Nutella Chocolate Sauce)", count: 1, lineType: "kds", price: 0 }, { product: "Green Tea", count: 1, lineType: "bds", price: 0 }] }`.
  - `parseEvDrinkOrderString("Aperol Spritz | 19:30")` returns `{ preorderTime: "19:30", items: [{ product: "Aperol Spritz", count: 1, lineType: "bds", price: 0 }] }`.
  - `parseEvDrinkOrderString("Americano, With Milk, With Sugar | 19:00")` returns `{ preorderTime: "19:00", items: [{ product: "Americano, With Milk, With Sugar", count: 1, lineType: "bds", price: 0 }] }`.
  - Malformed input (empty string, missing time segment) emits `console.warn` and returns `{ preorderTime: "00:00", items: [] }` (safe fallback, not a throw).
  - All existing `buildOrderValue.test.ts` round-trip fixtures parse successfully.
- **Engineering Coverage:**
  - UI / visual: N/A — server-side pure function, no UI output.
  - UX / states: Required — malformed input must not throw; `console.warn` guard and fallback return value ensure bar write does not fail on parser error.
  - Security / privacy: N/A — no auth or data exposure; input is the `value` field already validated non-empty by the handler.
  - Logging / observability / audit: Required — `console.warn` emitted when pipe-string cannot be parsed (missing time segment or empty segments); enables operator awareness of malformed orders.
  - Testing / validation: Required — unit tests cover Eggs with sides, Pancakes (no sides), non-Eggs food, evening drink with modifiers, evening drink without modifiers, empty/malformed input edge cases. Round-trip fixtures from `buildOrderValue.test.ts` used as canonical test data.
  - Data / contracts: Required — output shape must satisfy `SalesOrderItem` type: `{ product: string; count: number; lineType: "kds" | "bds"; price: number }`. Food segment → `lineType: "kds"`; all other segments → `lineType: "bds"`. Price is always `0`.
  - Performance / reliability: N/A — pure synchronous string processing; negligible overhead.
  - Rollout / rollback: N/A — new file, no existing callers until TASK-03 imports it.
- **Validation contract:**
  - TC-P01: Eggs order with sides → correct `kds` food item + individual `bds` side items + `bds` drink item
  - TC-P02: Pancakes order (no sides segment) → correct `kds` food item + `bds` drink item
  - TC-P03: Non-Eggs food (e.g. "Veggie Toast") → `kds` food item + `bds` drink item
  - TC-P04: Evening drink with modifiers → single `bds` item (full comma-joined string as product)
  - TC-P05: Evening drink without modifiers → single `bds` item
  - TC-P06: Empty string input → `console.warn` called + `{ preorderTime: "00:00", items: [] }` returned
  - TC-P07: Value with no time segment → `console.warn` called + fallback preorderTime
  - TC-P08: Round-trip — every output of `buildBreakfastOrderValue(state)` fixture parses without warn
- **Execution plan:** Red → Green → Refactor: Write tests using `buildOrderValue.test.ts` fixtures as input; implement parser to pass; verify edge cases; add `console.warn` guards.
- **Planning validation:**
  - Checks run: Read `apps/prime/src/lib/meal-orders/buildOrderValue.ts` in full; confirmed segment order and structure for all three food types (Eggs, Pancakes, other) and evening drinks.
  - Validation artifacts: `buildBreakfastOrderValue` examples in JSDoc confirm segment count variability (2–4 segments for breakfast; 1–2 for drinks).
  - Unexpected findings: The food segment for Pancakes and other foods is the last food segment but may not always be followed by a sides segment — parser must identify the time segment by last position, not by index.
- **Scouts:**
  - Confirm lineType mapping decision: analysis specifies food items → `"kds"`, drink and side items → `"bds"`. Verify this matches how Reception's `PreorderButtons` renders items (food on KDS line, sides/drinks on BDS line).
- **Edge Cases & Hardening:**
  - Last pipe segment is always the time (`HH:MM`) — use last-segment detection for `preorderTime`.
  - Sides segment is identified by being a comma-joined list (second position, only for Eggs food).
  - Empty pipe segments after `split(" | ")` should be filtered.
  - Parser must not throw on any input — always return a safe fallback.
- **What would make this >=90%:**
  - Confirming lineType mapping (`kds` for food / `bds` for sides+drinks) against actual `PreorderButtons` render behavior.
- **Rollout / rollback:**
  - Rollout: New file, only imported by TASK-03.
  - Rollback: Remove import in `preorders.ts`; file becomes dead code.
- **Documentation impact:**
  - JSDoc on both exported functions explaining the segment format and item granularity.
- **Notes / references:**
  - `apps/prime/src/lib/meal-orders/buildOrderValue.ts` — canonical format spec.
  - `apps/prime/src/lib/meal-orders/__tests__/buildOrderValue.test.ts` — round-trip test fixtures.

---

### TASK-03: Atomic bridge write + integration tests

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/prime/functions/api/firebase/preorders.ts` replacing `firebase.set(preorderPath, nextNight)` with `firebase.update('/', multiPathPayload)`; new TC-05 (breakfast bridge) and TC-06 (drink bridge) in `apps/prime/functions/api/firebase/__tests__/preorders.test.ts`; TC-01 updated to assert `updateSpy` instead of `setSpy`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/prime/functions/api/firebase/preorders.ts`, `apps/prime/functions/api/firebase/__tests__/preorders.test.ts`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 87% — `FirebaseRest.update('/', payload)` pattern confirmed in `prime-requests.ts`; handler structure well-understood from reading the source. Need to confirm occupant read path for `guestFirstName`/`guestSurname` (must read from `bookings/{bookingId}/{guestUuid}`).
  - Approach: 85% — Atomic multi-path write is the chosen approach; no uncertainty on method.
  - Impact: 83% — Direct enabler for bar staff visibility; high confidence on impact.
- **Acceptance:**
  - After a successful breakfast order, `updateSpy` is called with a payload that includes:
    - `[preorderPath]: { night, breakfast: <unchanged>, breakfastTxnId: txnId, breakfastText: value, drink1, drink2, serviceDate }` (full object; `breakfast` is NOT modified — retains its current pipe-string or entitlement value; `drink1` unchanged)
    - `[barPath]: { preorderTime, items: SalesOrderItem[], guestFirstName, guestSurname, uuid }` (where barPath = `barOrders/breakfastPreorders/{monthName}/{day}/{txnId}`)
  - After a successful drink order, `updateSpy` payload includes:
    - `[preorderPath]: { night, breakfast (unchanged), drink1Txn: txnId, drink1Text: value, drink1 (unchanged), drink2, serviceDate }`
    - `[barPath]: { preorderTime, items, guestFirstName, guestSurname, uuid }` (barPath = `barOrders/evDrinkPreorders/{monthName}/{day}/{txnId}`)
  - `breakfast` field in the preorder node is NOT modified (entitlement value preserved for `useMealPlanEligibility`).
  - `drink1` field in the preorder node is NOT modified (entitlement marker preserved).
  - `setSpy` is NOT called for the preorder write (replaced by `updateSpy`).
  - If `updateSpy` throws, handler returns 500 and logs `console.error`.
  - TC-01 updated: asserts `updateSpy` called once (not `setSpy`).
  - TC-05 (breakfast bridge): full multi-path payload asserted; `preorder/.../nightX.breakfast` = original value (UNCHANGED); `preorder/.../nightX.breakfastTxnId` = txnId.
  - TC-06 (drink bridge): full multi-path payload asserted; `drink1` field unchanged in preorder node.
- **Engineering Coverage:**
  - UI / visual: N/A — server-side function; no UI output from this task.
  - UX / states: Required — failure path: if `firebase.update` throws, handler returns 500; guest sees error and can retry. No partial-write state possible (atomic). `console.error` logged on failure.
  - Security / privacy: Required — bridge write is gated behind existing `validateGuestSessionToken` and `hasServiceEntitlement` checks (unchanged). Occupant name read requires `bookings/{bookingId}/{guestUuid}` — guestUuid is from authenticated session. `guestFirstName`/`guestSurname` written only to internal `barOrders` path.
  - Logging / observability / audit: Required — `console.error('Error saving preorder:', error)` on `firebase.update` failure (existing catch block extended). Single error event covers entire atomic payload.
  - Testing / validation: Required — TC-01 updated; TC-05 (breakfast) and TC-06 (drink) added, each asserting exact multi-path payload via `updateSpy`. Tests use existing spy infrastructure in `preorders.test.ts`. `setSpy` call count asserted as 0 for the preorder write path. TC-05 must assert `breakfast` field is unchanged (not overwritten).
  - Data / contracts: Required — defines canonical `BarPreorderRecord` write type (`{ preorderTime: string; items: SalesOrderItem[]; guestFirstName: string; guestSurname: string; uuid: string }`). Preorder node must include all five original `PreorderNight` fields plus new optional fields. `breakfast` and `drink1` fields must not be overwritten. `breakfastTxnId` is the new breakfast backref field.
  - Performance / reliability: Required — one `update` call replacing one `set` call; same or better latency. Atomic write eliminates partial-write failure mode.
  - Rollout / rollback: Required — no feature flag; change is additive (Reception bar screen gains data it previously never had). Rollback: remove bridge write block from `onRequestPost` + Prime CF Pages redeploy. No residual txnId-in-breakfast regression (breakfast field not modified).
- **Validation contract:**
  - TC-01 (updated): eligible guest can create future-date order → `updateSpy` called once with full multi-path payload; `setSpy` not called; response 200
  - TC-05: breakfast bridge — full multi-path payload includes `barOrders/breakfastPreorders/{month}/{day}/{txnId}` node with correct items; `preorder/.../nightX.breakfastTxnId` = txnId; `preorder/.../nightX.breakfast` = ORIGINAL VALUE (unchanged); `preorder/.../nightX.breakfastText` = pipe-string value
  - TC-06: drink bridge — full multi-path payload includes `barOrders/evDrinkPreorders/{month}/{day}/{txnId}` node; `preorder/.../nightX.drink1Txn` = txnId; `preorder/.../nightX.drink1Text` = pipe-string value; `preorder/.../nightX.drink1` = original entitlement value (unchanged)
  - TC-07: firebase.update failure → handler returns 500; `console.error` called
- **Execution plan:** Red → Green → Refactor: Update TC-01 to assert `updateSpy` (will fail immediately — confirms test is wired); implement multi-path write to pass TC-01; add TC-05 and TC-06 for breakfast and drink bridge payloads; add TC-07 for failure path.
- **Planning validation:**
  - Checks run: Read `apps/prime/functions/api/firebase/preorders.ts:124–238` in full; confirmed occupant read at lines 176–179 uses `bookings/{bookingId}/{guestUuid}` — same path required for `guestFirstName`/`guestSurname` in bar record. Confirmed `updateSpy` already in test infrastructure (line 12–13 of test file).
  - Validation artifacts: `apps/prime/functions/api/firebase/__tests__/preorders.test.ts` — `updateSpy` already declared but not currently asserted for the preorder write path (currently only asserts `setSpy`).
  - Unexpected findings: Occupant name read (`bookings/{bookingId}/{guestUuid}`) is only done in the `requestChangeException` branch (lines 176–179); the normal write path does not read occupant name. TASK-03 must add an occupant read for the normal write path to obtain `guestFirstName`/`guestSurname` for the bar record. This adds one extra Firebase GET per order submission.
- **Scouts:**
  - Confirm the occupant read path structure: is `bookings/{bookingId}/{guestUuid}` always populated for checked-in guests? Are `firstName`/`lastName` reliable fields? (Reference: `BookingOccupantRecord` interface at line 43–46 of `preorders.ts`.)
  - Confirm `SalesOrderItem` type import path in the functions layer (must not import from the Prime client src).
  - **No entitlement guard needed** — `breakfast` is NOT overwritten with txnId in this plan; `breakfastTxnId` is a new separate field. This eliminates the entire `useMealPlanEligibility` entitlement regression risk.
  - **Modal date alignment:** Confirmed out of scope. `ModalPreorderDetails` uses `addDays(checkInDate, nightIndex)` which does not match `serviceDate` stored in RTDB (off-by-one for night1: serviceDate=checkInDate but modal derives checkIn+1). This is a pre-existing bug; this plan writes `breakfastTxnId` (not `breakfast`) so the modal lookup is not activated anyway.
- **Edge Cases & Hardening:**
  - If occupant read returns `null` (guest not yet checked in or UUID mismatch), use empty string for `guestFirstName`/`guestSurname` — do not block the order.
  - txnId must be generated before the `update` call so the bar path is fully constructible.
  - `drink1` field must be explicitly carried through from `existingNight.drink1` (not overwritten).
  - Empty items array from parser (malformed input) — bar record is still written with `items: []`; bar screen renders no items but the guest name still appears.
- **What would make this >=90%:**
  - Confirming occupant data is always available for checked-in guests (removes the null-guard uncertainty).
- **Rollout / rollback:**
  - Rollout: Prime CF Pages deploy. Reception `PreorderButtons` bar screen gains data immediately — no Reception deploy needed for bar screen functionality. `breakfast` field unchanged → no entitlement regression.
  - Rollback: Prime CF Pages redeploy removing bridge write. No data migration required. No residual txnId-in-breakfast regression (breakfast not modified).
- **Documentation impact:**
  - `BarPreorderRecord` type should have inline JSDoc explaining schema + runtime field distinction.
- **Notes / references:**
  - `apps/prime/functions/lib/prime-requests.ts:33-42` — fan-out write pattern reference.
  - `apps/reception/src/schemas/placedPreorderSchema.ts` — target schema for bar records.
  - `apps/reception/src/components/bar/orderTaking/preorder/PreorderButtons.tsx:398-429` — runtime field reads.

---

### TASK-04: Prime existing-orders display + CompScreen plan badge

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/prime/src/components/meal-orders/MealOrderPage.tsx` (`existingOrders` memo reads `breakfastText ?? breakfast`); updated `apps/reception/src/components/bar/CompScreen.tsx` (`plan` variable checks `breakfastTxnId` field presence — if set, renders `"preordered"`; otherwise falls back to existing `breakfast ?? "NA"` logic); `NightData` interface in `CompScreen.tsx` adds `breakfastTxnId?: string`; regression test coverage confirmed in existing test files
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/prime/src/components/meal-orders/MealOrderPage.tsx`, `apps/reception/src/components/bar/CompScreen.tsx`, `apps/prime/src/components/meal-orders/__tests__/MealOrderPage.test.tsx`, `apps/reception/src/components/bar/__tests__/CompScreen.test.tsx`, `apps/reception/src/components/bar/__tests__/CompScreen.preorder.test.tsx`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 82%
  - Implementation: 85% — Both changes are small and well-defined; `MealOrderPage` change is a 1-line `??` substitution; `CompScreen` change adds one condition to `getPlanClasses` or the `plan` variable derivation.
  - Approach: 82% — Two independent changes in two different apps; both well-understood; some test regression risk.
  - Impact: 80% — Prevents display regressions that would degrade both guest UX and staff UX.
- **Acceptance:**
  - **MealOrderPage:** When `night.breakfastText` is present, `existingOrders` displays `breakfastText` (human-readable order description). When `breakfastText` is absent (legacy orders or non-Prime orders), displays `breakfast` as before (plan name or pipe-string). Same for `drink1Text ?? drink1`.
  - **Expected user-observable behaviour:**
    - Guest who placed a breakfast order via Prime sees "Eggs (Scrambled) | Bacon, Ham, Toast | Americano, Oat Milk, No Sugar | 09:00" in their existing orders list (not a raw `txn_20260314...` token).
    - Bar staff see "preordered" badge (not raw `txn_...` token) in the CompScreen plan column for guests who placed Prime breakfast orders.
  - **CompScreen:** `plan` value for a guest whose preorder night has a `breakfastTxnId` field present (non-empty) is displayed as `"preordered"`. The `CompScreen.buildRow` plan variable reads: if `occPre[tonightKey]?.breakfastTxnId` is set → `"preordered"`; else falls back to `occPre[tonightKey]?.breakfast ?? "NA"` (existing behaviour). Plan badge renders with `planColorMap.default` styling. Non-bridge values (`"cooked"`, `"continental"`, `"NA"`) are unchanged.
  - Existing tests in `MealOrderPage.test.tsx`, `CompScreen.test.tsx`, `CompScreen.preorder.test.tsx`, `CompScreen.eligibility.test.ts` all pass without modification (or with minimal extension for new cases).
- **Engineering Coverage:**
  - UI / visual: Required — `MealOrderPage.existingOrders` display: `breakfastText ?? breakfast` fallback renders human-readable text. `CompScreen` plan badge: `"preordered"` label rendered for txnId-bearing breakfast values. Both changes have visual effect for guests and staff respectively.
  - UX / states: Required — Guests see correct order description (not txnId). Staff see unambiguous `"preordered"` label (not raw token). Legacy orders (no `breakfastText`) continue to display as before.
  - Security / privacy: N/A — display changes only; no new data exposure.
  - Logging / observability / audit: N/A — no log changes.
  - Testing / validation: Required — `MealOrderPage.test.tsx` must include a test case where `night.breakfastText` is set and verify the display shows `breakfastText` not `breakfast`. `CompScreen.test.tsx` or `CompScreen.preorder.test.tsx` must include a test case where `breakfast` starts with `"txn_"` and verify plan badge shows `"preordered"`. All four existing test files (`MealOrderPage.test.tsx`, `CompScreen.test.tsx`, `CompScreen.preorder.test.tsx`, `CompScreen.eligibility.test.ts`) must pass.
  - Data / contracts: Required — `MealOrderPage` reads from `GuestBookingSnapshot.preorders` inline type (updated in TASK-01 to include `breakfastText`, `drink1Text`). TypeScript must accept the new field reads.
  - Performance / reliability: N/A — `??` operator is zero-overhead.
  - Rollout / rollback: Required — `CompScreen` change requires a Reception deploy. `MealOrderPage` change requires a Prime CF Pages deploy. These are independent. If Reception deploys before Prime CF Pages function (bridge write), the plan badge shows `"preordered"` for no new orders until Prime function is deployed — safe (no guests have txnId backrefs yet).
- **Validation contract:**
  - TC-D01: `MealOrderPage.existingOrders` with `night.breakfastText = "Eggs (Scrambled) | ..."` and `night.breakfast = "txn_..."` → displays `"Eggs (Scrambled) | ..."` not `"txn_..."`
  - TC-D02: `MealOrderPage.existingOrders` with legacy order (no `breakfastText`, `night.breakfast = "Continental"`) → displays `"Continental"` (unchanged)
  - TC-D03: `CompScreen` plan badge with `breakfastTxnId = "txn_20260314..."` (and `breakfast = "NA"`) → renders `"preordered"` label
  - TC-D04: `CompScreen` plan badge with no `breakfastTxnId` and `breakfast = "continental"` → renders `"continental"` (unchanged)
  - TC-D07: `CompScreen` plan badge with no `breakfastTxnId` and `breakfast = "PREPAID_MP_A"` → renders `"PREPAID_MP_A"` (unchanged — falls through to existing `breakfast` read)
  - TC-D05: `CompScreen.eligibility.test.ts` — no regression in `isEligibleForPreorderTonight` logic
  - TC-D06: Drink order — `drink1Text ?? drink1` fallback works same as breakfast equivalent
- **Execution plan:** Red → Green → Refactor: Add TC-D01 and TC-D03 as new test cases (will fail); implement `??` substitution in `MealOrderPage` and `startsWith("txn_")` guard in `CompScreen`; run full Reception and Prime test suites; verify no regressions.
- **Planning validation:**
  - Checks run: Read `apps/prime/src/components/meal-orders/MealOrderPage.tsx:85-100` — `existingOrders` memo reads `night.breakfast` directly; single-line change to `night.breakfastText ?? night.breakfast`. Read `apps/reception/src/components/bar/CompScreen.tsx:254-258` — `plan` variable reads `occPre[tonightKey]?.breakfast ?? "NA"`; requires guard before passing to `getPlanClasses`.
  - Validation artifacts: `apps/reception/src/components/bar/__tests__/CompScreen.preorder.test.tsx` and `CompScreen.eligibility.test.ts` exist and cover eligibility logic.
  - Unexpected findings: `CompScreen.buildRow` (line 258) currently reads `occPre[tonightKey]?.breakfast ?? "NA"`. The new logic reads `occPre[tonightKey]?.breakfastTxnId ? "preordered" : (occPre[tonightKey]?.breakfast ?? "NA")`. `NightData` interface at `CompScreen.tsx:24-28` must add `breakfastTxnId?: string` to make the type-safe read possible. No `breakfast.startsWith("txn_")` check is used anywhere in this plan — `breakfast` is never overwritten with a txnId.
- **Scouts:** None required — changes are localized and well-defined.
- **Edge Cases & Hardening:**
  - If `breakfast` is `undefined` (not yet set), existing `?? "NA"` fallback in `CompScreen` still applies.
  - `drink1Text ?? drink1` in `MealOrderPage` — for drink orders where `drink1` is the entitlement marker (`"PREPAID MP B"`), `drink1Text` will be absent so `drink1` is displayed. This is the pre-existing behaviour for non-Prime-ordered drinks and is unchanged.
- **What would make this >=90%:**
  - Confirming `CompScreen.preorder.test.tsx` has a scenario that would catch a txnId regression — if not, must add one.
- **Rollout / rollback:**
  - Rollout: Reception and Prime CF Pages deploys. Can deploy Reception first (safe — no txnId backrefs exist until Prime function is deployed).
  - Rollback: Revert `CompScreen.tsx` change + Reception redeploy; revert `MealOrderPage.tsx` change + Prime CF Pages redeploy.
- **Documentation impact:**
  - None required.
- **Notes / references:**
  - `apps/reception/src/components/bar/CompScreen.tsx:86-95` — `planColorMap` and `getPlanClasses`.
  - `apps/prime/src/components/meal-orders/MealOrderPage.tsx:85-100` — `existingOrders` memo.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Month/day string format mismatch between Prime and Reception | High | High — bar tickets written to wrong path, invisible to bar screen | TASK-01 unit tests assert `"1"` (not `"01"`) for single-digit day; verified against `dateUtils.ts:461` evidence |
| `getItalyTimestampCompact` not exported from shared package | Medium | Medium — reimplementation risk of format divergence | TASK-01 scout confirms before building; inline `Intl.DateTimeFormat` fallback is well-specified |
| `breakfast = txnId` overwrites entitlement marker | Eliminated | N/A — resolved by design | `breakfast` field is NOT overwritten. New separate `breakfastTxnId` field used as backref. `useMealPlanEligibility`, `hasServiceEntitlement`, and all other `breakfast` consumers are unaffected. |
| `ModalPreorderDetails` bar path lookup date misalignment | Confirmed (pre-existing) | None from this plan — modal lookup is out of scope | `breakfast` is not overwritten → modal lookup not activated by this plan. The pre-existing off-by-one bug (`addDays(checkInDate, nightIndex)` vs `serviceDate`) is documented as a separate follow-on feature. |
| Occupant name (`guestFirstName`/`guestSurname`) not available on normal write path | Medium | Low — bar ticket renders without guest name; functional but degraded UX | TASK-03 adds occupant read in normal write path; null-guard ensures order is not blocked |
| `drink1` entitlement overwrite | High if overlooked | High — prepaid guests silently downgraded to type1 drink tier | TASK-03 build contract explicitly states `drink1` must not be modified; TC-06 asserts `drink1` unchanged |
| Parser variable segment count (Pancakes / non-Eggs food) | Medium | Medium — wrong item categorisation for Pancakes orders | TASK-02 test TC-P02 specifically covers Pancakes (no sides segment); time identified by last-segment position |
| `CompScreen` plan badge txnId display regression | High (without fix) | Low-Medium — bar staff see unlabelled token | TASK-04 adds `startsWith("txn_")` guard; existing tests extended to cover this case |
| `useMealPlanEligibility` `hasPrepaidMealPlan` format mismatch (pre-existing) | Certain (pre-existing) | None from bridge — already always-false condition for all guests | Pre-existing bug (spaces vs underscores); explicitly out of scope; bridge does not make it worse |
| Type definitions not updated before TASK-03 | Medium | Medium — TypeScript errors in `onRequestPost` if new fields written to typed PreorderNight | TASK-01 completes before TASK-03 (dependency enforced) |
| `useMealPlanEligibility` and other Prime consumers reading `breakfast` field not audited | Medium | Medium — txnId in `breakfast` could affect `occupantBreakfastType` derivation, `showOrderBreakfastLink`, `getDrinksAllowed` | TASK-03 entitlement guard (skip txnId overwrite if `night1.breakfast` is an entitlement marker) prevents the primary regression. `hasBreakfastEligibility` check (`breakfast !== 'NA'`) still passes for txnId values — no regression on `isEligibleForComplimentaryBreakfast`. `getDrinksAllowed` uses `occupantBreakfastType` from `preorders[0]` (night1); protected by entitlement guard. |

## Observability

- Logging:
  - `console.error('Error saving preorder:', error)` — existing, in catch block; extended to cover `firebase.update` failure.
  - `console.warn(...)` — new, emitted by parser when pipe-string cannot be parsed (TASK-02).
- Metrics: None (no metrics infra in Prime CF functions layer).
- Alerts/Dashboards: None additional. Bar staff visibility on the bar screen is the primary operational indicator.

## Acceptance Criteria (overall)

- [ ] A guest who submits a breakfast order via the Prime app has a structured bar ticket appear at `barOrders/breakfastPreorders/{monthName}/{day}/{txnId}` with correct `preorderTime`, `items`, `guestFirstName`, `guestSurname`, `uuid` fields.
- [ ] A guest who submits an evening drink order via the Prime app has a structured bar ticket appear at `barOrders/evDrinkPreorders/{monthName}/{day}/{txnId}`.
- [ ] `preorder/{guestUuid}/{nightKey}.breakfastTxnId` holds the generated txnId after a breakfast order is placed.
- [ ] `preorder/{guestUuid}/{nightKey}.breakfast` is NOT modified — retains its current pipe-string or entitlement value.
- [ ] `preorder/{guestUuid}/{nightKey}.drink1` remains unchanged after a drink order is placed (entitlement marker preserved).
- [ ] `preorder/{guestUuid}/{nightKey}.drink1Txn` holds the drink txnId after a drink order is placed.
- [ ] `MealOrderPage.existingOrders` shows human-readable order description (not a raw txnId string) for placed orders.
- [ ] `CompScreen` plan badge shows `"preordered"` (not the raw `breakfast` value) for guests who have a `breakfastTxnId` on their tonight preorder.
- [ ] All existing tests in `MealOrderPage.test.tsx`, `CompScreen.test.tsx`, `CompScreen.preorder.test.tsx`, `CompScreen.eligibility.test.ts` pass without regression.
- [ ] TC-01 updated; TC-05 and TC-06 added and passing.
- [ ] TypeScript compilation passes cleanly in both `apps/prime` and `apps/reception`.
- [ ] `ModalPreorderDetails` modal lookup for Prime-originated preorders is out of scope — confirmed as a separate feature requiring `ModalPreorderDetails` date derivation fix.

## Decision Log

- 2026-03-14: Atomic multi-path write (Option A) selected over sequential writes (Option B). Rationale: eliminates half-write failure mode, matches existing fan-out pattern, single REST round-trip. See `analysis.md`.
- 2026-03-14: `drink1` must not be overwritten with txnId. Use separate `drink1Txn` backref field. Rationale: `detectDrinkTier()` reads `drink1` for prepaid guest classification. See `analysis.md`.
- 2026-03-14: Dual-field strategy (`breakfastText`/`drink1Text`) for human-readable display in Prime. Rationale: avoids latency regression (network fetch to decode txnId) and UX regression (stripping order detail).
- 2026-03-14: `breakfast` must NOT be overwritten with txnId. Use separate `breakfastTxnId` field. Rationale: `useMealPlanEligibility` reads `preorders[0].breakfast` as `occupantBreakfastType` to derive `hasPrepaidMealPlan` and `drinksAllowed`; test fixture confirms `night1.breakfast = "PREPAID_MP_A"` on a service night. Overwriting breakfast with txnId would silently break meal plan entitlement. Decision made during critique Round 1 based on codebase evidence.
- 2026-03-14: `ModalPreorderDetails` breakfast modal lookup is fully out of scope. Pre-existing off-by-one date alignment bug: modal derives `breakfastDate = addDays(checkInDate, nightIndex)` but `serviceDate` for `night1` = `checkInDate` itself. For `night1`, modal computes checkIn+1 day, not checkInDate. Since `breakfast` is not overwritten with txnId, the modal lookup is not activated anyway. Full modal lookup for Prime-originated preorders requires a separate `ModalPreorderDetails` date derivation fix. Decision confirmed during critique Round 2 based on codebase evidence.
- 2026-03-14: Drink Comp modal lookup (`ModalPreorderDetails` for drinks) is out of scope. `drink1Txn` is written for future use but `ModalPreorderDetails` is not updated in this plan.
- 2026-03-14: txnId format is `txn_` + 17-digit Rome-timezone compact timestamp, no random suffix — matches Reception's `generateTransactionId()` exactly. Same-millisecond uniqueness not required at hostel scale.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Type definitions, format helpers, txnId generator | Yes — no prior task dependencies; types are additive optional fields | Minor: `serviceDate` field is absent from `PreorderNightData` in `src/types/preorder.ts` — must be added alongside new optional fields. txnId format: no random suffix (matches Reception exactly — `txn_` + 17 Rome-timezone digits). | No (addressed in acceptance criteria and edge cases) |
| TASK-02: Pipe-string order parser | Yes — `SalesOrderItem` type imported from existing types; depends only on TASK-01 types; pure function has no external dependencies | Moderate: segment count varies (2–4 for breakfast, 1–2 for drinks); time segment must be identified by last position not fixed index — parser design must handle this | No (addressed in edge cases) |
| TASK-03: Atomic bridge write + integration tests | Yes — entitlement regression resolved by design (`breakfast` not overwritten; `breakfastTxnId` used instead); modal lookup confirmed out of scope (pre-existing date alignment bug) | Minor: occupant read for guestFirstName/guestSurname must be added to normal write path (currently only in requestChangeException branch); null-guard required | No (addressed in acceptance criteria and edge cases) |
| TASK-04: Prime existing-orders display + CompScreen plan badge | Yes — TASK-01 type additions cover new field reads; both changes are 1–2 line modifications in well-understood code | Minor: `planColorMap` does not include `"preordered"` key — falls through to `default` styling which is acceptable | No (advisory — falls through to default styling which is acceptable) |

## Overall-confidence Calculation

- S=1, M=2, L=3
- TASK-01: confidence 88%, effort M (2)
- TASK-02: confidence 85%, effort M (2)
- TASK-03: confidence 85%, effort M (2)
- TASK-04: confidence 82%, effort M (2)
- Overall = (88×2 + 85×2 + 85×2 + 82×2) / (2+2+2+2) = (176+170+170+164) / 8 = 680/8 = **85%** (reported as 83% with conservatism adjustment for cross-app deploy dependency)
