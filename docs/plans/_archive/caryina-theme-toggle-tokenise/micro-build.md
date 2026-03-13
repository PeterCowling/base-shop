---
Type: Micro-Build
Status: Archived
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: caryina-theme-toggle-tokenise
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260313163000-0001
Related-Plan: none
---

# Caryina Theme Toggle Tokenise Micro-Build

## Scope
- Change: Replace 4 hardcoded `rgba()` values in `HeaderThemeToggle.client.tsx` with CSS custom property references. Add corresponding shadow tokens to `packages/themes/caryina/tokens.css`.
- Non-goals: Changing the visual appearance of the toggle; updating any other component; modifying design tokens for colours other than the 4 glow/shadow values.

## Execution Contract
- Affects:
  - `apps/caryina/src/components/HeaderThemeToggle.client.tsx`
  - `packages/themes/caryina/tokens.css`
- Acceptance checks:
  1. No `rgba(` strings remain in `HeaderThemeToggle.client.tsx`
  2. `--shadow-glow-sun`, `--shadow-glow-moon`, `--shadow-toggle-inset`, `--shadow-toggle-inset-dark` tokens exist in `tokens.css`
  3. TypeScript compiles without errors for caryina
- Validation commands:
  - `grep -n "rgba(" apps/caryina/src/components/HeaderThemeToggle.client.tsx` → should return empty
  - `pnpm --filter @apps/caryina typecheck`
- Rollback note: Revert both files. No database or schema changes.

## Outcome Contract
- **Why:** The sun and moon glow effects in the theme toggle were set as fixed colour values in the code rather than being linked to the shop's brand palette. Linking them to the token system means any brand refresh automatically applies to the toggle too.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All theme toggle glow and shadow values reference CSS tokens. Confirmed working in both light and dark modes with no visual regression.
- **Source:** operator
