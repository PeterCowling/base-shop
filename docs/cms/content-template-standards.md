---
Type: Standard
Status: Active
Domain: CMS
Created: 2026-01-18
Created-by: Claude Opus 4.5
---

# Content Template Standards

This document defines the standardization rules for the content template library in `@acme/templates`. All templates must follow these conventions to ensure consistency, maintainability, and a predictable developer experience.

## Template ID Convention

Template IDs follow a hierarchical dot-notation pattern:

```
<origin>.<kind>.<page-type>.<variant>
```

| Segment | Values | Example |
|---------|--------|---------|
| origin | `core`, `remote`, `library` | `core` |
| kind | `page`, `section`, `slot-fragment` | `page` |
| page-type | `home`, `shop`, `product`, `checkout`, `legal` | `home` |
| variant | Descriptive name (kebab-case preferred) | `default`, `editorial`, `holiday` |

**Examples:**
- `core.page.home.default`
- `core.page.shop.lookbook`
- `core.page.product.lifestyle`
- `core.section.hero.minimal` (future)

## Component ID Convention

Component IDs within a template should follow this pattern:

```
<context>-<block-type-short>
```

**Rules:**
1. Use kebab-case for all component IDs
2. Prefix with page context when disambiguation is needed (e.g., `pdp-`, `checkout-`, `home-`)
3. Use short, descriptive names that indicate purpose
4. Avoid redundancy (don't repeat "section" in IDs for Section-type blocks)

**Standard Patterns:**

| Block Type | ID Pattern | Example |
|------------|------------|---------|
| HeroBanner | `<context>-hero` or just `hero` | `hero`, `shop-hero`, `pdp-hero` |
| ProductGrid | `<context>-grid` or `<context>-grid-<purpose>` | `home-grid`, `pdp-grid-related` |
| ValueProps | `value-props` | `value-props` |
| PromoTilesSection | `<context>-promos` or `promo-tiles` | `holiday-promos`, `promo-tiles` |
| PDPDetailsSection | `pdp-details` or `pdp-details-<variant>` | `pdp-details`, `pdp-details-luxury` |
| CheckoutSection | `checkout-main` | `checkout-main` |
| CartSection | `checkout-cart` | `checkout-cart` |
| Text | `<context>-story` or `<context>-text` | `pdp-story` |
| ImageSlider | `<context>-media` or `<context>-slider` | `pdp-media` |
| Callout | `<context>-cta` | `services-cta` |
| SocialProof | `social-proof` | `social-proof` |
| GuidedSellingSection | `gift-finder` or `<context>-guide` | `gift-finder` |

## Category Assignment

Categories group templates in the UI. Use these consistently:

| Category | Use When |
|----------|----------|
| `Commerce` | Product-focused pages: PDPs, PLPs, catalogs, shops |
| `Hero` | Campaign/editorial pages where hero content is the focus |
| `Features` | Feature showcase or comparison pages |
| `Legal` | Terms, privacy, policy pages |
| `System` | Checkout, cart, account pages |

**Guidelines:**
- Home pages with product focus → `Commerce`
- Home pages with editorial/campaign focus → `Hero`
- Shop/catalog pages → `Commerce`
- Product detail pages → `Commerce`
- Checkout/cart → `System`

## i18n Strategy

Template content follows a tiered localization approach:

### Tier 1: Template Metadata (Labels & Descriptions)

Template labels and descriptions are **hardcoded in English** with i18n-exempt comments. This is intentional because:
1. Templates are developer/CMS-operator facing, not end-user facing
2. The CMS UI that displays templates has its own i18n
3. Template labels serve as stable identifiers

**Format:**
```typescript
label: "Default home", // i18n-exempt -- TPL-001: template metadata
description: "Hero with CTA, value props, and featured products.", // i18n-exempt -- TPL-001: template metadata
```

### Tier 2: Placeholder Content

Placeholder content within blocks uses **i18n keys** that resolve at runtime. This allows shops to customize placeholder text per locale.

**Format:**
```typescript
// Use headlineKey/ctaKey for hero content
slides: [{ headlineKey: "home.hero.headline", ctaKey: "home.hero.cta" }]

// Use t() helper for content that should be translatable
caption: t("templates.holiday.promos.giftsUnder50")
```

### Tier 3: Alt Text & Accessibility

Alt text for placeholder images uses the **i18n-exempt comment** pattern since the actual images will be replaced:

```typescript
alt: "Hero image", // i18n-exempt -- TPL-001: placeholder alt
```

### i18n-exempt Comment Format

All i18n-exempt comments follow this format:

```typescript
// i18n-exempt -- TPL-001: <reason>
```

Where `TPL-001` is a tracking ticket for future i18n work (can be replaced with actual ticket when created).

**Valid reasons:**
- `template metadata` - for labels/descriptions
- `placeholder alt` - for placeholder image alt text
- `placeholder content` - for seed/demo content
- `component id` - for technical identifiers

## Preview Images

All templates must have a `previewImage` path defined:

```typescript
previewImage: "/templates/<template-variant>.svg"
```

**Naming convention:**
- Use the template variant as the filename
- Use SVG format for scalable previews
- Path is relative to public assets

**Examples:**
- `/templates/home-default.svg`
- `/templates/home-editorial.svg`
- `/templates/shop-lookbook.svg`
- `/templates/product-lifestyle.svg`

## Version Strategy

Template versions use semantic versioning but are primarily informational:

```typescript
version: "1.0.0"
```

**Version bumps:**
- MAJOR: Breaking changes to component structure
- MINOR: New optional components or props
- PATCH: Copy/content fixes, bug fixes

## Adding New Templates

When adding a new template, follow this checklist:

1. **ID**: Follow the `<origin>.<kind>.<page-type>.<variant>` pattern
2. **Version**: Start at `"1.0.0"`
3. **Label/Description**: Hardcode with `// i18n-exempt -- TPL-001: template metadata`
4. **Category**: Choose from `Commerce`, `Hero`, `Features`, `Legal`, `System`
5. **PageType**: Set to `marketing`, `legal`, or `fragment`
6. **PreviewImage**: Add path in `/templates/<variant>.svg` format
7. **Components**: Use standard ID patterns from this guide
8. **Origin**: Set to `"core"` for platform templates
9. **Export**: Add to appropriate group export (homePageTemplates, etc.)

## Template Catalog Summary

| Template ID | Category | Preview | Components |
|-------------|----------|---------|------------|
| `core.page.home.default` | Commerce | `/templates/home-default.svg` | hero, value-props, home-grid |
| `core.page.home.editorial` | Hero | `/templates/home-editorial.svg` | hero, promo-tiles, social-proof, home-grid |
| `core.page.home.holiday` | Hero | `/templates/home-holiday.svg` | hero, gift-finder, holiday-promos, holiday-grid |
| `core.page.shop.grid` | Commerce | `/templates/shop-grid.svg` | shop-grid |
| `core.page.shop.lookbook` | Commerce | `/templates/shop-lookbook.svg` | shop-hero, shop-grid-featured, shop-grid-secondary |
| `core.page.shop.services` | Commerce | `/templates/shop-services.svg` | services-hero, services-grid, services-cta |
| `core.page.product.default` | Commerce | `/templates/product-default.svg` | pdp-details, pdp-grid-related |
| `core.page.product.lifestyle` | Commerce | `/templates/product-lifestyle.svg` | pdp-media, pdp-details-luxury, pdp-story, pdp-related |
| `core.page.checkout.shell` | System | `/templates/checkout-shell.svg` | checkout-main, checkout-cart |

## Related Documentation

- [packages/templates/README.md](../../packages/templates/README.md) - Package overview
- [pagebuilder-library.md](../pagebuilder-library.md) - Library import/export and presets
- [page-builder-metadata.md](../page-builder-metadata.md) - Page Builder metadata schema
