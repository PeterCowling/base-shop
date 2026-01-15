Type: Guide
Status: Active
Domain: Theming
Last-reviewed: 2026-01-13

# Theming Accessibility and Performance

This document outlines accessibility and performance guardrails for theme customization.

## Accessibility

### Contrast Requirements

All theme token pairs must meet WCAG 2.1 AA contrast requirements:

| Requirement | Ratio | Applies to |
|-------------|-------|------------|
| Normal text | 4.5:1 | Body text, labels, captions |
| Large text (18pt+ or 14pt bold) | 3:1 | Headings, large buttons |
| UI components | 3:1 | Borders, icons, focus indicators |

### Automated Contrast Tests

Contrast ratios are verified by automated tests in:

- `packages/themes/base/__tests__/contrast.test.ts` - Base theme pairs
- `packages/themes/dark/__tests__/contrast.test.ts` - Dark theme pairs
- `apps/cms/__tests__/themes.tokens.contrast.test.ts` - All themes (base, bcd, brandx, dark)

These tests check the following token pairs:

```
--color-fg / --color-bg
--color-primary-fg / --color-primary
--color-accent-fg / --color-accent
--color-danger-fg / --color-danger
--color-success-fg / --color-success
--color-warning-fg / --color-warning
--color-info-fg / --color-info
--color-muted-fg / --color-muted
```

Run tests with:

```bash
pnpm --filter @acme/themes-base test
pnpm --filter @apps/cms test -- --testPathPattern=contrast
```

### Theme Editor Contrast Warnings

The Theme Editor provides real-time contrast checking:

1. When editing a color token, the editor compares it against related fg/bg pairs
2. Pairings below 4.5:1 display a warning with the measured ratio
3. A "Fix nearest AA" button suggests the closest compliant color
4. Warnings are aggregated in an alert banner

See [ColorInput.tsx](../apps/cms/src/app/cms/shop/[shop]/themes/ColorInput.tsx) for implementation.

### Pointer Target Sizes

The design system includes tokens for accessible touch targets:

| Token | Value | Standard |
|-------|-------|----------|
| `--target-min-aa` | 24px | WCAG 2.2 AA minimum |
| `--target-hig` | 44px | Apple Human Interface Guidelines |
| `--target-material` | 48px | Material Design / Android |

CSS utilities in `apps/cms/src/app/utilities.a11y.css`:

```css
.min-target-aa { min-width: var(--target-min-aa); min-height: var(--target-min-aa); }
.min-target-hig { min-width: var(--target-hig); min-height: var(--target-hig); }
.min-target-material { min-width: var(--target-material); min-height: var(--target-material); }
```

## Performance

### Font Loading

Theme font selection impacts performance. The `ThemeStyle` component optimizes loading by:

1. Preconnecting to Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`)
2. Loading only distinct first families from `--font-body`, `--font-heading-1`, `--font-heading-2`
3. Using `display=swap` to prevent FOIT (Flash of Invisible Text)

Best practices:

- Limit custom fonts to 2-3 families maximum
- Prefer system font stacks for body text when possible
- Use `font-display: swap` (handled automatically)

### CSS Variable Performance

Token injection via CSS variables is performant because:

- Variables are set on `:root` once, not per-component
- Changes are debounced (100ms preview, 500ms save)
- Only overridden values are stored and transmitted

### Lighthouse Budgets

Theme-heavy pages should meet these budgets from `lighthouserc.json`:

| Metric | Budget | Notes |
|--------|--------|-------|
| LCP | < 4000ms | Largest Contentful Paint |
| TBT | < 300ms | Total Blocking Time |
| CLS | < 0.1 | Cumulative Layout Shift |
| Script size | < 250KB | Total JavaScript |
| Images | < 600KB | Total image weight |

Run Lighthouse CI locally:

```bash
pnpm lhci autorun --config=lighthouserc.json
pnpm lhci autorun --config=lighthouserc.shop.json
```

### Reduced Motion

The system respects `prefers-reduced-motion`:

- Global color/border transitions are disabled when the preference is set
- Theme changes apply instantly without animation
- Components should use `motion-safe:` Tailwind variants for animations

## Adding New Tokens

When adding tokens to the design system:

1. Update `packages/themes/base/src/tokens.ts` with light/dark values
2. Add contrast test cases for fg/bg pairs
3. Update `tokenGroups.ts` if the token should appear in Theme Editor
4. Update `usageMap.ts` with human-readable descriptions
5. Document in `token-component-matrix.md`

## Related Documentation

- [Theming Guide](./theming.md) - Theme Editor usage
- [Token Matrix](./token-component-matrix.md) - Token-to-component mappings
- [Palette](./palette.md) - Base color palette and contrast ratios
- [Typography and Color](./typography-and-color.md) - Font and color system details
