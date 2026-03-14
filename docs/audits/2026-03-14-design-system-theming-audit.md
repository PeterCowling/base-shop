# Design System & Theming Audit

**Date:** 2026-03-14
**Scope:** All theme packages, all app-level CSS, component libraries, dark mode infrastructure

---

## Executive Summary

The token-based architecture is structurally sound — semantic names, light/dark pairs, generated CSS, per-app overrides. But it fails to deliver high-quality, distinctive, easily-tunable themes because **there is no shared brand contract**. Each app has invented its own theming dialect on top of the shared tokens, and the shared tokens themselves are just a generic blue default that every app must completely override. The result: six apps, six different ways to wire up colors, and no leverage from the shared infrastructure when building or refining a brand.

---

## Problem 1: Two Parallel Color Systems (No Shared Brand Contract)

**This is the root cause of most friction.**

The base token system defines semantic colors as HSL triplets:
```css
--color-primary: 220 90% 56%;   /* generic blue */
```

But Brikette — the most mature app — ignores this entirely and defines its own parallel system using hex + RGB triplets:
```css
--color-brand-primary: #005887;
--rgb-brand-primary: 0 88 135;
```

These two systems have no relationship:

| Layer | Base tokens | Brikette brand tokens |
|-------|-------------|----------------------|
| Format | HSL triplets (`220 90% 56%`) | Hex (`#005887`) + RGB triplets (`0 88 135`) |
| Naming | `--color-primary` | `--color-brand-primary` |
| Dark mode | `--color-primary-dark` var swap | `.dark { --color-brand-primary: #4da8d4 }` |
| Alpha support | `hsl(var(--x) / 0.5)` | `rgb(var(--rgb-x) / <alpha-value>)` |
| Tailwind mapping | `hsl(var(--color-primary))` | `rgb(var(--rgb-brand-primary) / <alpha-value>)` |

Caryina uses a third approach — it overrides the base HSL tokens directly. BOS uses a fourth — `@theme inline` with its own bridge vars. Prime uses a fifth — scoped `--gate-*` utilities.

**Impact:** When an agent or developer builds a themed component, there is no single question to answer ("which token do I use?"). The answer depends on which app you're in, which creates me-too results because the safe choice is always the generic base tokens.

---

## Problem 2: Base Tokens Are a Reset Layer, Not a Design System

`packages/themes/base/src/tokens.ts` defines ~130 tokens. The color values are a generic blue (`220 90% 56%` primary, `260 83% 70%` accent). These are placeholder values, not intentional design choices.

Every app that wants a distinctive look must override the entire color family — primary, primary-fg, primary-soft, primary-hover, primary-active, accent, accent-fg, accent-soft, plus borders, surfaces, and semantic states. That's 30+ tokens to manually pick HSL values for.

**What's missing:** A palette generation system. Given a seed hue and a few brand parameters, the system should derive:
- Light/dark mode pairs with correct contrast
- Soft, hover, and active variants
- Foreground colors that meet WCAG AA on their background
- Border and surface tints that relate to the primary

Instead, every theme file is hand-tuned HSL triplets with no systematic relationship between them. This is why results feel inflexible — changing the primary color requires cascading manual changes through 15+ related tokens.

---

## Problem 3: Dark Mode is Fragmented (4 Mechanisms, 6 Apps)

| Mechanism | Used by |
|-----------|---------|
| `.dark` class | Brikette |
| `.theme-dark` class | BOS |
| `.dark` + `.theme-dark` + `@media` fallback | Reception |
| `[data-theme="dark"]` attribute | Prime, XA-Uploader |

`ThemeModeContext.tsx` sets all three (`.dark`, `.theme-dark`, `data-theme`), but each app's CSS only listens to one or two of them. This means:

1. Testing dark mode requires knowing which selector the app uses
2. Shared components in `packages/ui` can't reliably target dark mode without knowing the app context
3. The split-state fix (OS prefers dark but user picks light) has been independently implemented 3 different ways

---

## Problem 4: Two Component Libraries, No Clear Boundary

| Package | Exports | Token consumption |
|---------|---------|-------------------|
| `packages/ui` | 19 atoms, 18 molecules, 40+ components, 51 hooks | Tailwind utilities via `brand-*` names |
| `packages/design-system` | 102 atoms, 71 primitives, 10 shadcn re-exports | Tailwind utilities via `primary`, `foreground` names |

Both export `Badge`, `Button`, atoms, and molecules. Components in `ui` reference `brand-secondary`, `brand-text` — names that only exist in Brikette's tailwind config. Components in `design-system` reference `primary`, `foreground` — names from the base token system.

A developer building a new themed feature doesn't know which library to import from, and mixing them risks inconsistent token resolution.

---

## Problem 5: Tailwind Config Re-mapping is Per-App Boilerplate

Each app must manually bridge CSS custom properties to Tailwind color utilities:

**Brikette** (`tailwind.config.mjs`):
```js
brand: {
  primary: "rgb(var(--rgb-brand-primary) / <alpha-value>)",
  // ... 13 more entries
}
```

**Reception** (`tailwind.config.mjs`):
```js
"primary-main": "hsl(var(--color-primary))",
"pinkShades-row1": "hsl(var(--color-pinkShades-row1))",
// ... 85+ entries across 3 color maps
```

**BOS** (`global.css`):
```css
@theme inline {
  --color-brand-bg: hsl(var(--color-bg));
  /* ... */
}
```

These are all doing the same job — making CSS custom properties available as Tailwind utilities — but each uses a different format, different naming, and different mechanism. This boilerplate is error-prone (reception's cascade bug) and creates maintenance drag.

---

## Problem 6: CSS Cascade Fragility (Tailwind v4 Layer Precedence)

Tailwind v4's `@theme` declarations sit inside `@layer theme`, which has LOWER specificity than unlayered CSS. The generated `tokens.css` files are unlayered. This means:

1. Token values from `tokens.css` (unlayered) **always win** over `@theme` wrappers
2. If a token stores a raw HSL triplet (`330 55% 66%`) and `@theme` tries to wrap it with `hsl()`, the raw triplet wins and becomes invalid CSS
3. This has already caused a production bug (reception shade colors) and required a non-obvious workaround (storing full `hsl()` in tokens.css)

The underlying tension: the token system was designed for Tailwind v3 (where `hsl(var(--x))` in the config was the only consumer), but Tailwind v4 introduces CSS-native theming (`@theme`) that conflicts with the same vars.

---

## Problem 7: No Design System Guardrails for Agents

The `tools-design-system` skill provides guidance, but agents frequently produce:
- Generic layouts because the safe path is base tokens (always available, always work)
- Hardcoded values when they can't figure out which token system the app uses
- Duplicate utility definitions (e.g., `@utility` blocks in globals.css that replicate what should be in the shared preset)

There is no validation step that checks "does this component use the right token contract for its app?"

---

## Diagnosis: Why Results Are "Me-Too"

The design system provides:
- Semantic token names (good)
- Light/dark pairs (good)
- A code generation pipeline (good)

But it fails to provide:
1. **A palette generation engine** — so every theme is hand-tuned and feels arbitrary
2. **A single brand-token contract** — so agents default to the lowest-common-denominator base tokens
3. **A unified CSS-to-Tailwind bridge** — so each app reinvents the plumbing, leaving no room for design refinement
4. **A dark mode standard** — so dark themes are either copy-pasted or skipped

The system has the right *architecture* but the wrong *workflow*. The workflow should be: pick brand parameters -> generate full palette -> wire once -> tune individual tokens. Instead it's: manually define 30+ HSL triplets -> manually bridge to Tailwind -> manually define dark variants -> debug cascade issues.

---

## Structural Recommendations

### R1: Unified Brand Token Contract

Define a single `BrandTokens` interface that every app must implement:

```typescript
interface BrandTokens {
  // Seed
  primaryHue: number;
  primarySaturation: number;
  accentHue: number;

  // Generated from seed (overridable)
  primary: HslPair;        // light + dark
  primaryFg: HslPair;
  primarySoft: HslPair;
  primaryHover: HslPair;
  primaryActive: HslPair;
  accent: HslPair;
  // ... etc

  // Brand-specific extensions
  custom: Record<string, HslPair>;
}
```

Each app defines seed values + optional overrides. The build step generates the full token set with correct contrast ratios.

### R2: Palette Generation from Seed Colors

Replace hand-tuned HSL triplets with a deterministic palette generator:
- Input: primary hue, saturation, lightness + accent hue
- Output: all 30+ color variants with WCAG-compliant contrast
- Dark mode: algorithmically derived (invert lightness scale, adjust saturation)
- Override escape hatch: any generated value can be manually overridden

### R3: Single Dark Mode Mechanism

Standardize on one CSS selector for dark mode across all apps. The `ThemeModeContext` already sets `.dark`, `.theme-dark`, and `data-theme` — pick `.dark` (Tailwind convention) and update all app CSS to use it exclusively.

### R4: Collapse the CSS-to-Tailwind Bridge

Move the var-to-utility mapping into the generated CSS itself (using Tailwind v4 `@theme`), eliminating per-app tailwind.config.mjs color boilerplate. The token generator should output both:
1. `:root` variable declarations
2. `@theme` utility registrations

### R5: Clarify Component Library Boundaries

- `packages/design-system`: headless primitives + shadcn. No brand-specific token names.
- `packages/ui`: composed components with brand tokens. Consumes design-system primitives.
- Rule: if a component uses `brand-*` or app-specific colors, it belongs in `ui` or the app. If it uses only base semantic tokens, it belongs in `design-system`.

### R6: Retire the Parallel Hex/RGB System

Brikette's `--color-brand-*` hex + `--rgb-brand-*` triplets should be replaced with the same HSL triplet pattern used by all other apps. HSL supports alpha via `hsl(H S% L% / alpha)` in modern CSS — the RGB triplet workaround is no longer needed.

---

## File Reference

| File | Role | Issue |
|------|------|-------|
| `packages/themes/base/src/tokens.ts` | Master token definitions | Generic blue defaults, no palette logic |
| `packages/themes/base/tokens.css` | Generated CSS variables | Unlayered — wins over @theme |
| `packages/themes/caryina/src/tokens.ts` | Caryina overrides | Clean pattern — good model |
| `packages/themes/reception/src/tokens.ts` | Reception overrides | 35 shade families, manual HSL |
| `apps/brikette/src/styles/global.css` | Brikette theme | Parallel hex/RGB system |
| `apps/brikette/tailwind.config.mjs` | Brikette TW config | RGB alpha pattern |
| `apps/reception/tailwind.config.mjs` | Reception TW config | 85+ manual color entries |
| `apps/business-os/src/styles/global.css` | BOS theme | @theme inline pattern |
| `packages/platform-core/src/contexts/ThemeModeContext.tsx` | Dark mode state | Sets 3 selectors |
| `packages/ui/src/molecules/ThemeToggle.tsx` | Theme toggle | References brand tokens |
| `packages/design-system/src/utils/style/cn.ts` | Tailwind merge | Hardcoded token list |
