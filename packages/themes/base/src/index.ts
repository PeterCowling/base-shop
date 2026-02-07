// packages/themes/base/src/index.ts
export * from "./easing";
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
