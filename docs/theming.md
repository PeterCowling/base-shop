Type: Guide
Status: Active
Domain: Theming
Last-reviewed: 2025-12-02

# Theming and Live Preview

Base themes provide the starting set of design tokens for a shop. The **Theme Editor** lets you pick a base theme and layer token overrides on top. Overrides merge with the base tokens and are persisted with the shop so they can be shared across sessions.

## Device presets

Both the Page Builder and live preview provide a device menu with presets for common screens:

- Desktop 1280
- Desktop 1440
- iPad
- iPad Pro
- iPhone SE
- iPhone 12
- Galaxy S8

Use the desktop/tablet/mobile buttons or the dropdown to switch widths and breakpoints. Selections are kept only for the current session and reset to **Desktop 1280** on reload. The original Desktop/Tablet/Mobile buttons map to the closest preset for backward compatibility.

## Selecting elements and overriding colors

1. Open the Theme Editor in the CMS.
2. The preview offers an inspect mode. Clicking any tokenised element highlights it and focuses its matching input.
3. Click a color swatch or field to open the picker and enter a new value. Only differences from the base theme are stored as overrides.

## Brand intensity

The Theme Editor includes a brand intensity control that previews subtle or bold brand overlays while keeping overrides intact. This is a preview-only adjustment; persisted tokens remain the explicit overrides you set.

## Contrast warnings

When overrides push key foreground/background pairs below the WCAG AA target, the Theme Editor surfaces a warning list so you can adjust token pairs before publishing.

## Presets

- Type a name in _Preset name_ and press **Save Preset** to capture the current set of overrides.
- Presets appear in the theme list and can be removed with **Delete Preset**.

## Resetting to defaults

- Use the reset icon beside a color input to remove its override.
- Use **Reset all** to clear every override at once (with confirmation).
- To clear an override outside the editor, call `resetThemeOverride(shop, token)` from [`apps/cms/src/actions/shops.server.ts`](../apps/cms/src/actions/shops.server.ts).

## Implementation references

- **Theme Editor** – [`apps/cms/src/app/cms/shop/[shop]/themes/ThemeEditor.tsx`](../apps/cms/src/app/cms/shop/[shop]/themes/ThemeEditor.tsx)
- **CMS inline help pattern** – [`docs/cms/shop-build-ui-patterns.md`](./cms/shop-build-ui-patterns.md) (see `CmsInlineHelpBanner`)
- **Live preview** – [`apps/cms/src/app/cms/configurator/steps/ThemeEditorForm.tsx`](../apps/cms/src/app/cms/configurator/steps/ThemeEditorForm.tsx)
- **Server actions** – [`apps/cms/src/actions/shops.server.ts`](../apps/cms/src/actions/shops.server.ts)
