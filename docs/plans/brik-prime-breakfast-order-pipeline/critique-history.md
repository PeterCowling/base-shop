# Critique History: brik-prime-breakfast-order-pipeline

---

## Analysis Stage Critique

### Analysis Round 1 — 2026-03-14

- Route: codemoot
- Artifact: `docs/plans/brik-prime-breakfast-order-pipeline/analysis.md`
- Score: 4/10 → lp_score: 2.0
- Verdict: needs_revision
- Critical: 2, Warning: 2, Info: 0

| ID | Severity | Finding | Resolution |
|---|---|---|---|
| A1-01 | Critical | Atomic payload incomplete: described as writing only `[barPath]`, backref, and text field — omitted that preorder node must be the full `PreorderNight` object (all 5 fields). First-time night order would leave consumers of `drink1`, `drink2`, `serviceDate` broken. | Fixed: specified multi-path payload includes full `nextNight` object with new optional fields added alongside. |
| A1-02 | Critical | Drink1 entitlement regression: writing txnId to `drink1` breaks `detectDrinkTier()` which reads `night.drink1` and checks `"PREPAID MP B"/"PREPAID MP C"`. Prepaid guests would be silently downgraded to type1 tier. | Fixed: changed drink backref to `drink1Txn` new field; `drink1` left unchanged as entitlement marker. |
| A1-03 | Warning | Dual-field type blast radius understated: only mentioned `PreorderNight` and `PreorderNightData` but omitted `GuestBookingSnapshot.preorders` inline type. | Fixed: documented all three type locations. |
| A1-04 | Warning | Rollout row inconsistency: stated "Reception bar screen and Comp screen require no code changes" while `CompScreen` plan badge does require a change. | Fixed: clarified `PreorderButtons` = no change; `CompScreen` + Prime UI = changes required. |

### Analysis Round 2 — 2026-03-14

- Route: codemoot
- Artifact: `docs/plans/brik-prime-breakfast-order-pipeline/analysis.md`
- Score: 7/10 → lp_score: 3.5
- Verdict: needs_revision
- Critical: 0, Warning: 3, Info: 0

| ID | Severity | Finding | Resolution |
|---|---|---|---|
| A2-01 | Warning | TASK-01 still omitted `GuestBookingSnapshot` type update. `MealOrderPage` reads `snapshot.preorders` via `useGuestBookingSnapshot` — without updating this type, `breakfastText ?? breakfast` reads remain mistyped. | Fixed: TASK-01 now explicitly lists all three type definition locations including `useGuestBookingSnapshot.ts:21-30`. |
| A2-02 | Warning | Rollout Engineering Coverage row still had inconsistency: stated bar screen and Comp screen no-change while Comp screen needs a change. | Fixed: corrected to precisely state `PreorderButtons` = no change; `CompScreen` plan badge = change required. |
| A2-03 | Warning | Drink end-state overstated in Summary: implied Comp modal is fixed for drinks, but drink modal lookup is out of scope since `drink1` is kept unchanged and `ModalPreorderDetails` checks `nightValue.drink1?.startsWith("txn_")`. | Fixed: added explicit drink scope limitation paragraph to Summary; split End-State Operating Model Comp modal row into two (breakfast in scope, drinks out of scope). |

### Analysis Round 3 — 2026-03-14 (Final)

- Route: codemoot
- Artifact: `docs/plans/brik-prime-breakfast-order-pipeline/analysis.md`
- Score: 4/10 → lp_score: 2.0
- Verdict: needs_revision
- Critical: 1 (REBUTTED), Warning: 2, Info: 0

| ID | Severity | Finding | Resolution |
|---|---|---|---|
| A3-01 | Critical | `useMealPlanEligibility` blast radius: writing txnId to `breakfast` claimed to make `hasPrepaidMealPlan` false and hide breakfast/drink affordances in Prime homepage. | **REBUTTED.** Investigation traced the full call chain: (1) `hasBreakfastEligibility` checks `breakfast !== 'NA'` — txnId passes, no regression on `isEligibleForComplimentaryBreakfast`. (2) `hasPrepaidMealPlan` checks `PREPAID_MP_A/B/C` (underscore format) but Reception writes `PREPAID MP A/B/C` (space format) — this check is pre-existing broken regardless of the bridge. Pre-existing condition documented explicitly in analysis. |
| A3-02 | Warning | `existingOrders` display of entitlement markers: `breakfastText ?? breakfast` fallback would show `PREPAID MP A` as an order entry. | Documented as pre-existing display issue. Night 1 with `breakfast = "PREPAID MP A"` already appears as an `existingOrders` entry in the current codebase. TASK-04 note updated to acknowledge this. |
| A3-03 | Warning | TASK-04 blast radius too narrow: `useMealPlanEligibility`/`useUnifiedBookingData` not accounted for in test plan. | Addressed: Data/contracts Engineering Coverage row updated with full `useMealPlanEligibility` blast radius analysis and explicit rebuttal. Risks table updated with pre-existing `hasPrepaidMealPlan` format mismatch entry. |

### Post-Loop Gate

Round 3 is the final round per critique-loop-protocol. The critical finding was investigated and rebutted with code-level evidence. The two warnings were addressed with documentation of pre-existing conditions. All deterministic validators pass. Analysis is credible for planning handoff.

---

## Round 1 — 2026-03-14

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | Patterns & Conventions Observed; Resolved Q5; Risk table; Planning Constraints | `day` format claimed as zero-padded; actual `getItalyLocalDateParts` returns un-padded string via `String(Number(...))`. Fixed: corrected to un-padded with evidence cite. |
| 1-02 | Major | Open Questions | Agent-resolvable deferral: display strategy (dual-field vs. parse-back) was deferred to operator but is fully resolvable by agent reasoning. Fixed: moved to Resolved with option (a) dual-field rationale. |
| 1-03 | Moderate | Dependency & Impact Map | `CompScreen` plan column regression not mentioned — after backref write, `breakfast` field holds txnId, displayed raw in plan badge. Fixed: added to blast radius and Risk table. |
| 1-04 | Moderate | Non-goals | Non-goal incorrectly references "Comp screen existing orders list" (no such list exists there). Fixed: reworded to accurately describe pipe-string as parser input / `breakfastText` storage. |
| 1-05 | Moderate | Data & Contracts | Parser item granularity for sides segment was undefined (1 item vs. 3 items). Fixed: added explicit granularity decision (each comma-delimited sub-item = separate SalesOrderItem). |
| 1-06 | Moderate | Key Modules | `getItalyTimestampCompact` is Reception-only; Prime must reimplement or source from shared package. Fixed: added note to Key Modules #9. |
| 1-07 | Minor | Confidence Inputs (Approach) | Forward reference "see analysis below" referenced non-existent section within the fact-find. Fixed: replaced with accurate description of what analysis.md will enumerate. |
| 1-08 | Minor | Non-goals | Wording contradicts the backref write which replaces the pipe-string with txnId. Fixed: reworded to distinguish submission encoding from stored field value. |

### Issues Confirmed Resolved This Round

None — first round.

### Issues Carried Open (not yet resolved)

None — all issues resolved by autofix in this round. Post-fix score: credible (3.8 estimated).
