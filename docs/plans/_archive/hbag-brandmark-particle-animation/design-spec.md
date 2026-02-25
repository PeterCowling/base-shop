---
Type: Design-Spec
Status: Draft
Feature-Slug: hbag-brandmark-particle-animation
Business-Unit: HBAG
Target-App: caryina
Theme-Package: @themes/caryina
Brand-Language: docs/business-os/strategy/HBAG/2026-02-21-brand-identity-dossier.user.md
Created: 2026-02-23
Updated: 2026-02-23
Owner: Pete
---

# Design Spec: Caryina BrandMark Hourglass Dissolution Animation

## Context

**Business:** Caryina (HBAG)  
**App:** caryina  
**Audience:** Fashion-aware women 27-42 buying premium bag accessories; mobile-first social discovery.  
**Device:** responsive (mobile-first)

**Feature goal:** Replace the current `y` fade/rotate with a Canvas 2D hourglass particle dissolution that reforms into the tagline while preserving the current `Car` + `ina` wordmark merge.

**Fact-find:** `docs/plans/_archive/hbag-brandmark-particle-animation/fact-find.md`

## Gate Pre-flight (GATE-BD-07)

- Brand dossier exists and is `Active`: `docs/business-os/strategy/HBAG/2026-02-21-brand-identity-dossier.user.md`
- Strategy index Brand Dossier row is `Active`: `docs/business-os/strategy/HBAG/index.user.md`

Gate result: PASS.

## Visual Intent

The animation should feel deliberate, refined, and materially grounded: the extra letter dissolves like sand, funnels through a narrow neck at the baseline, then settles into the tagline as readable type. Motion should read as craftsmanship, not spectacle. The brand color language remains recessive pastel (Strawberry Milk + warm Sage) so product photography remains dominant on real pages.

## Current State Audit

- Existing component: `apps/caryina/src/components/BrandMark/BrandMark.tsx`
- Existing style system: `apps/caryina/src/components/BrandMark/BrandMark.module.css`
- Existing container: `apps/caryina/src/components/Header.tsx`
- Existing brand variables: `apps/caryina/src/styles/global.css`

Violations to remove during implementation:
- Local duplicate reduced-motion hook in BrandMark should be replaced by shared hook to align with system pattern.
- Particle/final-state behavior is currently CSS-only and cannot express the hourglass narrative.

Preserve:
- `BrandMarkProps` public API.
- `mount` and `hover` trigger modes.
- `prefers-reduced-motion` behavior (instant final state).

## Component Map

### Reused Components

| Component | Package | Usage |
|-----------|---------|-------|
| `BrandMark` | `apps/caryina` | Existing host component and public API surface |
| `Header` | `apps/caryina` | Existing placement and navigation context |
| `useReducedMotion` | `@acme/design-system/hooks` | Replace local reduced-motion logic with shared hook |

### New Components Needed

| Component | Target Package | Rationale |
|-----------|---------------|-----------|
| `BrandMarkParticleCanvas` | `apps/caryina/src/components/BrandMark/` | Canvas overlay renderer specific to Caryina wordmark choreography |
| `useBrandMarkParticleEngine` | `apps/caryina/src/components/BrandMark/` | Isolate frame loop, phase timing, and physics from React view layer |
| `sampleTextPixels` utility | `apps/caryina/src/components/BrandMark/` | Offscreen glyph sampling for tagline target positions |

### Composition Tree

```text
Header (existing)
└── Link "/" (existing)
    └── BrandMark (existing API surface)
        ├── FallbackTextLayer (existing)
        ├── BaselineMeasureLayer (existing)
        ├── SlideLayer: Car + ina (existing DOM motion)
        ├── ParticleCanvasOverlay (new)
        └── TaglineTextLayer (existing, timing updated)
```

## Token Binding

| Element | Property | Token Class / Variable | Dark Mode | Notes |
|---------|----------|------------------------|-----------|-------|
| BrandMark base text | color | `hsl(var(--color-primary))` via `--brand-mark-color` | explicit dark token | Keep wordmark in Strawberry Milk in both themes |
| Dissolving particle accent | color mix endpoint | `hsl(var(--color-accent))` via `--brand-accent-color` | explicit dark token | Mid/late particle phase tint toward Sage |
| Tagline text | color | `hsl(var(--color-fg-muted))` | explicit dark token | Preserve current low-emphasis editorial tone |
| Header separator | border-bottom | `hsl(var(--color-border-muted))` | explicit dark token | No change to header chrome |
| Focus outline on logo link | ring | `hsl(var(--ring))` + `hsl(var(--ring-offset))` | explicit dark token | Add visible keyboard focus state if missing |
| Page background contrast context | background | `hsl(var(--color-bg))` | explicit dark token | Ensures particle colors stay on-brand against page surface |

### Token Evidence

- `--color-primary`, `--color-accent`, `--color-fg-muted`, `--color-border-muted`: `packages/themes/caryina/src/tokens.ts`
- `--ring`, `--ring-offset`: `packages/themes/base/src/tokens.ts` (inherited by Caryina)
- `--brand-mark-color`, `--brand-accent-color` mapping: `apps/caryina/src/styles/global.css`

**New tokens required:** none.

## Layout

### Mobile (default)

- Keep current header shell: `flex items-center gap-4 px-6 py-4`.
- BrandMark remains `inline-flex` column; canvas overlay absolutely aligned to the composed wordmark box.
- Tagline stays one visual block below wordmark with existing `margin-top: 0.25em`.
- Particle density target: low-to-medium (mobile-safe) with runtime cap by rendered area.

### Tablet (`md:` 768px+)

- Same structure as mobile (no reflow changes).
- Increase particle density cap for cleaner letterform reconstruction.
- Keep timing envelope 3.0-3.6s for mount trigger.

### Desktop (`lg:` 1024px+)

- Same structure as tablet.
- Allow highest density cap and full hourglass neck detail.
- Timing envelope 3.4-4.0s for mount trigger.

**Spacing:** preserve existing spacing rhythm (`gap-4`, `px-6`, `py-4`, tagline offset `0.25em`).

## Interaction States

| Element | Hover | Active | Disabled | Loading | Error |
|---------|-------|--------|----------|---------|-------|
| BrandMark (`trigger="mount"`) | no-op after completion | no-op | when `animate=false`, force final state | before font readiness, show fallback text | if canvas init fails, fall back to existing CSS-only transform |
| BrandMark (`trigger="hover"`) | replay abbreviated particle sequence on pointer enter | sequence completes to final state | with reduced motion, no replay | if engine not ready, keep static final state | on runtime exception, keep static final state |
| Tagline reveal | N/A | settles to full opacity at end phase | always visible in reduced motion | hidden until final settle threshold | immediate visible fallback |
| Header logo link | optional soft tint only; do not shift layout | standard pressed feedback | N/A | N/A | N/A |

## Accessibility

- **Focus order:** Header logo link remains in normal tab order before subsequent nav controls.
- **ARIA:** Keep `role="img"` + `aria-label` on the BrandMark root. Set canvas layer `aria-hidden="true"` and keep DOM text authoritative for assistive tech.
- **Contrast:** Validate `--color-fg-muted` tagline contrast against `--color-bg` at small text size. If below AA for effective size, switch tagline to `--color-fg`.
- **Touch targets:** Ensure logo link hit area is at least `min-h-11 min-w-11` without altering visible composition.
- **Screen reader:** Do not announce animation phases; announce only stable brand label and link destination.
- **Reduced motion:** Respect `prefers-reduced-motion` by skipping particles and rendering immediate final state.

## Animation and Performance

- Renderer: Canvas 2D only, no external dependencies.
- Frame loop: `requestAnimationFrame` with delta-time updates.
- Bundle budget: keep new animation code under 5 KB gzipped.
- Runtime target: 60fps on modern devices with adaptive particle cap by viewport and device pixel ratio.
- Teardown: stop RAF and clear observers on unmount.

## Implementation Defaults (for open fact-find questions)

- Particle color progression: primary at spawn, easing toward accent through funnel/settle phases.
- Small viewport behavior: keep animation enabled but scale particle count down; fallback to instant final state only when reduced motion is requested or initialization fails.
- Hover mode: abbreviated 1.5-2.0s variant that preserves the dissolve-to-settle narrative.

## Prerequisites for Plan

- [x] Brand language doc exists and is `Active`: `docs/business-os/strategy/HBAG/2026-02-21-brand-identity-dossier.user.md`
- [x] Theme package exists: `packages/themes/caryina/`
- [x] Required tokens exist; no new token additions needed
- [x] Reused components/patterns verified in app and design-system sources

## Notes

- This spec is a component-level visual behavior spec. It does not change domain logic, APIs, or data flows.
- Test strategy should include:
  - Unit tests for particle engine lifecycle and reduced-motion branching.
  - Integration tests for fallback/final states.
  - Visual snapshot at deterministic final frame.
