/**
 * Caryina Theme CSS Config
 *
 * Maps all 20 structured token entries from tokens.ts to the CSS variable
 * names consumed by the caryina app. This is the bridge between the
 * three-layer system and global.css.
 *
 * Font vars use tokenVarMap (not fontVarMap) because tokens.ts stores
 * `var(--font-dm-sans)` — the same format as the current tokens.css output.
 * Using fontVarMap would emit the full family string instead.
 *
 * Dark mode selector: "html.theme-dark" matches the class toggled by
 * ThemeModeSwitch.tsx via applyResolvedMode().
 */
import type { ThemeCSSConfig } from "@themes/base";

import { assets } from "./assets";
import { profile } from "./design-profile";
import { tokens } from "./tokens";

export const themeCSSConfig: ThemeCSSConfig = {
  assets,
  profile,

  /**
   * Flat token map — all 20 vars from tokens.ts.
   * Emitted verbatim as CSS custom properties.
   */
  tokenVarMap: tokens as Record<`--${string}`, { light: string; dark?: string }>,

  /**
   * fontVarMap is intentionally empty: font vars are in tokenVarMap above
   * with `var(--font-dm-sans)` values matching the current tokens.css format.
   */
  fontVarMap: {},

  /**
   * No RGB triplet vars in caryina (no --rgb-* vars in tokens.css).
   */
  // rgbVarMap: undefined,

  /**
   * Dark mode selector: html.theme-dark is the class toggled by ThemeModeSwitch.tsx.
   * ThemeModeSwitch also toggles html.dark but html.theme-dark is the authoritative
   * caryina dark-mode selector.
   */
  darkSelector: "html.theme-dark",

  colorVarMap: {},
};
