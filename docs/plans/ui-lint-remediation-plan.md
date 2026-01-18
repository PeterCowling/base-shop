---
Type: Plan
Status: Active
Domain: Platform
Last-reviewed: 2026-01-16
Relates-to charter: none
Created: 2026-01-16
Created-by: Codex
Last-updated: 2026-01-16
Last-updated-by: Codex
---

# UI Lint Remediation Plan

## Problem Statement
`pnpm run lint` fails due to 600+ ESLint errors in `@acme/ui` (token usage, forbidden inline styles, hook rules, and missing tsconfig inclusion for `tsup.config.ts`). This blocks CI-quality lint passes and obscures real regressions. The issues are widespread and cannot be safely fixed ad hoc without a coordinated approach.

## Goals
- Restore `@acme/ui` lint to a clean (zero-error) state.
- Replace forbidden inline styles and raw Tailwind palette classes with DS token utilities.
- Resolve hook rule violations and unused vars.
- Bring configuration files under lint coverage without suppressing errors.
- Keep changes scoped and reviewable, avoiding regressions in UI behavior.

## Non-Goals
- Broad UI redesigns or behavior changes unrelated to lint fixes.
- Disabling lint rules or adding global exceptions.

## Proposed Approach
1. **Inventory & Categorize Errors**
   - Group by rule family: `no-restricted-syntax` (palette colors), `react/forbid-dom-props` (inline style), `react-hooks/rules-of-hooks`, `ds/no-hardcoded-copy`, and config parsing errors.
   - Identify high-churn files (`packages/ui/src/components/.../VirtualList.tsx` and others with many violations).

2. **Configuration Fixes First**
   - Add `packages/ui/tsup.config.ts` to the relevant `tsconfig` (or enable `allowDefaultProject`) so lint can parse it cleanly.
   - Confirm no new lint errors are introduced by config inclusion.

3. **Tokenization Pass**
   - Replace Tailwind palette colors with DS token utilities (e.g., `text-foreground`, `bg-surface-2`, `border-border-1`).
   - Prefer existing UI tokens/classes; avoid arbitrary colors.

4. **Inline Style Refactor**
   - Replace `style` props on DOM nodes with class utilities or CSS variables.
   - Where inline style is required for dynamic values, move to CSS vars on a wrapper and bind them via class.

5. **Hook & Logic Corrections**
   - Fix hooks usage in non-component functions (e.g., `VirtualList` render helper) by lifting hooks to component scope.
   - Remove unused variables or prefix with `_` where intentional.

6. **Copy/I18n Cleanup**
   - Convert user-facing strings into i18n keys where appropriate.
   - Remove unused `eslint-disable` directives.

7. **Incremental Lint Runs**
   - Re-run `pnpm --filter @acme/ui lint` after each batch to ensure progress and minimize regressions.

## Milestones
- M1: Config parsing error resolved (`tsup.config.ts` in tsconfig)
- M2: VirtualList lint clean
- M3: Token utility migration in UI components
- M4: Inline style refactor complete
- M5: Final `@acme/ui` lint pass is clean

## Risks
- Token changes could subtly alter UI colors; verify against snapshots or manual review.
- Refactoring inline styles may impact layout; need targeted visual checks.

## Validation
- Run `pnpm --filter @acme/ui lint` after each milestone.
- Re-run `pnpm run lint` at the end to confirm repo-wide status.

## Open Questions
- Are there preferred DS token mappings for the flagged palette colors in `@acme/ui`?
- Should we prioritize specific components or flows for first fixes?

## Active tasks

- **UI-LINT-01** - Resolve config parsing error (tsup.config.ts in tsconfig)
