---
Type: Analysis
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: brik-prime-breakfast-order-pipeline
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/brik-prime-breakfast-order-pipeline/fact-find.md
Related-Plan: docs/plans/brik-prime-breakfast-order-pipeline/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# BRIK Prime Breakfast Order Pipeline — Analysis

## Decision Frame

### Summary

A guest who pre-orders breakfast or evening drinks through the Prime app has their order recorded in Firebase but it never reaches bar staff. The bar screen in Reception reads from a different Firebase path that Prime never writes to. This analysis decides how to bridge the two paths, how to structure the written record so the bar screen can display tickets and (for breakfast) the Comp screen modal can look up the placed order, and how to preserve the human-readable order text for the Prime guest-facing "existing orders" view.

**Evening drink scope limitation:** The `ModalPreorderDetails` component in Reception looks up drink orders by checking `nightValue.drink1?.startsWith("txn_")`. Keeping `drink1` unchanged (required to preserve the drink-tier entitlement check in `detectDrinkTier()`) means the drink Comp modal lookup path is not activated by this feature — drink orders placed via Prime will appear as bar tickets on the bar screen, but the Comp screen modal will continue to show the text fallback for evening drinks. Full Comp modal support for drinks is out of scope for this feature.

The decision is architecture-level: which component owns the bridge write, and whether to write it atomically with the preorder or as a separate downstream operation.

**Drink backref constraint (resolved in analysis):** The fact-find proposed storing txnId in `preorder/{uuid}/{nightKey}.drink1`. This is not viable. `detectDrinkTier()` in `useEvDrinkWizard.ts` (line 61) reads `night.drink1` and checks whether it equals `"PREPAID MP B"` or `"PREPAID MP C"` to determine if a guest has the all-tier drink entitlement. Overwriting `drink1` with a txnId would silently downgrade prepaid guests to `type1` tier on every subsequent render. The correct approach is to use a separate `drink1Txn` field for the backref and `drink1Text` for the human-readable string, leaving `drink1` unchanged as the entitlement marker.

**Preorder node write shape (resolved in analysis):** The current handler writes the full `PreorderNight` object (`{ night, breakfast, drink1, drink2, serviceDate }`) via `firebase.set(preorderPath, nextNight)`. The multi-path atomic write must preserve this full object — the preorder payload in the multi-path update is `preorder/{uuid}/{nightKey}` = full `nextNight` (with `breakfast` replaced by txnId and `breakfastText` added), not just the backref field. Omitting the remaining fields would leave consumers that read `night.drink1`, `night.drink2`, `night.serviceDate`, or `night.night` in a broken state.

### Goals

1. Every guest breakfast or evening-drink order placed in Prime appears as a bar ticket at `barOrders/{breakfastPreorders|evDrinkPreorders}/{monthName}/{day}/{txnId}` during the service window.
2. For breakfast: `preorder/{guestUuid}/{nightKey}.breakfast` holds the generated `txnId` so `ModalPreorderDetails` can look up the placed order. For drinks: `preorder/{guestUuid}/{nightKey}.drink1Txn` holds the txnId; `drink1` is left unchanged.
3. The written record satisfies both `placedPreorderSchema` (`{ preorderTime, items }`) and the runtime fields `PreorderButtons` reads (`guestFirstName`, `guestSurname`, `uuid`).
4. The Prime "existing orders" view continues to show human-readable text: `breakfastText` (or `drink1Text`) field holds the pipe-delimited string for display.
5. The `CompScreen` plan badge correctly labels Prime-sourced breakfast orders (interprets `breakfast.startsWith("txn_")` as `"preordered"` rather than displaying a raw token).
6. Month/day RTDB path segments produced by Prime match the un-padded format `getItalyLocalDateParts` produces in Reception.

### Non-goals

- Changing the wizard UI in Prime.
- Changing bar staff order-taking flow (PreorderButtons single-click / double-click handling).
- Replacing the pipe-delimited string format as the order submission encoding.
- Adding pricing to Prime-originated preorders (all complimentary; `price: 0`).
- Internationalisation of order item names.
- Handling the `drink2` slot (no Prime UI exposes it).

### Constraints & Assumptions

- Constraints:
  - Prime functions layer runs as Cloudflare Pages Functions — no persistent compute, no scheduled tasks.
  - Firebase RTDB is the only persistence layer in scope.
  - The `txnId` must conform to `txn_YYYYMMDDhhmmssfff` (Rome timezone) to be locatable by `usePlacedPreorder` and `useCompletedOrder`.
  - All RTDB writes from Prime go through `FirebaseRest`.
  - Month/day path segments must be un-padded (e.g. `"1"`, `"14"`), matching Reception's `getItalyLocalDateParts` output.
  - `drink1` must not be overwritten with a txnId — it is used as the drink-tier entitlement marker by `detectDrinkTier()`.
  - The preorder node write must include the full `PreorderNight` object (all five fields: `night`, `breakfast`, `drink1`, `drink2`, `serviceDate`), not just the changed field(s).
- Assumptions:
  - `FirebaseRest.update('/', multiPathPayload)` supports fan-out atomic writes — confirmed by `createPrimeRequestWritePayload` pattern.
  - CF Workers support `Intl.DateTimeFormat` with the `Europe/Rome` timezone and `Date.now()` — sufficient to reimplement the txnId timestamp format without the Reception-only `getItalyTimestampCompact`.
  - `getItalyTimestampCompact` is not exported from a shared package (to be confirmed before build; fallback is inline reimplementation using `Intl.DateTimeFormat`).

## Inherited Outcome Contract

- **Why:** When a guest uses the app to choose their breakfast, their order is saved but it never makes its way to the staff working the bar. The bar screen shows no record of it. Staff have no way to know what was ordered or even that an order was placed. Fixing this closes the loop so that every guest order placed in the app shows up as a clear ticket for bar staff to act on.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A fact-find is complete that defines the bridge architecture: where it lives, how the order text is converted to structured bar items, and how a transaction reference is stored so the Comp screen can display placed orders.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/brik-prime-breakfast-order-pipeline/fact-find.md`
- Key findings used:
  - `onRequestPost` in `apps/prime/functions/api/firebase/preorders.ts` is the single write point for `preorder/{guestUuid}/{nightKey}` — the bridge write must live here.
  - `FirebaseRest.update('/', multiPathPayload)` fan-out pattern already used in `createPrimeRequestWritePayload` — atomic multi-path writes are feasible.
  - `ModalPreorderDetails` gates on `nightValue.breakfast?.startsWith("txn_")` — the preorder field must hold a txnId after bridge write.
  - `PreorderButtons` reads `guestFirstName`, `guestSurname`, `uuid` from the barOrder node at runtime — these fields must be written even though they are absent from `placedPreorderSchema`.
  - Month/day path format uses un-padded day string (`"1"` not `"01"`) — requires a dedicated helper with unit tests.
  - `CompScreen.isEligibleForPreorderTonight` checks `!== "NA"` — txnId passes this gate without regression.
- Analysis-stage corrections to fact-find:
  - The fact-find proposed writing txnId to `drink1`. This is not safe: `detectDrinkTier()` reads `drink1` to determine the guest's drink tier entitlement (`"PREPAID MP B"` / `"PREPAID MP C"`). Writing a txnId would silently downgrade prepaid guests. The analysis corrects this to a separate `drink1Txn` backref field.
  - The fact-find described the multi-path write payload without specifying that the preorder node write must be the full `PreorderNight` object (not just the modified field). The handler currently writes `nextNight` which includes all five fields — the multi-path write must preserve this.

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Atomicity / data integrity | Half-written state leaves bar tickets missing silently — no operator alert | Critical |
| Codebase pattern alignment | Reduces implementation risk and review cost | High |
| Consumer regression avoidance | Drink-tier entitlement and preorder node consumers must not break | Critical |
| Consumer update burden | Minimise Reception code changes needed to receive data | High |
| Rollback cost | CF Pages redeploy is the only rollback mechanism | Medium |
| Test seam quality | Bridge path has zero test coverage today — must be testable | High |
| Display regression risk | Cosmetic regressions degrade guest and staff UX | Medium |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — Atomic multi-path write in `onRequestPost` | Generate txnId before the preorder write. Replace `firebase.set(preorderPath, nextNight)` with a single `FirebaseRest.update('/', multiPathPayload)` call writing: (1) full `nextNight` object at `preorder/{uuid}/{nightKey}` (with `breakfast = txnId` and `breakfastText = value` added for breakfast; `drink1Txn = txnId` and `drink1Text = value` added for drinks, `drink1` left as-is), (2) the bar record at `barOrders/{type}/{monthName}/{day}/{txnId}`. | Matches `createPrimeRequestWritePayload` fan-out pattern; eliminates half-write risk; single REST round-trip; txnId known before any write so the path is fully constructible. Consumer regressions avoided by preserving full `nextNight` object and leaving `drink1` unchanged. | Slightly more logic to pre-compute txnId; must gate write after all validation passes. | Format parity for txnId timestamp; month/day un-padded day requirement. | Yes |
| B — Sequential writes: preorder first, then bridge | Preserve existing `firebase.set(preorderPath, nextNight)` call (retains full object write). Then issue two additional `set()` calls: one for the bar record, one for the backref field. | Minimal change to the preorder write path — existing object write preserved exactly. | Three separate REST calls; if second or third fails, preorder is written but bar ticket and backref are missing — silent failure invisible to bar staff. Harder to test atomicity. Does not match fan-out pattern. | Partial write silently drops bar tickets; three-call test assertions are more fragile. | Yes (inferior) |
| C — Separate Cloud Function / scheduled job | A Firebase RTDB trigger or polling Cloud Function reads `preorder/` and writes to `barOrders/`. | Fully decoupled from Prime function. | Violates the CF-Pages-Functions-only constraint. New infra surface, new deployment pipeline, trigger latency, no aligned rollback path. | Constraint violation; architectural mismatch. | No |
| D — Reception-side write at check-in | Reception operator manually triggers preorder population per guest. | No Prime changes. | Manual, failure-prone, does not meet Goal 1. | High operational failure rate. | No |

## Engineering Coverage Comparison

| Coverage Area | Option A (atomic multi-path) | Option B (sequential writes) | Chosen implication (Option A) |
|---|---|---|---|
| UI / visual | Dual-field strategy: `breakfastText` / `drink1Text` stores human-readable string; `breakfast` stores txnId; `drink1` unchanged; `drink1Txn` stores drink txnId. `MealOrderPage.existingOrders` reads `breakfastText ?? breakfast` (and `drink1Text ?? drink1` for drinks). `CompScreen` plan badge interprets `breakfast.startsWith("txn_")` as `"preordered"`. Both display regressions resolved. Existing `MealOrderPage` and `CompScreen` tests must be updated or extended to cover the new field reads. | Same dual-field strategy required for display regressions. | TASK-04 updates `MealOrderPage.existingOrders` (add `breakfastText ?? breakfast` read) and `CompScreen` plan column (txnId-prefix → `"preordered"` interpretation). Existing tests in `MealOrderPage.test.tsx` and `CompScreen.test.tsx` / `CompScreen.preorder.test.tsx` must be checked for regression coverage. |
| UX / states | Bar ticket appears during service window as soon as atomic write completes. `ModalPreorderDetails` modal shows structured items. Drink entitlement preserved because `drink1` is left unchanged. No silent-failure state. | Same happy path. On bridge write failure, bar ticket silently missing and no guest retry signal. Drink entitlement still preserved if sequential writes use `drink1Txn` for backref. | Atomic write eliminates silent-failure state. Guest sees error response on total write failure and can retry. |
| Security / privacy | Bridge write executes only after `validateGuestSessionToken` and `hasServiceEntitlement` pass. No guest-facing direct RTDB write. `guestFirstName`, `guestSurname` written to internal `barOrders` path only. | Identical security profile. | No additional security surface. |
| Logging / observability / audit | Single `console.error` on multi-path write failure covers all paths together. `console.warn` on malformed pipe-string parser input. | Three separate `console.error` calls; partial-write state harder to trace. | Log bridge write failure as a single error event. Add `console.warn` for unparseable input. |
| Testing / validation | One `FirebaseRest.prototype.update` spy assertion covers the entire atomic payload. Existing spy infrastructure in `preorders.test.ts` is directly reusable. Parser and helpers are pure functions. Existing `MealOrderPage.test.tsx`, `CompScreen.test.tsx`, and `CompScreen.preorder.test.tsx` provide regression surface for TASK-04 changes. | Three separate spy calls; partial-write simulation requires mid-sequence mock failure setup. | Unit tests for: parser, month/day helper, txnId generator. Integration tests: extend TC-01 to assert multi-path payload; add TC-05 (breakfast bridge) and TC-06 (drink bridge). TASK-04 must verify no regressions in existing `MealOrderPage` and `CompScreen` test suites. |
| Data / contracts | Multi-path payload writes full `PreorderNight` object (preserving `night`, `drink1`, `drink2`, `serviceDate` fields). New optional fields: `breakfastText: string`, `drink1Txn: string`, `drink1Text: string`. Three type definitions require updating: `PreorderNight` (functions layer, `preorders.ts:27-33`), `PreorderNightData` (`apps/prime/src/types/preorder.ts:7-14`), `GuestBookingSnapshot` preorders inline type (`useGuestBookingSnapshot.ts:21-30`) — `MealOrderPage` reads `snapshot.preorders` via `useGuestBookingSnapshot` and must see the new fields typed. Bar record satisfies both `placedPreorderSchema` and `PreorderButtonData` runtime fields. **`useMealPlanEligibility` blast radius (pre-existing, not a regression):** `useMealPlanEligibility` reads `preorders[0].breakfast` to derive `occupantBreakfastType` and `hasPrepaidMealPlan`. After the bridge, `breakfast` on the ordering night holds a txnId. `hasBreakfastEligibility` (used for `isEligibleForComplimentaryBreakfast`) only checks `breakfast !== 'NA'` — a txnId passes this, no regression. `hasPrepaidMealPlan` checks `PREPAID_MP_A/B/C` (underscore format) but Reception writes `PREPAID MP A/B/C` (space format) — this check is pre-existing broken regardless of the bridge; the format mismatch predates this feature. | Same type updates required. No savings on contract surface. | TASK-03 defines canonical `BarPreorderRecord` write type. TASK-01 updates all three type definitions. Type surface change is cross-layer but not breaking — all new fields are optional. `useMealPlanEligibility` pre-existing format mismatch is explicitly out of scope. |
| Performance / reliability | One REST call replacing the current single `set` call. At hostel scale (<20 orders/morning) this is not a hot path. Atomic write reduces RTDB contention vs. three sequential writes. | Three sequential REST calls; ≈2× latency for non-preorder writes at low hostel volume. More total failure surface. | Atomic multi-path write is both faster and more reliable. |
| Rollout / rollback | **Reception `PreorderButtons` (bar screen) requires no code changes** — it already has correct read logic and will start receiving data as soon as Prime writes to the expected paths. **`CompScreen` (plan badge) does require a Reception code change** (TASK-04) — it is not zero-change. **Prime UI also requires changes** (TASK-04 `MealOrderPage`). Two apps (Prime CF Pages + Reception) must deploy for full correctness. Rollback: Prime CF Pages redeploy removing the bridge write block. Residual: any `preorder` nodes already holding a txnId in `breakfast` will display "Breakfast transaction not found" in Comp modal until overwritten by a fresh order — acceptable. No data migration needed. | Same rollback story. Partial-write residue (preorder written, no bar record) leaves Comp in a worse state. | No feature flag needed. Reception deployment for `CompScreen` plan badge change is a separate deploy step from the Prime function deploy. Rollback of the Prime function alone is sufficient to stop new bridge writes. |

## Chosen Approach

- **Recommendation:** Option A — Atomic multi-path write in `onRequestPost`
- **Why this wins:**
  - Matches the codebase's established fan-out write pattern (`createPrimeRequestWritePayload`). No architectural deviation.
  - Eliminates the half-written-state failure mode entirely. A failure in the multi-path write means the preorder is also not written, giving the guest a clear retry signal.
  - Single REST round-trip is faster than three sequential calls.
  - Test infrastructure already supports spy-on-`update` assertions — the atomic payload is the most testable shape.
  - Consumer regressions (drink entitlement, preorder node completeness) are directly handled by the approach design (leave `drink1` unchanged, write full `nextNight` object in the fan-out payload).
- **What it depends on:**
  - Confirmation that `getItalyTimestampCompact` is not exported from a shared package, so TASK-01 can confirm whether to import or reimplement.
  - A passing unit test for the month/day format helper confirming un-padded output.
  - The pipe-string parser producing `SalesOrderItem[]` entries that match `placedPreorderSchema` item shape.
  - Both type definitions (`PreorderNight` in functions layer and `PreorderNightData` in client layer) updated with new optional fields before TASK-03.

### Rejected Approaches

- Option B (sequential writes) — Superficially simpler but pushes the half-write risk into production. If the bar record write fails after the preorder write succeeds, the bar ticket is silently missing with no guest retry signal and no reception alert. Does not match the fan-out pattern.
- Option C (separate Cloud Function / scheduled job) — Violates the CF-Pages-Functions-only constraint. New infra surface with no aligned rollback path. Architecturally inconsistent for a gap that is straightforwardly fixed in the existing handler.
- Option D (Reception-side manual trigger) — Requires staff action per guest, fails silently when staff forget, does not constitute an automated pipeline. Does not meet Goal 1.

### Open Questions (Operator Input Required)

None. All questions resolved in analysis and fact-find.

## End-State Operating Model

| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| Prime guest order write (breakfast) | `onRequestPost` → `firebase.set(preorderPath, nextNight)` with `breakfast = pipeString`. Bar path never written. | Guest confirms breakfast order | `onRequestPost` validates auth + entitlement → txnId generated → pipe-string parsed into `SalesOrderItem[]` → month/day path segments computed → `FirebaseRest.update('/', { [preorderPath]: { ...nextNight, breakfast: txnId, breakfastText: pipeString }, [barPath]: barRecord })` | Auth gates, entitlement check, nightKey derivation, `drink1` / `drink2` / `serviceDate` fields | txnId format must exactly match `txn_YYYYMMDDhhmmssfff` Rome timezone; month/day must be un-padded |
| Prime guest order write (drinks) | `onRequestPost` → `firebase.set(preorderPath, nextNight)` with `drink1 = pipeString`. Bar path never written. | Guest confirms drinks order | Same multi-path write: `{ [preorderPath]: { ...nextNight, drink1Txn: txnId, drink1Text: pipeString }, [barPath]: barRecord }`. `drink1` retains its current entitlement marker value — it is NOT overwritten with the txnId. | `drink1` field (entitlement marker), auth gates, nightKey derivation | `drink1` must remain unchanged; `drink1Txn` is the new backref field; no ModalPreorderDetails lookup for drinks unless that component is extended (out of scope) |
| Bar screen ticket display | `PreorderButtons` subscribes to `barOrders/{type}/{monthName}/{day}/` but receives no Prime-sourced data | Above atomic write completes | `PreorderButtons` receives new barOrder node; renders guest name, items, preorder time as an action ticket during service window | `PreorderButtons` component, time-gating, render logic — no code changes needed | Bar path format must match exactly (full English month name, un-padded day) |
| Comp screen modal lookup (breakfast) | `ModalPreorderDetails` checks `nightValue.breakfast?.startsWith("txn_")` — fails for pipe-string; falls through to raw text | Above atomic write completes (breakfast path) | `breakfast = txnId` → `startsWith("txn_")` check passes → `usePlacedPreorder` fetches `barOrders/breakfastPreorders/.../txnId` → modal shows structured items | `ModalPreorderDetails` component, `usePlacedPreorder` hook — no code changes needed | None if bar record write shape satisfies both schema and runtime fields |
| Comp screen modal lookup (drinks) | `ModalPreorderDetails` checks `nightValue.drink1?.startsWith("txn_")` — fails because `drink1` is kept as the entitlement marker (not overwritten with txnId) | N/A | **Out of scope.** `drink1Txn` backref written to RTDB for future use. `ModalPreorderDetails` is not updated to read `drink1Txn`. Drink Comp modal continues to show text fallback for Prime-originated drink orders. | Drink modal lookup logic — unchanged | Drink Comp modal lookup requires a separate feature to wire `drink1Txn` into `ModalPreorderDetails` |
| Prime existing-orders display | `MealOrderPage.existingOrders` reads `night.breakfast` (or `night.drink1`) as text — after bridge, `breakfast` holds txnId, `drink1` is unchanged | Same atomic write | `existingOrders` reads `night.breakfastText ?? night.breakfast` for breakfast; `night.drink1Text ?? night.drink1` for drinks. Human-readable text displayed. | Wizard UI, submission flow — unchanged | `MealOrderPage` update is TASK-04; existing `MealOrderPage.test.tsx` must be extended to cover new field reads |
| CompScreen plan badge | Plan column reads `breakfast` value as plan label (e.g. `"cooked"`, `"continental"`); txnId would display as unlabelled token | Same atomic write | `CompScreen` plan label logic interprets any `breakfast` value starting with `"txn_"` as a `"preordered"` label | Plan logic for non-Prime preorders — unchanged | Small Reception-side code change (TASK-04); existing `CompScreen.test.tsx` and `CompScreen.preorder.test.tsx` must be checked for regression |

## Planning Handoff

- Planning focus:
  - TASK-01: `serviceDate → {monthName, day}` format helper in Prime function layer. Verify or reimplement `getItalyTimestampCompact` for txnId generation using `Intl.DateTimeFormat` with `Europe/Rome` timezone. Update **all three** type definitions with new optional fields `breakfastText`, `drink1Txn`, `drink1Text`: (a) `PreorderNight` interface (functions layer, `apps/prime/functions/api/firebase/preorders.ts:27`); (b) `PreorderNightData` (`apps/prime/src/types/preorder.ts:7`); (c) the inline preorder night shape in `GuestBookingSnapshot.preorders` (`apps/prime/src/hooks/dataOrchestrator/useGuestBookingSnapshot.ts:21–30`) — this is the type `MealOrderPage` receives via `useGuestBookingSnapshot`, so it must include the new fields for TypeScript to accept the `breakfastText ?? breakfast` read. Unit tests for format helper and txnId generator asserting un-padded day output and `txn_YYYYMMDD...` format.
  - TASK-02: `parseBreakfastOrderValue(value: string): { preorderTime: string, items: SalesOrderItem[] }` and `parseEvDrinkOrderValue(...)` pure functions. Item granularity: each comma-delimited sub-item in the breakfast sides segment becomes a separate `SalesOrderItem` with `count: 1, lineType: "bds", price: 0`. Unit tests using existing `buildOrderValue` test cases as round-trip fixtures. Include edge-case tests (missing segments, empty strings); add `console.warn` for unparseable input.
  - TASK-03: Extend `onRequestPost` for atomic multi-path write. Replace `firebase.set(preorderPath, nextNight)` with `FirebaseRest.update('/', multiPathPayload)`. Payload includes: full `nextNight` object (with `breakfast = txnId` + `breakfastText` for breakfast, or `drink1Txn = txnId` + `drink1Text` for drinks, `drink1` left unchanged) and the bar record at `barOrders/{type}/{monthName}/{day}/{txnId}`. The bar record must include `preorderTime`, `items`, `guestFirstName`, `guestSurname`, `uuid`. Add TC-05 (breakfast bridge) and TC-06 (drink bridge) to `preorders.test.ts`.
  - TASK-04: Update `MealOrderPage.existingOrders` to read `night.breakfastText ?? night.breakfast` (and `night.drink1Text ?? night.drink1`). Note: `existingOrders` currently shows any non-`"NA"` value — for Night 1 (the entitlement marker night), it may already show `"PREPAID MP A"` as an order entry; this is a pre-existing display issue outside the scope of the bridge feature. Update `CompScreen` plan label logic to interpret `breakfast.startsWith("txn_")` as `"preordered"`. Verify no regressions in `MealOrderPage.test.tsx`, `CompScreen.test.tsx`, `CompScreen.preorder.test.tsx`, and `CompScreen.eligibility.test.ts`. Note: `useMealPlanEligibility` (`isEligibleForComplimentaryBreakfast`) uses `breakfast !== 'NA'` — a txnId passes this test; no change to TASK-04 scope required for this hook.
- Validation implications:
  - Month/day format helper must have a passing unit test before TASK-03 can proceed.
  - Parser must produce items that round-trip correctly against `buildOrderValue` test cases.
  - TC-05 and TC-06 must assert the exact multi-path update payload (full `nextNight` object + bar record) via the existing `FirebaseRest.prototype.update` spy infrastructure.
  - `placedPreorderSchema` validation must pass on the written bar record shape.
  - Existing `MealOrderPage.test.tsx` and `CompScreen.test.tsx` / `CompScreen.preorder.test.tsx` must not regress after TASK-04.
- Sequencing constraints:
  - TASK-01 and TASK-02 must complete before TASK-03 (helpers are dependencies).
  - TASK-03 and TASK-04 are independent and can proceed in parallel once TASK-01 and TASK-02 are done.
- Risks to carry into planning:
  - `getItalyTimestampCompact` availability in shared package — TASK-01 must confirm before writing txnId logic.
  - `drink1` must not be overwritten with txnId — TASK-03 build contract must explicitly specify `drink1` unchanged and `drink1Txn` as the new backref field.
  - `PreorderButtonData` runtime fields (`guestFirstName`, `guestSurname`, `uuid`) — TASK-03 build contract must list all required fields in the bar record write.
  - TASK-04 Reception-side (`CompScreen`) change — must confirm existing Reception tests pass after the plan badge update.

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Month/day string format mismatch between Prime and Reception | High | High — bar tickets written to wrong path, invisible to bar screen | Requires a unit test to confirm; analysis specifies the contract but cannot run the test | TASK-01 must produce a passing test before TASK-03 proceeds |
| `getItalyTimestampCompact` not exported from shared package | Medium | Medium — reimplementation risk of format divergence | Requires codebase check at build time | TASK-01 must confirm or reimplement before writing txnId logic |
| `PreorderButtonData` runtime fields not written to RTDB bar record | Medium | Medium — bar ticket renders missing guest name | Known schema gap from fact-find | TASK-03 build contract must list all required fields explicitly |
| `CompScreen` plan badge txnId display regression | High | Low–Medium — bar staff see unlabelled token | Cannot resolve without code change; TASK-04 scoped | TASK-04 must include plan label interpretation update and run existing `CompScreen` tests |
| Parser malformed pipe-string edge cases | Low | Low — only occurs if `buildBreakfastOrderValue` output changes | Parser is a new function; edge cases emerge during unit testing | TASK-02 must test edge cases and add `console.warn` guard |
| `useMealPlanEligibility` `hasPrepaidMealPlan` format mismatch | Certain (pre-existing) | None from bridge — pre-existing broken condition | Reception writes `PREPAID MP A` (spaces) but Prime checks `PREPAID_MP_A` (underscores); `hasPrepaidMealPlan` is already always `false` for all guests regardless of bridge. `isEligibleForComplimentaryBreakfast` (`breakfast !== 'NA'`) is unaffected. | Out of scope — pre-existing bug. Document in plan so future work can address the format mismatch separately. |
| `drink1` entitlement overwrite (resolved in analysis, guard required in build) | High if overlooked | High — prepaid guests silently downgraded to type1 tier | Resolved at analysis level; constraint added | TASK-03 build contract must explicitly state `drink1` is NOT modified; use `drink1Txn` for backref |
| Type definitions not updated before TASK-03 | Medium | Medium — TypeScript errors in `onRequestPost` if new fields are written to typed `PreorderNight` | Requires coordinated type update | TASK-01 updates both `PreorderNight` and `PreorderNightData` type definitions as a prerequisite for TASK-03 |

## Planning Readiness

- Status: Go
- Rationale: Architecture is well-defined. Chosen approach (atomic multi-path write) matches existing codebase patterns, eliminates the primary failure mode, and avoids both the drink-entitlement regression and the preorder node completeness failure. All open questions resolved. Four tasks identified with explicit sequencing and acceptance criteria. No operator input required before planning begins.
