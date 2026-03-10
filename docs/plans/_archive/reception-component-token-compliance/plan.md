---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-08
Last-reviewed: 2026-03-08
Last-updated: 2026-03-08
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-component-token-compliance
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Component Token Compliance Plan

## Summary

Fix 4 files in the reception app where components use non-semantic styles instead of theme tokens. Two issues: (1) CompScreen.tsx uses dynamic class concatenation that breaks Tailwind JIT compilation, resulting in a broken accent background; (2) PinInput.tsx and PinLoginInline.tsx use non-semantic Tailwind default colors for PIN digit focus states; (3) ModalPreorderDetails.tsx uses bare `border` without an explicit border-color token. All fixes are mechanical replacements with existing semantic tokens.

## Active tasks
- [x] TASK-01: Fix CompScreen dynamic class and ModalPreorderDetails border
- [x] TASK-02: Replace PIN input non-semantic focus colors with semantic tokens

## Goals
- All reception components consume semantic tokens for all color-related styling
- No dynamic class concatenation that breaks Tailwind JIT
- No non-semantic Tailwind default palette colors (e.g. `bg-pink-400`)

## Non-goals
- Redesigning component layouts or UX
- Adding new tokens to the theme system
- Refactoring component structure or abstractions

## Constraints & Assumptions
- Constraints:
  - Must use tokens already defined in `packages/themes/reception/src/tokens.ts` and `packages/themes/base/src/tokens.ts`
  - Must not change visual appearance except where current rendering is broken
- Assumptions:
  - All required semantic tokens already exist (confirmed by fact-find audit)

## Inherited Outcome Contract

- **Why:** Each reception screen reinvents its visual language with hardcoded classes rather than consuming the semantic token system. This causes visual inconsistency and makes theme changes ineffective across the app.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All reception screens consume semantic tokens for surfaces, borders, and text hierarchy — no hardcoded color values or ad-hoc style patterns.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/reception-component-token-compliance/fact-find.md`
- Key findings used:
  - Only 4 files across 55+ reception components have token compliance issues
  - CompScreen.tsx line 114: `bg-${accentBase}` breaks Tailwind JIT — class is never generated, background is transparent
  - PinInput.tsx and PinLoginInline.tsx: 5 non-semantic focus colors each (`focus:bg-pink-400`, etc.)
  - ModalPreorderDetails.tsx lines 127, 146: bare `border` without explicit border-color token

## Proposed Approach
- Option A: Fix all 4 files in a single task (grouped by concern)
- Option B: Split into separate tasks per concern area (bar components vs common components)
- Chosen approach: Option B — split into 2 tasks. The bar fixes (CompScreen + ModalPreorderDetails) are independent of the PIN input fixes. This allows parallel execution and isolated validation.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Fix CompScreen dynamic class + ModalPreorderDetails border | 90% | S | Complete (2026-03-08) | - | - |
| TASK-02 | IMPLEMENT | Replace PIN input non-semantic focus colors | 85% | S | Complete (2026-03-08) | - | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | No file overlap — safe to execute in parallel |

## Tasks

### TASK-01: Fix CompScreen dynamic class and ModalPreorderDetails border
- **Type:** IMPLEMENT
- **Deliverable:** code-change in `apps/reception/src/components/bar/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-08)
- **Affects:** `apps/reception/src/components/bar/CompScreen.tsx`, `apps/reception/src/components/bar/ModalPreorderDetails.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — exact lines identified, replacement code is a simple ternary
  - Approach: 90% — standard semantic token substitution, no design decisions needed. Held-back test: no single unresolved unknown would drop this below 80 because both `bg-success-main` and `bg-error-main` are confirmed registered in @theme and the ternary pattern is standard Tailwind usage.
  - Impact: 90% — fixes a currently broken background (CompScreen accent renders as transparent)
- **Acceptance:**
  - CompScreen table header background renders with correct accent color (green for success, red for error)
  - ModalPreorderDetails night section borders use `border-border-1` token
  - No lint errors introduced
  - Expected user-observable behavior:
    - [ ] CompScreen "Arrivals" table header shows green (`bg-success-main`) background
    - [ ] CompScreen "Departures" table header shows red (`bg-error-main`) background
    - [ ] ModalPreorderDetails night sections have visible, consistent borders matching the app's border style
- **Validation contract (TC-XX):**
  - TC-01: CompScreen with `accent="success"` → table header has `bg-success-main` class (not dynamic interpolation)
  - TC-02: CompScreen with `accent="error"` → table header has `bg-error-main` class
  - TC-03: ModalPreorderDetails night sections → have `border border-border-1` classes
  - TC-04: Typecheck passes (`pnpm --filter @apps/reception typecheck`)
  - TC-05: Lint passes (`pnpm --filter @apps/reception lint`)
  - TC-06: Visual verification — CompScreen accent backgrounds render correctly in `next dev` build (primary gate for the JIT fix, since lint does not catch dynamic class interpolation)
- **Execution plan:**
  - Red: Confirm `bg-${accentBase}` produces transparent background (known broken state)
  - Green: Replace line 114 with `accent === "success" ? "bg-success-main" : "bg-error-main"` in the className. Add `border-border-1` to ModalPreorderDetails lines 127 and 146.
  - Refactor: Remove the `accentBase` variable (line 106) and inline the ternary directly.
- **Planning validation (required for M/L):**
  - None: S-effort task
- **Scouts:** None: exact lines and replacement values are known
- **Edge Cases & Hardening:**
  - CompScreen `accent` prop only takes `"success"` or `"error"` — ternary covers both cases exhaustively
- **What would make this >=90%:**
  - Already at 90%. Would reach 95% with a dev build confirming the accent backgrounds render visually.
- **Rollout / rollback:**
  - Rollout: Standard deploy — CSS-only changes
  - Rollback: Revert commit
- **Documentation impact:** None
- **Notes / references:**
  - CompScreen.tsx:106 — `const accentBase = accent === "success" ? "success-main" : "error-main"`
  - CompScreen.tsx:114 — `` className={`sticky top-0 bg-${accentBase} text-primary-fg uppercase`} ``

### TASK-02: Replace PIN input non-semantic focus colors with semantic tokens
- **Type:** IMPLEMENT
- **Deliverable:** code-change in `apps/reception/src/components/common/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-08)
- **Affects:** `apps/reception/src/components/common/PinInput.tsx`, `apps/reception/src/components/common/PinLoginInline.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — replacement tokens identified; PIN digits use distinct colors for visual differentiation so each slot needs a distinct semantic alternative
  - Approach: 90% — use existing semantic token families (accent-soft, primary-soft, info-light, success-light, warning-light) for focus states instead of non-semantic palette colors. Held-back test: no single unresolved unknown would drop this below 80 because all replacement tokens are confirmed in @theme and the array structure is unchanged.
  - Impact: 85% — visual refinement for PIN login focus states; ensures theme changes affect PIN input consistently
- **Acceptance:**
  - PIN digit focus states use semantic tokens only
  - Each PIN digit retains visual distinction (different color per position)
  - No `bg-pink-400`, `bg-purple-400`, `bg-sky-400`, `bg-teal-400`, or `bg-amber-400` classes remain
  - No lint errors introduced
  - Expected user-observable behavior:
    - [ ] PIN input digits show distinct colored backgrounds when focused
    - [ ] Colors are consistent with the reception dark theme palette
    - [ ] PIN login flow works identically (no functional change)
- **Validation contract (TC-XX):**
  - TC-01: `PIN_BG_CLASSES` array in PinInput.tsx contains only semantic token classes (no Tailwind default palette colors)
  - TC-02: `PIN_BG_CLASSES` array in PinLoginInline.tsx matches PinInput.tsx (same replacement)
  - TC-03: All 6 PIN slots still have distinct focus colors (array has 6 entries with different classes)
  - TC-04: Typecheck passes (`pnpm --filter @apps/reception typecheck`)
  - TC-05: Lint passes (`pnpm --filter @apps/reception lint`)
- **Execution plan:**
  - Red: Confirm current `PIN_BG_CLASSES` contains non-semantic colors
  - Green: Replace the focus classes with semantic alternatives that provide visible contrast against the base state. The base state already uses `-light`/`-soft` variants, so focus must use the `-main` or full-strength variants:
    - `bg-accent-soft focus:bg-pink-400` → `bg-accent-soft focus:bg-accent` (accent at full strength)
    - `bg-accent-soft focus:bg-purple-400` → `bg-accent-soft focus:bg-primary-main` (primary green)
    - `bg-info-light focus:bg-sky-400` → `bg-info-light focus:bg-info-main` (info at full strength)
    - `bg-success-light focus:bg-teal-400` → `bg-success-light focus:bg-success-main` (success at full strength)
    - `bg-warning-light focus:bg-amber-400` → `bg-warning-light focus:bg-warning-main` (warning at full strength)
  - Refactor: Verify the visual distinction is maintained — each focus state is now the full-strength version of the corresponding base color, providing clear contrast.
- **Planning validation (required for M/L):**
  - None: S-effort task
- **Scouts:** None: replacement values are determined by matching the semantic intent of each original color
- **Edge Cases & Hardening:**
  - Position 3 (`bg-primary-light focus:bg-primary-soft`) is already compliant — leave unchanged
  - The duplicated array in both files must stay in sync — update both identically
- **What would make this >=90%:**
  - Visual confirmation that PIN digit focus states are distinct and readable in dark mode
- **Rollout / rollback:**
  - Rollout: Standard deploy — CSS-only changes
  - Rollback: Revert commit
- **Documentation impact:** None
- **Notes / references:**
  - Both files have identical `PIN_BG_CLASSES` arrays — update both to match

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| PIN focus colors too similar after token swap | Low | Low | 5 distinct semantic families used; visual verification in dev build |
| CompScreen accent color unexpected appearance | Low | Low | Currently broken (transparent) — any valid color is an improvement |

## Observability
None: cosmetic CSS-only changes, no runtime observability needed.

## Acceptance Criteria (overall)
- [ ] No non-semantic Tailwind default palette colors remain in reception components
- [ ] No dynamic class concatenation that breaks Tailwind JIT
- [ ] All border declarations use explicit border-color tokens
- [ ] Typecheck passes

## Decision Log
- 2026-03-08: PIN focus colors — decided to use existing semantic token families (accent-soft, primary-soft, info-light, success-light, warning-light) rather than creating new dedicated PIN tokens. Rationale: these tokens already exist and provide sufficient visual distinction; adding new tokens for 6 PIN digits would be over-engineering.
- 2026-03-08: [Adjacent: delivery-rehearsal] Extracting `PIN_BG_CLASSES` into a shared constant to de-duplicate between PinInput.tsx and PinLoginInline.tsx — adjacent scope, not same-outcome. Route to post-build reflection.

## Overall-confidence Calculation
- TASK-01: 90% × S(1) = 90
- TASK-02: 85% × S(1) = 85
- Overall = (90 + 85) / (1 + 1) = 87.5% → 88%

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Fix CompScreen dynamic class + ModalPreorderDetails border | Yes | None — target files and lines confirmed, replacement tokens confirmed in @theme | No |
| TASK-02: Replace PIN input non-semantic focus colors | Yes | None — both files confirmed identical arrays, replacement tokens confirmed in @theme | No |
