---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-12
Last-updated: 2026-02-12
Feature-Slug: ds-skylar-migration
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-design-system
Related-Plan: docs/plans/ds-skylar-migration-plan.md
Business-OS-Integration: on
Business-Unit: PLAT
Card-ID: pending
---

# P4 — Design System: Skylar CSS Variable Migration

## Scope

### Summary

Migrate `apps/skylar/` from its custom CSS variable system (`--skylar-gold`, `--skylar-cream`, etc.) and raw `rgba()` values to the centralised token system. 22 CSS files with custom variables plus 27 baselined `ds/no-raw-tailwind-color` violations in TSX components. This is more complex than other migrations because Skylar uses extensive CSS gradients and shadows with `rgba()` — these need design decisions, not just mechanical find-and-replace.

### Goals

- Replace Skylar's custom CSS variables (`--skylar-*`) with base/brand theme tokens
- Replace raw `rgba()` values in gradients and shadows with token-based alternatives
- Fix 27 baselined `ds/no-raw-tailwind-color` violations in TSX components
- Add scoped ESLint `error` config for Skylar
- Remove Skylar entries from baseline file

### Non-goals

- Redesigning Skylar's visual identity
- Creating a Skylar-specific theme package (use base tokens or create if justified)
- Restructuring CSS architecture (module CSS → Tailwind)

### Constraints & Assumptions

- Constraints:
  - Skylar is a marketing/branding site — visual fidelity is important
  - Gradients and shadows may not have exact token equivalents
  - Some `rgba()` values may need new token definitions (e.g., `--color-overlay` variants)
- Assumptions:
  - Skylar's custom palette maps reasonably to base tokens (to be verified)
  - Some exemptions may be needed for complex gradient definitions

## Evidence Audit (Current State)

### Custom CSS Variable System

`apps/skylar/src/app/styles/shell.css` defines a parallel variable system:
```css
:root {
  --skylar-gold: #d5b169;
  --skylar-cream: #f8f4ed;
  --skylar-charcoal: #080808;
  --skylar-en-accent: #E43D12;
  --skylar-en-gold: #EFB11D;
  --it-gold: #D8B072;
}
```

These do not flow through the design system pipeline and have no light/dark mode support.

### `rgba()` Usage Pattern

```css
/* Gradients with hardcoded alpha channels */
background: linear-gradient(140deg, #fffaf4, #ffffff);
box-shadow: 0 45px 65px -55px rgba(25, 9, 0, 0.25);
border: 1px solid rgba(228, 61, 18, 0.25);
background: linear-gradient(145deg, rgba(255,255,255,0.96), var(--it-ground));
```

### Baselined TSX Violations (27)

Concentrated in:
- `src/app/[lang]/page.tsx` — `bg-zinc-900/60`, `text-zinc-100`, `text-zinc-200`
- `src/app/[lang]/products/components/StandardProductsPage.tsx` — same zinc pattern
- `src/app/[lang]/real-estate/components/DefaultRealEstatePage.tsx` — same pattern
- `src/components/HeroSection.tsx` — `bg-zinc-900/70`, `text-zinc-100`, `bg-slate-900`, `text-white`, `text-zinc-200/70`
- `src/components/PeopleCard.tsx` — `bg-zinc-900/80`, `text-zinc-100`
- `src/components/ServicesSection.tsx` — `bg-zinc-900/50`, `text-zinc-100`, `text-zinc-200`

Pattern: dark overlays on hero images using `zinc-900` at various opacities.

### Mapping Decisions Needed

| Skylar Pattern | Candidate Token | Decision Needed? |
|---------------|----------------|-----------------|
| `--skylar-gold` (#d5b169) | `--color-accent`? | Yes — is this the brand accent? |
| `--skylar-cream` (#f8f4ed) | `--color-bg`? | Yes — warm background |
| `--skylar-charcoal` (#080808) | `--color-fg`? | Likely yes |
| `bg-zinc-900/60` | `bg-overlay` | Check if overlay token exists at right opacity |
| `text-zinc-100` | `text-fg-inverse` | Likely yes |
| `rgba(*, *, *, 0.25)` shadows | `--shadow-*` tokens | May need new shadow tokens |

### Test Landscape

- No unit tests for Skylar components
- No visual regression tests
- Validation: manual visual check of all page types (home, products, real-estate, people)

### Dependency & Impact Map

- Blast radius: isolated — Skylar is a standalone marketing site
- Risk: visual fidelity is more important here than in admin tools

## Questions

### Resolved

- Q: Does Skylar have a dedicated theme package?
  - A: No — no `packages/themes/skylar/` exists.
  - Evidence: `packages/themes/` directory listing

### Open (User Input Needed)

- Q: Should Skylar get its own theme package (`packages/themes/skylar/`) for the gold/cream brand colours, or should these map to existing base/accent tokens?
  - Why it matters: determines whether we add tokens to base theme (polluting it) or create a dedicated theme
  - Decision owner: Pete
  - Default assumption: map to base tokens where possible, create Skylar theme only if >5 unique tokens needed

## Confidence Inputs (for /lp-plan)

- **Implementation:** 70% — CSS gradient migration requires design judgement, not just find-and-replace
- **Approach:** 75% — unclear whether Skylar needs its own theme package
- **Impact:** 95% — isolated site, no downstream consumers
- **Delivery-Readiness:** 70% — needs design decisions on gradient/shadow token mapping
- **Testability:** 50% — no automated tests; manual visual verification only

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Visual fidelity loss from token approximation | Medium | Medium | Side-by-side comparison before/after for each page type |
| New tokens needed for gradient overlays | Medium | Low | Define in base theme if broadly useful, else Skylar theme |
| Scope creep from "fixing" gradients | Medium | Low | Stick to token migration only; visual redesign is separate |

## Suggested Task Seeds

1. Audit and decide: token mapping for each `--skylar-*` variable
2. Migrate CSS variables to token references in `shell.css`
3. Migrate `rgba()` values in remaining 21 CSS files
4. Fix 27 baselined TSX violations (zinc/slate → semantic tokens)
5. Add scoped ESLint `error` config
6. Manual visual verification of all page types
7. Remove Skylar entries from baseline file

## Execution Routing Packet

- Primary execution skill: `/lp-build`
- Supporting skills: `/lp-design-system`
- Deliverable acceptance: `pnpm lint` passes at `error` severity, custom CSS variables eliminated, baseline entries removed, visual sign-off

## Planning Readiness

- Status: **Ready-for-planning**
- Blocking items: Design decision on Skylar theme package (can default to base tokens)
- Recommended next step: `/lp-plan` (answer open question first or accept default)
