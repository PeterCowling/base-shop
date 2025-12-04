Type: Guide
Status: Active
Domain: Theming
Last-reviewed: 2025-12-02

# Typography and Colour System

This document explains how font and colour selection works across the Base‑Shop repo. It covers the token model, Tailwind integration, theming and dark mode, CMS selection flows, and accessibility/performance considerations.

## Overview

- Tokens are defined as CSS custom properties using HSL numeric tuples for colours and raw stacks for fonts.
- Tailwind reads tokens via a shared preset/plugin to expose utilities like `text-primary`, `bg-bg`, and `font-mono`.
- Themes ship token defaults; shops can override tokens at runtime, including fonts, via CMS.
- Dark mode uses both the user’s system preference and an `html.theme-dark` override class.

## Token Sources

- Base token catalogue: `packages/themes/base/src/tokens.ts`
  - Colour, spacing, radius, shadow, and typography keys. Colours are HSL components like `"220 90% 56%"` consumed as `hsl(var(--color-primary))`.
- Generated stylesheets: `packages/themes/base/src/tokens.css`, `packages/themes/base/src/tokens.dynamic.css`, `packages/themes/base/src/tokens.static.css`
  - Produced by the build script `dist-scripts/build-tokens.js`.
- Theme overrides (examples): `packages/themes/dark/src/tokens.css`, `packages/themes/brandx/src/tokens.css`
  - Some themes also expose a `tailwind-tokens.ts` used by the build script to emit CSS.
- Machine-readable export of variable names: `packages/design-tokens/src/exportedTokenMap.ts`

## Tailwind Integration

- Tailwind preset (config values only): `packages/design-tokens/src/index.ts`
- Tailwind plugin (no-op handler, config-only): `packages/design-tokens/index.ts`
- Root config: `tailwind.config.mjs`
  - Loads `@acme/tailwind-config` and `@acme/design-tokens` with a local fallback.
  - Dark mode is `class` and recognizes `.theme-dark`.

### Aliases exposed to Tailwind utilities

- Colours
  - `bg`: `hsl(var(--color-bg))`
  - `fg`: `hsl(var(--color-fg))`
  - `primary`, `accent`, `danger`, `success`, `warning`, `info`, `muted`
  - Foregrounds: `text-primary-foreground`, `text-accent-foreground`, `text-danger-foreground`, etc.
- Fonts
  - `font-sans`: `var(--font-sans)`
  - `font-mono`: `var(--font-mono)`
  - Runtime alias: `--font-sans` is set to `var(--font-body)` when a body font override exists, so Tailwind’s `font-sans` follows the selected body font (see ThemeStyle).
- Spacing, radii, shadows
  - Spacing scale expanded to 8‑pt rhythm: `spacing[0,1,2,3,4,5,6,8,10,12,16] → var(--space-*)`
  - Radius scale expanded to size‑based set: `rounded-none|xs|sm|md|lg|xl|2xl|3xl|4xl|full → var(--radius-*)`
  - Shadows: `shadow-sm|md|lg → var(--shadow-*)`

## Dark Mode Model

- Strategy: hybrid “system preference + class override”.
  - Media query: `@media (prefers-color-scheme: dark)` swaps tokens in base CSS.
  - Class override: `html.theme-dark` forces dark values regardless of system.
- Initialization: `packages/platform-core/src/utils/initTheme.ts` toggles `theme-dark` and sets `color-scheme` on page load using `localStorage('theme')` or system default.
  - `theme = 'light' | 'dark' | 'system'`.

## Fonts: Three‑Font Model

- Tokens:
  - `--font-body`: primary body stack
  - `--font-heading-1`: H1–H3 stack
  - `--font-heading-2`: H4–H6 stack
  - Low-level families: `--font-sans`, `--font-mono` (defaults are Geist, but can be overridden by themes/apps)
- Defaults (base theme): Geist Sans/Mono; headings default to the body or `--font-sans` until customized.
- CMS UI: `packages/ui/src/components/cms/page-builder/FontsPanel.tsx`
  - Lets users choose body and heading families and preview with live rendering.
  - Includes “Suggested Pairings” and lazy-loads Google Fonts for preview.

### Font Loading and Injection

- Server component `packages/ui/src/components/ThemeStyle.tsx` is the canonical injector:
  - Fetches `themeTokens` for a shop or uses provided `tokens` prop.
  - Emits `<style data-shop-theme>` with `:root { … }` CSS variables for all tokens, plus `--font-sans: var(--font-body)` when `--font-body` is present.
  - Emits `<link rel="preconnect">` and `<link rel="stylesheet">` for distinct first families used in `--font-body`, `--font-heading-1`, `--font-heading-2`.
  - Google Fonts URL format: `https://fonts.googleapis.com/css2?family=<Name>&display=swap`.

## Colours: Semantics and Usage

- Neutral core: `--color-bg`, `--color-fg` with 12‑step extensions for surfaces/borders in themed packages.
- Brand families: `--color-primary` (+ `*-fg`, `*-soft`, `*-hover`, `*-active` where present), `--color-accent`, and state colours `danger|success|warning|info` and `muted`.
- Utilities in Tailwind (examples):
  - Backgrounds: `bg-bg`, `bg-primary`, `bg-accent`, `bg-muted`
  - Text: `text-fg`, `text-primary-foreground`, `text-accent-foreground`
  - Borders via component CSS using `hsl(var(--color-border))` or themed `border-border` aliases where defined.
- Gradients and hero:
  - `--gradient-hero-from|via|to` and `--hero-contrast-overlay` feed hero utilities/components. See `docs/elevation-and-hero.md`.

## CMS Selection Flow (Fonts and Colours)

1. The base/theme CSS provides defaults for `:root` with dark counterparts behind media/class.
2. The CMS stores per‑shop overrides as a flat map of token keys to values.
3. On render, `ThemeStyle` injects `:root { … }` with all overrides and loads required web fonts.
4. Tailwind utilities render using `hsl(var(--color-…))` and `var(--font-…)`, so components immediately reflect the selection without rebuilds.

## Accessibility

- Contrast tests target WCAG 2.1 AA (≥ 4.5:1) for text on core surfaces. See unit tests such as `packages/ui/src/components/cms/page-builder/__tests__/FontsPanel.contrast.test.ts`.
- Pointer target guidance is encoded as tokens and utilities:
  - Tokens: `--target-min-aa: 24px` (WCAG 2.2 minimum), `--target-hig: 44px` (Apple HIG), `--target-material: 48px` (Material/Android)
  - Utilities (CMS): `.min-target-aa`, `.min-target-hig`, `.min-target-material` in `apps/cms/src/app/utilities.a11y.css`
- Guidance:
  - For long‑form text on brand backgrounds, prefer a contrast overlay (`bg-hero-contrast` + `text-hero-foreground`).
  - Avoid using `*-soft` backgrounds without verifying text contrast in the CMS preview and automated checks.

## Performance and Robustness

- Preconnect to Google Fonts and only load distinct first families from the body/heading stacks.
- Respect `prefers-reduced-motion`; global transitions for color/border are disabled when set.
- Token injection is additive and idempotent; changes are debounced and patched by key via the CMS to minimize writes.

## Adding or Overriding Tokens

- To add a new token to the base catalogue, update `packages/themes/base/src/tokens.ts` (or append via `packages/themes/base/src/tokens.extensions.ts`) and regenerate artifacts (`pnpm -r build`).
- To ship theme defaults, add/edit `packages/themes/<name>/src/tailwind-tokens.ts` and run the token build script to emit CSS.
- To expose a token to Tailwind, ensure it is included in the design‑tokens preset or plugin.

## Quick Usage Examples

- Body text and headings follow selected tokens:
  - `className="text-fg"` → foreground text colour
  - `className="bg-bg"` → page background colour
  - `className="font-sans"` → follows `--font-body` via alias
- Buttons (brand foreground pairing):
  - `className="bg-primary text-primary-foreground"`

## File Map (Key References)

- Tailwind config and dark mode: `tailwind.config.mjs`
- Design tokens preset: `packages/design-tokens/src/index.ts`
- Design tokens plugin: `packages/design-tokens/index.ts`
- Base tokens (source of truth): `packages/themes/base/src/tokens.ts`
- Generated base CSS: `packages/themes/base/src/tokens.css`
- Theme overrides: `packages/themes/*/src/tokens.css`
- Runtime injector (tokens + fonts): `packages/ui/src/components/ThemeStyle.tsx`
- Theme init (dark/class): `packages/platform-core/src/utils/initTheme.ts`
