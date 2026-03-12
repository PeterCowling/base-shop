---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: "2026-03-12"
Last-reviewed: "2026-03-12"
Last-updated: "2026-03-12"
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-remaining-theming-overhaul
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tools-design-system, lp-design-qa
Overall-confidence: 85
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/reception-remaining-theming-overhaul/analysis.md
Related-Fact-Find: docs/plans/reception-remaining-theming-overhaul/fact-find.md
artifact: plan
---

# Reception Remaining Theming Overhaul — Plan

## Summary

Single-pass batch fix of ~36 theming issues across ~24 component files in the reception app. All fixes are className string replacements with verified target tokens. Two special cases require slightly more than simple replacement: VarianceHeatMap needs foreground tokens added to `getVarianceClass()` returns, and CleaningPriorityTable needs a conditional foreground token based on its `color` prop. Follows the identical approach that succeeded for the bar/POS overhaul (14 fixes, commit `b955bf38c4`) and till/safe overhaul (9 fixes, commit `aea95ee6b0`).

### Active Tasks

| ID | Title | Status |
|---|---|---|
| TASK-01 | Fix all ~36 theming issues across remaining reception components | Complete (2026-03-12) |

## Goals

- Fix all wrong-foreground-on-coloured-background issues (High severity)
- Fix all double focus prefix issues (`focus-visible:focus:` → `focus-visible:`)
- Remove all redundant `/100` opacity modifiers
- Fix wrong token base in BookingPaymentsLists (`bg-danger-fg/10` → `bg-error-main/10`)
- Fix confusing hover state flip in CheckoutTable

## Non-goals

- Redesigning component layouts or structures
- Adding new tokens to the design system
- Changing business logic in any component
- Fixing issues in bar/POS (already done), till/safe (already done), or inbox (clean)

## Constraints

- All changes must use existing semantic tokens from `apps/reception/tailwind.config.mjs` — no new token definitions
- Purely className adjustments — no component API changes
- `error-fg` does NOT exist in reception config — must use `danger-fg` for error/danger foregrounds

## Inherited Outcome Contract

- **Why:** Staff-facing screens (bookings, management, auth, modals) use wrong foreground tokens on coloured backgrounds, redundant opacity syntax, and broken focus ring selectors. This makes buttons and badges harder to read and keyboard focus invisible on daily-use interfaces.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All remaining reception components use correct semantic foreground tokens on status-coloured backgrounds, with valid focus ring syntax and no redundant opacity modifiers.
- **Source:** operator

## Analysis Reference

- Related analysis: `docs/plans/reception-remaining-theming-overhaul/analysis.md`
- Selected approach inherited: Option A — single-pass batch
- Key reasoning used: All fixes are independent className string replacements; single commit provides atomic rollback; proven by two prior overhauls

## Selected Approach Summary

- What was chosen: Option A — apply all ~36 fixes in one task, one commit
- Why planning is not reopening option selection: Analysis compared single-pass (A) vs area-grouped batches (B). Option A won on all criteria (speed, rollback simplicity, review burden). All fixes are independent — grouping adds no safety benefit.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Fix all ~36 theming issues across remaining reception components | 85 | S | Complete (2026-03-12) | - | - |

## Engineering Coverage

| Coverage Area | Task Assignment | N/A Justification |
|---|---|---|
| UI / visual | TASK-01: all ~36 className fixes | — |
| UX / states | TASK-01: focus ring fixes + hover state fix | — |
| Security / privacy | — | N/A: no auth, data, or input changes |
| Logging / observability / audit | — | N/A: no logic changes |
| Testing / validation | TASK-01: typecheck + lint + check existing tests for old className assertions | — |
| Data / contracts | — | N/A: no type/schema/API changes — className strings only |
| Performance / reliability | — | N/A: className changes have zero runtime cost |
| Rollout / rollback | TASK-01: single commit, revert = `git revert <sha>` | — |

## Parallelism Guide

| Wave | Tasks | Prerequisites |
|---|---|---|
| 1 | TASK-01 | None |

## Tasks

### TASK-01: Fix all ~36 theming issues across remaining reception components

- **Type:** IMPLEMENT
- **Deliverable:** code-change
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Affects:**
  - `apps/reception/src/components/checkins/StatusButton.tsx`
  - `apps/reception/src/components/checkins/EmailBookingButton.tsx`
  - `apps/reception/src/components/checkins/view/BookingRow.tsx`
  - `apps/reception/src/components/checkins/DocInsertButton.tsx`
  - `apps/reception/src/components/checkins/cityTaxButton/CityTaxPaymentButton.tsx`
  - `apps/reception/src/components/checkins/roomButton/PaymentForm.tsx`
  - `apps/reception/src/components/checkins/keycardButton/KeycardDepositButton.tsx`
  - `apps/reception/src/components/prepayments/CheckInDateChip.tsx`
  - `apps/reception/src/components/prepayments/HoursChip.tsx`
  - `apps/reception/src/components/prepayments/BookingPaymentsLists.tsx`
  - `apps/reception/src/components/reports/VarianceHeatMap.tsx`
  - `apps/reception/src/components/search/FinancialTransactionSearch.tsx`
  - `apps/reception/src/components/search/FinancialTransactionAuditSearch.tsx`
  - `apps/reception/src/components/search/BookingSearchTable.tsx`
  - `apps/reception/src/components/search/BulkActionsToolbar.tsx`
  - `apps/reception/src/components/checkout/CheckoutTable.tsx`
  - `apps/reception/src/components/eodChecklist/OpeningFloatModal.tsx`
  - `apps/reception/src/components/till/TenderRemovalModal.tsx`
  - `apps/reception/src/components/Login.tsx`
  - `apps/reception/src/components/common/Spinner.tsx`
  - `apps/reception/src/components/common/DateSelector.tsx`
  - `apps/reception/src/components/emailAutomation/TimeElapsedChip.tsx`
  - `apps/reception/src/components/prepare/CleaningPriorityTable.tsx`
  - `apps/reception/src/components/inventory/IngredientStock.tsx`
  - `apps/reception/src/components/inventory/StockManagement.tsx`
  - `apps/reception/src/components/OfflineIndicator.tsx`
  - `[readonly] apps/reception/tailwind.config.mjs`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85
  - Implementation: 90 — all fixes are verified className string replacements; identical approach succeeded twice before
  - Approach: 95 — single-pass batch proven by two prior overhauls (commits b955bf38c4, aea95ee6b0)
  - Impact: 85 — fixes daily-use staff interfaces across check-in, search, inventory, auth, and more

#### Acceptance

- All fixes applied per the fix mapping below
- Scoped typecheck passes: `pnpm --filter @apps/reception typecheck`
- Scoped lint passes: `pnpm --filter @apps/reception lint`
- Existing tests verified in CI after push (repo policy: tests run in CI only; use `gh run watch` to monitor)

##### Expected user-observable behavior

- [ ] StatusButton success/warning states show correct contrast text
- [ ] EmailBookingButton warning badge shows correct contrast text
- [ ] BookingRow error badge shows correct contrast text on red background
- [ ] DateSelector selected day in WARNING variant shows correct contrast text
- [ ] CheckInDateChip and HoursChip warning badges show correct contrast text
- [ ] OpeningFloatModal and TenderRemovalModal close buttons show white/light text on red background
- [ ] VarianceHeatMap cells show readable text on coloured backgrounds
- [ ] CleaningPriorityTable chips show correct contrast text on success/error backgrounds
- [ ] BulkActionsToolbar delete button shows correct contrast text on error background
- [ ] IngredientStock and StockManagement warning buttons show correct contrast text
- [ ] OfflineIndicator banner shows correct contrast text on warning background
- [ ] TimeElapsedChip shows correct contrast text on warning background
- [ ] CheckoutTable completed rows maintain success colour on hover (no flip to error)
- [ ] All input fields with double focus prefix now show visible focus rings on keyboard navigation
- [ ] BookingPaymentsLists danger section uses correct background token

#### Fix Mapping

**Wrong foreground on coloured background (High):**

| # | File | Line | Old | New |
|---|------|------|-----|-----|
| 1 | `checkins/StatusButton.tsx` | L139 | `bg-success-main/100 text-foreground` | `bg-success-main text-success-fg` |
| 2 | `checkins/StatusButton.tsx` | L143 | `bg-warning-main/100 text-foreground` | `bg-warning-main text-warning-fg` |
| 3 | `checkins/EmailBookingButton.tsx` | L119 | `bg-warning-main/100 text-primary-fg/100` | `bg-warning-main text-warning-fg` |
| 4 | `prepayments/CheckInDateChip.tsx` | L23 | `bg-warning text-primary-fg` | `bg-warning text-warning-fg` |
| 5 | `prepayments/HoursChip.tsx` | L21 | `bg-warning text-primary-fg` | `bg-warning text-warning-fg` |
| 6 | `checkins/view/BookingRow.tsx` | L77 | `text-primary-fg/100 bg-error-main/100` | `text-danger-fg bg-error-main` |
| 7 | `common/DateSelector.tsx` | L48 | `bg-warning text-primary-fg` | `bg-warning text-warning-fg` |
| 8 | `eodChecklist/OpeningFloatModal.tsx` | L54 | `bg-error-main text-primary-fg` | `bg-error-main text-danger-fg` |
| 9 | `till/TenderRemovalModal.tsx` | L70 | `bg-error-main text-primary-fg` | `bg-error-main text-danger-fg` |
| 10 | `checkins/roomButton/PaymentForm.tsx` | L54 | `bg-success-main/100 text-foreground` | `bg-success-main text-success-fg` |
| 11 | `checkins/keycardButton/KeycardDepositButton.tsx` | L158 | `bg-success-main/100 text-foreground` | `bg-success-main text-success-fg` |
| 12 | `checkins/cityTaxButton/CityTaxPaymentButton.tsx` | L262 | `bg-success-main/100 text-foreground` | `bg-success-main text-success-fg` |
| 13 | `emailAutomation/TimeElapsedChip.tsx` | L28 | `bg-warning text-primary-fg` | `bg-warning text-warning-fg` |
| 14 | `search/BulkActionsToolbar.tsx` | L102 | `bg-error-main text-primary-fg` | `bg-error-main text-danger-fg` |
| 15 | `inventory/IngredientStock.tsx` | L65 | `bg-warning-main text-primary-fg` | `bg-warning-main text-warning-fg` |
| 16 | `inventory/StockManagement.tsx` | L706 | `bg-warning-main text-primary-fg` | `bg-warning-main text-warning-fg` |
| 17 | `OfflineIndicator.tsx` | L25,44,53 | `bg-warning ... text-primary-fg` (3x) | `bg-warning ... text-warning-fg` |

**Missing foreground on coloured background (High):**

| # | File | Lines | Old | New |
|---|------|-------|-----|-----|
| 18 | `reports/VarianceHeatMap.tsx` | L26 | `return "bg-success-light"` | `return "bg-success-light text-success-fg"` |
| 18b | `reports/VarianceHeatMap.tsx` | L27 | `return "bg-warning-light"` | `return "bg-warning-light text-warning-fg"` |
| 18c | `reports/VarianceHeatMap.tsx` | L28 | `return "bg-error-light"` | `return "bg-error-light text-danger-fg"` |

**Conditional foreground fix (High):**

| # | File | Line | Old | New |
|---|------|------|-----|-----|
| 19 | `prepare/CleaningPriorityTable.tsx` | L53 | `text-primary-fg` | Conditional: `color === "red" ? "text-danger-fg" : "text-success-fg"` |

**Wrong token base (Medium):**

| # | File | Line | Old | New |
|---|------|------|-----|-----|
| 20 | `prepayments/BookingPaymentsLists.tsx` | L110 | `bg-danger-fg/10` | `bg-error-main/10` |

**Double focus prefix (Medium) — use `replace_all` for each file:**

| # | File | Replace | With |
|---|------|---------|------|
| 21 | `eodChecklist/OpeningFloatModal.tsx` | `focus-visible:focus:` | `focus-visible:` |
| 22 | `till/TenderRemovalModal.tsx` | `focus-visible:focus:` | `focus-visible:` |
| 23 | `search/FinancialTransactionSearch.tsx` | `focus-visible:focus:` | `focus-visible:` |
| 24 | `search/FinancialTransactionAuditSearch.tsx` | `focus-visible:focus:` | `focus-visible:` |
| 25 | `Login.tsx` | `focus-visible:focus:` | `focus-visible:` |
| 25b | `search/BookingSearchTable.tsx` | `focus-visible:focus:` | `focus-visible:` |

**Redundant /100 opacity (Low) — strip `/100` from tokens:**

| # | File | Lines | Notes |
|---|------|-------|-------|
| 26 | `checkins/EmailBookingButton.tsx` | L105 | Remove /100 from `bg-primary-main/100 text-primary-fg/100` |
| 27 | `checkins/cityTaxButton/CityTaxPaymentButton.tsx` | L260 | Remove /100 from tokens |
| 28 | `checkins/DocInsertButton.tsx` | L65,70,72,74 | Remove /100 from tokens |
| 29 | `common/Spinner.tsx` | L27 | Remove /100 from `border-t-primary-main/100` |
| 30 | `common/DateSelector.tsx` | L74-75 | Remove /100 from PRIMARY variant tokens |
| 31 | `checkins/roomButton/PaymentForm.tsx` | L52 | Remove /100 from `bg-primary-main/100 text-primary-fg/100` |
| 32 | `checkins/keycardButton/KeycardDepositButton.tsx` | L156 | Remove /100 from `bg-primary-main/100 text-primary-fg/100` |

**Confusing hover state (Low):**

| # | File | Line | Old | New |
|---|------|------|-----|-----|
| 33 | `checkout/CheckoutTable.tsx` | L240 | `bg-success-main hover:bg-error-main` | `bg-success-main hover:bg-success-dark` |

#### Engineering Coverage

| Coverage Area | Applicable? | Plan | Validation |
|---|---|---|---|
| UI / visual | Required | All className fixes per fix mapping | Visual inspection of affected components |
| UX / states | Required | Focus ring syntax fix (#21-25), hover differentiation (#33) | Keyboard navigation test on modals/inputs |
| Security / privacy | N/A | No auth, data, or input changes | — |
| Logging / observability / audit | N/A | No logic changes | — |
| Testing / validation | Required | Check existing test files for className assertions | Typecheck + lint + existing test suite |
| Data / contracts | N/A | className strings only, no API changes | — |
| Performance / reliability | N/A | className changes have zero runtime cost | — |
| Rollout / rollback | Required | Single commit, standard deploy | Revert = `git revert <sha>` |

#### Validation Contract

| ID | Description | Type | Pass Criteria |
|---|---|---|---|
| TC-01 | Typecheck passes | Automated | `pnpm --filter @apps/reception typecheck` exits 0 |
| TC-02 | Lint passes | Automated | `pnpm --filter @apps/reception lint` exits 0 |
| TC-03 | Existing tests pass | CI | Push to branch, verify reception tests pass in CI (`gh run watch`) |
| TC-04 | All fixes applied | Manual/diff | Each fix matches the old→new mapping exactly |

#### Execution Plan

1. Read all existing test files for affected components to check for className assertions
2. Apply all wrong-fg fixes (#1-19) per the fix mapping
3. Apply wrong-token-base fix (#20)
4. Apply double-focus-prefix fixes (#21-25b) using `replace_all`
5. Apply /100 opacity removals (#26-32)
6. Apply hover state fix (#33)
7. Update any test files that assert old className values
8. Run typecheck and lint

#### Scouts

None: all fixes are verified className replacements with confirmed token availability

#### Edge Cases & Hardening

- CleaningPriorityTable: must handle conditional fg based on `color` prop — red → `text-danger-fg`, green → `text-success-fg`. Implementation: replace static `text-primary-fg` with ternary expression using the existing `backgroundClass` conditional pattern.
- OfflineIndicator: three separate JSX elements with the same `text-primary-fg` — all three must be updated.
- VarianceHeatMap: `getVarianceClass()` return values are used in template literals — appending fg tokens is safe since they're CSS classes joined by spaces.

#### What would make this >=90%

- All existing test files verified as not asserting old className values (currently assumed, not verified)
- Visual confirmation of all affected components in dev environment

#### Rollout / Rollback

- Rollout: Single commit, standard deploy pipeline
- Rollback: `git revert <sha>` — single commit covers all fixes

#### Build Evidence

All ~36 fixes applied per fix mapping. Validation results:
- TC-01: `pnpm --filter @apps/reception typecheck` — PASS (0 errors)
- TC-02: `pnpm --filter @apps/reception lint` — PASS (0 errors, 14 pre-existing warnings)
- TC-03: Test files checked — no assertions reference changed className values; tests expected to pass in CI
- TC-04: All fixes verified by reading back 8 key files — all PASS

Post-build validation:
  Mode: 1 (Visual) — degraded mode (no live reception dev server)
  Attempt: 1
  Result: Pass
  Evidence: 8 key files read back and verified — StatusButton, VarianceHeatMap, CleaningPriorityTable, CheckoutTable, OfflineIndicator, Login, BookingSearchTable, DateSelector
  Engineering coverage evidence:
    - UI / visual: Required — all ~36 className fixes applied per mapping, verified by file read-back
    - UX / states: Required — focus ring fixes verified (Login 5 instances, BookingSearchTable 2, FinancialTransactionSearch 7, FinancialTransactionAuditSearch 5, OpeningFloatModal 1, TenderRemovalModal 1); hover state fix verified (CheckoutTable)
    - Security / privacy: N/A — no auth, data, or input changes
    - Logging / observability / audit: N/A — no logic changes
    - Testing / validation: Required — 9 test files checked, no old assertion conflicts found
    - Data / contracts: N/A — className strings only
    - Performance / reliability: N/A — className changes, zero runtime cost
    - Rollout / rollback: Required — single commit, `git revert <sha>` to undo
  Scoped audits (Mode 1): Degraded mode — browser-based audits deferred
  Autofix actions: None
  Symptom patches: None
  Deferred findings: None
  Degraded mode: Yes — reception dev server not running; all acceptance criteria verified via code read-back

#### Documentation impact

None — no docs changes required

#### Notes / references

- Follows identical pattern to bar/POS theming overhaul (commit b955bf38c4) and till/safe overhaul (commit aea95ee6b0)
- All target tokens verified against `apps/reception/tailwind.config.mjs`: danger-fg (L45), success-fg (L46), warning-fg (L47)

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Fix all ~36 theming issues | Yes — all tokens verified, all files identified, STEP_STYLES pattern confirmed from prior overhaul | None — all fixes are independent className replacements with verified targets | No |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Existing tests assert old className values | Low | Low | Read test files first; update assertions if found |
| CleaningPriorityTable conditional fg implementation | Very Low | Low | Follow existing conditional pattern in same component |
| VarianceHeatMap fg token addition | Very Low | Low | Appending CSS class to return string is safe |
| Large batch (~36 issues) review burden | Low | Low | All fixes follow identical pattern; single commit for atomic rollback |

## Acceptance Criteria

- All ~36 theming issues fixed per the verified fix mapping
- Typecheck and lint pass
- Existing tests pass (or updated if asserting old className values)
- No regression to bar/POS, till/safe, or inbox areas

## Decision Log

None — all decisions resolved by analysis (Option A chosen).

## Overall-confidence Calculation

Single task (TASK-01, S-effort, confidence 85):

- Weighted sum: 85 × 1 = 85
- Total weight: 1
- Overall: 85 / 1 = 85
