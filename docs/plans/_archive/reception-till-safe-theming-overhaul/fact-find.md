---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: UI
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: reception-till-safe-theming-overhaul
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tools-design-system, lp-design-qa
Related-Analysis: docs/plans/reception-till-safe-theming-overhaul/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260312100000-0002
---

# Reception Till, Safe & Cash Management Theming Overhaul — Fact-Find Brief

## Scope

### Summary

Fix theming issues across till, safe, and cash management components in the reception app. The primary issues are wrong foreground colours on status-coloured backgrounds (error/warning buttons using `text-primary-fg` instead of `text-danger-fg`/`text-warning-fg`), double focus prefixes on close buttons, and minor token cleanup. A shared utility component (`DifferenceBadge`) also has incorrect foreground defaults affecting reports.

### Goals

- Fix wrong foreground tokens on status-coloured backgrounds in till and safe components
- Fix double focus prefix syntax on modal close buttons
- Fix duplicate hover state on copy pill buttons
- Fix DifferenceBadge shared component default foreground tokens

### Non-goals

- Redesigning till/safe layout or component structure
- Adding new tokens to the design system
- Changing till/safe business logic

### Constraints & Assumptions

- Constraints:
  - All changes use existing semantic tokens only
  - Purely className adjustments — no component API changes
  - Preserve intentional opacity on backdrop-blur/frosted elements (ShiftSummary `bg-surface/80`)
- Assumptions:
  - Single commit is acceptable for className-only changes

## Outcome Contract

- **Why:** The till and safe screens are used by staff every day for cash management. Wrong text colours on warning and error buttons make them harder to read, and broken focus ring syntax means keyboard users can't see focus indicators on close buttons. Fixing this means every button and badge is legible and accessible.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All till, safe, and cash management components use correct semantic foreground tokens on status-coloured backgrounds, with valid focus ring syntax and distinct interaction states.
- **Source:** operator

## Access Declarations

None — all evidence is in the local repository.

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/components/till/Till.tsx` — thin wrapper routing to till sub-components
- `apps/reception/src/components/safe/SafeManagement.tsx` — safe management screen entry
- `apps/reception/src/components/reports/EndOfDayPacket.tsx` — end-of-day report (consumes DifferenceBadge)

### Key Modules / Files

1. `apps/reception/src/components/till/CountInputModal.tsx` — modal for count input (close button issues)
2. `apps/reception/src/components/till/FloatEntryModal.tsx` — modal for float entry (close button issues)
3. `apps/reception/src/components/till/CloseShiftForm.tsx` — shift close form with dynamic warning/error close buttons
4. `apps/reception/src/components/till/DrawerLimitWarning.tsx` — warning banner with lift button
5. `apps/reception/src/components/till/ShiftSummary.tsx` — shift summary card (frosted glass intentional)
6. `apps/reception/src/components/till/CopyBookingRefPill.tsx` — copy pill button
7. `apps/reception/src/components/till/CopyOccupantIdPill.tsx` — copy pill button
8. `apps/reception/src/components/common/DifferenceBadge.tsx` — shared badge component (HIGH: wrong defaults)
9. `apps/reception/tailwind.config.mjs` — token resolution (L13-49: receptionSemanticColors)

### Patterns & Conventions Observed

- Token resolution chain: `base tokens.ts → base tokens.css → reception tokens.ts → reception tailwind.config.mjs`
- Status foreground tokens: `danger-fg` (L45), `success-fg` (L46), `warning-fg` (L47) — all valid
- `error-main` maps to `--color-danger` (L42) — so error backgrounds use `danger-fg` for text
- `bg-surface/80` + `backdrop-blur-sm` pattern is intentional frosted glass (ShiftSummary L12-13 documents this)

### Data & Contracts

- DifferenceBadge component props include `positiveClassName` and `negativeClassName` as optional string props with defaults
- Changing the defaults from `text-primary-fg` to `text-success-fg`/`text-danger-fg` fixes all consumers that rely on defaults
- No consumers override these defaults (verified via grep)

### Dependency & Impact Map

- Upstream: Token definitions in `packages/themes/reception/src/tokens.ts` and `packages/themes/base/tokens.css` (readonly)
- Downstream: DifferenceBadge is consumed by EndOfDayPacket.tsx, SafeReconciliation.tsx, TillReconciliation.tsx, ReconciliationWorkbench.tsx
- Blast radius: Minimal — className changes only, no API changes, DifferenceBadge default change propagates correctly to all consumers

### Test Landscape

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| DifferenceBadge | Unit | `apps/reception/src/components/common/__tests__/DifferenceBadge.test.tsx` | Tests rendering logic |
| Till schema | Unit | `apps/reception/src/schemas/__tests__/tillRecordSchema.test.ts` | Schema validation |
| Safe schema | Unit | `apps/reception/src/schemas/__tests__/safeCountSchema.test.ts` | Schema validation |
| Till route | Parity | `apps/reception/src/parity/__tests__/till-route.parity.test.tsx` | Route parity |
| Safe route | Parity | `apps/reception/src/parity/__tests__/safe-route.parity.test.tsx` | Route parity |

#### Coverage Gaps

- No visual regression tests for till/safe components
- DifferenceBadge test may assert on the old default classNames — needs verification during build

#### Testability Assessment

- Easy to test: className changes verifiable via typecheck + lint
- Verification: Visual contrast sweep post-build

### Recent Git History (Targeted)

- `apps/reception/src/components/till/` — ShiftSummary and CloseShiftForm recently updated with frosted glass and step progress UX
- `apps/reception/src/components/common/DifferenceBadge.tsx` — stable, no recent changes

## Verified Issue Inventory

| # | File | Line | Old | New | Severity | Category |
|---|------|------|-----|-----|----------|----------|
| 1 | CountInputModal.tsx | 45 | `bg-error-main text-primary-fg ... focus-visible:focus:ring-2 focus-visible:focus:ring-error-main` | `bg-error-main text-danger-fg ... focus-visible:ring-2 focus-visible:ring-error-main` | High | Wrong fg + double focus |
| 2 | FloatEntryModal.tsx | 46 | `bg-error-main text-primary-fg ... focus-visible:focus:ring-2 focus-visible:focus:ring-error-main` | `bg-error-main text-danger-fg ... focus-visible:ring-2 focus-visible:ring-error-main` | High | Wrong fg + double focus |
| 3 | CloseShiftForm.tsx | 264 | `${styles.closeBtnBg} text-primary-fg` | `${styles.closeBtnBg} ${styles.closeBtnFg}` (add closeBtnFg to STEP_STYLES) | High | Wrong fg on dynamic bg |
| 4 | CloseShiftForm.tsx | 356 | `${styles.closeBtnBg} text-primary-fg` | `${styles.closeBtnBg} ${styles.closeBtnFg}` | High | Wrong fg on dynamic bg |
| 5 | DrawerLimitWarning.tsx | 21 | `bg-warning text-primary-fg` | `bg-warning text-warning-fg` | High | Wrong fg on warning bg |
| 6 | DifferenceBadge.tsx | 13 | `positiveClassName = "bg-success-main text-primary-fg"` | `positiveClassName = "bg-success-main text-success-fg"` | High | Wrong default fg |
| 7 | DifferenceBadge.tsx | 14 | `negativeClassName = "bg-error-main text-primary-fg"` | `negativeClassName = "bg-error-main text-danger-fg"` | High | Wrong default fg |
| 8 | CopyBookingRefPill.tsx | 43 | `bg-surface-3 ... hover:bg-surface-3` | `bg-surface-3 ... hover:bg-surface-elevated` | Low | No-op hover |
| 9 | CopyOccupantIdPill.tsx | 43 | `bg-surface-3 ... hover:bg-surface-3` | `bg-surface-3 ... hover:bg-surface-elevated` | Low | No-op hover |

### Intentionally preserved (NOT issues)

- ShiftSummary.tsx L56: `bg-surface/80 backdrop-blur-sm` — intentional frosted glass effect (documented in component comments L11-13)
- ShiftSummary.tsx L65: `bg-success-light/20` — intentional subtle green tint on status badge
- VarianceSummary.tsx L89: `bg-warning-light/10` — intentional subtle warning background

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | All 9 issues are className fixes | Primary focus | All fixes use verified tokens |
| UX / states | Required | Hover states on copy pills are no-ops | Fix #8-9 differentiate hover | Distinct interaction feedback |
| Security / privacy | N/A | No auth, data, or input changes | - | - |
| Logging / observability / audit | N/A | No logic changes | - | - |
| Testing / validation | Required | DifferenceBadge has unit test; visual verification needed | DifferenceBadge test may assert old defaults | Verify test after fix; contrast sweep |
| Data / contracts | N/A | No schema or API changes | DifferenceBadge prop defaults change but are optional | Consumer compatibility verified |
| Performance / reliability | N/A | className changes have zero runtime cost | - | - |
| Rollout / rollback | Required | Single commit, standard deploy | Revert = single git revert | - |

## Questions

### Resolved

- Q: Does `error-fg` exist in reception theme?
  - A: No. The reception tailwind config (L42-45) maps `error-main` to `--color-danger` and has `danger-fg` at L45 for the foreground. Use `text-danger-fg` for error/danger backgrounds.
  - Evidence: `apps/reception/tailwind.config.mjs:42-45`

- Q: Is CloseShiftForm `text-primary-fg` on dynamic backgrounds fixable without API changes?
  - A: Yes. Add `closeBtnFg` to the existing `STEP_STYLES` constant (L46-56) with `text-warning-fg` for reconcile and `text-danger-fg` for error. Then use `${styles.closeBtnFg}` in the className.
  - Evidence: `CloseShiftForm.tsx:46-56`

- Q: Is `bg-surface/80` in ShiftSummary intentional?
  - A: Yes. Component comments (L11-13) explicitly document the frosted glass effect. Preserve as-is.
  - Evidence: `ShiftSummary.tsx:11-13`

- Q: Does any consumer of DifferenceBadge override the default classNames?
  - A: No consumers override. All rely on defaults. Changing defaults propagates correctly.
  - Evidence: grep across `apps/reception/` for `DifferenceBadge` usage shows no `positiveClassName` or `negativeClassName` prop overrides.

### Open (Operator Input Required)

None.

## Scope Signal

- Signal: right-sized
- Rationale: 9 verified issues across 7 files, all className replacements with verified target tokens. Scope matches the bar/POS overhaul pattern exactly. No architecture changes, no new tokens, no business logic.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Token resolution chain | Yes | None | No |
| Till modal close buttons (CountInput, FloatEntry) | Yes | None | No |
| CloseShiftForm dynamic styling | Yes | None — STEP_STYLES extension is contained | No |
| DrawerLimitWarning | Yes | None | No |
| DifferenceBadge defaults | Yes | None — no consumers override defaults | No |
| Copy pill hover states | Yes | None | No |
| ShiftSummary frosted glass | Yes | None — confirmed intentional, excluded from scope | No |

## Confidence Inputs

- Implementation: 95% — all fixes are className string replacements with verified target tokens; one fix requires adding a property to an existing constant object
- Approach: 95% — follows identical pattern to the completed bar/POS overhaul (single-pass batch)
- Impact: 85% — fixes daily-use staff interface; High issues fix unreadable button text on status backgrounds
- Delivery-Readiness: 95% — all tokens verified, no blockers
- Testability: 85% — typecheck + lint + DifferenceBadge unit test + visual verification

All scores are >=80. >=90 would require automated visual regression tests for till/safe screens.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| DifferenceBadge test asserts old default classNames | Low | Low | Check test during build; update if needed |
| CloseShiftForm STEP_STYLES extension introduces typo | Very Low | Low | Typecheck will catch; object is small and contained |

## Planning Constraints & Notes

- Must-follow patterns:
  - Use `danger-fg` (not `error-fg`) for error/danger foregrounds — reception config has no `error-fg` token
  - Preserve `bg-surface/80` on ShiftSummary frosted glass element
- Rollout/rollback expectations:
  - Single commit, standard deploy; revert = `git revert <sha>`

## Suggested Task Seeds (Non-binding)

- Single IMPLEMENT task: fix all 9 issues across 7 files in one pass (same approach as bar/POS overhaul)

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: tools-design-system, lp-design-qa
- Deliverable acceptance: all 9 className fixes applied, typecheck + lint pass, visual contrast sweep
- Post-delivery measurement plan: none (className changes only)

## Evidence Gap Review

### Gaps Addressed

- Token resolution verified for all replacement tokens (danger-fg, success-fg, warning-fg, surface-elevated)
- DifferenceBadge consumer analysis complete — no overrides of defaults
- ShiftSummary frosted glass explicitly excluded with evidence

### Confidence Adjustments

- None — all scores stable after evidence review

### Remaining Assumptions

- Single commit is acceptable for className-only changes (consistent with bar/POS precedent)

## Analysis Readiness

- Status: Ready-for-analysis
- Blocking items: None
- Recommended next step: `/lp-do-analysis reception-till-safe-theming-overhaul`
