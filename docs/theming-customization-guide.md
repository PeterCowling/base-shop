Type: Guide
Status: Active
Domain: Theming
Last-reviewed: 2026-02-07

# Theme Customization Guide

A comprehensive guide to customizing colors, typography, spacing, and creating custom themes in Base-Shop's design system.

## Table of Contents

1. [Token Architecture Overview](#token-architecture-overview)
2. [Brand Color Customization](#brand-color-customization)
3. [Typography Customization](#typography-customization)
4. [Spacing Customization](#spacing-customization)
5. [Dark Mode](#dark-mode)
6. [Creating a Custom Theme](#creating-a-custom-theme)
7. [Common Recipes](#common-recipes)

---

## Token Architecture Overview

Base-Shop's theming system is built on a layered token architecture that flows from core definitions through semantic tokens to CSS custom properties, and finally to Tailwind utilities and React components.

### Architecture Flow

```
Core Tokens (@acme/design-tokens)
  ↓
Semantic Tokens (@acme/themes/base)
  ↓
Tailwind Config (@acme/tailwind-config)
  ↓
CSS Custom Properties (--token-name)
  ↓
Components (@acme/design-system)
```

### Token Types

**Core Tokens** (`packages/design-tokens/src/core/`)
- Raw values defined in TypeScript
- Universal across all themes
- Examples: spacing scale, typography scale, z-index layers
- Location: `spacing.ts`, `typography.ts`, `z-index.ts`

**Semantic Tokens** (`packages/themes/base/src/tokens.ts`)
- Contextual tokens with `light` and optional `dark` variants
- Map to CSS custom properties with `--` prefix
- Examples: `--color-primary`, `--color-bg`, `--font-sans`
- Support both light and dark modes

**Extended Tokens** (`packages/themes/base/src/tokens.extensions.ts`)
- Flat additive tokens that extend the base system
- Include typography, spacing, radii, breakpoints, z-index
- Merged into base tokens as `{ light: value }` entries

### How Tokens Map to CSS

All tokens are exposed as CSS custom properties:

```css
/* Semantic color token */
--color-primary: 220 90% 56%;  /* light mode */
.theme-dark {
  --color-primary: 220 90% 66%;  /* dark mode */
}

/* Usage in Tailwind */
.bg-primary {
  background-color: hsl(var(--color-primary));
}
```

HSL values are stored without the `hsl()` wrapper to enable alpha channel manipulation:

```css
/* Alpha transparency works */
.bg-primary-soft {
  background-color: hsl(var(--color-primary) / 0.12);
}
```

---

## Brand Color Customization

### Primary Brand Colors

Override the primary brand color by setting CSS custom properties:

```css
/* In your app's global CSS */
:root {
  /* Light mode primary */
  --color-primary: 260 83% 70%;
  --color-primary-fg: 0 0% 10%;
  --color-primary-soft: 260 83% 97%;
  --color-primary-hover: 260 83% 75%;
  --color-primary-active: 260 83% 80%;
}

.theme-dark {
  /* Dark mode primary */
  --color-primary: 260 83% 70%;
  --color-primary-fg: 0 0% 10%;
  --color-primary-soft: 260 83% 20%;
  --color-primary-hover: 260 83% 75%;
  --color-primary-active: 260 83% 80%;
}
```

### Available Brand Token Families

Each brand token family includes base, foreground, soft, hover, and active variants:

**Primary**
- `--color-primary` — Main brand color
- `--color-primary-fg` — Text color on primary background
- `--color-primary-soft` — Tinted background (12% opacity in light mode)
- `--color-primary-hover` — Hover state
- `--color-primary-active` — Active/pressed state

**Accent**
- `--color-accent` — Secondary brand color
- `--color-accent-fg` — Text on accent background
- `--color-accent-soft` — Tinted background

**Semantic Colors**
- `--color-danger` / `--color-danger-fg` / `--color-danger-soft`
- `--color-success` / `--color-success-fg` / `--color-success-soft`
- `--color-warning` / `--color-warning-fg` / `--color-warning-soft`
- `--color-info` / `--color-info-fg` / `--color-info-soft`

### Neutral Colors

The neutral color system uses a 12-step semantic scale:

```css
:root {
  /* Core neutrals */
  --color-bg: 0 0% 100%;        /* Page background */
  --color-fg: 0 0% 10%;         /* Primary text */
  --color-fg-muted: 0 0% 40%;   /* Secondary text */

  /* Semantic surface layers */
  --color-bg-1: 0 0% 100%;      /* Base layer */
  --color-bg-2: 0 0% 98%;       /* Elevated layer */
  --color-bg-3: 0 0% 96%;       /* More elevated */
  --color-bg-4: 0 0% 94%;
  --color-bg-5: 0 0% 92%;

  /* Component surfaces */
  --color-panel: 0 0% 96%;      /* Card, panel backgrounds */
  --color-inset: 0 0% 98%;      /* Inset/recessed areas */
  --surface-input: 0 0% 96%;    /* Form input backgrounds */

  /* Borders */
  --color-border: 0 0% 80%;
  --color-border-strong: 0 0% 65%;
  --color-border-muted: 0 0% 88%;
}
```

### Gradient Tokens

Hero gradients are customizable via three tokens:

```css
:root {
  --gradient-hero-from: 234 89% 60%;
  --gradient-hero-via: 270 83% 60%;
  --gradient-hero-to: 222 47% 11%;

  /* Optional: overlay for text contrast */
  --hero-contrast-overlay: 0 0% 0% / 0.55;
}
```

Use in Tailwind:

```jsx
<div className="bg-hero">
  {/* Gradient background */}
</div>

<div className="bg-hero-contrast text-hero-foreground">
  {/* Gradient with contrast overlay for readable text */}
</div>
```

---

## Typography Customization

### Font Family Override

The design system supports a three-font model:

```css
:root {
  /* System fonts (defaults) */
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);

  /* Semantic font families */
  --font-body: var(--font-sans);          /* Body copy */
  --font-heading-1: var(--font-sans);     /* Primary headings */
  --font-heading-2: var(--font-sans);     /* Secondary headings */
}
```

**Custom font example:**

```css
/* Load custom font */
@font-face {
  font-family: 'Proxima Nova';
  src: url('/fonts/ProximaNova.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}

/* Override tokens */
:root {
  --font-heading-1: 'Proxima Nova', var(--font-sans);
  --font-heading-2: 'Proxima Nova', var(--font-sans);
}
```

### Font Size Scale

Typography uses a modular scale with `--text-*` prefix (DECISION-07):

```css
:root {
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  --text-4xl: 2.25rem;    /* 36px */
  --text-5xl: 3rem;       /* 48px */
}
```

**Tailwind usage:**

```jsx
<h1 className="text-4xl font-bold">Heading</h1>
<p className="text-base">Body text</p>
```

### Font Weights

```css
:root {
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

Tailwind classes: `font-light`, `font-normal`, `font-medium`, `font-semibold`, `font-bold`

### Line Heights

```css
:root {
  --leading-none: 1;
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;
}
```

Tailwind classes: `leading-tight`, `leading-normal`, `leading-relaxed`, etc.

---

## Spacing Customization

Base-Shop uses an 8px grid system with 4px increments for smaller values:

```css
:root {
  /* Core spacing scale */
  --space-0: 0px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
}
```

### Tailwind Spacing Classes

All spacing tokens map to Tailwind utilities:

```jsx
<div className="p-4">     {/* padding: 16px */}
<div className="mt-6">    {/* margin-top: 24px */}
<div className="gap-2">   {/* gap: 8px */}
```

### Border Radius Scale

```css
:root {
  --radius-none: 0px;
  --radius-xs: 2px;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 20px;
  --radius-3xl: 28px;
  --radius-4xl: 32px;
  --radius-full: 9999px;
}
```

Tailwind classes: `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-full`, etc.

### Shadow/Elevation Scale

```css
:root {
  /* Simple shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

  /* Elevation scale (light/dark tuned) */
  --elevation-0: none;
  --elevation-1: 0 1px 2px rgba(0, 0, 0, 0.06);
  --elevation-2: 0 2px 6px rgba(0, 0, 0, 0.10);
  --elevation-3: 0 4px 12px rgba(0, 0, 0, 0.14);
  --elevation-4: 0 8px 24px rgba(0, 0, 0, 0.18);
  --elevation-5: 0 12px 36px rgba(0, 0, 0, 0.22);
}

.theme-dark {
  --elevation-1: 0 1px 2px rgba(0, 0, 0, 0.14);
  --elevation-2: 0 2px 6px rgba(0, 0, 0, 0.18);
  /* ... darker shadows for dark mode */
}
```

Tailwind classes: `shadow-sm`, `shadow-elevation-2`, `shadow-elevation-4`, etc.

---

## Dark Mode

### The `.theme-dark` Class (DECISION-01)

Base-Shop uses the `.theme-dark` class to toggle dark mode. This class is applied to `document.documentElement` (`<html>`).

```html
<!-- Light mode -->
<html class="theme-base">

<!-- Dark mode -->
<html class="theme-dark dark">
```

The `dark` class is also added for Tailwind's `dark:` variant support.

### Theme Initialization

The theme system initializes before React hydration to prevent flash of unstyled content (FOUC):

```tsx
// In app layout
import { initTheme } from '@acme/platform-core/utils';

export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: initTheme }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Toggling Dark Mode

Use the `ThemeModeProvider` and `useThemeMode` hook:

```tsx
'use client';

import { useThemeMode } from '@acme/platform-core/contexts';

export function ThemeToggle() {
  const { mode, setMode, isDark } = useThemeMode();

  return (
    <button onClick={() => setMode(isDark ? 'light' : 'dark')}>
      {isDark ? 'Light' : 'Dark'} Mode
    </button>
  );
}
```

**Available modes:**
- `'light'` — Always light
- `'dark'` — Always dark
- `'system'` — Follow OS preference

### Dark Mode Color Customization

Override dark mode colors in `.theme-dark` selector:

```css
:root {
  --color-primary: 220 90% 56%;
}

.theme-dark {
  --color-primary: 220 90% 66%;  /* Lighter in dark mode */
  --color-bg: 0 0% 4%;           /* Dark background */
  --color-fg: 0 0% 93%;          /* Light text */
}
```

### Tailwind Dark Variant

Use Tailwind's `dark:` variant for component-specific overrides:

```jsx
<div className="bg-white dark:bg-gray-900">
  <p className="text-gray-900 dark:text-gray-100">
    Text that adapts to theme
  </p>
</div>
```

---

## Creating a Custom Theme

Follow these steps to create a brand-specific theme (e.g., `theme-brandx`):

### Step 1: Copy Base Theme Structure

```bash
cd packages/themes
cp -r base brandx
cd brandx
```

### Step 2: Update Package Metadata

Edit `packages/themes/brandx/package.json`:

```json
{
  "name": "@acme/themes-brandx",
  "version": "0.1.0",
  "main": "src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./tokens.css": "./dist/tokens.css"
  }
}
```

### Step 3: Customize Tokens

Edit `packages/themes/brandx/src/tokens.ts`:

```typescript
import { tokens as baseTokens } from '@acme/themes-base';

export const tokens = {
  ...baseTokens,

  // Override brand colors
  "--color-primary": { light: "15 86% 55%", dark: "15 86% 65%" },
  "--color-accent": { light: "190 85% 50%", dark: "190 85% 60%" },

  // Override typography
  "--font-heading-1": { light: "'Bebas Neue', var(--font-sans)" },
  "--font-heading-2": { light: "'Bebas Neue', var(--font-sans)" },

  // Override neutrals if needed
  "--color-bg": { light: "30 20% 98%", dark: "0 0% 4%" },
} as const;
```

### Step 4: Build Theme Stylesheet

Run the token build script:

```bash
pnpm build:tokens
```

This generates `packages/themes/brandx/dist/tokens.css`.

### Step 5: Apply Theme in App

```tsx
// In app layout or root component
import '@acme/themes-brandx/tokens.css';

export default function BrandXLayout({ children }) {
  return (
    <html className="theme-brandx">
      <body>{children}</body>
    </html>
  );
}
```

### Step 6: Add Theme Switching (Optional)

```tsx
'use client';

import { useEffect } from 'react';

export function useThemeName(name: 'base' | 'brandx') {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-base', 'theme-brandx');
    root.classList.add(`theme-${name}`);
    root.setAttribute('data-theme', name);
    localStorage.setItem('theme-name', name);
  }, [name]);
}
```

---

## Common Recipes

### Recipe 1: Change Brand Colors

**Goal:** Update primary brand color to match company branding

```css
/* app/globals.css */
:root {
  /* Teal brand color: hsl(180, 85%, 45%) */
  --color-primary: 180 85% 45%;
  --color-primary-fg: 0 0% 100%;
  --color-primary-soft: 180 85% 95%;
  --color-primary-hover: 180 85% 40%;
  --color-primary-active: 180 85% 35%;
}

.theme-dark {
  --color-primary: 180 85% 55%;
  --color-primary-fg: 0 0% 10%;
  --color-primary-soft: 180 85% 18%;
}
```

**Verify:** All `bg-primary`, `text-primary`, `border-primary` classes now use your color.

---

### Recipe 2: Add a Custom Font

**Goal:** Use "Inter" for body text and "Playfair Display" for headings

```css
/* app/globals.css */

/* Load fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');

:root {
  /* Override font families */
  --font-body: 'Inter', system-ui, sans-serif;
  --font-heading-1: 'Playfair Display', Georgia, serif;
  --font-heading-2: 'Playfair Display', Georgia, serif;

  /* Update Tailwind font families */
  --font-sans: 'Inter', system-ui, sans-serif;
}
```

**Tailwind usage:**

```jsx
<p className="font-sans">Uses Inter</p>
<h1 className="font-heading-1">Uses Playfair Display</h1>
```

---

### Recipe 3: Adjust Spacing Scale

**Goal:** Use a 6px base unit instead of 8px

```css
:root {
  --space-1: 6px;
  --space-2: 12px;
  --space-3: 18px;
  --space-4: 24px;
  --space-5: 30px;
  --space-6: 36px;
  --space-8: 48px;
  --space-10: 60px;
  --space-12: 72px;
  --space-16: 96px;
}
```

**Warning:** Changing the spacing scale affects all components. Test thoroughly.

---

### Recipe 4: Create a Dark Mode Variant

**Goal:** High-contrast dark mode for accessibility

```css
/* Create a custom high-contrast theme class */
.theme-dark-hc {
  --color-bg: 0 0% 0%;          /* Pure black */
  --color-fg: 0 0% 100%;        /* Pure white */
  --color-bg-2: 0 0% 8%;        /* Slightly lighter */
  --color-bg-3: 0 0% 12%;

  --color-border: 0 0% 40%;     /* Higher contrast borders */
  --color-border-strong: 0 0% 60%;

  /* Brighter accent colors for contrast */
  --color-primary: 220 100% 70%;
  --color-success: 142 80% 50%;
  --color-danger: 0 90% 60%;
}
```

**Usage:**

```tsx
<html className="theme-dark-hc dark">
  {/* High contrast dark mode */}
</html>
```

---

### Recipe 5: Custom Z-Index for Modal Stacking

**Goal:** Add a new layer for mega-menus between dropdowns and modals

```css
:root {
  /* Default z-index scale (100 increments - DECISION-08) */
  --z-base: 0;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-fixed: 300;

  /* Custom: mega-menu layer */
  --z-mega-menu: 350;

  --z-modal-backdrop: 400;
  --z-modal: 500;
  --z-popover: 600;
  --z-tooltip: 700;
  --z-toast: 800;
  --z-max: 9999;
}
```

**Tailwind usage:**

```jsx
<nav className="z-mega-menu">
  {/* Custom z-index layer */}
</nav>
```

---

### Recipe 6: Translucent Surfaces for Glassmorphism

**Goal:** Create frosted glass effect for panels

```css
:root {
  /* Add custom translucent surface token */
  --surface-glass: 0 0% 100% / 0.7;
}

.theme-dark {
  --surface-glass: 0 0% 10% / 0.7;
}
```

**Component usage:**

```jsx
<div
  className="bg-[hsl(var(--surface-glass))] backdrop-blur-md"
  style={{ borderColor: 'hsl(var(--color-border))' }}
>
  Frosted glass panel
</div>
```

---

## Advanced Topics

### Animation Tokens

The design system includes easing and duration tokens:

```css
:root {
  /* Easing curves */
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.42, 0, 1.0, 1.0);
  --ease-out: cubic-bezier(0, 0, 0.58, 1.0);
  --ease-in-out: cubic-bezier(0.42, 0, 0.58, 1.0);

  /* Semantic easings */
  --ease-enter: var(--ease-out);
  --ease-exit: var(--ease-in);
  --ease-emphasis: cubic-bezier(0.34, 1.56, 0.64, 1);  /* Back easing */

  /* Durations */
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
}
```

**Usage:**

```jsx
<div className="transition-transform duration-[var(--duration-normal)] ease-[var(--ease-out)]">
  Animated element
</div>
```

### Breakpoint Tokens

Responsive breakpoints are available as tokens:

```css
:root {
  --bp-xs: 0px;
  --bp-sm: 490px;
  --bp-md: 768px;
  --bp-lg: 1040px;
  --bp-xl: 1440px;
}
```

Use with CSS `@media` or Tailwind's responsive variants (`md:`, `lg:`, etc.).

### Safe Area Insets (Mobile)

For full-bleed layouts on mobile devices:

```css
:root {
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
}
```

**Usage:**

```jsx
<header className="pt-[var(--safe-top)]">
  {/* Respects notch/camera cutout */}
</header>
```

---

## Validation and Testing

### Verify Token Overrides

Check that your custom tokens are applied:

```javascript
// In browser DevTools console
getComputedStyle(document.documentElement).getPropertyValue('--color-primary');
// Expected: "260 83% 70%" (your custom value)
```

### Test Dark Mode

Toggle between light and dark modes and verify:
1. Color contrast meets WCAG AA (4.5:1 for text, 3:1 for UI components)
2. All interactive elements remain visible
3. No jarring color shifts during transition

### TypeScript Type Safety

Tokens defined in `tokens.ts` are type-safe:

```typescript
import { tokens } from '@acme/themes-base';

// TypeScript autocomplete works
const primaryColor = tokens['--color-primary'].light;
```

---

## Troubleshooting

### Issue: Custom colors not applying

**Cause:** CSS specificity or token not defined

**Solution:**
1. Verify token is defined in `:root` or `.theme-dark`
2. Check browser DevTools computed styles
3. Ensure CSS file is imported in correct order

### Issue: Dark mode flashes on page load

**Cause:** Theme not initialized before React hydration

**Solution:**
Add `initTheme` script to `<head>`:

```tsx
<script dangerouslySetInnerHTML={{ __html: initTheme }} />
```

### Issue: Tailwind classes not using custom tokens

**Cause:** Token not mapped in Tailwind config

**Solution:**
Verify `@acme/tailwind-config` preset is imported in app's `tailwind.config.ts`:

```typescript
import basePreset from '@acme/tailwind-config';

export default {
  presets: [basePreset],
  // ...
};
```

---

## Related Documentation

- [Architecture](./architecture.md) — Package layering and import rules
- [Design System README](../packages/design-system/README.md) — Component catalog and usage
- [Design System Plan](./plans/design-system-plan.md) — Roadmap and decisions
- [Theming Audit (2026-01)](./theming-audit-2026-01.md) — Historical context

---

## Summary

The Base-Shop theming system provides:

- **Flexible token architecture** — Override at any level (core, semantic, component)
- **Light/dark mode support** — Built-in with `.theme-dark` class
- **Type-safe tokens** — Full TypeScript autocomplete
- **Tailwind integration** — All tokens available as utility classes
- **Custom theme support** — Create brand-specific themes easily

For questions or theme customization support, consult the design system team or open an issue in the repository.
