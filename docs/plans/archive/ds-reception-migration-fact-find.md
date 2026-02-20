---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-12
Last-updated: 2026-02-12
Feature-Slug: ds-reception-migration
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: /lp-do-build
Supporting-Skills: /lp-design-system
Related-Plan: docs/plans/ds-reception-migration-plan.md
Business-OS-Integration: on
Business-Unit: BRIK
Card-ID: pending
---

# P5 — Design System: Reception Full Migration

## Scope

### Summary

Migrate `apps/reception/` — the legacy property management system — from raw Tailwind palette colours and hardcoded hex constants to the centralised design token system. This is the largest migration: ~220 component files, all DS lint rules currently **OFF** (`...offAllDsRules`). Reception is internal-only (staff/owner-facing) but actively used daily for property operations.

### Goals

- Phase 1: Turn on DS colour rules at `warn` level to surface the full violation inventory
- Phase 2: Systematically replace raw colours with semantic tokens, file by file
- Phase 3: Escalate DS colour rules to `error` for Reception
- Eliminate the legacy `colors.ts` constants file and `statusColors.ts` hex mappings
- Achieve design system compliance for the colour layer

### Non-goals

- Migrating non-colour DS violations (spacing, typography, layout primitives) — separate phase
- Visual redesign of Reception
- Adding dark mode (though tokens make this possible later)
- Migrating all 36 DS rules at once — colour first, others later

### Constraints & Assumptions

- Constraints:
  - `apps/reception/` currently has `...offAllDsRules` in ESLint config (all 36 rules OFF)
  - Only `DarkModeToggle.tsx` and `dashboard/**` have DS rules at `warn`
  - No automated visual regression tests
  - Must not disrupt daily operations (reception is used for check-ins, bookings, financial reporting)
- Assumptions:
  - ~220 files based on audit grep results
  - Migration can be done incrementally (directory by directory) without a big-bang
  - Booking status colours (`statusColors.ts`) will need a semantic status token mapping

## Evidence Audit (Current State)

### ESLint Config (Current)

```javascript
// eslint.config.mjs:1472-1479
/* ▸ Reception app: internal tooling, not localized yet */
{
  files: ["apps/reception/**"],
  rules: {
    ...offAllDsRules,  // ALL 36 DS rules OFF
  },
},

// Partial opt-in for dashboard components only:
{
  files: [
    "apps/reception/src/components/common/DarkModeToggle.tsx",
    "apps/reception/src/components/dashboard/**/*.{ts,tsx}",
  ],
  rules: {
    "ds/no-raw-color": "warn",
    "ds/no-raw-font": "warn",
    "ds/no-raw-tailwind-color": "warn",
  },
},
```

### Legacy Colour Constants

**`src/constants/colors.ts`:**
```typescript
export const darkPalette = {
  darkBg: "#000000",
  darkSurface: "#333333",
  darkAccentGreen: "#a8dba8",
  darkAccentOrange: "#ffd89e",
}
```

**`src/components/roomgrid/constants/statusColors.ts`:**
```typescript
export const statusColors: Record<MyLocalStatus, string> = {
  disabled: "#ed6c02",
  "1": "#42a5f5",   // check-in
  "8": "#1976d2",   // occupied
  "23": "#ff9800",  // maintenance
  "12": "#4caf50",  // available
  "14": "#DCDCDC",  // blocked
  "16": "#7a807b",  // cleaning
}
```

These hex values are used in inline styles and passed to UI components directly — they bypass both the token system and Tailwind utilities.

### Violation Density by Directory

| Directory | bg-* violations | text-* violations | border-* violations | Total |
|-----------|----------------|-------------------|---------------------|-------|
| `src/components/` | ~80 | ~70 | ~100 | ~250 |
| `src/pages/` | ~15 | ~20 | ~10 | ~45 |
| `src/constants/` | 18 hex colours | — | — | 18 |

### Top Offending Files

1. `src/components/search/FinancialTransactionSearch.tsx` — 29 text-*, 10 bg-*
2. `src/components/Login.tsx` — 29 text-*
3. `src/components/reports/EndOfDayPacket.tsx` — 19 bg-*
4. `src/components/roomgrid/constants/statusColors.ts` — 7 hex colours
5. `src/constants/colors.ts` — 11 hex colours

### Status Colour Mapping (Decision Required)

Booking status colours need semantic mapping. Proposed approach:

| Status | Current Hex | Proposed Token | Rationale |
|--------|------------|---------------|-----------|
| Available (#4caf50) | `bg-success` | Green = available |
| Check-in (#42a5f5) | `bg-info` | Blue = informational action |
| Occupied (#1976d2) | `bg-primary` | Strong blue = primary state |
| Maintenance (#ff9800) | `bg-warning` | Orange = needs attention |
| Disabled (#ed6c02) | `bg-danger` | Red-orange = unavailable |
| Blocked (#DCDCDC) | `bg-surface-2` | Gray = neutral/inactive |
| Cleaning (#7a807b) | `bg-muted` | Muted = in-progress |

Alternatively, these could become hospitality-specific tokens (already exist: `--hospitality-ready`, `--hospitality-warning`, etc.).

### Test Landscape

- **Frameworks:** Jest for unit tests
- **Test count:** Low — most components have no unit tests
- **Visual regression:** None
- **Storybook:** No Reception stories
- **Validation strategy:** `pnpm lint` + manual verification of key flows (room grid, check-in, financial reports)

### Dependency & Impact Map

- Blast radius: isolated — internal staff tool
- Risk: disrupting daily operations if visual changes confuse staff
- Operational impact: reception is used hourly for check-ins and bookings

## Questions

### Resolved

- Q: Does Reception have a theme package?
  - A: No — uses base tokens. No `@themes/reception` exists.

- Q: Are the hospitality tokens usable for status colours?
  - A: Yes — `--hospitality-ready`, `--hospitality-warning`, `--hospitality-danger` exist in base tokens.
  - Evidence: `packages/themes/base/src/tokens.ts`

### Open (User Input Needed)

- Q: Should we use hospitality tokens (`--hospitality-*`) or general semantic tokens (`--color-success`, `--color-warning`) for booking status colours?
  - Why it matters: determines whether reception-specific status semantics are visible in the token name
  - Decision owner: Pete
  - Default assumption: use hospitality tokens where they match, fall back to general semantic tokens

## Confidence Inputs (for /lp-do-plan)

- **Implementation:** 70% — large scope (220 files), hex constants need refactoring not just class replacement
- **Approach:** 85% — token migration is correct; phased rollout (warn → error) is proven
- **Impact:** 90% — isolated app, but staff rely on colour cues for booking status
- **Delivery-Readiness:** 75% — large scope means multi-session effort
- **Testability:** 40% — no automated visual tests, no Storybook, minimal unit tests

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Staff confusion from visual changes to booking status colours | Medium | Medium | Map to closest visual equivalents; brief staff if notable changes |
| Hex constants used in inline styles don't trigger ESLint | High | Medium | Grep for `style=` with colour values; convert to Tailwind classes |
| Scope underestimated (hidden violations in template literals) | Medium | Medium | Phase 1 (warn) will surface true count before committing to timeline |
| Migration takes multiple sessions, risk of half-migrated state | Medium | Low | Migrate directory-by-directory; each commit is self-contained |

## Suggested Task Seeds

### Phase 1: Visibility
1. Turn on `ds/no-raw-color` and `ds/no-raw-tailwind-color` at `warn` for all of `apps/reception/`
2. Run lint and record full violation inventory
3. Decide status colour mapping

### Phase 2: Migration (directory by directory)
4. Migrate `src/constants/colors.ts` → export token references or delete
5. Migrate `src/components/roomgrid/` (including `statusColors.ts`)
6. Migrate `src/components/search/` (heaviest: FinancialTransactionSearch)
7. Migrate `src/components/reports/` (EndOfDayPacket)
8. Migrate `src/components/Login.tsx`
9. Migrate remaining `src/components/` files
10. Migrate `src/pages/`

### Phase 3: Lock-down
11. Escalate DS colour rules to `error` for `apps/reception/`
12. Remove `...offAllDsRules` override (for colour rules only)
13. Verify with `pnpm lint`

## Execution Routing Packet

- Primary execution skill: `/lp-do-build`
- Supporting skills: `/lp-design-system`
- Deliverable acceptance: DS colour rules at `error` for Reception, zero violations, `statusColors.ts` eliminated

## Planning Readiness

- Status: **Ready-for-planning**
- Blocking items: status colour mapping decision (can proceed with default)
- Recommended next step: `/lp-do-plan`
