Type: Guide
Status: Active
Domain: Theming
Last-reviewed: 2025-12-02

# Elevation and Hero Contrast

This repo ships a token-driven elevation scale and contrast-safe hero background utilities. Use them to create depth and maintain WCAG contrast in both light and dark themes.

## Elevation scale

Tokens (light/dark tuned):
- `--elevation-0`: none
- `--elevation-1`: subtle separation
- `--elevation-2`: standard surface lift
- `--elevation-3`: prominent card
- `--elevation-4`: hero/major modules
- `--elevation-5`: spotlight panels/overlays

Tailwind aliases:
- `shadow-elevation-0..5` map to the tokens above

Guidance:
- Small tiles/chips: `shadow-elevation-1`
- Standard cards/drawers: `shadow-elevation-3`
- Hero sections: `shadow-elevation-4`
- Featured panels: `shadow-elevation-5`

Tokens live in:
- `@themes/base/tokens.css`
- `@themes/dark/tokens.css`
- App-specific overrides: `apps/cms/src/app/cms.tokens.css`

## Hero contrast

Utilities:
- `bg-hero`: brand gradient background
- `bg-hero-contrast`: gradient with an accessibility overlay layer
- `text-hero-foreground`: pairs with `bg-hero-contrast` for WCAG contrast

Overlay control:
- `--hero-contrast-overlay`: default `0 0% 0% / 0.55`
- Adjust per app if your hero needs a lighter/darker overlay.

Examples:

```tsx
<section className="rounded-3xl bg-hero-contrast text-hero-foreground shadow-elevation-4">
  <h1 className="text-3xl font-semibold">Operate with confidence</h1>
  <p className="text-hero-foreground/80">Dashboards, live previews, and more.</p>
</section>
```

Notes:
- Avoid pairing `bg-hero` with `text-primary-foreground` for long-form text. Use `bg-hero-contrast` and `text-hero-foreground` instead.
- The CMS lints against unsafe `bg-hero` usage.
