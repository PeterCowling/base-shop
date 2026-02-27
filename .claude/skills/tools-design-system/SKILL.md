---
name: tools-design-system
description: Apply design tokens and system patterns correctly. Reference for semantic colors, spacing, typography, borders, and shadows. Never use arbitrary values.
operating_mode: GENERATE
trigger_conditions: design tokens, semantic colors, spacing, typography, borders, shadows, Tailwind tokens, arbitrary values
related_skills: tools-refactor, lp-design-spec, lp-design-qa, tools-ui-contrast-sweep
---

# Apply Design System

Use design tokens exclusively. Never use arbitrary values (`[#hex]`, `[16px]`, etc.).

## Color Tokens

### Backgrounds
`bg-bg`, `bg-primary`, `bg-accent`, `bg-muted`, `bg-primary-soft`, `bg-accent-soft`

Layered surfaces: `bg-[hsl(var(--surface-1))]`, `bg-[hsl(var(--surface-2))]`, `bg-[hsl(var(--surface-3))]`

### Text
`text-fg`, `text-fg-muted`, `text-primary-foreground`, `text-accent-foreground`

### Borders
`border-[hsl(var(--color-border))]`, `border-[hsl(var(--color-border-strong))]`, `border-[hsl(var(--color-border-muted))]`

## Spacing (Padding/Margin/Gap)

8-pt rhythm: `0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16` — e.g., `p-4`, `gap-6`, `space-y-4`

## Typography

- **Sizes**: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl`
- **Weights**: `font-normal`, `font-medium`, `font-semibold`, `font-bold`
- **Families**: `font-sans`, `font-heading`, `font-mono`

## Borders & Radius

`rounded-none`, `rounded-xs`, `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-4xl`, `rounded-full`

## Shadows

`shadow-sm`, `shadow-md`, `shadow-lg` (mapped to `var(--shadow-*)` tokens)

## Common Patterns

**Card:** `bg-[hsl(var(--surface-2))] text-fg rounded-lg border-[hsl(var(--color-border))] shadow-sm p-6`

**Primary button:** `bg-primary text-primary-foreground hover:bg-[hsl(var(--color-primary-hover))] px-4 py-2 rounded-md font-medium`

**Input:** `flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm`

**Container:** `container mx-auto px-4 py-8`

## Using `cn()` for class merging

```tsx
import { cn } from '@acme/design-system/utils/style'

<div className={cn('base-styles', { 'conditional': variant === 'x' }, className)}>
```

## Responsive (mobile-first)

`md:` (768px+), `lg:` (1024px+), `xl:` (1280px+)

## Anti-Patterns

- `bg-[#FF0000]` — use semantic tokens
- `bg-red-500` — use semantic tokens
- `p-[16px]` — use `p-4`
- `style={{ ... }}` — use Tailwind classes
- `w-[250px]` — use `w-64` or similar

## When Tokens Don't Exist

1. Check for a close semantic token
2. Add to design tokens package (`packages/design-tokens/`)
3. Update Tailwind config
4. Document in `docs/typography-and-color.md`
