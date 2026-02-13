---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-12
Last-updated: 2026-02-12
Feature-Slug: ds-business-os-migration
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-design-system
Related-Plan: docs/plans/ds-business-os-migration-plan.md
Business-OS-Integration: on
Business-Unit: BOS
Card-ID: pending
---

# P2 — Design System: Business-OS Token Migration

## Scope

### Summary

Migrate `apps/business-os/` from raw Tailwind palette colours (`bg-gray-50`, `text-gray-900`, `bg-blue-600`, etc.) to semantic design tokens. ~50 component files use direct palette classes. Business-OS is internal-only but actively developed — every new page adds more violations, making future migration harder. This is the inflection point to stop the bleed.

### Goals

- Replace all raw Tailwind palette colour classes with semantic token utilities in `apps/business-os/`
- Add a scoped ESLint config block escalating `ds/no-raw-tailwind-color` to `error` for Business-OS
- Establish a consistent visual identity using the design system tokens
- Zero regressions in functionality

### Non-goals

- Visual redesign or branding — map existing colours to closest semantic equivalents
- Migrating non-colour DS violations (spacing, typography, etc.)
- Adding dark mode support (internal tool, not required)

### Constraints & Assumptions

- Constraints:
  - Business-OS does not have a dedicated theme — uses base theme tokens
  - No automated visual regression tests exist for Business-OS
  - Must not break existing functionality (card management, ideas, board, etc.)
- Assumptions:
  - ~50 files based on audit (exact count to be confirmed during planning)
  - Mapping is mechanical: `gray-*` → `fg`/`muted`/`secondary`, `blue-*` → `accent`/`primary`, `red-*` → `danger`, `green-*` → `success`

## Evidence Audit (Current State)

### Violation Pattern

The app consistently uses this anti-pattern:
```tsx
<main className="min-h-dvh bg-gray-50 p-4">
  <header className="border border-gray-200 bg-white p-5">
    <h1 className="text-2xl font-bold text-gray-900">Title</h1>
    <p className="text-sm text-gray-600">Description</p>
  </header>
  <Link className="bg-blue-600 text-white hover:bg-blue-700">Action</Link>
  <Link className="border border-gray-300 text-gray-700 hover:bg-gray-50">Secondary</Link>
</main>
```

### Standard Mapping Table

| Raw Tailwind | Semantic Token | Semantic Meaning |
|-------------|---------------|-----------------|
| `bg-white` | `bg-panel` | Surface background |
| `bg-gray-50` | `bg-bg` | Page background |
| `bg-gray-100` | `bg-surface-1` | Subtle surface |
| `bg-blue-600` | `bg-accent` | Primary action |
| `bg-blue-700` | `bg-accent/90` | Primary hover |
| `bg-green-*` | `bg-success` | Success state |
| `bg-red-*` | `bg-danger` | Error/danger state |
| `bg-yellow-*` | `bg-warning` | Warning state |
| `text-gray-900` | `text-fg` | Primary text |
| `text-gray-700` | `text-secondary` | Secondary text |
| `text-gray-600` | `text-muted` | Muted text |
| `text-gray-500` | `text-muted` | Muted text |
| `text-white` | `text-on-primary` | Text on coloured bg |
| `text-blue-*` | `text-accent` | Link/accent text |
| `text-red-*` | `text-danger` | Error text |
| `text-green-*` | `text-success` | Success text |
| `border-gray-200` | `border-1` | Default border |
| `border-gray-300` | `border-2` | Stronger border |
| `border-blue-*` | `border-accent` | Accent border |
| `border-red-*` | `border-danger` | Error border |

### Top Offending Files (from audit)

1. `src/app/guides/validation/ValidationDashboard.tsx` — 42 text-* violations
2. `src/components/ideas/IdeasList.tsx` — 20 text-* violations
3. `src/app/ideas/[id]/page.tsx` — 16 text-* violations
4. `src/app/ideas/page.tsx` — 7 bg-* violations
5. `src/app/page.tsx` — multiple violations

### Current ESLint Config

Business-OS has no scoped DS rules — only gets global `warn` level. The `global.css` file has 1 hardcoded hex colour.

### Test Landscape

- **Frameworks:** Jest for unit tests
- **Coverage:** NavigationHeader has a test (`NavigationHeader.test.tsx`). Most pages have no unit tests.
- **Visual regression:** None
- **Validation strategy:** `pnpm lint` + manual spot-check of key pages (board, ideas, card detail)

### Dependency & Impact Map

- Upstream: `packages/themes/base/` (tokens)
- Downstream: none (Business-OS is a leaf app)
- Blast radius: isolated — internal tool only

## Questions

### Resolved

- Q: Does Business-OS import a theme package?
  - A: No — uses base tokens directly. No `@themes/bos` package exists.
  - Evidence: `apps/business-os/package.json`

- Q: Will the `global.css` hex colours be caught by `ds/no-raw-color`?
  - A: `ds/no-raw-color` is at `warn` globally for Business-OS; should be escalated with the tailwind-color rule.

### Open (User Input Needed)

None.

## Confidence Inputs (for /lp-plan)

- **Implementation:** 90% — mechanical mapping, but 50 files means risk of missed edge cases
- **Approach:** 90% — semantic tokens are correct; mapping table covers all observed patterns
- **Impact:** 95% — leaf app, no downstream consumers
- **Delivery-Readiness:** 90% — clear scope, no blockers
- **Testability:** 60% — no visual regression tests; manual validation required for key pages

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Semantic token doesn't map well to a specific UI pattern (e.g., status badges) | Medium | Low | Use mapping table; escalate ambiguous cases |
| ValidationDashboard has complex conditional colouring | Medium | Low | Audit each status colour mapping carefully |
| Missed violations in dynamically constructed class strings | Low | Medium | Grep for template literals and `cn()` calls with palette colours |

## Suggested Task Seeds

1. Batch-migrate pages: `page.tsx`, `ideas/page.tsx`, `ideas/[id]/page.tsx`
2. Batch-migrate components: `IdeasList.tsx`, `ValidationDashboard.tsx`
3. Migrate remaining component files (~45 more)
4. Fix `global.css` hex colour
5. Add scoped ESLint error config for Business-OS
6. Run `pnpm lint --filter business-os` to confirm zero violations

## Execution Routing Packet

- Primary execution skill: `/lp-build`
- Supporting skills: `/lp-design-system`
- Deliverable acceptance: `pnpm lint` passes with `error` severity, zero raw Tailwind palette colours in production code

## Planning Readiness

- Status: **Ready-for-planning**
- Recommended next step: `/lp-plan`
