---
Type: Plan
Status: Archived
Domain: Reception
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14
Build-Commit: a5d259cb61
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-extension-city-tax-recording
Dispatch-ID: IDEA-DISPATCH-20260314113000-BRIK-EXT-002
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 92%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/reception-extension-city-tax-recording/analysis.md
---

# Reception Extension City Tax Recording Plan

## Summary

The "Mark city tax as paid" checkbox in the extension modal (`ExtensionPayModal.tsx`) has two bugs: the displayed collection amount is wrong for guests with an outstanding balance (omits extension nights), and the write silently fails for all three guest cases (balance>0, balance=0, no record). The fix replaces two code blocks in one file with a unified formula, and updates four tests. No new infrastructure, no schema changes, no migration. All changes land in `ExtensionPayModal.tsx` and `ExtensionPayModal.test.tsx`.

## Active tasks
- [x] TASK-01: Fix display and write logic in ExtensionPayModal.tsx — Complete (2026-03-14)
- [x] TASK-02: Update and add tests in ExtensionPayModal.test.tsx — Complete (2026-03-14)

## Goals
- Fix `displayedCityTaxTotal` so staff see the correct amount to collect (old balance + extension nights) in all cases
- Fix `handleExtend` so a city tax record is always written for all three guest cases
- Validate the fix via updated and new unit tests

## Non-goals
- Changing the city tax rate (EXT-011)
- Adding `allFinancialTransactions` mirroring for extension city tax
- Replacing the checkbox with the full `CityTaxPaymentButton` component

## Constraints & Assumptions
- Constraints:
  - Firebase `update()` is the only write primitive — no RTDB transactions
  - `cityTax/{bookingRef}/{occupantId}` root-level fields only: `{ balance, totalDue, totalPaid }`
  - CI-only test policy: all Jest tests run in GitHub Actions only; no local test execution
  - Must use `ActivityCode.CITY_TAX_PAYMENT` enum constant (not numeric literal 9)
- Assumptions:
  - €2.50/night is the correct rate for this season
  - Extension city tax accumulates onto the existing record, not a separate node

## Inherited Outcome Contract

- **Why:** When staff check "Mark city tax as paid" during an extension, they expect the payment to be recorded. For guests without an outstanding balance (the majority, since most guests pay at check-in), nothing is written. Cash gets collected but never appears in the records — creating a reconciliation gap.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Checking "Mark city tax as paid" during an extension: (a) displays the correct collection amount including any old outstanding balance plus the extension nights' tax; and (b) always creates or updates a city tax record that correctly includes the extension nights' tax amount in `totalDue`, regardless of the guest's prior city tax status (outstanding balance, fully paid, or no prior record).
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/reception-extension-city-tax-recording/analysis.md`
- Selected approach inherited:
  - Option A — Unified formula: single unconditional write using `{ totalDue: (record?.totalDue??0)+ext, totalPaid: (record?.totalDue??0)+ext, balance: 0 }` covering all three cases
- Key reasoning used:
  - All three cases collapse into one formula; no branching needed
  - Display fix uses the same mathematical basis as the write fix (`(record?.balance??0) + ext` for display, `(record?.totalDue??0)+ext` for write — note: display includes `balance` for outstanding amount, write uses `totalDue` as accumulation base)
  - `CityTaxPaymentButton` helper pattern explicitly avoided (would drive balance negative for fully-paid records without pre-incrementing `totalDue`)

## Selected Approach Summary
- What was chosen:
  - Option A: unified formula for both display and write
  - `displayedCityTaxTotal`: `return sum + (record?.balance ?? 0) + defaultCityTaxPerGuest`
  - `handleExtend` city tax block: unconditional `saveCityTax(bookingRef, id, { totalDue: (record?.totalDue??0)+ext, totalPaid: (record?.totalDue??0)+ext, balance: 0 })` → `saveActivity(id, { code: ActivityCode.CITY_TAX_PAYMENT })`
- Why planning is not reopening option selection:
  - Analysis definitively chose Option A; no operator forks remain; all constraints satisfied

## Fact-Find Support
- Supporting brief: `docs/plans/reception-extension-city-tax-recording/fact-find.md`
- Evidence carried forward:
  - `CityTaxRecord = { balance, totalDue, totalPaid }` — schema confirmed
  - `saveCityTax` uses Firebase `update()` which creates nodes when absent — supports all 3 cases
  - `defaultCityTaxPerGuest = nights * 2.5` is in scope at write site (`ExtensionPayModal.tsx:71-74`)
  - `cityTaxTargets` is correctly scoped by `extendType` — never writes to non-targeted occupants
  - `pricing-queries.server.ts:114-139` reads `cityTax/{bookingRef}` — read-only consumer, benefits from fix, no code change needed

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Fix display + write in ExtensionPayModal.tsx | 92% | S | Complete (2026-03-14) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Update + add tests in ExtensionPayModal.test.tsx | 92% | S | Complete (2026-03-14) | TASK-01 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | `displayedCityTaxTotal` formula: `(record?.balance??0) + defaultCityTaxPerGuest` for all occupants | TASK-01 | One-line useMemo change; no layout changes |
| UX / states | Display and write use same formula basis; staff see correct collection amount in all cases | TASK-01 | No new UX states; checkbox behaviour unchanged |
| Security / privacy | N/A | - | Internal staff tool; no PII; no auth changes |
| Logging / observability / audit | `ActivityCode.CITY_TAX_PAYMENT` write attempted for all 3 cases; fails closed if `saveActivity` errors (pre-existing error-handling pattern) | TASK-01 | Previously only attempted for case A |
| Testing / validation | 3 existing test assertions updated + 1 new test for case C | TASK-02 | CI-only; test changes must accompany code |
| Data / contracts | Unified write: `{ totalDue: (record?.totalDue??0)+ext, totalPaid: (record?.totalDue??0)+ext, balance: 0 }` via Firebase `update()` | TASK-01 | Creates node when absent; root-level fields only |
| Performance / reliability | Max 2 Firebase writes per occupant (date + city tax); not on hot path | TASK-01 | No change from pre-existing pattern |
| Rollout / rollback | Single commit; no migration; prior data not invalidated | TASK-01, TASK-02 | Rollback = revert the commit |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Code changes first |
| 2 | TASK-02 | TASK-01 complete | Tests reference updated code; can be committed together |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| City tax display | Staff opens extension modal | `displayedCityTaxTotal` returns `sum + (balance??0) + ext` for each occupant in `cityTaxTargets`; "Collect city tax:" shows correct total for all 3 guest types | TASK-01 | None |
| City tax write — all cases | Staff checks "Mark city tax as paid" → clicks "Extend" | For each occupant in `cityTaxTargets`: (1) `saveCityTax(bookingRef, id, { totalDue: oldDue+ext, totalPaid: oldDue+ext, balance: 0 })`, (2) `saveActivity(id, { code: ActivityCode.CITY_TAX_PAYMENT })`; if `saveActivity` fails, throws → modal stays open, toast shows error | TASK-01 | `saveCityTax` completes before `saveActivity` per occupant — partial write possible if `saveActivity` fails (pre-existing pattern, widened blast radius; accepted) |
| Inbox pricing | Live inference from RTDB (no trigger change) | `pricing-queries.server.ts:114-139` sums `record.balance` across occupants; with `balance: 0` written consistently, inbox correctly shows 0 outstanding city tax after extension payment | None (read-only) | None |

## Tasks

### TASK-01: Fix display and write logic in ExtensionPayModal.tsx
- **Type:** IMPLEMENT
- **Deliverable:** Code change to `apps/reception/src/components/man/modals/ExtensionPayModal.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Build Evidence:** Commit `a5d259cb61` — `displayedCityTaxTotal` unified formula applied; `handleExtend` city tax block replaced with unconditional write using `{ totalDue: (record?.totalDue??0)+ext, totalPaid: (record?.totalDue??0)+ext, balance: 0 }` for all 3 cases; `defaultCityTaxPerGuest` added to `useCallback` dep array. Typecheck + lint passed (`pnpm --filter @apps/reception typecheck && lint` — 0 errors, warnings pre-existing only).
- **Affects:** `apps/reception/src/components/man/modals/ExtensionPayModal.tsx`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 92%
  - Implementation: 95% — exact lines and write shapes fully specified; `defaultCityTaxPerGuest` in scope confirmed
  - Approach: 95% — Option A settled in analysis; no alternative viable
  - Impact: 88% — fixes data gap for all 3 cases; inbox pricing reads benefit immediately; minor risk from wider `Promise.all` partial-write blast radius (accepted)
- **Acceptance:**
  - `displayedCityTaxTotal` useMemo: returns `(record?.balance ?? 0) + defaultCityTaxPerGuest` for each occupant in `cityTaxTargets` (replaces the `if (record && record.balance > 0)` conditional)
  - `handleExtend` city tax block: unconditionally calls `saveCityTax(bookingRef, id, { totalDue: (record?.totalDue ?? 0) + defaultCityTaxPerGuest, totalPaid: (record?.totalDue ?? 0) + defaultCityTaxPerGuest, balance: 0 })` for every occupant in `cityTaxTargets` when `markCityTaxPaid` is true
  - `saveActivity(id, { code: ActivityCode.CITY_TAX_PAYMENT })` called unconditionally after `saveCityTax` for every occupant in `cityTaxTargets`; errors from `saveActivity` throw and surface via toast (pre-existing fail-closed pattern)
  - Package-scoped typecheck and lint pass: `pnpm --filter reception typecheck && pnpm --filter reception lint`
  - **Expected user-observable behavior:**
    - [ ] For a guest with outstanding balance (case A): modal shows `old_balance + extension_nights_tax` as city tax to collect; checking "Mark city tax as paid" and extending writes correct totals and logs activity
    - [ ] For a guest fully paid up (case B): modal shows `extension_nights_tax` as city tax to collect; write occurs and activity is logged
    - [ ] For a guest with no prior city tax record (case C): modal shows `extension_nights_tax`; write creates the record and activity is logged
- **Engineering Coverage:**
  - UI / visual: Required — `displayedCityTaxTotal` useMemo formula updated in JSX data binding
  - UX / states: Required — display corrected; no new checkbox states; "Collect city tax:" value now matches what will be recorded
  - Security / privacy: N/A — internal staff tool; no PII touched
  - Logging / observability / audit: Required — `ActivityCode.CITY_TAX_PAYMENT` (enum, not literal 9) logged for all 3 cases
  - Testing / validation: N/A — test changes in TASK-02; this task must typecheck cleanly
  - Data / contracts: Required — write shape `{ totalDue: oldDue+ext, totalPaid: oldDue+ext, balance: 0 }` correct for all 3 cases; Firebase `update()` creates node when absent
  - Performance / reliability: N/A — max 2 writes per occupant; not on hot path
  - Rollout / rollback: N/A — no migration; rollback = revert commit
- **Validation contract:**
  - TC-01: case A (record.balance=5, record.totalDue=5, ext=2.5) → `saveCityTax(ref, id, { totalDue: 7.5, totalPaid: 7.5, balance: 0 })`; display shows 7.5
  - TC-02: case B (record.balance=0, record.totalDue=5, record.totalPaid=5, ext=2.5) → `saveCityTax(ref, id, { totalDue: 7.5, totalPaid: 7.5, balance: 0 })`; display shows 2.5
  - TC-03: case C (no record, ext=2.5) → `saveCityTax(ref, id, { totalDue: 2.5, totalPaid: 2.5, balance: 0 })`; display shows 2.5
  - TC-04: `ActivityCode.CITY_TAX_PAYMENT` (not `9`) used in `saveActivity` call
  - TC-05: TypeScript compiles cleanly — `record?.totalDue ?? 0` and `record?.balance ?? 0` type-safe via `CityTaxRecord | undefined` union
- **Execution plan:**
  1. **Red**: current code has `if (record && record.balance > 0)` guard + `if (record)` outer guard → silently skips B and C, wrong display for A
  2. **Green**:
     - In `displayedCityTaxTotal` useMemo (lines 76-85): replace the `if (record && record.balance > 0) { return sum + record.balance; } return sum + defaultCityTaxPerGuest;` with `return sum + (record?.balance ?? 0) + defaultCityTaxPerGuest;`
     - In `handleExtend` city tax block (lines 122-145): replace the entire `if (record) { if (record.balance > 0) { ... } }` block with: `await saveCityTax(bookingRef, id, { totalDue: (record?.totalDue ?? 0) + defaultCityTaxPerGuest, totalPaid: (record?.totalDue ?? 0) + defaultCityTaxPerGuest, balance: 0, }); const cityTaxActivityResult = await saveActivity(id, { code: ActivityCode.CITY_TAX_PAYMENT }); if (!cityTaxActivityResult.success) { throw new Error(cityTaxActivityResult.error ?? \`Failed to save city tax activity for occupant ${id}.\`); }`
  3. **Refactor**: none needed — unified formula is already the cleanest form
- **Scouts:** None: all variables confirmed in scope; `record?.totalDue ?? 0` is type-safe given `CityTaxRecord | undefined`
- **Edge Cases & Hardening:**
  - `record === undefined` (case C): `(record?.totalDue ?? 0) + ext = ext`; `(record?.balance ?? 0) + ext = ext` — correct
  - Multi-occupant "all" extension: `cityTaxTargets` iterates all occupants via `Promise.all`; each gets an independent write — correct
  - `saveActivity` failure mid-fan-out: pre-existing error path; `throw` causes `Promise.all` to reject; modal stays open; toast shown — pre-existing accepted behavior
- **What would make this >=90%:** Already at 92%. Could reach 95% with explicit confirmation from CI run. TypeScript check locally is the only remaining pre-push gate.
- **Rollout / rollback:**
  - Rollout: merge to dev branch → CI passes → standard deploy pipeline
  - Rollback: `git revert` the commit; no data migration to undo; prior city tax records unaffected
- **Documentation impact:** None: internal operational fix; no public docs or runbooks reference this behavior
- **Notes / references:**
  - `apps/reception/src/schemas/cityTaxSchema.ts` — `CityTaxRecord` schema
  - `apps/reception/src/hooks/mutations/useCityTaxMutation.ts` — Firebase `update()` path
  - `apps/reception/src/constants/activities.ts` — `ActivityCode.CITY_TAX_PAYMENT = 9`
  - Do NOT use the `useCityTaxPayment` helper pattern from `CityTaxPaymentButton` — that helper uses `totalPaid += payment; balance = totalDue - totalPaid` which would produce negative balance for fully-paid records without pre-incrementing `totalDue`

---

### TASK-02: Update and add tests in ExtensionPayModal.test.tsx
- **Type:** IMPLEMENT
- **Deliverable:** Code change to `apps/reception/src/components/man/modals/__tests__/ExtensionPayModal.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Build Evidence:** Commit `a5d259cb61` — (1) render test line 79: `"5,00"` → `"7,50"`; (2) case A write shape: `{ balance: 0, totalPaid: 5 }` → `{ totalDue: 7.5, totalPaid: 7.5, balance: 0 }`; (3) case B test flipped to assert 2 writes with unified shape for o1+o2; (4) new case C test with `cityTaxRecords: {}` asserts `{ totalDue: 2.5, totalPaid: 2.5, balance: 0 }`. Tests run in CI.
- **Affects:** `apps/reception/src/components/man/modals/__tests__/ExtensionPayModal.test.tsx`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 92%
  - Implementation: 95% — all three broken assertions and one missing test are specified by file+line
  - Approach: 95% — test changes mirror the exact write shape and display value changes from TASK-01
  - Impact: 88% — tests run in CI only; validation gate is CI passing; no local test execution possible
- **Acceptance:**
  - Test at line 79: `expect(screen.getByText(/collect city tax:/i)).toHaveTextContent("7,50")` (o1 has balance=5 + 2.5 extension for 1 night; currently asserts `"5,00"`)
  - Test at line 149: `saveCityTaxMock` asserted with `{ totalDue: 7.5, totalPaid: 7.5, balance: 0 }` (currently `{ balance: 0, totalPaid: 5 }`)
  - Test at line 182 flipped: `saveCityTaxMock` called twice — once for o1 with `{ totalDue: 7.5, totalPaid: 7.5, balance: 0 }`, once for o2 with `{ totalDue: 7.5, totalPaid: 7.5, balance: 0 }` (o2 has `totalDue: 5, balance: 0`; after fix: `{ totalDue: 7.5, totalPaid: 7.5, balance: 0 }`)
  - New test for case C: renders modal with `cityTaxRecords: { o1: undefined }` (or no key for o1), checks mark + extend → `saveCityTaxMock` called with `{ totalDue: 2.5, totalPaid: 2.5, balance: 0 }` (1 night × €2.50)
  - All tests pass in CI
- **Engineering Coverage:**
  - UI / visual: Required — render test assertion updated to reflect corrected display amount
  - UX / states: N/A — no new UX states being tested; existing scenario updated
  - Security / privacy: N/A
  - Logging / observability / audit: Required — activity mock assertions in flipped test confirm `ActivityCode.CITY_TAX_PAYMENT` (code 9) is called for all cases
  - Testing / validation: Required — 3 updated assertions + 1 new test
  - Data / contracts: Required — write shape assertions updated to unified formula
  - Performance / reliability: N/A
  - Rollout / rollback: N/A — test file only; no data impact
- **Validation contract:**
  - TC-01: render test shows `"7,50"` for default single-guest (o1 has balance=5, 1 night = 2.5; 5+2.5=7.5 formatted `"7,50"`)
  - TC-02: case A write: `saveCityTaxMock("B1", "o1", { totalDue: 7.5, totalPaid: 7.5, balance: 0 })`
  - TC-03: flipped case B/multi test: `saveCityTaxMock` called twice; o2 (balance=0, totalDue=5) → `{ totalDue: 7.5, totalPaid: 7.5, balance: 0 }`
  - TC-04: case C new test: mock prop passes `cityTaxRecords: {}` or `cityTaxRecords: { o1: undefined }`; after extend with mark → `saveCityTaxMock("B1", "o1", { totalDue: 2.5, totalPaid: 2.5, balance: 0 })`
  - TC-05: activity mock asserts `code: 9` for each write in all updated tests — note: Jest mocks capture the runtime value (always `9`) and cannot distinguish enum from literal; enum usage is enforced by TypeScript compilation (`ActivityCode.CITY_TAX_PAYMENT` is the only type-safe source of this value) and lint, not by the test assertion
- **Execution plan:**
  1. **Red**: tests assert current broken behavior (5.00 display, partial writes, case B skip)
  2. **Green**:
     - Line 79: change `"5,00"` → `"7,50"` in render test assertion
     - Line 149: change `{ balance: 0, totalPaid: 5 }` → `{ totalDue: 7.5, totalPaid: 7.5, balance: 0 }`
     - Lines 182-202 test: update title to `"writes city tax for all occupants when balance is paid or zero"` (or similar); change assertion from "called once (o1 only)" to "called twice" with correct shapes for o1 and o2; update activity assertion to cover both
     - Add new test: `it("writes city tax when no prior record exists", ...)` — render with `cityTaxRecords: {}` for occupantId o1, mark + extend single → assert `saveCityTaxMock("B1", "o1", { totalDue: 2.5, totalPaid: 2.5, balance: 0 })`
  3. **Refactor**: none
- **Scouts:** None: test framework and mock patterns confirmed from existing tests; `userEvent` and `screen` already imported
- **Edge Cases & Hardening:**
  - The flipped test at line 182 uses `extendType === "all"` with both o1 and o2 in `cityTaxTargets`; the city tax fix writes for both — assert both calls
  - For the new case C test, use `cityTaxRecords: {}` (empty object) as the prop; `record = cityTaxRecords[id]` evaluates to `undefined` — triggers case C path
- **What would make this >=90%:** CI run confirming all tests pass. Score is 92% because all assertions are fully specified before implementation.
- **Rollout / rollback:**
  - Rollout: committed with TASK-01 (or separate commit in same PR)
  - Rollback: revert commit
- **Documentation impact:** None
- **Notes / references:**
  - `defaultProps` in test file: `o1: { balance: 5, totalDue: 5, totalPaid: 0 }`, `o2: { balance: 0, totalDue: 5, totalPaid: 5 }`, nights=1 → `defaultCityTaxPerGuest = 2.5`
  - For o2 in the "all" case: `(record.totalDue ?? 0) + 2.5 = 5 + 2.5 = 7.5`

---

## Risks & Mitigations
- Partial write in `Promise.all` fan-out (`saveCityTax` complete before `saveActivity`): pre-existing pattern, widened to cases B/C; accepted; `isSaving` prevents double-submit
- Test at line 182 must change from 1 call to 2 calls: CI will catch if wrong; flag as required
- Implementation must use `ActivityCode.CITY_TAX_PAYMENT` enum (not `9`): explicit in execution plan

## Observability
- Logging: `ActivityCode.CITY_TAX_PAYMENT` (code 9) activity write is now attempted for all three cases during extension when checkbox is checked. Previously only attempted for case A (balance>0). Fails closed if `saveActivity` errors — modal stays open, toast shown.
- Metrics: None: no metrics instrumentation needed for this fix
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [ ] `displayedCityTaxTotal` shows `(old_balance ?? 0) + extension_nights_tax` for every guest in the extension modal
- [ ] `saveCityTax` called with `{ totalDue: oldDue+ext, totalPaid: oldDue+ext, balance: 0 }` for all three guest cases (A/B/C) when "Mark city tax as paid" is checked
- [ ] `ActivityCode.CITY_TAX_PAYMENT` activity write attempted for all cases (not just balance>0); fails closed on error
- [ ] All 4 test changes pass in CI (render assertion updated, case A write shape updated, case B/multi test flipped, case C new test added)
- [ ] TypeScript typechecks cleanly locally before push
- [ ] No regression to key extension, date extension, or accommodation price flows

## Decision Log
- 2026-03-14: Chose Option A (unified formula) over Option B (per-case branching) — single write path, no conditional maintenance burden. Settled in analysis.
- 2026-03-14: `CityTaxPaymentButton` helper pattern explicitly avoided — `useCityTaxPayment.ts:23-33` drives balance negative for fully-paid records without pre-incrementing `totalDue`. Settled in analysis.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Fix display + write in ExtensionPayModal.tsx | Yes — `defaultCityTaxPerGuest` in scope; `CityTaxRecord` schema confirmed; `ActivityCode` import present at line 7 | None | No |
| TASK-02: Update + add tests in ExtensionPayModal.test.tsx | Yes — TASK-01 code changes define the exact write shapes and display values the tests assert; mock setup is established | None | No |

## Overall-confidence Calculation
- TASK-01: 92%, Effort S (weight 1)
- TASK-02: 92%, Effort S (weight 1)
- Overall-confidence = (92×1 + 92×1) / (1+1) = **92%**
