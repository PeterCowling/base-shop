# Theming and Live Preview

Base themes provide the starting set of design tokens for a shop. The **Theme Editor** lets you pick a base theme and layer token overrides on top. Overrides merge with the base tokens and are persisted with the shop so they can be shared across sessions.

## Device presets
Both the Page Builder and live preview now support selecting from common device presets (iPhone models, iPads, Galaxy phones, desktops). Use the device menu to switch widths and breakpoints. The original Desktop/Tablet/Mobile buttons map to the closest preset for backward compatibility.

## Selecting elements and overriding colors
1. Open the Theme Editor in the CMS.
2. The preview uses `WizardPreview` in inspect mode. Clicking any tokenised element highlights it and focuses its matching input.
3. Click a color swatch or field to open the picker and enter a new value. Only differences from the base theme are stored as overrides.

## Presets
- Type a name in *Preset name* and press **Save Preset** to capture the current set of overrides.
- Presets appear in the theme list and can be removed with **Delete Preset**.

## Resetting to defaults
- Use the reset icon beside a color input to remove its override.
- To clear an override outside the editor, call `resetThemeOverride(shop, token)` from [`apps/cms/src/actions/shops.server.ts`](../apps/cms/src/actions/shops.server.ts).

## Implementation references
- **Theme Editor** – [`apps/cms/src/app/cms/shop/[shop]/themes/ThemeEditor.tsx`](../apps/cms/src/app/cms/shop/[shop]/themes/ThemeEditor.tsx)
- **Live preview** – [`apps/cms/src/app/cms/wizard/WizardPreview.tsx`](../apps/cms/src/app/cms/wizard/WizardPreview.tsx)
- **Server actions** – [`apps/cms/src/actions/shops.server.ts`](../apps/cms/src/actions/shops.server.ts)
