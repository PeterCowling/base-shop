// packages/themes/base/src/index.ts
export { assets as baseAssets } from "./assets";
export { generateAssetCSS } from "./build-assets";
export { BORDER_MAP,ELEVATION_MAP, generateProfileCSS, RADIUS_MAP } from "./build-profile";
export { generateRecipeCSS } from "./build-recipes";
export type { GenerateThemeCSSOptions, ThemeCSSConfig } from "./build-theme-css";
export { generateThemeCSS, hexToRgbTriplet } from "./build-theme-css";
export { profile as baseProfile } from "./design-profile";
export * from "./easing";
export { recipes as baseRecipes } from "./recipes";
export type * from "./theme-expression";
export * from "./tokens";

// Export core token scales (single source of truth for design-tokens package)
export {
  coreContainers,
  coreFontSizes,
  coreFontWeights,
  coreLetterSpacing,
  coreLineHeights,
  coreOpacity,
  coreSizes,
  coreSpacing,
  coreZIndex,
  type TokenRecord,
} from "./tokens.extensions";
