---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-12
Last-updated: 2026-02-12
Feature-Slug: ds-shared-packages-cleanup
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-design-system
Related-Plan: docs/plans/ds-shared-packages-cleanup-plan.md
Business-OS-Integration: on
Business-Unit: PLAT
Card-ID: pending
---

# P0 — Design System: Shared Packages Cleanup

## Scope

### Summary

Fix 21 `ds/no-raw-tailwind-color` violations in `packages/ui/` (17) and `packages/template-app/` (4). These shared packages are consumed by every customer-facing app, so raw Tailwind palette colours here leak downstream. This is the highest-priority design-centralisation work because the blast radius is repo-wide.

### Goals

- Replace all raw Tailwind palette colours in `packages/ui/` with semantic token utilities
- Replace all raw Tailwind palette colours in `packages/template-app/` with semantic token utilities
- Remove all 21 entries from the baseline file `tools/eslint-baselines/ds-no-raw-tailwind-color.json`
- Zero regressions — visual output must be equivalent

### Non-goals

- Changing component APIs or behaviour
- Migrating other DS rule violations (spacing, typography, etc.) — separate work
- Touching app-level code

### Constraints & Assumptions

- Constraints:
  - All replacements must use existing semantic tokens from `packages/themes/base/src/tokens.ts`
  - If a semantic token doesn't exist for a needed colour, escalate (do not invent tokens)
  - WCAG AA contrast must be maintained
  - Dark mode must continue to work (semantic tokens handle this automatically)
- Assumptions:
  - The 21 violations are exhaustive (baseline file is current)

## Evidence Audit (Current State)

### Violation Inventory (from baseline)

**`packages/ui/src/atoms/RatingsBar.tsx`** (8 violations):
- `text-black/85` (×2) → `text-fg` or `text-fg/85`
- `text-white` (×2) → `text-on-primary` or `text-fg-inverse`
- `ring-white/40` → `ring-fg-inverse/40`
- `border-white/15` → `border-fg-inverse/15`
- `border-white/25` → `border-fg-inverse/25`
- `bg-white/10` → `bg-fg-inverse/10`

**`packages/ui/src/components/organisms/operations/ComboBox/ComboBox.tsx`** (3 violations):
- `border-gray-300` → `border-1`
- `border-red-500` → `border-danger`
- `text-gray-500` → `text-muted`

**`packages/ui/src/components/organisms/operations/SearchBar/SearchBar.tsx`** (1 violation):
- `border-gray-300` → `border-1`

**`packages/ui/src/components/organisms/operations/SplitPane/SplitPane.tsx`** (2 violations):
- `bg-blue-500` (×2) → `bg-accent` or `bg-primary`

**`packages/ui/src/components/organisms/operations/StepWizard/StepWizard.tsx`** (2 violations):
- `bg-green-600` (×2) → `bg-success`

**`packages/ui/src/organisms/modals/primitives.tsx`** (1 violation):
- `bg-black/60` → `bg-overlay`

**`packages/template-app/src/app/[lang]/product/[slug]/PdpClient.client.tsx`** (1 violation):
- `text-gray-700` → `text-secondary`

**`packages/template-app/src/app/account/returns/ReturnForm.tsx`** (1 violation):
- `text-red-600` → `text-danger`

**`packages/template-app/src/app/edit-preview/page.tsx`** (1 violation):
- `text-red-600` → `text-danger`

**`packages/template-app/src/app/returns/mobile/Scanner.tsx`** (1 violation):
- `text-red-600` → `text-danger`

### Token Mapping Confidence

All replacements map to well-established semantic tokens. No new tokens needed.

### Test Landscape

- `packages/ui/` has unit tests via Jest; operations components have lower coverage
- `packages/template-app/` has integration tests for returns flow
- Visual regression: none automated — manual check required
- RatingsBar has a Storybook story for visual verification

### Dependency & Impact Map

- Upstream: `packages/themes/base/` (token definitions)
- Downstream: every app importing `@acme/ui` or cloned from template-app (brikette, prime, xa, xa-b, xa-j, bcd, cover-me-pretty, cochlearfit)
- Blast radius: high (all customer-facing apps), but changes are purely cosmetic replacements

## Questions

### Resolved

- Q: Are there semantic tokens for all needed replacements?
  - A: Yes — `text-fg`, `text-muted`, `text-secondary`, `text-danger`, `text-on-primary`, `bg-overlay`, `bg-success`, `bg-accent`, `border-1`, `border-danger` all exist in base tokens.
  - Evidence: `packages/themes/base/src/tokens.ts`

### Open (User Input Needed)

None.

## Confidence Inputs (for /lp-plan)

- **Implementation:** 95% — straightforward find-and-replace with known token mappings
- **Approach:** 95% — semantic tokens are the correct solution; no alternative needed
- **Impact:** 85% — high blast radius but changes are visual-only; needs manual visual check per app
- **Delivery-Readiness:** 95% — clear scope, no blockers
- **Testability:** 70% — no visual regression tests; relies on manual verification + Storybook

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Subtle visual difference in edge cases (e.g., alpha compositing on dark backgrounds) | Medium | Low | Check RatingsBar in both light/dark mode Storybook |
| Missing token for a specific opacity pattern | Low | Low | Escalate rather than invent — use `text-fg/85` pattern |

## Suggested Task Seeds

1. Replace 8 violations in `RatingsBar.tsx` and verify in Storybook
2. Replace 6 violations in operations components (ComboBox, SearchBar, SplitPane, StepWizard)
3. Replace 1 violation in `modals/primitives.tsx`
4. Replace 4 violations in `template-app` pages
5. Remove resolved entries from baseline file
6. Run `pnpm lint` to confirm zero remaining baseline violations

## Execution Routing Packet

- Primary execution skill: `/lp-build`
- Supporting skills: `/lp-design-system`
- Deliverable acceptance: `pnpm lint` passes, baseline file has 21 fewer entries, no visual regressions in Storybook

## Planning Readiness

- Status: **Ready-for-planning**
- Recommended next step: `/lp-plan`
