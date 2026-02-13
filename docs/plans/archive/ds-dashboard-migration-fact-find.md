---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-12
Last-updated: 2026-02-12
Feature-Slug: ds-dashboard-migration
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-design-system
Related-Plan: docs/plans/ds-dashboard-migration-plan.md
Business-OS-Integration: on
Business-Unit: PLAT
Card-ID: pending
---

# P3 — Design System: Dashboard Token Migration

## Scope

### Summary

Migrate `apps/dashboard/` from raw Tailwind `slate-*` palette colours to semantic design tokens. 7 component files, 2 baselined `ds/no-raw-tailwind-color` violations. This is the smallest migration — a quick win that can be done in a single session.

### Goals

- Replace all raw Tailwind palette colours in `apps/dashboard/` with semantic token utilities
- Remove 2 Dashboard entries from baseline file
- Add scoped ESLint `error` config for Dashboard
- Prevent future regression

### Non-goals

- Visual redesign
- Adding dark mode
- Migrating non-colour violations

### Constraints & Assumptions

- Constraints:
  - Dashboard uses base theme tokens (no dedicated theme package)
  - Internal-only admin tool
- Assumptions:
  - 7 files total based on audit

## Evidence Audit (Current State)

### Violation Inventory

**Baselined violations (2):**
- `src/pages/shops/[id].tsx:156` — `text-green-700`, `text-red-700` (status indicators)

**Unbaselined warnings (from audit, ~7 files):**
- `src/pages/shops.tsx` — `bg-slate-50`, `text-slate-900`, `text-slate-700`, `text-slate-600`, `text-red-700`, `text-blue-700`, `hover:text-blue-900`
- `src/pages/Upgrade.tsx` — 32 text-* violations (heaviest file)
- Other pages: consistent `slate-*` pattern

### Standard Mapping

| Raw Tailwind | Semantic Token |
|-------------|---------------|
| `bg-slate-50` | `bg-bg` |
| `text-slate-900` | `text-fg` |
| `text-slate-700` | `text-secondary` |
| `text-slate-600` | `text-muted` |
| `text-red-700` | `text-danger` |
| `text-green-700` | `text-success` |
| `text-blue-700` | `text-accent` |

### Test Landscape

- No unit tests for Dashboard pages
- Validation: `pnpm lint` + manual spot-check

### Dependency & Impact Map

- Blast radius: isolated — internal admin tool, no downstream consumers

## Questions

### Resolved

- Q: Is Dashboard a leaf app?
  - A: Yes — no other package imports from it.

### Open (User Input Needed)

None.

## Confidence Inputs (for /lp-plan)

- **Implementation:** 95% — 7 files, mechanical mapping
- **Approach:** 95% — same pattern as all other migrations
- **Impact:** 98% — leaf app, internal only
- **Delivery-Readiness:** 95% — smallest scope of all work packages
- **Testability:** 60% — no automated visual tests

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Upgrade.tsx has complex conditional colouring | Low | Low | Audit manually — 32 violations but likely repetitive pattern |

## Suggested Task Seeds

1. Migrate all 7 files (can be a single task given small scope)
2. Remove 2 baseline entries
3. Add scoped ESLint `error` config
4. Verify with `pnpm lint`

## Execution Routing Packet

- Primary execution skill: `/lp-build`
- Supporting skills: `/lp-design-system`
- Deliverable acceptance: `pnpm lint` passes at `error` severity, baseline entries removed

## Planning Readiness

- Status: **Ready-for-planning**
- Recommended next step: `/lp-plan`
