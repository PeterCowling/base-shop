---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: Reception
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-extension-city-tax-recording
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/reception-extension-city-tax-recording/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260314113000-BRIK-EXT-002
---

# Reception Extension City Tax Recording — Fact-Find Brief

## Scope

### Summary
When extending a booking, the modal's "Mark city tax as paid" checkbox fails to correctly record city
tax for all guests. For guests with an outstanding balance (balance > 0), the code zeroes the balance
but never adds the extension nights' amount to `totalDue` — so the extension tax vanishes from the
cumulative record. For guests with no outstanding balance (balance = 0 or no record at all), nothing is
written at all. All three cases share the same root issue: `defaultCityTaxPerGuest` (the extension
nights' tax) is never accumulated into the city tax record. This is a data integrity gap: cash
collected, nothing recorded.

### Goals
- Understand the full city tax data model and `saveCityTax` mutation contract
- Identify the pattern used by the existing check-in city tax payment flow
- Design the fix that covers all three cases: outstanding balance > 0, balance = 0, no record — using a unified write formula that correctly accumulates extension nights' tax into `totalDue`
- Confirm no new infrastructure or schema changes are needed

### Non-goals
- Changing the city tax rate (currently hardcoded at €2.50/night — tracked separately as EXT-011)
- Adding `allFinancialTransactions` mirroring for extension city tax (used by `CityTaxPaymentButton` but not other mutation paths; scope risk outweighs value)
- Replacing the checkbox flow with the full `CityTaxPaymentButton` component

### Constraints & Assumptions
- Constraints:
  - Firebase `update()` is the only write primitive available — no transactions in the RTDB client SDK
  - The `cityTax/{bookingRef}/{occupantId}` node holds one `CityTaxRecord` at the root level; `CityTaxPaymentButton` may also write nested `transactions/*` sub-nodes there, but the extension flow reads and writes only the three root-level fields (`balance`, `totalDue`, `totalPaid`) — the nested sub-nodes are not affected by this fix
  - Activity code 9 (`CITY_TAX_PAYMENT`) is the correct code regardless of whether payment is for original or extension nights
- Assumptions:
  - €2.50/night is the correct rate for Positano (matches production modal display)
  - Extension city tax should accumulate onto the existing record (no separate node per extension)

## Outcome Contract

- **Why:** When staff check "Mark city tax as paid" during an extension, they expect the payment to be
  recorded. For guests without an outstanding balance (the majority, since most guests pay at check-in),
  nothing is written. Cash gets collected but never appears in the records — creating a reconciliation gap.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Checking "Mark city tax as paid" during an extension: (a) displays
  the correct collection amount including any old outstanding balance plus the extension nights' tax;
  and (b) always creates or updates a city tax record that correctly includes the extension nights' tax
  amount in `totalDue`, regardless of the guest's prior city tax status (outstanding balance, fully paid,
  or no prior record).
- **Source:** operator

## Current Process Map

- **Trigger:** Staff clicks "Guest" button on `/extension` page → extension modal opens → staff checks
  "Mark city tax as paid" → clicks "Extend"
- **End condition:** `handleExtend` resolves → modal closes → success toast shown

### Process Areas

| Area | Current step-by-step flow | Owners / systems / handoffs | Evidence refs | Known issues |
|---|---|---|---|---|
| City tax display (balance > 0) | `displayedCityTaxTotal` useMemo at lines 76-85: `if (record && record.balance > 0) return sum + record.balance` | ExtensionPayModal.tsx:76-85 | `ExtensionPayModal.tsx:76-85` | **BUG: shows only the old outstanding balance, not `record.balance + defaultCityTaxPerGuest`. Staff are directed to collect too little cash for extension guests with an outstanding balance.** |
| City tax save (balance > 0) | `if (record && record.balance > 0)` → `saveCityTax(bookingRef, id, { balance: 0, totalPaid: record.totalDue })` → `saveActivity(id, { code: 9 })` | ExtensionPayModal.tsx:122-145 | `ExtensionPayModal.tsx:122-145` | **BUG: writes `totalPaid: record.totalDue` and zeros balance but never increments `totalDue` by the extension nights' amount (`defaultCityTaxPerGuest`). Extension tax is collected but unrecorded in the cumulative total.** |
| City tax save (balance = 0) | Guard `record.balance > 0` fails → skip → nothing written | ExtensionPayModal.tsx:127 | `ExtensionPayModal.tsx:127` | **BUG: extension city tax not recorded** |
| City tax save (no record) | `if (record)` outer guard fails → skip → nothing written | ExtensionPayModal.tsx:124 | `ExtensionPayModal.tsx:124` | **BUG: extension city tax not recorded** |
| Check-in city tax payment | `CityTaxPaymentButton` → requires existing record (`if (!occupantTax) return`) → `saveCityTax` with updated totals + `transactions/${txnId}` → activity code 9 → `addToAllTransactions` | `CityTaxPaymentButton.tsx:185-230` | `CityTaxPaymentButton.tsx` | Guard requires existing record — cannot create from scratch |

## Discovery Contract Output

- **Gap Case ID:** n/a
- **Recommended First Prescription:** n/a

## Evidence Audit (Current State)

### Entry Points
- `apps/reception/src/components/man/modals/ExtensionPayModal.tsx` — `handleExtend` async handler (line 88) — the mutation chain that runs on "Extend" button click

### Key Modules / Files
- `apps/reception/src/components/man/modals/ExtensionPayModal.tsx` — bug location: lines 122-145
- `apps/reception/src/hooks/mutations/useCityTaxMutation.ts` — `saveCityTax(bookingRef, occupantId, Partial<CityTaxRecord>)` — uses Firebase `update()` at `cityTax/{bookingRef}/{occupantId}`
- `apps/reception/src/schemas/cityTaxSchema.ts` — `CityTaxRecord = { balance: number, totalDue: number, totalPaid: number }`
- `apps/reception/src/types/hooks/data/cityTaxData.ts` — re-exports `CityTaxRecord`, `CityTaxData`
- `apps/reception/src/components/checkins/cityTaxButton/CityTaxPaymentButton.tsx` — reference pattern for full payment flow (requires existing record)
- `apps/reception/src/constants/activities.ts` — `ActivityCode.CITY_TAX_PAYMENT = 9`

### Patterns & Conventions Observed
- Firebase `update()` creates nodes if they don't exist — `saveCityTax` therefore supports both creation and update with the same call shape
- The extension fix uses a dedicated unified formula — NOT the `CityTaxPaymentButton` accumulation pattern. The `CityTaxPaymentButton` helper (`useCityTaxPayment.ts:23-33`) does `totalPaid += payment; balance = totalDue - totalPaid`, which would drive `balance` negative for a fully-paid record if `totalDue` is not increased first. The correct extension write shape is: `{ totalDue: (record?.totalDue??0)+ext, totalPaid: (record?.totalDue??0)+ext, balance: 0 }` — always bring `totalPaid` up to the new `totalDue`.
- Extension modal already computes `defaultCityTaxPerGuest = nights * 2.5` — this value is available in scope for all three cases
- `cityTaxTargets` is derived from `extendType`: either `[occupantId]` (single) or `occupantIds` (all in booking). It is NOT the full occupant list from all bookings — it is already correctly scoped to the occupants being extended. The write targets exactly the occupants whose stay is being extended.

### Data & Contracts
- Types/schemas/events:
  - `CityTaxRecord` at `apps/reception/src/schemas/cityTaxSchema.ts:3-7`:
    ```typescript
    { balance: number, totalDue: number, totalPaid: number }
    ```
- Persistence:
  - Firebase RTDB path: `cityTax/{bookingRef}/{occupantId}` → single `CityTaxRecord` node per occupant per booking
  - No sub-records in the extension flow (unlike `CityTaxPaymentButton` which also writes `transactions/{txnId}`)
  - `update()` creates the node when absent — confirmed by mutation hook implementation

### Dependency & Impact Map
- Upstream dependencies:
  - `defaultCityTaxPerGuest` (computed at modal scope, `nights * 2.5`)
  - `cityTaxRecords` (prop passed from `Extension.tsx`, loaded via `useCityTax`)
  - `cityTaxTargets` (occupant IDs to update, computed from `extendType`)
- Downstream dependents:
  - `useCityTax` hook reads `cityTax/{bookingRef}/{occupantId}` — any future read of this guest's city tax record will reflect the write
  - `apps/reception/src/lib/inbox/pricing-queries.server.ts:114-139` — `readLiveBalance()` fetches `/cityTax/{bookingRef}` and sums `record.balance` across all occupants to compute `cityTaxDue` for inbox pricing display. Extension city tax writes (which zero `balance` on payment) will correctly reduce the outstanding amount shown in inbox pricing.
- Likely blast radius:
  - `ExtensionPayModal.tsx` handleExtend function — 3-line condition change
  - `pricing-queries.server.ts` is a read-only consumer: it will correctly reflect the newly created/updated records. No code change needed there, but it confirms the data model writes are correct (zeroing `balance` = removing outstanding amount from inbox total).

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest + Testing Library
- **CI-only policy**: Per `docs/testing-policy.md`, all Jest tests run in GitHub Actions CI only. Do not run test commands locally. Push changes and monitor via `gh run watch`.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| ExtensionPayModal | Unit | `ExtensionPayModal.test.tsx` | Covers balance > 0 case and render check; explicitly documents the balance = 0 skip |
| useCityTaxMutation | Unit | `useCityTaxMutation.test.ts` | Covers success/error paths |

#### Coverage Gaps
- Untested paths:
  - `markCityTaxPaid` with `record === undefined` (no city tax record at all) — no test exists; new test required
  - `markCityTaxPaid` with `record.balance === 0` (fully paid, extension nights) — test at line 182 explicitly verifies `saveCityTaxMock` NOT called for balance=0 occupants (broken behavior). **Must be flipped.**
- Tests asserting current broken behavior (must be updated):
  - Line 79: `"collect city tax: 5,00"` render assertion — shows old outstanding balance only; after display fix should assert `"7,50"` (5.00 outstanding + 2.50 for 1 extension night)
  - Line 149: `saveCityTaxMock` called with `{ balance: 0, totalPaid: 5 }` — broken write shape; after fix should assert `{ balance: 0, totalDue: 7.5, totalPaid: 7.5 }`
  - Line 182-193: `"does not write city tax activity for occupant whose balance is already zero"` — validates broken behavior; must be updated to assert write occurs with correct unified shape for both o1 and o2

#### Recommended Test Approach
- Unit tests for: all three cases in `handleExtend` — (A) balance > 0, (B) balance = 0, (C) no record
- Integration tests for: not needed (mutation is thin wrapper over Firebase `update`)
- E2E tests for: out of scope

### Recent Git History (Targeted)
- `90eafcfb62` — `fix(reception): guard city tax activity log write behind balance > 0 check` — this is the commit that introduced the current guard. The original intent was to prevent double-recording when balance was already 0, but it also blocked recording for extension nights.

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | `displayedCityTaxTotal` (ExtensionPayModal.tsx:76-85) shows `record.balance` for case A guests — does not include `defaultCityTaxPerGuest`. Staff are told to collect the old outstanding amount only. | Fix must also update display: unified formula `(record?.balance??0) + defaultCityTaxPerGuest` across all three cases | Yes |
| UX / states | Required | Checkbox appears to work but silently fails in 3 of 3 cases; display is also wrong for case A | Fix restores expected behaviour; no new UX states; display amount corrected | No |
| Security / privacy | N/A | Internal staff tool; city tax amounts are not PII; no auth changes | None | No |
| Logging / observability / audit | Required | Activity code 9 already logged for balance>0 case; gaps for cases B and C | Fix adds activity logging for cases B and C | No |
| Testing / validation | Required | Existing test for case A; existing test documents broken behaviour for case B; case C untested | Two test changes: flip case B assertion, add case C test | Yes |
| Data / contracts | Required | `CityTaxRecord = { balance, totalDue, totalPaid }` — Firebase `update()` supports creation | Unified write shape (all 3 cases): `{ totalDue: (record?.totalDue??0)+ext, totalPaid: (record?.totalDue??0)+ext, balance: 0 }`. This correctly increments `totalDue` by extension nights in all cases and settles any prior outstanding balance. | Yes |
| Performance / reliability | N/A | Two additional Firebase writes per occupant at most; not on a hot path | None | No |
| Rollout / rollback | N/A | Single component change; no migration; prior data is not invalidated | Rollback = revert the commit | No |

## Questions

### Resolved
- Q: Does `saveCityTax` support creating a new record when none exists?
  - A: Yes. `useCityTaxMutation` uses Firebase `update()` at `cityTax/{bookingRef}/{occupantId}`. Firebase `update()` creates the path if absent.
  - Evidence: `apps/reception/src/hooks/mutations/useCityTaxMutation.ts:34-38`

- Q: Should the `allFinancialTransactions` mirror be used for extension city tax?
  - A: No. Only `CityTaxPaymentButton` uses `allFinancialTransactions`. The extension flow has never used it, and adding it would expand blast radius without a clear operator requirement. The `cityTax/{bookingRef}/{occupantId}` write is sufficient for reconciliation.
  - Evidence: `CityTaxPaymentButton.tsx:218-229` (only component that writes to allFinancialTransactions for city tax)

- Q: Is a new activity code needed for extension city tax?
  - A: No. Code 9 (`CITY_TAX_PAYMENT`) is appropriate. The activity log records that city tax was paid; the context (extension vs original stay) is not needed in the activity log.
  - Evidence: `apps/reception/src/constants/activities.ts:10`

- Q: How should city tax accumulate when a guest already has a fully-paid record (balance = 0)?
  - A: Use the unified formula across all three cases: `{ totalDue: (record?.totalDue ?? 0) + ext, totalPaid: (record?.totalDue ?? 0) + ext, balance: 0 }`. Note: this is NOT the `CityTaxPaymentButton` pattern (`totalPaid += payment; balance = totalDue - totalPaid`) — applying that pattern without first increasing `totalDue` would result in a negative balance for fully-paid records. The correct extension write always brings `totalPaid` up to the new `totalDue` and explicitly sets `balance: 0`.
  - Evidence: `ExtensionPayModal.tsx:71-74` (`defaultCityTaxPerGuest` in scope); `useCityTaxPayment.ts:23-33` (why CityTaxPaymentButton pattern is NOT used here)

### Open (Operator Input Required)
- None. All questions are resolved from code evidence.

## Confidence Inputs
- Implementation: 95% — exact write shapes for all three cases are known; implementation is ~10 lines
- Approach: 95% — single approach; no branching decisions needed
- Impact: 90% — fixes a silent data gap on every extension where city tax checkbox was used with a clean account
- Delivery-Readiness: 95% — all evidence in hand; no blockers
- Testability: 90% — existing test scaffold; three existing tests need updating (display assertion at line 79, write shape assertion at line 149, broken-behavior flip at line 182); one new test needed for case C

What would raise each score to ≥90: already there for all. The unified write formula is fully derived from the schema; `defaultCityTaxPerGuest` confirmed in scope at `ExtensionPayModal.tsx:72`; blast radius confirmed complete including `pricing-queries.server.ts`.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Double-recording if operator clicks Extend twice | Low | Medium | `isSaving` flag disables the Extend button during the async save chain; a second submit cannot occur while the first is in flight |
| Incorrect tax amount if rate changes mid-stay | Low | Low | Not new — extension already shows the current hardcoded rate. Addressed separately by EXT-011. |
| Test "does not write city tax for balance=0" must be flipped | High | Low | Must explicitly update this test or CI will fail. Flag as required in plan. |

## Planning Constraints & Notes
- Must-follow patterns:
  - Use `saveActivity(id, { code: ActivityCode.CITY_TAX_PAYMENT })` — not the numeric literal 9
  - Use `defaultCityTaxPerGuest` (already in scope) for the extension tax amount
  - Follow the accumulation pattern from `CityTaxPaymentButton` for case B
- Rollout/rollback expectations:
  - No migration needed. Fix is purely additive — adds writes in cases that were previously no-ops
- Observability expectations:
  - Activity code 9 will now appear for extension nights in the activity log

## Suggested Task Seeds (Non-binding)
1. Fix `displayedCityTaxTotal` (ExtensionPayModal.tsx:76-85) — replace `if (record && record.balance > 0) return sum + record.balance` with `return sum + (record?.balance ?? 0) + defaultCityTaxPerGuest`
2. Fix `handleExtend` city tax block (ExtensionPayModal.tsx:122-145) — remove the `if (record && record.balance > 0)` guard and replace with unified: `await saveCityTax(bookingRef, id, { totalDue: (record?.totalDue??0)+ext, totalPaid: (record?.totalDue??0)+ext, balance: 0 })` followed by `saveActivity(id, { code: ActivityCode.CITY_TAX_PAYMENT })`
3. Update render test at line 79 — fix city tax display assertion from `"5,00"` to `"7,50"`
4. Update case A write-shape test at line 149 — assert `{ balance: 0, totalDue: 7.5, totalPaid: 7.5 }`
5. Flip test `"does not write city tax activity for occupant whose balance is already zero"` at line 182 — update to assert `saveCityTaxMock` called twice (once for o1 with case A shape, once for o2 with case B shape)
6. Add test for case C: `markCityTaxPaid` with `cityTaxRecords[id] === undefined`

## Execution Routing Packet
- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `ExtensionPayModal.tsx`: `displayedCityTaxTotal` display formula updated (case A shows `balance + ext`, not just `balance`); `handleExtend` city tax block unified across all three cases
  - `ExtensionPayModal.test.tsx`: render test (line 79) updated for new display amount; case A write-shape test (line 149) updated; broken-behavior test (line 182) flipped to assert writes for both o1 and o2; new case C test added

## Evidence Gap Review

### Gaps Addressed
- Full `CityTaxRecord` schema confirmed from `cityTaxSchema.ts`
- Firebase path and `update()` behaviour confirmed from mutation hook
- Check-in payment pattern reviewed in `CityTaxPaymentButton.tsx`
- Activity code confirmed from `activities.ts`
- `displayedCityTaxTotal` display bug confirmed: case A shows only old outstanding balance (`record.balance`), not `record.balance + defaultCityTaxPerGuest`. Fix covers both display and write.
- Existing test coverage mapped: render test (line 73), case A write assertion, case B broken-behavior test, and case C gap all identified
- Blast radius confirmed: `pricing-queries.server.ts:114-139` reads `cityTax/{bookingRef}` for inbox pricing — read-only consumer, no code change needed
- `cityTaxTargets` scoping confirmed: already filtered by `extendType`, never writes to non-targeted occupants
- `cityTax` node structure: root-level `CityTaxRecord` fields are the only concern for this fix; nested `transactions/*` sub-nodes from `CityTaxPaymentButton` are unaffected

### Confidence Adjustments
- No downward adjustments. All three fix cases are unambiguously derivable from the schema.

### Remaining Assumptions
- €2.50/night rate is correct for the current season (operator-held knowledge; no code evidence either way)
- No operator intent to write `allFinancialTransactions` for extension city tax

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| CityTaxRecord schema | Yes | None | No |
| saveCityTax mutation contract | Yes | None | No |
| displayedCityTaxTotal (display formula) | Yes | Case A shows only old `balance`, not `balance + ext` — staff instructed to collect wrong amount | Required change: unified display formula; render test assertion updates |
| All three fix cases (A, B, and C) write shapes | Yes | Case A is also broken — extension nights not added to totalDue | Unified formula covers all three; no per-case branching needed |
| Activity code logging | Yes | None | No |
| Existing test landscape | Yes | Render test asserts wrong amount (5.00 → 7.50); test at line 182 validates broken behaviour; case A write test needs update | Yes — flag all as required tasks in plan |
| Blast radius | Yes | pricing-queries.server.ts:114-139 reads cityTax balance for inbox pricing — read-only consumer, no code change needed | No (informational only) |

## Scope Signal

- Signal: right-sized
- Rationale: The fix is confined to two code blocks in one file (`displayedCityTaxTotal` and `handleExtend` in `ExtensionPayModal.tsx`, ~12 lines total). The data model is fully understood. No new infrastructure, no schema changes, no migration. All test changes are known and bounded (4 tests in `ExtensionPayModal.test.tsx`).

## Analysis Readiness
- Status: Ready-for-analysis
- Blocking items: none
- Recommended next step: `/lp-do-analysis reception-extension-city-tax-recording`
