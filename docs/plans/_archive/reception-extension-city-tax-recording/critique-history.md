---
feature-slug: reception-extension-city-tax-recording
stage: lp-do-fact-find
---

# Critique History — reception-extension-city-tax-recording

## Round 1

- **Tool:** codemoot (external critic)
- **Score:** 6/10 → lp_score: 3.0 (partially credible)
- **Verdict:** needs_revision

### Findings

| Severity | Finding | Resolution |
|---|---|---|
| critical | Process Map line 73 incorrectly states the `balance > 0` case "Works correctly". In `ExtensionPayModal.tsx:127-131` the code writes `{ balance: 0, totalPaid: record.totalDue }` but never increments `totalDue` by `defaultCityTaxPerGuest`. Extension nights' tax is unrecorded for all three cases, not just B and C. | Fixed: Process Map updated; all three cases now shown as broken. Unified formula `{ totalDue: (record?.totalDue??0)+ext, totalPaid: (record?.totalDue??0)+ext, balance: 0 }` derived and documented. |
| warning | `cityTaxTargets` occupant scope: the proposed B/C write shapes could risk writing to all occupants if `occupantIds` is not properly scoped. | Fixed: Added clarification that `cityTaxTargets` is derived from `extendType` (either `[occupantId]` or `occupantIds`), already correctly scoped — not the full booking occupant list. No new risk introduced. |
| warning | Blast radius incomplete: `pricing-queries.server.ts:114-137` reads `/cityTax/{bookingRef}` and sums `record.balance` into live guest payable totals for inbox pricing output. | Fixed: Added to Key Modules and Downstream Dependents. Confirmed read-only consumer — no code change needed, but writes must be correct. |
| info | Test infrastructure section listed `pnpm --filter reception test` which conflicts with the CI-only governed test policy. | Fixed: Replaced with governed runner path `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=ExtensionPayModal`. |

### Changes made to artifact
- Summary: rewritten to clarify all three cases share the same root bug (extension amount never added to totalDue)
- Outcome Contract: updated to mention `totalDue` accumulation explicitly
- Process Map: Case A now marked as BUG with explanation
- Patterns & Conventions: added `cityTaxTargets` scoping clarification
- Downstream Dependents: added `pricing-queries.server.ts:114-139` as blast radius consumer
- Engineering Coverage Matrix / Data & Contracts: write shapes updated to unified formula
- Suggested Task Seeds: added task for case A assertion update (4 seeds total)
- Rehearsal Trace: updated blast radius row and case A row
- Execution Routing Packet: updated acceptance package to mention 4 test changes
- Evidence Gap Review: expanded to cover blast radius and scoping confirmation
- Q&A (Resolved): unified formula documented with rationale
- Test infrastructure: governed runner command

## Round 2

- **Tool:** codemoot (external critic)
- **Score:** 6/10 → lp_score: 3.0 (partially credible)
- **Verdict:** needs_revision

### Findings

| Severity | Finding | Resolution |
|---|---|---|
| critical | `displayedCityTaxTotal` shows only `record.balance` for case A guests (lines 76-85), not `record.balance + defaultCityTaxPerGuest`. After the unified write fix, staff are told to collect the wrong (smaller) amount. Display fix required alongside write fix. | Fixed: Engineering Coverage Matrix UI/visual updated to Required; Process Map includes display bug; Suggested Task Seeds adds display fix as Task 1; displayedCityTaxTotal unified formula documented; render test assertion update scoped (5.00→7.50); Execution Routing Packet expanded. |
| warning | Test infrastructure still references `pnpm -w run test:governed ...`, which conflicts with CI-only test policy (`docs/testing-policy.md`). | Fixed: Removed test command entirely. Now states CI-only policy per `docs/testing-policy.md`. |
| warning | Execution packet says "No other files require changes" but render test at `ExtensionPayModal.test.tsx:73` asserts the current city-tax display amount and must update. | Fixed: Execution packet updated to include render test assertion change in acceptance package. |
| info | `cityTax/{bookingRef}/{occupantId}` node is not strictly flat — `CityTaxPaymentButton` writes nested `transactions/*` children. | Fixed: Constraints section updated to clarify the node structure and confirm the extension fix only writes to root-level fields, leaving nested sub-nodes unaffected. |

### Changes made to artifact
- Summary: unchanged (already correct from Round 1)
- Outcome Contract: updated to mention both display and write correctness
- Process Map: added display bug row for `displayedCityTaxTotal` case A
- Constraints: clarified `cityTax` node structure (root fields vs nested transactions/*)
- Engineering Coverage Matrix: UI/visual changed from N/A to Required
- Coverage Gaps: added render test assertion mismatch (line 79: 5.00→7.50)
- Test Infrastructure: removed governed runner command; added CI-only policy reference
- Suggested Task Seeds: 6 tasks (added display fix as Task 1; render test update as Task 3)
- Rehearsal Trace: added display formula row
- Evidence Gap Review: added display bug and test render assertion to gaps addressed
- Scope Signal: updated to reflect both display and write changes (~12 lines, 4 tests)
- Execution Routing Packet: updated acceptance package

## Round 3

- **Tool:** codemoot (external critic)
- **Score:** 8/10 → lp_score: 4.0 (credible)
- **Verdict:** needs_revision (score meets gate threshold ≥4.0)

### Findings

| Severity | Finding | Resolution |
|---|---|---|
| warning | Retry-risk mitigation was wrong — claimed `saveCityTax` is idempotent so a second submit "re-writes same totals," but `updateBookingDates` is not idempotent (re-writes booking/checkout + financial transactions). | Fixed: mitigation changed to "isSaving flag disables Extend button during save; second submit cannot occur while first is in flight." |
| warning | "Follow the accumulation pattern from CityTaxPaymentButton for case B" conflicts with the unified formula. `useCityTaxPayment.ts:23-33` does `totalPaid += payment; balance = totalDue - totalPaid` — applying that to a fully-paid record without first increasing `totalDue` drives `balance` negative. | Fixed: Patterns section updated to explicitly state the extension fix uses its own unified formula (NOT the CityTaxPaymentButton pattern) and explains why. Resolved Q&A updated to match. |
| info | Test-effort narrative was inconsistent — said "two test changes" in one section but live suite has three assertions on broken behavior (lines 79, 149, 182) plus one missing case. | Fixed: Coverage Gaps now lists all three test-line mutations explicitly; Testability confidence updated; Suggested Task Seeds expanded to 6 items with exact assertions. |

### Changes made to artifact
- Risks table: retry-risk mitigation corrected
- Patterns & Conventions: CityTaxPaymentButton pattern note replaced with explicit formula + why the helper can't be reused
- Q&A (Resolved): accumulation answer updated to warn against CityTaxPaymentButton pattern
- Coverage Gaps: all three broken-behavior assertions documented by line (79, 149, 182) + case C gap
- Testability confidence: updated to "three existing tests + one new test"
- Suggested Task Seeds: expanded to 6 with exact assertions (display fix, write fix, 4 test changes)
- Execution Routing Packet: acceptance package updated with exact line references

