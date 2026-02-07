---
Type: Standard
Status: Canonical
Domain: Design System
Created: 2026-01-16
Created-by: Claude Opus 4.5
Last-updated: 2026-01-16
---

# Component API Standard

This document defines canonical prop naming conventions for the `@acme/ui` component library.

## Quick Reference

| Prop | Purpose | Valid Values | Default |
|------|---------|--------------|---------|
| `color` | Semantic color intent | default, primary, accent, success, info, warning, danger | varies by component |
| `tone` | Visual fill intensity | solid, soft, outline, ghost, quiet | varies by component |
| `size` | Size scale | sm, md, lg | md |
| `variant` | **DEPRECATED** - Legacy back-compat only | Component-specific | - |

## Canonical Conventions

### 1. Color (Semantic Intent)

Use `color` for semantic color meaning:

```tsx
<Tag color="success">Approved</Tag>
<Alert color="danger">Error occurred</Alert>
<Button color="primary">Submit</Button>
```

**Standard values:**

| Value | Purpose | Background Token | Foreground Token |
|-------|---------|------------------|------------------|
| `default` | Neutral/muted appearance | `--color-muted` | `--color-fg` |
| `primary` | Brand primary action | `--color-primary` | `--color-primary-fg` |
| `accent` | Secondary emphasis | `--color-accent` | `--color-accent-fg` |
| `success` | Positive state | `--color-success` | `--color-success-fg` |
| `info` | Informational | `--color-info` | `--color-info-fg` |
| `warning` | Caution state | `--color-warning` | `--color-warning-fg` |
| `danger` | Destructive/error state | `--color-danger` | `--color-danger-fg` |

**Note:** `destructive` is a legacy alias for `danger` and should be migrated.

### 2. Tone (Visual Fill)

Use `tone` for fill intensity:

```tsx
<Button color="primary" tone="solid">Primary action</Button>
<Button color="primary" tone="soft">Secondary action</Button>
<Button color="primary" tone="outline">Tertiary action</Button>
<Button color="primary" tone="ghost">Inline action</Button>
<Button color="primary" tone="quiet">Low-emphasis action</Button>
```

**Standard values:**

| Tone | Description | Background | Border | Use case |
|------|-------------|------------|--------|----------|
| `solid` | Filled background | Full color | None | Primary actions |
| `soft` | Tinted background | `-soft` variant | None | Secondary actions |
| `outline` | Border only | Transparent | Full color | Tertiary actions |
| `ghost` | Transparent with hover fill | Transparent (hover: subtle) | None | Inline actions |
| `quiet` | Text-forward | Transparent (hover: minimal) | None | Low-emphasis actions |

### 3. Size Scale

All sizable components must support the full scale:

```tsx
<Button size="sm">Small</Button>   // h-9
<Button size="md">Medium</Button>  // h-10 (default)
<Button size="lg">Large</Button>   // h-11
```

**Required dimensions:**

| Size | Height | Padding (horizontal) | Typography | Icon-only |
|------|--------|---------------------|------------|-----------|
| `sm` | h-9 (36px) | px-3 | text-sm | h-9 w-9 |
| `md` | h-10 (40px) | px-4 | text-sm | h-10 w-10 |
| `lg` | h-11 (44px) | px-5 | text-base | h-11 w-11 |

**Note:** The `lg` size (44px) meets Apple HIG touch target recommendations.

### 4. Legacy Variant Migration

The `variant` prop is deprecated. Use `color` + `tone` instead:

| Legacy `variant` | Migration |
|------------------|-----------|
| `default` | `color="primary" tone="solid"` |
| `secondary` | `color="accent" tone="soft"` |
| `outline` | `color="accent" tone="outline"` |
| `ghost` | `color="accent" tone="ghost"` |
| `destructive` | `color="danger" tone="solid"` |
| `link` | `color="primary" tone="quiet"` |

Components with legacy `variant` props will emit console warnings in development.

### 5. Foreground Token Naming

**Standard:** Use `-fg` suffix (not `-foreground`)

- Correct: `text-primary-fg`, `text-success-fg`, `text-danger-fg`
- Legacy: `text-primary-foreground` (accepted for back-compat)

Migration: Replace `*-foreground` with `*-fg` when updating components.

## Component Compliance Status

| Component | `color` | `tone` | `size` (sm/md/lg) | Status |
|-----------|---------|--------|-------------------|--------|
| Button | Yes | Yes (5 values) | Yes | Compliant |
| Tag | Yes | Yes (solid/soft) | Yes | Compliant |
| Chip | Inherited | Inherited | Inherited | Compliant |
| ProductBadge | Yes | Yes (solid/soft) | Yes | Compliant |
| Alert | No (uses `variant`) | Yes | No | **Migration needed** |
| IconButton | No (uses `variant`) | No | **Missing lg** | **Migration needed** |
| Toast | No | No | No | **Migration needed** |
| Progress | No | No | No | N/A (different pattern) |

### Components Requiring Migration

#### IconButton

Current issues:
- Missing `size="lg"` support (only has sm/md)
- Uses `variant` prop instead of `color`
- No `tone` prop

Migration checklist:
- [ ] Add `size="lg"` support (h-11 w-11)
- [ ] Add `color` prop alongside `variant`
- [ ] Add `tone` prop (solid/soft/ghost/quiet)
- [ ] Deprecate `variant` with console warning

#### Alert

Current issues:
- Uses `variant` for semantic meaning (info/success/warning/danger)
- No `size` prop

Migration checklist:
- [ ] Add `color` prop (map from `variant`)
- [ ] Deprecate `variant` with console warning
- [ ] Consider adding `size` prop (sm/md/lg)

## TypeScript Interface Pattern

Standard component props interface:

```tsx
export interface ComponentProps extends React.HTMLAttributes<HTMLElement> {
  /** Semantic color intent */
  color?: "default" | "primary" | "accent" | "success" | "info" | "warning" | "danger";
  /** Visual fill intensity */
  tone?: "solid" | "soft" | "outline" | "ghost" | "quiet";
  /** Size scale */
  size?: "sm" | "md" | "lg";
  /** @deprecated Use color + tone instead */
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
}
```

## ESLint Enforcement

The `@acme/eslint-plugin-ds` package will enforce these conventions:

| Rule | Purpose | Status |
|------|---------|--------|
| `ds/no-raw-color` | Enforce color token usage | Active |
| `ds/standardized-size-prop` | Require sm/md/lg scale | Planned |
| `ds/deprecated-variant-prop` | Warn on variant usage | Planned |

## Related Documentation

- [Design System Handbook](design-system-handbook.md) - Token system and theming
- [Size & Tone Guide](design-system-handbook.md#3-size--tone-guide) - Detailed size/tone patterns
- [Visual Regression Coverage](visual-regression-coverage.md) - Testing requirements
