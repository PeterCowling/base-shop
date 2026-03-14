---
Type: Analysis
Status: Ready-for-planning
Domain: Reception
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-extension-city-tax-recording
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/reception-extension-city-tax-recording/fact-find.md
Related-Plan: docs/plans/reception-extension-city-tax-recording/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Reception Extension City Tax Recording Analysis

## Decision Frame

### Summary
The "Mark city tax as paid" checkbox in the extension modal has two bugs: (1) it displays
the wrong collection amount for guests who have an outstanding city tax balance (shows only
the old unpaid amount, not old amount + extension nights), and (2) it silently fails to write
a city tax record for all three guest cases: outstanding balance, fully paid, and no prior
record. The decision is which implementation approach to use for the fix.

This is a single-component fix with no architectural ambiguity. The analysis resolves
which of three plausible approaches is cleanest given the existing data model and test
landscape.

### Goals
- Fix `displayedCityTaxTotal` so staff see the correct amount to collect in all three cases
- Fix `handleExtend` city tax block so a `CityTaxRecord` is always written when the checkbox is checked
- Validate the fix via updated and new unit tests

### Non-goals
- Changing the city tax rate (tracked as EXT-011)
- Adding `allFinancialTransactions` mirroring for extension city tax
- Replacing the checkbox with the full `CityTaxPaymentButton` component

### Constraints & Assumptions
- Constraints:
  - Firebase `update()` is the only write primitive available — no RTDB transactions
  - `cityTax/{bookingRef}/{occupantId}` root-level fields only: `{ balance, totalDue, totalPaid }`
  - `cityTaxTargets` is already correctly scoped to the occupants being extended (by `extendType`)
  - CI-only test policy: no local Jest runs
- Assumptions:
  - €2.50/night is the correct rate for this season
  - Extension city tax accumulates onto the existing record, not a separate node

## Inherited Outcome Contract

- **Why:** When staff check "Mark city tax as paid" during an extension, they expect the payment to be recorded. For guests without an outstanding balance (the majority, since most guests pay at check-in), nothing is written. Cash gets collected but never appears in the records — creating a reconciliation gap.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Checking "Mark city tax as paid" during an extension: (a) displays the correct collection amount including any old outstanding balance plus the extension nights' tax; and (b) always creates or updates a city tax record that correctly includes the extension nights' tax amount in `totalDue`, regardless of the guest's prior city tax status (outstanding balance, fully paid, or no prior record).
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/reception-extension-city-tax-recording/fact-find.md`
- Key findings used:
  - All three city tax cases (balance>0, balance=0, no record) share the same root bug — `defaultCityTaxPerGuest` is never added to `totalDue`
  - `displayedCityTaxTotal` shows only `record.balance` for case A guests, not `record.balance + defaultCityTaxPerGuest`
  - `saveCityTax` uses Firebase `update()` which creates the node when absent — supports all three cases with one call shape
  - `CityTaxPaymentButton` helper (`useCityTaxPayment.ts:23-33`) accumulates using `totalPaid += payment; balance = totalDue - newTotalPaid` — this pattern drives balance negative if applied to a fully-paid record without first increasing `totalDue`, so the extension fix needs its own formula
  - Blast radius: `pricing-queries.server.ts:114-139` reads `cityTax/{bookingRef}` for inbox pricing — read-only consumer, no code change needed
  - 3 existing tests need updating + 1 new test for case C

## Evaluation Criteria
| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Correctness across all 3 cases | All three cases must be handled — no conditional gaps | Critical |
| Code simplicity | Single clear write path reduces future bug surface | High |
| Test fidelity | Existing tests must accurately reflect new behaviour | High |
| Blast radius | Runtime changes confined to `ExtensionPayModal.tsx`; test changes in `ExtensionPayModal.test.tsx` | High |
| Pattern consistency | Must not introduce accumulation logic that conflicts with `CityTaxRecord` semantics | Medium |

## Options Considered
| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A: Unified formula | Replace both the display useMemo and the `if (record && record.balance > 0)` guard with a single unconditional write using `{ totalDue: (record?.totalDue??0)+ext, totalPaid: (record?.totalDue??0)+ext, balance: 0 }` | Handles all 3 cases in one code path; no branching; display matches write exactly | N/A | None — test assertions are fully known | Yes |
| B: Per-case branching | Keep case A branch for balance>0 (fixing its write shape), add `else if (record && record.balance === 0)` for case B, and `else` for case C | Preserves original guard intent; explicit case labels | 3× the code; harder to maintain; future bug surface is larger; display fix still needed separately | Divergence between display and write logic if maintained separately | Yes |
| C: Delegate to CityTaxPaymentButton helper | Rewrite checkbox to use `useCityTaxPayment` hook pattern | Aligns with check-in flow pattern | Requires increasing `totalDue` before calling helper; two distinct writes; would likely require `allFinancialTransactions` mirroring (rejected non-goal); significantly expands scope | Out-of-scope scope expansion; helper drives `balance` negative for fully-paid records if `totalDue` not pre-incremented | No |

## Engineering Coverage Comparison
| Coverage Area | Option A | Option B | Chosen implication |
|---|---|---|---|
| UI / visual | One-line unified display fix in `displayedCityTaxTotal` useMemo | Separate per-case display fix with branching | Option A: `return sum + (record?.balance??0) + defaultCityTaxPerGuest` |
| UX / states | Display matches write; staff see correct amount for all cases | Display fix still separate from write fix — risk of drift | Option A: display and write use same formula, no UX mismatch |
| Security / privacy | N/A | N/A | None |
| Logging / observability / audit | One `saveActivity` call per occupant in all 3 cases | Same — one per occupant, but within 3 separate branches | Option A: activity 9 always logged; no conditional gaps |
| Testing / validation | 4 test changes (display, case A write shape, case B flip, case C new) | 4+ test changes; additional branches need coverage | Option A: minimal test surface; known assertions |
| Data / contracts | One unified write shape; `saveCityTax` called once per occupant | Three write shapes; must verify all 3 are correct separately | Option A: `{ totalDue: oldDue+ext, totalPaid: oldDue+ext, balance: 0 }` for all |
| Performance / reliability | Max 2 Firebase writes per occupant (date + city tax) | Same | No difference |
| Rollout / rollback | Single commit; rollback = revert | Same | No difference |

## Chosen Approach

- **Recommendation:** Option A — unified formula
- **Why this wins:** All three guest cases collapse into a single formula: `{ totalDue: (record?.totalDue??0)+ext, totalPaid: (record?.totalDue??0)+ext, balance: 0 }`. The display and write logic use the same mathematical basis. There is no branching to maintain, no risk of per-case drift, and the test changes are fully enumerated. Option B produces identical runtime behavior with 3× the code. Option C is out of scope.
- **What it depends on:** `defaultCityTaxPerGuest` being in scope at the write site (confirmed: `ExtensionPayModal.tsx:71-74`); `saveCityTax` supporting node creation from `undefined` (confirmed: Firebase `update()` creates paths when absent).

### Rejected Approaches

- **Option B (per-case branching)** — Functionally correct but produces 3 conditional branches where 1 unified write suffices. The extra branches triple the maintenance surface without adding any correctness benefit. Rejected on simplicity grounds.
- **Option C (CityTaxPaymentButton helper delegation)** — Out of scope per fact-find non-goals. The helper would require `totalDue` to be incremented first as a separate step, pulling in `allFinancialTransactions` mirroring. Rejected for scope expansion.

### Open Questions (Operator Input Required)
- None. All questions resolved from code evidence.

## End-State Operating Model

| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| City tax display | `displayedCityTaxTotal` shows `record.balance` for case A guests — omits extension nights' amount | Staff open extension modal with case A guest selected | `displayedCityTaxTotal` returns `(record?.balance??0) + defaultCityTaxPerGuest` for all occupants in `cityTaxTargets` | Radio buttons, date extension logic, accommodation price display | None — purely additive to existing useMemo |
| City tax write (case A — balance > 0) | Zeroes balance but omits extension nights from `totalDue` | Staff check "Mark city tax as paid" → click "Extend" | `saveCityTax(bookingRef, id, { totalDue: oldDue+ext, totalPaid: oldDue+ext, balance: 0 })` → `saveActivity(id, { code: ActivityCode.CITY_TAX_PAYMENT })` | `updateBookingDates` write chain; key extension logic | `saveCityTax` completes before `saveActivity` — if activity write fails, city tax record is persisted but activity is not logged; modal stays open (existing error-handling pattern, now applies to more occupants) |
| City tax write (case B — balance = 0) | Nothing written — guard `balance > 0` fails | Same trigger | Same unified write with `ActivityCode.CITY_TAX_PAYMENT` activity | Everything else | Same partial-write risk as case A — widened blast radius because case B occupants newly enter the `Promise.all` city-tax fan-out |
| City tax write (case C — no record) | Nothing written — outer `if (record)` guard fails | Same trigger | Same unified write with `ActivityCode.CITY_TAX_PAYMENT` activity | Everything else | Same partial-write risk — case C occupants also newly enter the fan-out |
| Inbox pricing (downstream read) | `pricing-queries.server.ts:114-139` sums `record.balance` for payable total | Live inference from RTDB | No code change — zeroing `balance` on payment now consistently reduces inbox-displayed city tax due | No change needed | None — already correct behavior; correctly benefits from the fix |

## Planning Handoff

- Planning focus:
  - Two code changes in `ExtensionPayModal.tsx`: (1) `displayedCityTaxTotal` useMemo, (2) `handleExtend` city tax block
  - Four test changes in `ExtensionPayModal.test.tsx`: render assertion (line 79), case A write shape (line 149), case B broken-behavior flip (line 182), new case C test
- Validation implications:
  - All tests run in CI only (per `docs/testing-policy.md`)
  - TypeScript typecheck must pass locally before push
  - No migration or data cleanup needed
- Sequencing constraints:
  - Display fix and write fix can be implemented in one commit — they are in the same file
  - Test changes must follow or accompany the code changes
- Risks to carry into planning:
  - `isSaving` guard already prevents double-submit; no additional guard needed
  - `updateBookingDates` is called before city tax write — if it throws, city tax is not written. This is pre-existing behavior, not a regression. Planning should note this is intentional (partial failure is surfaced via toast).
  - Partial-write in `Promise.all` fan-out: `saveCityTax` completes before `saveActivity` per occupant; if `saveActivity` fails, city tax is persisted but activity is not logged. After the fix, case B and C occupants newly enter this path — this is the same pre-existing error-handling pattern, now with wider blast radius. Acceptable; no mitigation required in this scope.
  - Use `ActivityCode.CITY_TAX_PAYMENT` enum constant (not numeric literal `9`) in the implementation — matches the live component at line 132-134.

## Risks to Carry Forward
| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Test at line 182 expects `saveCityTaxMock` called once (only o1) — after fix it should be called twice (o1 + o2) | High (must change) | Low (test change is clear) | Requires code-level assertion update | Flag as required task; CI will catch if missed |
| Render test at line 79 expects `"5,00"` — after display fix should be `"7,50"` | High (must change) | Low | Requires code-level assertion update | Flag as required task |
| `updateBookingDates` failure leaves city tax unwritten | Low | Medium | Pre-existing; not introduced by this fix | Note in plan as accepted pre-existing risk |
| `saveCityTax` completes before `saveActivity` in `Promise.all` — if activity write fails, city tax is persisted but activity is unlogged; modal stays open | Low | Low | Pre-existing pattern; now applies to case B/C occupants too (wider blast radius) | Accepted; no mitigation required — existing error-handling surfaces failure via toast |
| Implementation must use `ActivityCode.CITY_TAX_PAYMENT` enum (not literal `9`) | High (must follow) | Low | Convention enforcement | Flag as implementation requirement |

## Planning Readiness
- Status: Go
- Rationale: Single-component fix with fully enumerated changes, known test mutations, and no open questions. Implementation is ~12 lines across 2 code blocks in one file. All 4 test changes are specified.
