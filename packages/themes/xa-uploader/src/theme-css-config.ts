/**
 * xa-uploader Theme CSS Config
 *
 * All 17 `--gate-*` tokens are emitted via `derivedVars.light`.
 * We do not use `colorVarMap` because that would prefix var names with `--color-`,
 * changing them from `--gate-*` to `--color-gate-*` and breaking all consumers.
 *
 * Split:
 *   - 14 plain-color entries: derived from assets.brandColors (single source of truth)
 *   - 3 alpha-channel entries: hardcoded (cannot be expressed as plain hex in ThemeAssets)
 */
/* eslint-disable ds/no-raw-color -- theme config IS the color source of truth */
import type { BrandColor, ThemeCSSConfig } from "@themes/base";

import { assets } from "./assets";
import { profile } from "./design-profile";

/**
 * Convert camelCase asset key to kebab-case CSS var suffix.
 * e.g. "accentSoft" → "accent-soft", "headerBg" → "header-bg"
 */
function toKebab(key: string): string {
  return key.replace(/([A-Z])/g, "-$1").toLowerCase();
}

/**
 * Build derivedVars light entries from brandColors.
 * Returns Record<"gate-<kebab-key>", value-string>.
 */
function buildGateVars(
  colors: Record<string, BrandColor | string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(colors).map(([key, val]) => [
      `gate-${toKebab(key)}`,
      typeof val === "string" ? val : val.light,
    ]),
  );
}

export const themeCSSConfig: ThemeCSSConfig = {
  assets,
  profile,

  // Empty — using derivedVars.light for all vars to preserve --gate-* naming
  colorVarMap: {},
  fontVarMap: {},
  rgbVarMap: {},

  derivedVars: {
    light: {
      // 14 plain-color entries derived from assets.brandColors (single source of truth)
      ...buildGateVars(assets.brandColors),

      // 3 alpha-channel entries — cannot be expressed as plain hex in brandColors
      "gate-border": "hsl(0 0% 10% / 0.22)",
      "gate-header-border": "hsl(0 0% 100% / 0.2)",
      "gate-header-accent": "hsl(190 70% 40% / 0.35)",
    },
  },
};
