Type: Guide
Status: Active
Domain: Theming
Last-reviewed: 2025-12-02

# Advanced Theming

## Base themes

Selecting a base theme resets overrides and reloads its default tokens:

```tsx
// apps/cms/src/app/cms/shop/[shop]/themes/ThemeEditor.tsx
const handleThemeChange = (e: ChangeEvent<HTMLSelectElement>) => {
  const next = e.target.value;
  setTheme(next);
  setOverrides({});
  setThemeDefaults(tokensByThemeState[next]);
  schedulePreviewUpdate(tokensByThemeState[next]);
};
```

Theme selection also persists `themeId` and new defaults to the shop so subsequent sessions stay aligned with the selected theme.

## Element overrides

Each override merges with the current theme and updates the preview:

```tsx
// apps/cms/src/app/cms/shop/[shop]/themes/ThemeEditor.tsx
const handleOverrideChange =
  (key: string, defaultValue: string) => (value: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      if (!value || value === defaultValue) {
        delete next[key];
      } else {
        next[key] = value;
      }
      const merged = { ...tokensByThemeState[theme], ...next };
      schedulePreviewUpdate(merged);
      return next;
    });
  };
```

## Persistence

Preview tokens are saved to `localStorage` and shop configs persist theme data:

```tsx
// apps/cms/src/app/cms/shop/[shop]/themes/ThemeEditor.tsx
useEffect(() => {
  savePreviewTokens(previewTokens);
}, [previewTokens]);
```

```json
// packages/platform-core/src/repositories/shops/schema.json
{
  "themeId": { "type": "string" },
  "themeDefaults": {
    "type": "object",
    "additionalProperties": { "type": "string" },
    "description": "Mapping of design tokens to original theme values",
    "default": {}
  },
  "themeOverrides": {
    "type": "object",
    "additionalProperties": { "type": "string" },
    "default": {}
  },
  "themeTokens": {
    "type": "object",
    "additionalProperties": { "type": "string" },
    "description": "Mapping of design tokens to theme values (defaults merged with overrides)"
  }
}
```

## Live preview

The configurator preview listens for token updates and merges them into its styles:

```tsx
useEffect(() => {
  const handle = () => {
    setThemeStyle((prev) => ({ ...prev, ...loadPreviewTokens() }));
  };
  handle();
  window.addEventListener("storage", handle);
  window.addEventListener(PREVIEW_TOKENS_EVENT, handle);
  return () => {
    window.removeEventListener("storage", handle);
    window.removeEventListener(PREVIEW_TOKENS_EVENT, handle);
  };
}, []);
```

## Brand intensity preview

The Theme Editor supports a brand intensity control that blends an overlay into the preview. This affects preview tokens only and does not mutate stored overrides unless you explicitly change a token.

## CLI overrides

Theme tokens can also be supplied when creating a shop:

```bash
pnpm quickstart-shop --brand "#663399" --tokens ./tokens.json
```

`--brand` generates tokens for the primary color while `--tokens` loads additional overrides from a JSON file. For `init-shop`, use the interactive token prompts or provide `themeOverrides` via the config file instead.

## Creating a new theme package

For a reusable theme package that can be shared across shops, use the `generate-theme` CLI:

```bash
# Generate a complete theme package
pnpm generate-theme --name my-brand --primary '#2563eb'

# With custom accent color
pnpm generate-theme --name my-brand --primary '#2563eb' --accent '#7c3aed'

# Generate a dark theme variant
pnpm generate-theme --name my-brand-dark --primary '#3b82f6' --dark
```

This creates a fully functional theme package at `packages/themes/<name>/` with:

| File | Purpose |
|------|---------|
| `src/tailwind-tokens.ts` | Token overrides for Tailwind integration |
| `src/index.ts` | Package exports |
| `src/tokens.css` | CSS custom properties for direct import |
| `__tests__/contrast.test.ts` | Automated WCAG contrast validation |
| `README.md` | Documentation with color palette swatches |

The generated theme includes:
- An 11-shade color palette (50-950) derived from your primary color
- WCAG 2.1 AA compliant contrast ratios
- Harmonized semantic colors (success, warning, danger, info)
- Surface and border tokens
- Gradient tokens for hero sections

After generating, install dependencies and build:

```bash
pnpm install
pnpm --filter @themes/<name> build
```

Then use the theme with `init-shop --theme <name>` or in the CMS Theme Editor.
