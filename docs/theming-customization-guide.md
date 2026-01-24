Type: Guide
Status: Active
Domain: Theming
Last-reviewed: 2026-01-23

# Theme Customization Guide

This guide covers how to customize the design-system's appearance by overriding design tokens. All components consume CSS custom properties (tokens) from `packages/themes/`, making it straightforward to adjust colors, typography, spacing, and more without modifying component source code.

## How Tokens Work

The design-system uses a layered token architecture:

1. **Base tokens** (`@themes/base/tokens.css`) define defaults for all apps
2. **Theme packages** (e.g., `packages/themes/brandx/`) override specific tokens
3. **Runtime overrides** (via the CMS Theme Editor) layer on top at runtime

Components reference tokens through CSS custom properties:

```css
/* Component uses semantic token */
.button-primary {
  background-color: hsl(var(--color-primary));
  color: hsl(var(--color-primary-fg));
}
```

Changing `--color-primary` propagates to every component that uses it.

---

## Approach 1: CSS Override File

The simplest approach — create a CSS file that overrides specific tokens and import it after the base theme.

### Brand Primary Color

```css
/* app/theme-overrides.css */
:root {
  --color-primary: 340 80% 50%;       /* Hot pink */
  --color-primary-fg: 0 0% 100%;      /* White text on primary */
  --color-primary-dark: 340 80% 60%;   /* Lighter in dark mode */
  --color-primary-fg-dark: 0 0% 10%;   /* Dark text on primary in dark mode */
}
```

Import order matters — overrides must come after the base:

```tsx
// app/layout.tsx
import "@themes/base/tokens.css";
import "./theme-overrides.css";  // Your overrides
import "./globals.css";
```

### Accent Color

```css
:root {
  --color-accent: 160 84% 39%;       /* Teal accent */
  --color-accent-fg: 0 0% 100%;
  --color-accent-dark: 160 84% 50%;
  --color-accent-fg-dark: 0 0% 10%;
}
```

### Full Brand Palette

Override all semantic colors for a cohesive brand identity:

```css
:root {
  /* Brand colors */
  --color-primary: 262 83% 58%;       /* Purple */
  --color-primary-fg: 0 0% 100%;
  --color-accent: 38 92% 50%;         /* Gold */
  --color-accent-fg: 0 0% 10%;

  /* Surfaces */
  --surface-1: 262 20% 99%;           /* Slight purple tint */
  --surface-2: 262 15% 96%;
  --surface-3: 262 12% 92%;

  /* Borders */
  --border-1: var(--color-primary) / 0.08;
  --border-2: var(--color-primary) / 0.16;

  /* Focus ring matches primary */
  --color-focus-ring: 262 83% 58%;
  --ring: 262 83% 58%;
}
```

---

## Approach 2: Theme Package (Preset)

For reusable themes, create a new package under `packages/themes/`:

```
packages/themes/my-brand/
├── tokens.css
├── package.json
└── tsconfig.json
```

### package.json

```json
{
  "name": "@acme/theme-my-brand",
  "version": "0.1.0",
  "private": true,
  "exports": {
    "./tokens.css": "./tokens.css"
  }
}
```

### tokens.css

Only override what differs from the base theme. Unset tokens inherit from base:

```css
:root {
  /* Brand identity */
  --color-primary: 14 89% 55%;
  --color-primary-fg: 0 0% 100%;
  --color-accent: 199 89% 48%;
  --color-accent-fg: 0 0% 100%;

  /* Typography */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-heading-1: "Playfair Display", serif;

  /* Rounder corners */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-primary: 14 89% 65%;
    --color-primary-fg: 0 0% 10%;
    --color-accent: 199 89% 58%;
    --color-accent-fg: 0 0% 10%;
  }
}
```

### Usage in an app

```tsx
// app/layout.tsx
import "@themes/base/tokens.css";    // Base defaults
import "@acme/theme-my-brand/tokens.css"; // Brand overrides
```

---

## Common Customizations

### Typography (Custom Fonts)

The design-system uses a three-font model:

| Token | Purpose | Default |
|-------|---------|---------|
| `--font-body` | Body text | `var(--font-sans)` |
| `--font-heading-1` | Primary headings | `var(--font-sans)` |
| `--font-heading-2` | Secondary headings | `var(--font-sans)` |

To use custom fonts:

```css
:root {
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --font-body: var(--font-sans);
  --font-heading-1: "Playfair Display", serif;
  --font-heading-2: "Inter", system-ui, sans-serif;
}
```

Load fonts via Next.js `next/font` or a `<link>` tag — the token only sets the `font-family` value.

### Border Radius Scale

Adjust the entire radius scale to change the UI's "roundness":

```css
/* Sharp/minimal look */
:root {
  --radius-xs: 0px;
  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 6px;
  --radius-xl: 8px;
  --radius-2xl: 10px;
  --radius-full: 9999px;
}

/* Pill/rounded look */
:root {
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-xl: 24px;
  --radius-2xl: 28px;
  --radius-full: 9999px;
}
```

### Dark Mode Adjustments

Dark mode tokens use the `-dark` suffix. The base theme applies them via `prefers-color-scheme`:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: var(--color-bg-dark);
    --color-fg: var(--color-fg-dark);
    --color-primary: var(--color-primary-dark);
    /* ... */
  }
}
```

To customize dark mode specifically:

```css
@media (prefers-color-scheme: dark) {
  :root {
    /* Warmer dark background */
    --color-bg: 30 10% 8%;
    --color-fg: 30 5% 92%;

    /* Adjusted surfaces for dark */
    --surface-1: 30 8% 8%;
    --surface-2: 30 6% 13%;
    --surface-3: 30 5% 17%;

    /* Lighter borders in dark mode */
    --border-1: 30 5% 92% / 0.10;
    --border-2: 30 5% 92% / 0.18;
  }
}
```

### Elevation (Shadows)

The elevation scale controls depth perception:

```css
:root {
  --elevation-0: none;
  --elevation-1: 0 1px 3px rgba(0, 0, 0, 0.04);
  --elevation-2: 0 2px 8px rgba(0, 0, 0, 0.08);
  --elevation-3: 0 4px 16px rgba(0, 0, 0, 0.12);
  --elevation-4: 0 8px 32px rgba(0, 0, 0, 0.16);
  --elevation-5: 0 16px 48px rgba(0, 0, 0, 0.20);
}
```

### Spacing Scale

Adjust the spacing rhythm (base unit is 4px):

```css
:root {
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

---

## Token Reference

### Color Tokens

| Token | Purpose |
|-------|---------|
| `--color-bg` | Page/app background |
| `--color-fg` | Default text color |
| `--color-primary` | Brand primary (buttons, links, focus) |
| `--color-primary-fg` | Text on primary-colored surfaces |
| `--color-accent` | Secondary brand color |
| `--color-accent-fg` | Text on accent-colored surfaces |
| `--color-danger` / `--color-danger-fg` | Error/destructive states |
| `--color-success` / `--color-success-fg` | Success states |
| `--color-warning` / `--color-warning-fg` | Warning states |
| `--color-info` / `--color-info-fg` | Informational states |
| `--color-muted` | Muted/disabled backgrounds |
| `--color-fg-muted` | Muted/secondary text |
| `--surface-1` through `--surface-3` | Layered surface backgrounds |
| `--surface-input` | Form input backgrounds |
| `--border-1` through `--border-3` | Border intensities |

### Z-Index Tokens

| Token | Value | Purpose |
|-------|-------|---------|
| `--z-base` | 0 | Default stacking |
| `--z-dropdown` | 100 | Dropdown menus |
| `--z-sticky` | 200 | Sticky headers |
| `--z-fixed` | 300 | Fixed position elements |
| `--z-modal-backdrop` | 400 | Modal overlay |
| `--z-modal` | 500 | Modal dialogs |
| `--z-popover` | 600 | Popovers, date pickers |
| `--z-tooltip` | 700 | Tooltips |
| `--z-toast` | 800 | Toast notifications |
| `--z-max` | 9999 | Emergency override |

---

## CMS Theme Editor (Runtime)

For shops using the CMS, the Theme Editor provides a UI for runtime token overrides:

1. Navigate to **Shop > Themes** in the CMS
2. Select a base theme
3. Click any tokenized element to override its value
4. Overrides persist per-shop and merge with the base theme

See [theming.md](./theming.md) for full Theme Editor documentation.

---

## Validation

Run the token validator to ensure your theme meets requirements:

```bash
pnpm validate:tokens
```

This checks that all required tokens are defined and recommends optional ones for completeness.

---

## Related Documentation

- [Theming overview](./theming.md) — Theme Editor and live preview
- [Advanced theming](./theming-advanced.md) — Base theme mechanics and persistence
- [Token-component matrix](./theming-token-component-matrix.md) — Which components use which tokens
