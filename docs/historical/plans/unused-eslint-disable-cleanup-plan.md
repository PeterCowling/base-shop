---
Type: Plan
Status: Completed
Domain: Platform
Created: 2026-01-16
Created-by: Codex
Last-updated: 2026-01-16
Last-updated-by: Codex
Completed: 2026-01-16
Completed-by: Codex
---

# Unused eslint-disable Cleanup Plan

## Problem
`@acme/ui` lint reports many `Unused eslint-disable directive` warnings across CMS and UI files. These warnings add noise and hide real issues.

## Scope
- Target only `Unused eslint-disable directive` warnings in `packages/ui/src/**` (and related story files).
- Avoid semantic changes; remove or adjust stale directives only.

## Proposed Approach
1. Enumerate all unused eslint-disable warnings from `pnpm --filter @acme/ui lint`.
2. Group by file to avoid partial edits and keep each file focused.
3. For each file:
   - Remove unused `eslint-disable` lines.
   - If a disable is still needed for specific lines, replace with a scoped `eslint-disable-next-line` or `eslint-disable-line` and add a ticketed `i18n-exempt` where required.
4. Re-run `pnpm --filter @acme/ui lint` to verify warning reduction.

## Risks / Mitigations
- **Risk:** Removing a disable could re-expose legitimate lint errors.
  - **Mitigation:** Only remove disables flagged as unused by ESLint; re-run lint to confirm.

## Exit Criteria
- No `Unused eslint-disable directive` warnings for `@acme/ui`.
- Lint output is strictly reduced or unchanged for other rules.

## Next Steps
- Proceed with cleanup if approved.
- If any file requires non-trivial refactoring beyond removing directives, pause and create a follow-up plan.

## Completion Summary
- Removed unused `eslint-disable` directives and related `eslint-enable` leftovers in `packages/ui/src`.
- Replaced necessary suppressions with scoped, documented directives where lint still required them.
- Verified no remaining `Unused eslint-disable directive` warnings in `@acme/ui` lint output.
