---
Type: Handbook
Status: Canonical
Domain: Design System
Created: 2026-01-16
Created-by: Claude Opus 4.5
Last-updated: 2026-01-16
---

# Design System Handbook

This handbook consolidates all design system documentation for the Base-Shop platform. It covers the component library (`@acme/ui`), token system, theming, and CMS UI patterns.

## Quick Reference

| Topic | Section | Key Files |
|-------|---------|-----------|
| Component Library | [1. Component Library](#1-component-library) | `packages/ui/` |
| Tokens & Theming | [2. Token System](#2-token-system) | `packages/themes/`, `packages/design-tokens/` |
| Sizes & Tones | [3. Size & Tone Guide](#3-size--tone-guide) | Atoms: Button, Tag, Chip, etc. |
| Surfaces & Elevation | [4. Surfaces & Elevation](#4-surfaces--elevation) | Drawer, Dialog, Popover, Card |
| CMS Patterns | [5. CMS UI Patterns](#5-cms-ui-patterns) | `packages/ui/src/components/cms/` |
| Typography & Color | [6. Typography & Color](#6-typography--color) | Fonts, palettes, contrast |
| Accessibility | [7. Accessibility](#7-accessibility) | WCAG, tap targets, screen readers |

---

## 1. Component Library

The `@acme/ui` package provides shared design system and CMS UI components for the Acme platform.

### Structure

```
packages/ui/src/components/
├── atoms/           # Button, Tag, Input, Chip, etc.
├── molecules/       # Accordion, CodeBlock, CurrencySwitcher
├── organisms/       # ProductGrid, FilterSidebar, DataTable
├── templates/       # AppShell, TrackingDashboard
├── overlays/        # Dialog, Drawer, Popover
├── cms/             # CMS-specific patterns
└── platform/        # Platform-core UI (shop, pdp, blog)
```

### Import Rules

```tsx
// Correct: use public entrypoints
import { Button, Card, Tag } from "@acme/ui";
import { CmsBuildHero } from "@acme/ui/cms";

// Incorrect: avoid deep imports
import { Button } from "@acme/ui/src/components/atoms/Button";
```

For layering rules and public API surfaces, see:
- `packages/ui/docs/architecture.md`
- `packages/ui/docs/platform-vs-apps.md`

---

## 2. Token System

### Token Architecture

Tokens are CSS custom properties using HSL numeric tuples for colors and raw stacks for fonts.

**Token Sources:**
- Base catalogue: `packages/themes/base/src/tokens.ts`
- Generated CSS: `packages/themes/base/src/tokens.css`
- Theme overrides: `packages/themes/*/src/tokens.css`
- Exported map: `packages/design-tokens/src/exportedTokenMap.ts`

### Token Categories

| Category | Example Tokens | Usage |
|----------|---------------|-------|
| Colors | `--color-primary`, `--color-fg`, `--color-bg` | `hsl(var(--color-primary))` |
| Typography | `--font-body`, `--font-heading-1`, `--font-mono` | `var(--font-body)` |
| Spacing | `--space-1` through `--space-16` | 8-pt rhythm scale |
| Radius | `--radius-sm`, `--radius-md`, `--radius-lg` | Border radii |
| Shadows | `--shadow-sm`, `--shadow-md`, `--shadow-lg` | Elevation |

### Tailwind Integration

Tokens are exposed via `@acme/design-tokens` preset:

```tsx
// Colors
className="bg-primary text-primary-foreground"
className="bg-bg text-fg"

// Typography
className="font-sans"  // follows --font-body via alias
className="font-mono"

// Spacing (8-pt rhythm)
className="p-4"  // var(--space-4)

// Radius
className="rounded-md"  // var(--radius-md)
```

### Dark Mode

Strategy: hybrid "system preference + class override".

- Media query: `@media (prefers-color-scheme: dark)` swaps tokens
- Class override: `html.theme-dark` forces dark regardless of system
- Initialization: `packages/platform-core/src/utils/initTheme.ts`

```tsx
// localStorage values: 'light' | 'dark' | 'system'
```

### Multi-Brand Theming

The design system supports multiple brand themes beyond light/dark mode.

**Available Theme Packages:**

| Theme | Package | Purpose |
|-------|---------|---------|
| base | `packages/themes/base/` | Default light theme tokens |
| dark | `packages/themes/dark/` | Dark mode overrides |
| brandx | `packages/themes/brandx/` | Brand X customization |
| bcd | `packages/themes/bcd/` | BCD brand |
| cochlearfit | `packages/themes/cochlearfit/` | CochlearFit brand |
| skylar | `packages/themes/skylar/` | Skylar brand |
| prime | `packages/themes/prime/` | Prime brand |

**Theme Structure:**

Each theme package exports token overrides that layer on top of base tokens:

```typescript
// packages/themes/brandx/src/index.ts
export const tokens = {
  "--color-primary": { light: "280 70% 50%", dark: "280 70% 60%" },
  "--color-accent": { light: "220 80% 55%", dark: "220 80% 65%" },
  // Override only the tokens you need
};
```

**Applying a Brand Theme:**

1. Import theme tokens in your app layout
2. Apply via `ThemeStyle` component or direct CSS injection
3. Brand tokens cascade over base tokens via CSS specificity

```tsx
// apps/myshop/src/app/layout.tsx
import { ThemeStyle } from "@acme/ui";
import { tokens as brandTokens } from "@acme/themes-brandx";

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <ThemeStyle tokens={brandTokens} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**Creating a New Brand Theme:**

```bash
# 1. Create theme package
mkdir -p packages/themes/mybrand/src

# 2. Create package.json
cat > packages/themes/mybrand/package.json << 'EOF'
{
  "name": "@acme/themes-mybrand",
  "version": "1.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts"
}
EOF

# 3. Export token overrides
cat > packages/themes/mybrand/src/index.ts << 'EOF'
export const tokens = {
  "--color-primary": { light: "220 80% 50%", dark: "220 80% 60%" },
  "--color-accent": { light: "280 70% 60%", dark: "280 70% 70%" },
};
EOF

# 4. Register in workspace (add to pnpm-workspace.yaml if needed)
# 5. Add to tsconfig paths if using TypeScript aliases
```

**Storybook Testing:**

Brand themes can be tested in Storybook using the theme toolbar:
- Token switcher: `base` vs `brandx` vs other themes
- Combined with locale/currency selectors for full context testing

---

## 3. Size & Tone Guide

Use these defaults to keep atoms consistent across apps.

### Sizes

| Size | Dimensions | Icon-only | Applies to |
|------|------------|-----------|------------|
| `sm` | h-9 / px-3 | h/w-9 | Button, IconButton, Tag, ProductBadge, Chip |
| `md` | h-10 / px-4 | h/w-10 | (default) |
| `lg` | h-11 / px-5 / text-base | h/w-11 | |

### Tones

| Tone | Description | Use case |
|------|-------------|----------|
| `solid` | Filled background + foreground contrast | Primary actions |
| `soft` | Tinted background, neutral foreground | Secondary actions |
| `outline` | Border + neutral text | Tertiary actions |
| `ghost` | Neutral text, subtle hover fill | Inline actions |
| `quiet` | Text-forward, near-transparent hover | Low-emphasis actions |

### Colors

Available colors for toned components:
- `default`, `primary`, `accent`
- `success`, `info`, `warning`, `danger`
- `destructive` (alias for danger on Tag/Badge/Chip)

### Storybook Reference

- Buttons: `Primitives/Button` (TonesAndColors, TonesColorsSizes)
- IconButton: `Atoms/IconButton`
- Pills: `Atoms/Tag`, `Atoms/ProductBadge`, `Atoms/Chip`

---

## 4. Surfaces & Elevation

### Surface Tokens

| Token | Usage |
|-------|-------|
| `bg-panel` | Containers: dialogs, drawers, popovers, dropdowns, cards |
| `bg-surface-2` | Lightweight hover/highlight states |
| `bg-surface-3` | Stronger emphasis: selected rows, elevated hover |
| `border-border-2` | Container edges |
| `border-border-1` | Subtle separators |
| `ring-ring` | Focus rings |

### Component Patterns

```tsx
// DropdownMenu / Select / Popover
className="bg-panel border-border-2"
// Item hover
className="hover:bg-surface-3"

// Dialog content
className="bg-panel border-border-2"

// Table rows
className="hover:bg-surface-2"      // hover
className="bg-surface-3"            // selected
```

### Drawer Primitive

For slide-over surfaces, use the Drawer primitive:

```tsx
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from "@acme/ui";

<Drawer>
  <DrawerTrigger asChild>
    <button>Open</button>
  </DrawerTrigger>
  <DrawerContent side="right" width="w-80" className="p-6">
    <DrawerTitle>Title</DrawerTitle>
    <DrawerDescription className="sr-only">Description</DrawerDescription>
    {/* content */}
  </DrawerContent>
</Drawer>
```

**Props:**
- `side`: `"left" | "right"` (default: `"right"`)
- `width`: Tailwind width class or pixel number

---

## 5. CMS UI Patterns

CMS UI patterns live in `packages/ui/src/components/cms/`. These canonical patterns provide consistency across CMS build, launch, and update flows.

### 5.1 CmsBuildHero

Shared hero layout for main build/launch surfaces.

**Usage:** Configurator dashboard, Settings hero, Products hero

```tsx
import { CmsBuildHero } from "@acme/ui/cms";

<CmsBuildHero
  tag="Configurator"
  title="Build your shop"
  body="Complete the steps below to launch."
  primaryCta={{ label: "Quick launch", href: "/launch" }}
  inlineMeta={[{ label: "Progress", value: "4/7" }]}
  tone="build"
/>
```

**Props:**
- `tag: string` – short label
- `title: string` – main heading
- `body: string` – supporting copy
- `primaryCta?: { label, href?, onClick? }`
- `secondaryCtas?: { label, href?, onClick? }[]`
- `inlineMeta?: { label, value }[]` – stats like "3/7 complete"
- `tone?: "build" | "operate" | "upgrade"`

### 5.2 CmsLaunchChecklist

Standard checklist UI for launch and readiness states.

**Usage:** Configurator LaunchPanel, Products catalog checklist, Upgrade readiness

```tsx
import { CmsLaunchChecklist } from "@acme/ui/cms";

<CmsLaunchChecklist
  items={[
    { id: "products", label: "Products in stock", status: "complete", href: "/products" },
    { id: "payments", label: "Payments configured", status: "warning", href: "/settings" },
  ]}
  readyLabel="Ready to launch!"
  showReadyCelebration
/>
```

**Props:**
- `items: { id, label, status, href, onFix? }[]`
  - `status`: `"complete" | "warning" | "error" | "pending"`
- `readyLabel?: string`
- `showReadyCelebration?: boolean`

### 5.3 CmsSettingsSnapshot

Snapshot view of shop configuration.

**Usage:** SettingsHero, ConfigurationOverview

```tsx
import { CmsSettingsSnapshot } from "@acme/ui/cms";

<CmsSettingsSnapshot
  title="Current snapshot"
  rows={[
    { id: "lang", label: "Languages", value: "en, de" },
    { id: "currency", label: "Currency", value: "EUR", tone: "success" },
  ]}
/>
```

**Props:**
- `title?: string`
- `body?: string`
- `rows: { id, label, value, tone? }[]`
  - `tone`: `"default" | "warning" | "error" | "success"`

### 5.4 CmsStepShell

Standard frame for Configurator-style step pages.

**Usage:** Configurator step pages, multi-step wizards

```tsx
import { CmsStepShell } from "@acme/ui/cms";

<CmsStepShell
  stepId="products"
  icon={<ShoppingCart />}
  title="Add your products"
  description="Import or create your catalog"
  status="in-progress"
  trackLabel="Essentials"
>
  {/* step content */}
</CmsStepShell>
```

**Props:**
- `stepId: string`
- `icon?: ReactNode`
- `title: string`
- `description?: string`
- `status: "complete" | "skipped" | "in-progress"`
- `trackLabel?: string`
- `trackTone?: "default" | "info" | "warning"`
- `recommendedBefore?: string[]`
- `children: ReactNode`

### 5.5 CmsInlineHelpBanner

Inline help for build surfaces with doc links and telemetry.

**Usage:** Status bar, Settings help, Theme Editor banners

```tsx
import { CmsInlineHelpBanner } from "@acme/ui/cms";

<CmsInlineHelpBanner
  heading="Need help?"
  body="Learn how to configure your shop theme."
  links={[
    { label: "Theming guide", href: "/docs/theming" },
    { label: "Build journey", href: "/docs/journey" },
  ]}
  tone="info"
/>
```

**Props:**
- `heading?: string`
- `body: string`
- `links: { label, href, onClick? }[]`
- `tone?: "info" | "warning"`

### 5.6 CmsMetricTiles

Quick-stats tiles for build/launch or catalog state.

**Usage:** Configurator dashboard, Products hero stats

```tsx
import { CmsMetricTiles } from "@acme/ui/cms";

<CmsMetricTiles
  items={[
    { id: "milestones", label: "Core milestones", value: "3/7", caption: "Essential steps" },
    { id: "health", label: "Shop health", value: "Healthy" },
  ]}
/>
```

**Props:**
- `items: { id, label, value, caption? }[]`

### Pattern Mapping by Surface

| Surface | Patterns Used |
|---------|---------------|
| Configurator dashboard | CmsBuildHero, CmsMetricTiles, CmsLaunchChecklist |
| Settings | CmsBuildHero, CmsSettingsSnapshot |
| Products | CmsBuildHero, CmsMetricTiles, CmsLaunchChecklist |
| Theme Editor | CmsInlineHelpBanner |
| Configurator steps | CmsStepShell |
| Upgrade preview | CmsBuildHero, CmsLaunchChecklist, CmsInlineHelpBanner |

---

## 6. Typography & Color

### Three-Font Model

| Token | Purpose |
|-------|---------|
| `--font-body` | Primary body stack |
| `--font-heading-1` | H1–H3 stack |
| `--font-heading-2` | H4–H6 stack |
| `--font-sans` | Low-level (defaults to Geist) |
| `--font-mono` | Monospace (defaults to Geist Mono) |

Fonts are selected in the CMS via `FontsPanel.tsx` and injected by `ThemeStyle.tsx`.

### Color Palette

Base and dark themes share a WCAG AA compliant color system:

| Token | Light | Dark | Contrast |
|-------|-------|------|----------|
| `--color-bg` / `--color-fg` | white/near-black | near-black/white | 17+ |
| `--color-primary` / `--color-primary-fg` | blue/white | blue/dark | 4.5+ |
| `--color-accent` / `--color-accent-fg` | purple/dark | purple/dark | 5+ |
| `--color-success` | green tint | green | 4.5+ |
| `--color-warning` | amber tint | amber | 5.5+ |
| `--color-info` | blue tint | blue | 6+ |

### Theme Generator

Generate a token map from a brand color:

```bash
pnpm ts-node scripts/src/generate-theme.ts '#336699'
```

### Runtime Token Injection

`ThemeStyle.tsx` (server component) is the canonical injector:
- Emits `<style data-shop-theme>` with `:root { … }` CSS variables
- Loads Google Fonts via `<link rel="preconnect">` and stylesheet links

---

## 7. Accessibility

### Contrast Requirements

- All text meets WCAG 2.1 AA (≥ 4.5:1 for normal text)
- Contrast tests in `packages/ui/src/components/cms/page-builder/__tests__/`

### Tap Targets

| Token | Size | Standard |
|-------|------|----------|
| `--target-min-aa` | 24px | WCAG 2.2 minimum |
| `--target-hig` | 44px | Apple HIG |
| `--target-material` | 48px | Material/Android |

CMS utilities: `.min-target-aa`, `.min-target-hig`, `.min-target-material`

### Icon-Only Actions

Icon-only buttons require accessible labels:

```tsx
// Correct
<IconButton aria-label="Close menu">
  <XIcon />
</IconButton>

// Incorrect - no accessible name
<IconButton>
  <XIcon />
</IconButton>
```

### Drawer/Dialog Accessibility

Always provide `DrawerTitle` and `DrawerDescription` (use `sr-only` to visually hide):

```tsx
<DrawerContent>
  <DrawerTitle>Settings</DrawerTitle>
  <DrawerDescription className="sr-only">
    Configure your preferences
  </DrawerDescription>
</DrawerContent>
```

### Reduced Motion

Global transitions are disabled when `prefers-reduced-motion` is set.

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| [theming-charter.md](theming-charter.md) | Canonical theming system charter |
| [theming.md](theming.md) | Theme Editor and live preview guide |
| [palette.md](palette.md) | Base color palette and contrast table |
| [typography-and-color.md](typography-and-color.md) | Deep dive on fonts and colors |
| [design-system-package-import.md](design-system-package-import.md) | External package import guide |
| [ui-responsive-audit.md](ui-responsive-audit.md) | Responsive/stress audit status |
| [cms/shop-build-ui-patterns.md](cms/shop-build-ui-patterns.md) | Detailed CMS pattern specs |
| [cms/shop-build-ui-audit.md](cms/shop-build-ui-audit.md) | CMS component inventory |

---

## File Map

### Core Packages

| Path | Purpose |
|------|---------|
| `packages/ui/` | Component library |
| `packages/themes/base/` | Base token definitions |
| `packages/themes/dark/` | Dark theme overrides |
| `packages/design-tokens/` | Tailwind preset/plugin |
| `packages/eslint-plugin-ds/` | Design system ESLint rules (33 rules) |

### Key Files

| File | Purpose |
|------|---------|
| `packages/themes/base/src/tokens.ts` | Source of truth for tokens |
| `packages/ui/src/components/ThemeStyle.tsx` | Runtime token injector |
| `packages/platform-core/src/utils/initTheme.ts` | Dark mode initialization |
| `tailwind.config.mjs` | Root Tailwind configuration |

---

## ESLint Design System Rules

The `@acme/eslint-plugin-ds` package enforces design system compliance with 33 rules:

| Category | Rules |
|----------|-------|
| Token Enforcement | `no-raw-color`, `no-raw-spacing`, `no-raw-radius`, `no-raw-shadow`, `no-raw-typography` |
| Layer Boundaries | `no-margins-on-atoms`, `enforce-layout-primitives`, `absolute-parent-guard` |
| Accessibility | `min-tap-size`, `enforce-focus-ring-token`, `no-misused-sr-only`, `icon-button-size` |
| Responsive | `require-breakpoint-modifiers`, `container-widths-only-at` |
| RTL/i18n | `no-physical-direction-classes-in-rtl`, `no-hardcoded-copy` |

### Purpose and Escape Hatches

The DS rules exist to keep UI consistent, accessible, and theme-safe across brands:

- Tokens: prevent raw values that bypass theming and contrast guarantees.
- Boundaries: keep layout decisions in layout primitives, not leaf components.
- Accessibility: enforce tap targets, focus rings, and SR-only usage.
- Responsiveness: require breakpoint-aware patterns for layout stability.
- RTL/i18n: avoid physical directions and hardcoded copy for localization.

When a rule blocks legitimate work, use a temporary, ticketed exception and plan a follow-up fix:

- Prefer fixing the violation using tokens or DS primitives first.
- If you must disable a rule, add an inline `eslint-disable-next-line` with a ticket and (optionally) `ttl=YYYY-MM-DD`.
- Some rules are relaxed in stories and during migration; see `docs/linting.md` for current exception patterns and scope.

---

## 8. Component API Reference

For canonical prop naming conventions, see [Component API Standard](component-api-standard.md).

### Quick Reference

| Prop | Purpose | Values |
|------|---------|--------|
| `color` | Semantic intent | default, primary, accent, success, info, warning, danger |
| `tone` | Fill intensity | solid, soft, outline, ghost, quiet |
| `size` | Scale | sm, md, lg |

### Migration from Legacy Props

The `variant` prop is deprecated. Migrate to `color` + `tone`:

```tsx
// Before
<Button variant="destructive">Delete</Button>

// After
<Button color="danger" tone="solid">Delete</Button>
```

### Component Compliance

See [Component API Standard - Compliance Status](component-api-standard.md#component-compliance-status) for current migration status.

---

## 9. Contribution Guidelines

### Adding a New Component

1. **Follow [Component API Standard](component-api-standard.md)**
   - Implement `color`, `tone`, `size` props where applicable
   - Use standard values (no custom variants)

2. **Implement all three sizes** (sm/md/lg) for sizable components

3. **Add Storybook stories** covering:
   - Default state
   - All sizes
   - All colors and tones
   - Interactive states (hover, focus, disabled)
   - Dark mode via decorator

4. **Add accessibility tests**
   - jest-axe for unit tests
   - Cypress a11y for E2E tests

5. **Document in this handbook** if it's a CMS pattern (Section 5)

### Modifying Existing Components

1. **Check compliance status** in [Component API Standard](component-api-standard.md)

2. **Maintain backward compatibility** with deprecated props
   - Add console warnings for deprecated usage in development
   - Keep legacy props working for at least 2 minor versions

3. **Update Storybook stories** to cover changes

4. **Update handbook sections** if behavior changes

### Token Changes

1. **Modify base tokens:**
   ```bash
   # Edit source of truth
   packages/themes/base/src/tokens.ts
   ```

2. **Run contrast tests:**
   ```bash
   pnpm test --filter=@acme/themes-base
   ```

3. **Update dark theme if needed:**
   ```bash
   packages/themes/dark/src/tokens.ts
   ```

4. **Regenerate CSS (if applicable):**
   ```bash
   pnpm tokens:build
   ```

### Adding a Brand Theme

See [Multi-Brand Theming](#multi-brand-theming) section above.

### Testing Requirements

- All new components need story coverage
- Run `pnpm stories:verify` to check coverage
- Add to [Visual Regression Coverage](visual-regression-coverage.md) if critical
