// packages/platform-core/src/shops/index.ts
/**
 * Shop utilities - includes both universal and server-only exports.
 *
 * For client components, import from '@acme/platform-core/shops/client' instead
 * to avoid bundling server-only code.
 */

// Re-export all universal utilities
export {
  getDomain,
  getEditorialBlog,
  getSanityConfig,
  getShopAppPackage,
  getShopAppSlug,
  getShopWorkflowName,
  normalizeShopId,
  type SanityBlogConfig,
  setDomain,
  setEditorialBlog,
  setSanityConfig,
  type Shop,
  SHOP_NAME_RE,
  type ShopDomain,
  type ShopIdTarget,
  validateShopName,
} from "./universal";

// Server-only exports
export { checkShopExists } from "./checkShopExists.server";
export { incrementOperationalError } from "./health";

// Tier definitions (LAUNCH-29)
export {
  // Constants
  BASIC_TIER,
  checkTierLimit,
  compareTiers,
  ENTERPRISE_TIER,
  getRequiredTierForPages,
  getRequiredTierForProducts,
  // Functions
  getTierDefinition,
  getTierFeatures,
  getTierLimits,
  guardCustomLegalPage,
  guardCustomTheme,
  // Guards
  guardDirectInventoryWrite,
  guardTierLimit,
  hasFeature,
  type ShopMetrics,
  // Types
  type ShopTier,
  shopTierSchema,
  STANDARD_TIER,
  TIER_DEFINITIONS,
  tierAtLeast,
  type TierDefinition,
  type TierFeatures,
  tierFeaturesSchema,
  type TierLimits,
  type TierValidationResult,
  validateShopForTier,
} from "./tiers";
