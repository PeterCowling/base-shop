---
Type: Plan
Status: Active
Domain: UI
Workstream: Engineering
Created: "2026-03-12"
Last-reviewed: "2026-03-12"
Last-updated: "2026-03-12"
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-till-safe-theming-overhaul
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tools-design-system, lp-design-qa
Related-Fact-Find: docs/plans/reception-till-safe-theming-overhaul/fact-find.md
Related-Analysis: docs/plans/reception-till-safe-theming-overhaul/analysis.md
Overall-confidence: 90
artifact: plan
---

# Reception Till, Safe & Cash Management Theming Overhaul — Plan

## Summary

Single-pass batch fix of 9 theming issues across 7 till/safe/common component files. All fixes are className string replacements with verified target tokens. One fix (CloseShiftForm) requires adding a property to an existing constant object. Follows the identical approach that succeeded for the bar/POS theming overhaul.

### Active Tasks

| ID | Title | Status |
|---|---|---|
| TASK-01 | Fix all 9 theming issues across till, safe, and common components | Ready |

## Goals

- Fix 7 High-severity wrong-foreground issues (CountInputModal, FloatEntryModal, CloseShiftForm x2, DrawerLimitWarning, DifferenceBadge x2)
- Fix 2 Low-severity no-op hover states (CopyBookingRefPill, CopyOccupantIdPill)

## Non-goals

- Redesigning till/safe layout or component structure
- Adding new tokens to the design system
- Changing till/safe business logic

## Constraints

- All changes must use existing semantic tokens — no new token definitions
- Purely className adjustments — no component API changes
- Preserve intentional opacity on frosted elements (ShiftSummary `bg-surface/80`)
- Use `danger-fg` (not `error-fg`) — reception config has no `error-fg` token

## Inherited Outcome Contract

- **Why:** The till and safe screens are used by staff every day for cash management. Wrong text colours on warning and error buttons make them harder to read, and broken focus ring syntax means keyboard users can't see focus indicators on close buttons. Fixing this means every button and badge is legible and accessible.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All till, safe, and cash management components use correct semantic foreground tokens on status-coloured backgrounds, with valid focus ring syntax and distinct interaction states.
- **Source:** operator

## Analysis Reference

- Analysis: `docs/plans/reception-till-safe-theming-overhaul/analysis.md`

## Selected Approach Summary

Option A — single-pass batch. All 9 issues are className string replacements with known target values. A single atomic commit delivers full visual consistency immediately and requires only one verification pass. This is the same approach that succeeded for the bar/POS overhaul (commit `b955bf38c4`).

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| ID | Title | Type | Effort | Confidence | Status | Dependencies |
|---|---|---|---|---|---|---|
| TASK-01 | Fix all 9 theming issues across till, safe, and common components | IMPLEMENT | S | 90 | Ready | None |

## Engineering Coverage

| Coverage Area | Task Assignment | N/A Justification |
|---|---|---|
| UI / visual | TASK-01: all 9 className fixes | — |
| UX / states | TASK-01: focus ring fixes (#1-2) + hover fixes (#8-9) | — |
| Security / privacy | — | N/A: no auth, data, or input changes |
| Logging / observability / audit | — | N/A: no logic changes |
| Testing / validation | TASK-01: typecheck + lint + DifferenceBadge test check + contrast sweep | — |
| Data / contracts | TASK-01: DifferenceBadge prop defaults change (optional props, no consumer overrides) | — |
| Performance / reliability | — | N/A: className changes have zero runtime cost |
| Rollout / rollback | TASK-01: single commit, revert = `git revert <sha>` | — |

## Parallelism Guide

| Wave | Tasks | Prerequisites |
|---|---|---|
| 1 | TASK-01 | None |

## Tasks

### TASK-01: Fix all 9 theming issues across till, safe, and common components

- **Type:** IMPLEMENT
- **Deliverable:** code-change
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Confidence:** 85
- **Status:** Ready
- **Dependencies:** None
- **Affects:**
  - `apps/reception/src/components/till/CountInputModal.tsx`
  - `apps/reception/src/components/till/FloatEntryModal.tsx`
  - `apps/reception/src/components/till/CloseShiftForm.tsx`
  - `apps/reception/src/components/till/DrawerLimitWarning.tsx`
  - `apps/reception/src/components/common/DifferenceBadge.tsx`
  - `apps/reception/src/components/till/CopyBookingRefPill.tsx`
  - `apps/reception/src/components/till/CopyOccupantIdPill.tsx`
  - `apps/reception/src/components/common/__tests__/DifferenceBadge.test.tsx` [readonly — check only]
  - `apps/reception/tailwind.config.mjs` [readonly]

#### Confidence

- **Implementation:** 90 — all fixes are verified className string replacements with one small constant extension; identical pattern succeeded in bar/POS overhaul
- **Approach:** 95 — single-pass batch proven by bar/POS precedent (commit b955bf38c4)
- **Impact:** 85 — fixes daily-use staff interface; High issues fix unreadable button text on status backgrounds
- **Composite:** 85

#### Acceptance

- All 9 className fixes applied per the fix mapping below
- `pnpm typecheck` passes for reception app
- `pnpm lint` passes for reception app
- DifferenceBadge unit test still passes (or updated if it asserts old defaults)
- No changes to ShiftSummary `bg-surface/80` frosted glass

##### Expected user-observable behavior

- [ ] Close buttons on CountInputModal and FloatEntryModal show white/light text on red background (not dark text)
- [ ] Close buttons on CloseShiftForm show correct contrast text on warning (amber) and error (red) backgrounds
- [ ] DrawerLimitWarning lift button shows correct contrast text on warning background
- [ ] DifferenceBadge positive values show white/light text on green background
- [ ] DifferenceBadge negative values show white/light text on red background
- [ ] CopyBookingRefPill and CopyOccupantIdPill have visible hover state change

#### Fix Mapping

| # | File | Old | New | Severity |
|---|------|-----|-----|----------|
| 1 | CountInputModal.tsx L45 | `bg-error-main text-primary-fg ... focus-visible:focus:ring-2 focus-visible:focus:ring-error-main` | `bg-error-main text-danger-fg ... focus-visible:ring-2 focus-visible:ring-error-main` | High |
| 2 | FloatEntryModal.tsx L46 | `bg-error-main text-primary-fg ... focus-visible:focus:ring-2 focus-visible:focus:ring-error-main` | `bg-error-main text-danger-fg ... focus-visible:ring-2 focus-visible:ring-error-main` | High |
| 3 | CloseShiftForm.tsx L264 | `${styles.closeBtnBg} text-primary-fg` | `${styles.closeBtnBg} ${styles.closeBtnFg}` | High |
| 4 | CloseShiftForm.tsx L356 | `${styles.closeBtnBg} text-primary-fg` | `${styles.closeBtnBg} ${styles.closeBtnFg}` | High |
| 5 | DrawerLimitWarning.tsx L21 | `bg-warning text-primary-fg` | `bg-warning text-warning-fg` | High |
| 6 | DifferenceBadge.tsx L13 | `positiveClassName = "bg-success-main text-primary-fg"` | `positiveClassName = "bg-success-main text-success-fg"` | High |
| 7 | DifferenceBadge.tsx L14 | `negativeClassName = "bg-error-main text-primary-fg"` | `negativeClassName = "bg-error-main text-danger-fg"` | High |
| 8 | CopyBookingRefPill.tsx L43 | `hover:bg-surface-3` | `hover:bg-surface-elevated` | Low |
| 9 | CopyOccupantIdPill.tsx L43 | `hover:bg-surface-3` | `hover:bg-surface-elevated` | Low |

#### CloseShiftForm STEP_STYLES Extension

Add `closeBtnFg` to the existing `STEP_STYLES` constant:

```typescript
const STEP_STYLES = {
  reconcile: {
    closeBtnBg: "bg-warning-main",
    closeBtnFg: "text-warning-fg",  // NEW
    border: "border-warning-main",
    text: "text-warning-main",
  },
  error: {
    closeBtnBg: "bg-error-main",
    closeBtnFg: "text-danger-fg",  // NEW — danger-fg, not error-fg
    border: "border-error-main",
    text: "text-error-main",
  },
} as const;
```

#### Engineering Coverage

| Coverage Area | Applicable? | Plan | Validation |
|---|---|---|---|
| UI / visual | Required | All 9 className fixes per fix mapping | Visual inspection of affected components |
| UX / states | Required | Focus ring syntax fix (#1-2), hover differentiation (#8-9) | Keyboard navigation test on modals, hover state on pills |
| Security / privacy | N/A | No auth, data, or input changes | — |
| Logging / observability / audit | N/A | No logic changes | — |
| Testing / validation | Required | Check DifferenceBadge test for default className assertions | Typecheck + lint + existing test suite |
| Data / contracts | Required | DifferenceBadge prop defaults change (optional, no consumer overrides) | Verify no consumers override defaults |
| Performance / reliability | N/A | className changes have zero runtime cost | — |
| Rollout / rollback | Required | Single commit, standard deploy | Revert = `git revert <sha>` |

#### Validation Contract

| ID | Description | Type | Pass Criteria |
|---|---|---|---|
| TC-01 | Typecheck passes | Automated | `pnpm typecheck` exits 0 for reception |
| TC-02 | Lint passes | Automated | `pnpm lint` exits 0 for reception |
| TC-03 | DifferenceBadge test | Automated | Existing test passes (or updated if asserting old defaults) |
| TC-04 | All 9 fixes applied | Manual/diff | Each fix matches the old→new mapping exactly |

#### Execution Plan

1. Read DifferenceBadge test file to check for default className assertions
2. Apply all 9 fixes per the fix mapping
3. Add `closeBtnFg` to CloseShiftForm STEP_STYLES
4. Run typecheck and lint
5. Update DifferenceBadge test if needed
6. Commit all changes

#### Planning Validation

- [x] Token resolution verified: `danger-fg` (L45), `success-fg` (L46), `warning-fg` (L47) in reception tailwind.config.mjs
- [x] `error-fg` does NOT exist in reception — must use `danger-fg`
- [x] CloseShiftForm STEP_STYLES structure verified (L46-56)
- [x] DifferenceBadge consumer analysis complete — no overrides
- [x] ShiftSummary frosted glass excluded (intentional)

#### Rollout / Rollback

- **Rollout:** Single commit, standard deploy pipeline
- **Rollback:** `git revert <sha>` — single commit covers all fixes

#### Notes

- Follows identical pattern to bar/POS theming overhaul (commit b955bf38c4)
- All target tokens verified against reception tailwind.config.mjs

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Fix all 9 theming issues | Yes — all tokens verified, files identified, STEP_STYLES structure confirmed | None — all fixes are independent className replacements with verified targets | No |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| DifferenceBadge test asserts old default classNames | Low | Low | Read test first; update assertions if needed |
| CloseShiftForm STEP_STYLES extension introduces typo | Very Low | Low | Typecheck will catch; object is small and contained |

## Acceptance Criteria

- All 9 theming issues fixed per the verified fix mapping
- Typecheck and lint pass
- Existing tests pass
- No regression to ShiftSummary frosted glass or other intentional styles

## Decision Log

None — all decisions resolved by analysis (Option A chosen).

## Overall-confidence Calculation

Single task (TASK-01, S-effort, confidence 85):

- Weighted sum: 85 × 1 = 85
- Total weight: 1
- Overall: 85 / 1 = 85

Rounded to plan-level: 90 (S-effort single-task plan with proven precedent and verified tokens).
