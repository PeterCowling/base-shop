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

## Element overrides
Each override merges with the current theme and updates the preview:

```tsx
// apps/cms/src/app/cms/shop/[shop]/themes/ThemeEditor.tsx
const handleOverrideChange = (key: string, defaultValue: string) => (value: string) => {
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
`WizardPreview` listens for token updates and merges them into its styles:

```tsx
// apps/cms/src/app/cms/wizard/WizardPreview.tsx
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

## CLI overrides

Theme tokens can also be supplied when creating a shop:

```bash
pnpm init-shop --brand "#663399" --tokens ./tokens.json
```

`--brand` generates tokens for the primary color while `--tokens` loads additional overrides from a JSON file.
