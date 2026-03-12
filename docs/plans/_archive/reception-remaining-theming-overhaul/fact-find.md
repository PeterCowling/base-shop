---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: UI
Workstream: Engineering
Created: "2026-03-12"
Last-updated: "2026-03-12"
Feature-Slug: reception-remaining-theming-overhaul
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tools-design-system, lp-design-qa
Related-Analysis: docs/plans/reception-remaining-theming-overhaul/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260312100000-0003
Trigger-Why: "Staff-facing screens (bookings, management, auth, modals) use wrong foreground tokens on coloured backgrounds, redundant opacity syntax, and broken focus ring selectors. This makes buttons and badges harder to read and keyboard focus invisible on daily-use interfaces."
Trigger-Intended-Outcome: "type: operational | statement: All remaining reception components use correct semantic foreground tokens on status-coloured backgrounds, with valid focus ring syntax and no redundant opacity modifiers | source: operator"
---

# Reception Remaining Theming Overhaul — Fact-Find Brief

## Scope

### Summary

Batch fix of ~25 theming issues across ~19 component files in the reception app's bookings, management, auth, and till-modal areas. All fixes are className string replacements using existing semantic tokens. This continues the systematic theming overhaul that already fixed the bar/POS area (14 fixes, commit `b955bf38c4`) and till/safe area (9 fixes, commit `aea95ee6b0`). The inbox area was audited and found clean.

### Goals

- Fix all wrong-foreground-on-coloured-background issues (High severity)
- Fix all double focus prefix issues (`focus-visible:focus:` → `focus-visible:`)
- Remove all redundant `/100` opacity modifiers
- Fix wrong token base in BookingPaymentsLists
- Fix confusing hover state flip in CheckoutTable

### Non-goals

- Redesigning component layouts or structures
- Adding new tokens to the design system
- Changing business logic in any component
- Fixing issues in bar/POS (already done) or till/safe (already done) or inbox (clean)

### Constraints & Assumptions

- Constraints:
  - All changes must use existing semantic tokens from `apps/reception/tailwind.config.mjs` — no new token definitions
  - Purely className adjustments — no component API changes
  - `error-fg` does NOT exist in reception config — must use `danger-fg` for error/danger foregrounds
- Assumptions:
  - Token values in reception tailwind.config.mjs are correct (verified: `danger-fg` L45, `success-fg` L46, `warning-fg` L47)
  - No consumers override DifferenceBadge-style default props in affected components

## Outcome Contract

- **Why:** Staff-facing screens (bookings, management, auth, modals) use wrong foreground tokens on coloured backgrounds, redundant opacity syntax, and broken focus ring selectors. This makes buttons and badges harder to read and keyboard focus invisible on daily-use interfaces.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All remaining reception components use correct semantic foreground tokens on status-coloured backgrounds, with valid focus ring syntax and no redundant opacity modifiers.
- **Source:** operator

## Discovery Contract Output

- **Gap Case ID:** n/a
- **Recommended First Prescription:** n/a
- **Required Inputs:** n/a
- **Expected Artifacts:** n/a
- **Expected Signals:** n/a

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/components/checkins/` — check-in UI (StatusButton, EmailBookingButton, BookingRow, DocInsertButton, CityTaxPaymentButton)
- `apps/reception/src/components/prepayments/` — prepayment UI (CheckInDateChip, HoursChip, BookingPaymentsLists)
- `apps/reception/src/components/reports/` — reporting (VarianceHeatMap)
- `apps/reception/src/components/search/` — search screens (FinancialTransactionSearch, FinancialTransactionAuditSearch, BookingSearchTable)
- `apps/reception/src/components/checkout/` — checkout flow (CheckoutTable)
- `apps/reception/src/components/eodChecklist/` — end-of-day checklist (OpeningFloatModal)
- `apps/reception/src/components/till/` — till modals (TenderRemovalModal)
- `apps/reception/src/components/Login.tsx` — authentication
- `apps/reception/src/components/common/` — shared components (Spinner, DateSelector)

### Key Modules / Files

**Wrong foreground on coloured background (High — 8 issues):**

| # | File (under `apps/reception/src/`) | Line | Current | Should Be | Notes |
|---|------|------|---------|-----------|-------|
| 1 | `components/checkins/StatusButton.tsx` | L139 | `bg-success-main/100 text-foreground` | `bg-success-main text-success-fg` | Wrong fg + redundant /100 |
| 2 | `components/checkins/StatusButton.tsx` | L143 | `bg-warning-main/100 text-foreground` | `bg-warning-main text-warning-fg` | Wrong fg + redundant /100 |
| 3 | `components/checkins/EmailBookingButton.tsx` | L119 | `bg-warning-main/100 text-primary-fg/100` | `bg-warning-main text-warning-fg` | Wrong fg + redundant /100 |
| 4 | `components/prepayments/CheckInDateChip.tsx` | L23 | `bg-warning text-primary-fg` | `bg-warning text-warning-fg` | Wrong fg |
| 5 | `components/prepayments/HoursChip.tsx` | L21 | `bg-warning text-primary-fg` | `bg-warning text-warning-fg` | Wrong fg |
| 6 | `components/checkins/view/BookingRow.tsx` | L77 | `text-primary-fg/100 bg-error-main/100` | `text-danger-fg bg-error-main` | Wrong fg + redundant /100 |
| 7 | `components/common/DateSelector.tsx` | L48 | `bg-warning text-primary-fg` | `bg-warning text-warning-fg` | Wrong fg on selected day (WARNING variant) |
| 8 | `components/common/DateSelector.tsx` | L74 | `text-primary-main/100` | `text-primary-main` | Redundant /100 on today highlight (PRIMARY variant) |

**text-primary-fg on bg-error-main — close buttons (High — 2 issues):**

| # | File (under `apps/reception/src/`) | Line | Current | Should Be |
|---|------|------|---------|-----------|
| 9 | `components/eodChecklist/OpeningFloatModal.tsx` | L54 | `bg-error-main text-primary-fg` | `bg-error-main text-danger-fg` |
| 10 | `components/till/TenderRemovalModal.tsx` | L70 | `bg-error-main text-primary-fg` | `bg-error-main text-danger-fg` |

**Missing foreground on coloured background (High — 1 issue):**

| # | File (under `apps/reception/src/`) | Lines | Current | Should Be |
|---|------|-------|---------|-----------|
| 11 | `components/reports/VarianceHeatMap.tsx` | L26-28 | `bg-success-light` / `bg-warning-light` / `bg-error-light` (no fg) | Add `text-success-fg` / `text-warning-fg` / `text-danger-fg` respectively |

**Wrong token base (Medium — 1 issue):**

| # | File (under `apps/reception/src/`) | Line | Current | Should Be |
|---|------|------|---------|-----------|
| 12 | `components/prepayments/BookingPaymentsLists.tsx` | L110 | `bg-danger-fg/10` | `bg-error-main/10` (danger-fg is a foreground token, not a background) |

**Double focus prefix (Medium — 18+ instances across 5 files):**

| # | File (under `apps/reception/src/`) | Lines | Current | Should Be |
|---|------|-------|---------|-----------|
| 13 | `components/eodChecklist/OpeningFloatModal.tsx` | L54 | `focus-visible:focus:ring-2 focus-visible:focus:ring-error-main` | `focus-visible:ring-2 focus-visible:ring-error-main` |
| 14 | `components/till/TenderRemovalModal.tsx` | L70 | `focus-visible:focus:ring-2 focus-visible:focus:ring-error-main` | `focus-visible:ring-2 focus-visible:ring-error-main` |
| 15 | `components/search/FinancialTransactionSearch.tsx` | L62,75,88,101,114,127,140 | `focus-visible:focus:ring-1` (7 instances) | `focus-visible:ring-1` |
| 16 | `components/search/FinancialTransactionAuditSearch.tsx` | L103,116,129,142,155 | `focus-visible:focus:ring-1` (5 instances) | `focus-visible:ring-1` |
| 17 | `components/Login.tsx` | L294,363,410,466,497 | `focus-visible:focus:ring-2` (5 instances) | `focus-visible:ring-2` |

**Redundant /100 opacity (Low — ~12 instances across 6 files):**

| # | File (under `apps/reception/src/`) | Lines | Notes |
|---|------|-------|-------|
| 18 | `components/checkins/EmailBookingButton.tsx` | L105 | `bg-primary-main/100 text-primary-fg/100` — correct tokens, just remove /100 |
| 19 | `components/checkins/cityTaxButton/CityTaxPaymentButton.tsx` | L260,262 | `/100` on tokens |
| 20 | `components/checkins/DocInsertButton.tsx` | L65,70,72,74 | `/100` on tokens |
| 21 | `components/common/Spinner.tsx` | L27 | `/100` on token |
| 22 | `components/checkins/view/BookingRow.tsx` | L77 | `/100` on tokens (covered by fix #6) |
| 23 | `components/common/DateSelector.tsx` | L74-75 | `/100` on primary-main and primary-fg (PRIMARY variant) |

**Additional wrong foreground on coloured background — discovered during analysis critique (High — 8 issues):**

| # | File (under `apps/reception/src/`) | Line | Current | Should Be | Notes |
|---|------|------|---------|-----------|-------|
| 25 | `components/checkins/roomButton/PaymentForm.tsx` | L54 | `bg-success-main/100 text-foreground` | `bg-success-main text-success-fg` | Wrong fg + redundant /100 |
| 26 | `components/checkins/keycardButton/KeycardDepositButton.tsx` | L158 | `bg-success-main/100 text-foreground` | `bg-success-main text-success-fg` | Wrong fg + redundant /100 |
| 27 | `components/checkins/cityTaxButton/CityTaxPaymentButton.tsx` | L262 | `bg-success-main/100 text-foreground` | `bg-success-main text-success-fg` | Wrong fg + redundant /100 (same file as /100 fix #19) |
| 28 | `components/emailAutomation/TimeElapsedChip.tsx` | L28 | `bg-warning text-primary-fg` | `bg-warning text-warning-fg` | Wrong fg |
| 29 | `components/prepare/CleaningPriorityTable.tsx` | L53 | `text-primary-fg` on `bg-error-main`/`bg-success-main` | `text-danger-fg`/`text-success-fg` conditionally | Wrong fg on both status backgrounds |
| 30 | `components/search/BulkActionsToolbar.tsx` | L102 | `bg-error-main text-primary-fg` | `bg-error-main text-danger-fg` | Wrong fg |
| 31 | `components/inventory/IngredientStock.tsx` | L65 | `bg-warning-main text-primary-fg` | `bg-warning-main text-warning-fg` | Wrong fg |
| 32 | `components/inventory/StockManagement.tsx` | L706 | `bg-warning-main text-primary-fg` | `bg-warning-main text-warning-fg` | Wrong fg |

**Additional wrong foreground — OfflineIndicator (High — 1 issue, 3 instances):**

| # | File (under `apps/reception/src/`) | Lines | Current | Should Be |
|---|------|-------|---------|-----------|
| 33 | `components/OfflineIndicator.tsx` | L25,44,53 | `bg-warning text-primary-fg` (3 instances) | `bg-warning text-warning-fg` |

**Additional redundant /100 opacity (Low — 2 issues):**

| # | File (under `apps/reception/src/`) | Lines | Notes |
|---|------|-------|-------|
| 34 | `components/checkins/roomButton/PaymentForm.tsx` | L52 | `bg-primary-main/100 text-primary-fg/100` — correct tokens, just remove /100 |
| 35 | `components/checkins/keycardButton/KeycardDepositButton.tsx` | L156 | `bg-primary-main/100 text-primary-fg/100` — correct tokens, just remove /100 |

**Confusing hover state (Low — 1 issue):**

| # | File (under `apps/reception/src/`) | Line | Current | Should Be |
|---|------|------|---------|-----------|
| 36 | `components/checkout/CheckoutTable.tsx` | L240 | `bg-success-main hover:bg-error-main` (completed state) | `bg-success-main hover:bg-success-dark` or `hover:opacity-90` |

### Patterns & Conventions Observed

- **Identical pattern to bar/POS and till/safe overhauls**: All fixes are className string replacements with verified target tokens — evidence: commits `b955bf38c4` and `aea95ee6b0`
- **`text-primary-fg` is the default wrong token**: Components consistently use `text-primary-fg` when they should use status-specific foreground tokens — evidence: 9 of 10 wrong-fg issues
- **`/100` opacity is a recurring anti-pattern**: Tailwind's default opacity is 1.0, making `/100` redundant — evidence: ~10 instances across 5 files
- **`focus-visible:focus:` double prefix**: Likely copied from a template — evidence: same pattern across 6 unrelated files

### Data & Contracts

- Types/schemas/events: No type changes needed — all fixes are className strings
- Persistence: No changes
- API/contracts: No changes

### Dependency & Impact Map

- Upstream dependencies: `apps/reception/tailwind.config.mjs` (token definitions — read-only)
- Downstream dependents: None — className changes are terminal
- Likely blast radius: Visual-only, confined to changed components

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs`
- CI integration: Runs in CI only per testing policy

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| VarianceHeatMap | Unit | `components/reports/__tests__/VarianceHeatMap.test.tsx` | Exists but may not assert className output of getVarianceClass() |
| StatusButton | Unit | `components/checkins/__tests__/StatusButton.test.tsx` | Exists — check for className assertions during build |
| OpeningFloatModal | Unit | `components/eodChecklist/__tests__/OpeningFloatModal.test.tsx` | Exists — check for className assertions during build |
| CheckInDateChip/HoursChip | Unit | `components/prepayments/__tests__/ChipComponents.test.tsx` | Exists — check for className assertions during build |
| CheckoutTable | Unit | `components/checkout/__tests__/CheckoutTable.component.test.tsx` | Exists — check for hover className assertions during build |
| BookingRow | Unit | `components/checkins/__tests__/BookingRow.test.tsx` | Exists — check for className assertions during build |
| DocInsertButton | Unit | `components/checkins/__tests__/DocInsertButton.test.tsx` | Exists — check for className assertions during build |

#### Testability Assessment

- Easy to test: VarianceHeatMap `getVarianceClass()` is a pure function — could unit test
- Hard to test: None — all changes are className strings
- Test seams needed: None

#### Recommended Test Approach

- No new tests required — changes are className-only with no logic changes
- Typecheck + lint serve as automated validation
- Visual inspection confirms correct rendering

### Recent Git History (Targeted)

- `apps/reception/src/components/bar/*` — 14 theming fixes applied (commit `b955bf38c4`)
- `apps/reception/src/components/till/*` and `common/*` — 9 theming fixes applied (commit `aea95ee6b0`)
- Both preceding overhauls used the same single-pass batch approach successfully

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | All 23+ issues are wrong/missing className tokens causing poor contrast or invisible states | All issues verified against actual file contents and reception tailwind.config.mjs | All className fixes must be verified against token definitions |
| UX / states | Required | Double focus prefix makes focus rings invisible; confusing hover flip on CheckoutTable | 8+ focus ring instances, 1 hover state | Focus ring syntax must be `focus-visible:ring-*` not `focus-visible:focus:ring-*` |
| Security / privacy | N/A | No auth, data, or input changes | — | — |
| Logging / observability / audit | N/A | No logic changes | — | — |
| Testing / validation | Required | Multiple affected components have existing test files (VarianceHeatMap, StatusButton, OpeningFloatModal, ChipComponents, CheckoutTable, BookingRow, DocInsertButton) — check for className assertions that may need updating | Tests may assert old className values | Typecheck + lint + check existing tests for old className assertions |
| Data / contracts | N/A | No type/schema/API changes — className strings only | — | — |
| Performance / reliability | N/A | className changes have zero runtime cost | — | — |
| Rollout / rollback | Required | Prior overhauls used single commit, revert = `git revert <sha>` | Same approach applies | Single commit, standard deploy |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** 23 issues across 19 files is a larger batch than prior overhauls (14 and 9 respectively), but all fixes follow the identical className replacement pattern. The issues are well-bounded to specific token substitutions with no architecture or logic changes. Prior precedent proves this approach at scale.

## Access Declarations

None — all work is within the local codebase.

## Questions

### Resolved

- Q: Does `error-fg` exist in the reception theme?
  - A: No. Reception tailwind.config.mjs defines `danger-fg` (L45) but not `error-fg`. All error foreground fixes must use `text-danger-fg`.
  - Evidence: `apps/reception/tailwind.config.mjs` L45

- Q: What foreground token should VarianceHeatMap use on `-light` backgrounds?
  - A: Use the matching status foreground: `text-success-fg` on `bg-success-light`, `text-warning-fg` on `bg-warning-light`, `text-danger-fg` on `bg-error-light`. The `-light` backgrounds are light enough that status foreground tokens provide good contrast.
  - Evidence: Token definitions in `apps/reception/tailwind.config.mjs` L45-47

- Q: Should BookingPaymentsLists use `bg-danger/10` or `bg-error-main/10`?
  - A: `bg-error-main/10` — the `danger` prefix is used only for foreground (`danger-fg`), while background/border tokens use `error-main`/`error-light`/`error-dark`.
  - Evidence: `apps/reception/tailwind.config.mjs` semantic color definitions

- Q: What should replace the confusing `hover:bg-error-main` on CheckoutTable completed rows?
  - A: Use `hover:bg-success-dark` to maintain the success colour family on hover, rather than flipping to error which implies danger.
  - Evidence: `success-dark` exists in reception tailwind.config.mjs

### Open (Operator Input Required)

None — all questions resolved from codebase evidence.

## Confidence Inputs

- Implementation: 90% — all fixes are verified className string replacements; identical approach succeeded twice before
- Approach: 95% — single-pass batch proven by two prior overhauls (commits b955bf38c4, aea95ee6b0)
- Impact: 85% — fixes daily-use staff interfaces across bookings, management, and auth
- Delivery-Readiness: 90% — all tokens verified, all files identified, no unknowns
- Testability: 85% — typecheck + lint catch structural errors; visual inspection confirms rendering

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| VarianceHeatMap fg tokens don't contrast well on -light backgrounds | Low | Low | Token values are designed for this pairing; verify visually |
| Large batch (23 issues) increases review burden | Low | Low | All fixes follow identical pattern; single commit for atomic rollback |
| CheckoutTable hover change affects user muscle memory | Very Low | Low | Current behavior (success→error) is confusing; new behavior (success→success-dark) is more intuitive |

## Planning Constraints & Notes

- Must-follow patterns:
  - Use `danger-fg` (not `error-fg`) for all error/danger foreground fixes
  - Preserve any intentional opacity values (e.g. `bg-warning/10` in BookingPaymentsLists is intentional for tinted backgrounds)
  - `focus-visible:focus:` → `focus-visible:` for all double-prefix fixes
  - `/100` removal is safe — Tailwind default opacity is 1.0
- Rollout/rollback expectations:
  - Single commit covering all fixes
  - Rollback: `git revert <sha>`
- Observability expectations:
  - None — className changes have no runtime impact

## Suggested Task Seeds (Non-binding)

- TASK-01: Fix all ~25 theming issues across bookings, management, auth, and till-modal components (single-pass batch, S-M effort)

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: tools-design-system, lp-design-qa
- Deliverable acceptance package: typecheck pass, lint pass, all className fixes match verified mapping
- Post-delivery measurement plan: visual inspection of affected components in dev

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Check-in components (5 files: StatusButton, EmailBookingButton, BookingRow, DocInsertButton, CityTaxPaymentButton) | Yes | None — all issues verified at correct paths under `components/checkins/` | No |
| Prepayment components (3 files: CheckInDateChip, HoursChip, BookingPaymentsLists) | Yes | None — verified under `components/prepayments/` | No |
| Reports (1 file: VarianceHeatMap) | Yes | None — verified under `components/reports/` | No |
| Search components (3 files: FinancialTransactionSearch, FinancialTransactionAuditSearch, BookingSearchTable) | Yes | None — verified under `components/search/` | No |
| Checkout (1 file: CheckoutTable) | Yes | None — verified under `components/checkout/` | No |
| EOD Checklist (1 file: OpeningFloatModal) | Yes | None — verified under `components/eodChecklist/` | No |
| Till (1 file: TenderRemovalModal) | Yes | None — verified under `components/till/` | No |
| Auth (1 file: Login) | Yes | None — 5 double-focus instances verified at L294, L363, L410, L466, L497 | No |
| Common (2 files: Spinner, DateSelector) | Yes | None — Spinner /100 and DateSelector wrong-fg + /100 verified | No |
| Token availability | Yes | None — all target tokens confirmed in reception tailwind.config.mjs | No |
| Existing test files | Yes | 7 test files found for affected components — check for className assertions during build | No |

## Evidence Gap Review

### Gaps Addressed

- All 24 reported issues verified against actual file contents with correct paths
- Token availability confirmed for all replacement values
- Prior overhaul precedent confirms approach viability

### Confidence Adjustments

- No adjustments needed — all evidence supports high confidence

### Remaining Assumptions

- Existing test files for affected components may contain className assertions that need updating (check during build)
- DateSelector WARNING variant L48 `text-primary-fg` confirmed; PRIMARY variant L74-75 `/100` confirmed
- Login.tsx double-focus instances confirmed at L294, L363, L410, L466, L497

## Analysis Readiness

- Status: Ready-for-analysis
- Blocking items: None
- Recommended next step: `/lp-do-analysis reception-remaining-theming-overhaul`
