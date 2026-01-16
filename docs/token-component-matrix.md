Type: Guide
Status: Active
Domain: Theming
Last-reviewed: 2026-01-13

# Token-Component Matrix

This document maps design tokens to UI components, ensuring alignment between `packages/themes/base/src/tokens.ts` and actual component usage in `packages/ui`.

## Color Tokens

### Core Surfaces

| Token | Components | Theme Editor Group |
|-------|------------|-------------------|
| `--color-bg` | HeroBanner, Toast, SearchBar, NavigationPreview, primitives (card, input) | surfacesText |
| `--color-fg` | ProductBadge, Tag, Toast, Footer, most text components | surfacesText |
| `--color-bg-1` | (base only, not directly referenced) | surfacesText |
| `--color-bg-2` | (base only, not directly referenced) | surfacesText |
| `--color-bg-3` | (base only, not directly referenced) | surfacesText |
| `--color-bg-4` | (base only, not directly referenced) | surfacesText |
| `--color-bg-5` | (base only, not directly referenced) | surfacesText |
| `--color-panel` | (base only, not directly referenced) | surfacesText |
| `--color-inset` | (base only, not directly referenced) | surfacesText |
| `--color-border` | MediaSelector, page-builder components | surfacesText |
| `--color-border-strong` | (minimal usage) | surfacesText |
| `--color-border-muted` | (minimal usage) | surfacesText |
| `--color-fg-muted` | Progress (label), secondary text contexts | surfacesText |

### Primary/Accent Family

| Token | Components | Theme Editor Group |
|-------|------------|-------------------|
| `--color-primary` | Button, Checkbox, Progress, AnnouncementBar, ProductBadge, Tag, Alert, Switch | primaryAccent |
| `--color-primary-fg` | Button (text), ProfileForm, MfaChallenge, RevokeSessionButton | primaryAccent |
| `--color-primary-soft` | ProductBadge (soft), Tag (soft) | primaryAccent |
| `--color-primary-hover` | (CSS hover states) | primaryAccent |
| `--color-primary-active` | (CSS active states) | primaryAccent |
| `--color-accent` | ProductBadge, Tag, Button variants | primaryAccent |
| `--color-accent-fg` | ProductBadge, Tag | primaryAccent |
| `--color-accent-soft` | ProductBadge (soft), Tag (soft) | primaryAccent |

### Status Colors

| Token | Components | Theme Editor Group |
|-------|------------|-------------------|
| `--color-success` | StockStatus, Alert, ProductBadge, Tag, UploadPanel | statusColors |
| `--color-success-fg` | ProductBadge, Tag | statusColors |
| `--color-success-soft` | ProductBadge (soft), Tag (soft) | statusColors |
| `--color-info` | Alert, ProductBadge, Tag, Toast | statusColors |
| `--color-info-fg` | ProductBadge, Tag | statusColors |
| `--color-info-soft` | ProductBadge (soft), Tag (soft) | statusColors |
| `--color-warning` | ProductBadge, Tag, Alert | statusColors |
| `--color-warning-fg` | ProductBadge, Tag | statusColors |
| `--color-warning-soft` | ProductBadge (soft), Tag (soft) | statusColors |
| `--color-danger` | FormField, StockStatus, Alert, ProductBadge, Tag, Button, Toast, HeaderCart, DeleteButton | statusColors |
| `--color-danger-fg` | ProductBadge, Tag, CheckoutForm | statusColors |
| `--color-danger-soft` | ProductBadge (soft), Tag (soft) | statusColors |

### Muted/Neutral

| Token | Components | Theme Editor Group |
|-------|------------|-------------------|
| `--color-muted` | ReviewsCarousel, Progress, ProductBadge, Button, Toast, Footer | (surfacesText via --color-bg) |
| `--color-muted-fg` | Progress label, Sessions | (not in tokenGroups) |
| `--color-muted-border` | (minimal usage) | (not in tokenGroups) |

### Interaction

| Token | Components | Theme Editor Group |
|-------|------------|-------------------|
| `--color-focus-ring` | Focus states (via Tailwind ring utilities) | interaction |
| `--color-selection` | Text selection styling | interaction |
| `--color-highlight` | Keyboard highlights | interaction |
| `--color-link` | Anchor links | interaction |

### Overlays

| Token | Components | Theme Editor Group |
|-------|------------|-------------------|
| `--overlay-scrim-1` | Modal overlays | overlays |
| `--overlay-scrim-2` | Heavy overlays, lightbox | overlays |

## Font Tokens

| Token | Components | Notes |
|-------|------------|-------|
| `--font-body` | ThemeStyle, FontsPanel | Body text stack |
| `--font-heading-1` | ThemeStyle, FontsPanel | H1-H3 heading stack |
| `--font-heading-2` | ThemeStyle, FontsPanel | H4-H6 heading stack |
| `--font-sans` | FontsPanel, primitives | Fallback sans-serif |
| `--font-mono` | Code blocks | Monospace stack |

## Spacing/Radius/Shadow Tokens

These tokens are defined in `tokens.extensions.ts` but components primarily use Tailwind utility classes rather than direct token references.

| Token | Usage |
|-------|-------|
| `--radius-lg` | effectPresets.ts (button/card presets) |
| `--space-*` | Not directly referenced (Tailwind utilities used) |
| `--shadow-*` | Not directly referenced (Tailwind utilities used) |

## Gaps Identified

### Tokens defined but not in Theme Editor tokenGroups.ts

1. **`--color-muted-fg`** - Used by Progress, should be in surfacesText
2. **`--color-muted-border`** - Defined but minimal usage
3. **`--surface-1`** through **`--surface-input`** - Layered surfaces not exposed
4. **`--hero-fg`** - Hero foreground not in editor
5. **`--ring`**, **`--ring-offset`** - Focus ring tokens not exposed

### Tokens in Theme Editor but under-documented

1. **`--color-bg-1` through `--color-bg-5`** - Semantic step tokens defined but not used directly by components (components use `--color-bg` or Tailwind classes)

### Components with data-token attributes

These components expose tokens via `data-token` for Theme Editor inspection:

| Component | Tokens |
|-----------|--------|
| AnnouncementBar | `--color-primary`, `--color-primary-fg` |
| StickyAddToCartBar | `--color-bg` |
| LiveChatWidget | `--color-bg`, `--color-primary`, `--color-muted` |
| ProductBadge | Multiple status colors |
| Tag | Multiple status colors |
| Progress | `--color-muted`, `--color-primary`, `--color-muted-fg` |
| Switch | `--color-primary`, `--color-bg` |
| Toast | `--color-fg`, `--color-bg` |

## Recommendations

1. **Add missing tokens to tokenGroups.ts:**
   - Add `--color-muted-fg` to surfacesText group
   - Consider exposing `--surface-*` tokens for advanced users

2. **Document token usage in components:**
   - Ensure all components using semantic tokens have `data-token` attributes
   - Keep `theme-editor-tokens.md` in sync with actual component implementation

3. **Contrast testing coverage:**
   - Existing tests cover core pairs in `packages/themes/base/__tests__/contrast.test.ts`
   - Tests also exist for all themes in `apps/cms/__tests__/themes.tokens.contrast.test.ts`
