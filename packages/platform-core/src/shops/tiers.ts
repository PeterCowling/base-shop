import "server-only";

/**
 * LAUNCH-29: Shop Tier Definitions
 *
 * Defines the tiered system for shop capabilities:
 * - Basic: ≤5 products, template-only, centralized inventory
 * - Standard: 6-50 products, templates + customization
 * - Enterprise: 50+ products, full customization
 */
import { z } from "zod";

// ============================================================
// Types
// ============================================================

/**
 * Shop tier levels.
 */
export type ShopTier = "basic" | "standard" | "enterprise";

/**
 * Feature flags controlled by tier.
 */
export interface TierFeatures {
  /** Maximum number of products */
  maxProducts: number;
  /** Maximum number of pages */
  maxPages: number;
  /** Can use custom themes (not just template selection) */
  customThemes: boolean;
  /** Can edit page content beyond templates */
  customPageContent: boolean;
  /** Can use per-shop provider accounts */
  perShopProviderAccounts: boolean;
  /** Can have custom legal pages */
  customLegalPages: boolean;
  /** Has access to analytics dashboard */
  analyticsDashboard: boolean;
  /** Has access to advanced reports */
  advancedReports: boolean;
  /** Can use A/B testing */
  abTesting: boolean;
  /** Can use multi-currency */
  multiCurrency: boolean;
  /** Can use multi-language (beyond defaults) */
  multiLanguage: boolean;
  /** Support level */
  supportLevel: "self-serve" | "email" | "dedicated";
  /** SLA level */
  slaLevel: "none" | "standard" | "premium";
  /** Can use PIM/ERP integrations */
  erpIntegration: boolean;
  /** Direct inventory writes allowed */
  directInventoryWrites: boolean;
}

/**
 * Tier-specific limits and quotas.
 */
export interface TierLimits {
  /** Max API requests per minute */
  apiRateLimit: number;
  /** Max file upload size in bytes */
  maxFileUploadSize: number;
  /** Max total storage in bytes */
  maxStorageBytes: number;
  /** Max concurrent checkout sessions */
  maxConcurrentCheckouts: number;
  /** Max variants per product */
  maxVariantsPerProduct: number;
  /** Max images per product */
  maxImagesPerProduct: number;
  /** Max categories */
  maxCategories: number;
  /** Max discount codes */
  maxDiscountCodes: number;
}

/**
 * Complete tier definition.
 */
export interface TierDefinition {
  /** Tier identifier */
  tier: ShopTier;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** Feature flags */
  features: TierFeatures;
  /** Resource limits */
  limits: TierLimits;
  /** Recommended use cases */
  useCases: string[];
  /** Upgrade path (next tier) */
  upgradeTo?: ShopTier;
  /** Downgrade path (previous tier) */
  downgradeFrom?: ShopTier;
}

// ============================================================
// Tier Definitions
// ============================================================

/**
 * Basic tier: Entry-level for small shops and testing.
 */
export const BASIC_TIER: TierDefinition = {
  tier: "basic",
  name: "Basic",
  description: "Perfect for pop-up shops, small launches, and testing",
  features: {
    maxProducts: 5,
    maxPages: 10,
    customThemes: false,
    customPageContent: false,
    perShopProviderAccounts: false,
    customLegalPages: false,
    analyticsDashboard: true,
    advancedReports: false,
    abTesting: false,
    multiCurrency: false,
    multiLanguage: false,
    supportLevel: "self-serve",
    slaLevel: "none",
    erpIntegration: false,
    directInventoryWrites: false,
  },
  limits: {
    apiRateLimit: 60,
    maxFileUploadSize: 5 * 1024 * 1024, // 5MB
    maxStorageBytes: 500 * 1024 * 1024, // 500MB
    maxConcurrentCheckouts: 10,
    maxVariantsPerProduct: 10,
    maxImagesPerProduct: 5,
    maxCategories: 5,
    maxDiscountCodes: 5,
  },
  useCases: [
    "Pop-up shops",
    "Product launches",
    "Testing and prototyping",
    "Small artisan sellers",
    "Event merchandise",
  ],
  upgradeTo: "standard",
};

/**
 * Standard tier: For growing businesses.
 */
export const STANDARD_TIER: TierDefinition = {
  tier: "standard",
  name: "Standard",
  description: "For growing businesses with established product lines",
  features: {
    maxProducts: 50,
    maxPages: 50,
    customThemes: true,
    customPageContent: true,
    perShopProviderAccounts: true,
    customLegalPages: true,
    analyticsDashboard: true,
    advancedReports: true,
    abTesting: false,
    multiCurrency: true,
    multiLanguage: true,
    supportLevel: "email",
    slaLevel: "standard",
    erpIntegration: false,
    directInventoryWrites: true,
  },
  limits: {
    apiRateLimit: 300,
    maxFileUploadSize: 20 * 1024 * 1024, // 20MB
    maxStorageBytes: 5 * 1024 * 1024 * 1024, // 5GB
    maxConcurrentCheckouts: 50,
    maxVariantsPerProduct: 50,
    maxImagesPerProduct: 20,
    maxCategories: 25,
    maxDiscountCodes: 50,
  },
  useCases: [
    "Growing e-commerce businesses",
    "Established brands",
    "Multi-product catalogs",
    "Seasonal merchandise",
  ],
  upgradeTo: "enterprise",
  downgradeFrom: "basic",
};

/**
 * Enterprise tier: For high-volume merchants.
 */
export const ENTERPRISE_TIER: TierDefinition = {
  tier: "enterprise",
  name: "Enterprise",
  description: "For high-volume merchants with complex requirements",
  features: {
    maxProducts: Infinity,
    maxPages: Infinity,
    customThemes: true,
    customPageContent: true,
    perShopProviderAccounts: true,
    customLegalPages: true,
    analyticsDashboard: true,
    advancedReports: true,
    abTesting: true,
    multiCurrency: true,
    multiLanguage: true,
    supportLevel: "dedicated",
    slaLevel: "premium",
    erpIntegration: true,
    directInventoryWrites: true,
  },
  limits: {
    apiRateLimit: 1000,
    maxFileUploadSize: 100 * 1024 * 1024, // 100MB
    maxStorageBytes: 50 * 1024 * 1024 * 1024, // 50GB
    maxConcurrentCheckouts: 500,
    maxVariantsPerProduct: 200,
    maxImagesPerProduct: 50,
    maxCategories: Infinity,
    maxDiscountCodes: Infinity,
  },
  useCases: [
    "High-volume merchants",
    "Multi-channel retailers",
    "B2B commerce",
    "Custom integrations",
    "Complex product catalogs",
  ],
  downgradeFrom: "standard",
};

/**
 * All tier definitions indexed by tier name.
 */
export const TIER_DEFINITIONS: Record<ShopTier, TierDefinition> = {
  basic: BASIC_TIER,
  standard: STANDARD_TIER,
  enterprise: ENTERPRISE_TIER,
};

// ============================================================
// Schemas
// ============================================================

/**
 * Zod schema for shop tier.
 */
export const shopTierSchema = z.enum(["basic", "standard", "enterprise"]);

/**
 * Zod schema for tier features.
 */
export const tierFeaturesSchema = z.object({
  maxProducts: z.number().min(0),
  maxPages: z.number().min(0),
  customThemes: z.boolean(),
  customPageContent: z.boolean(),
  perShopProviderAccounts: z.boolean(),
  customLegalPages: z.boolean(),
  analyticsDashboard: z.boolean(),
  advancedReports: z.boolean(),
  abTesting: z.boolean(),
  multiCurrency: z.boolean(),
  multiLanguage: z.boolean(),
  supportLevel: z.enum(["self-serve", "email", "dedicated"]),
  slaLevel: z.enum(["none", "standard", "premium"]),
  erpIntegration: z.boolean(),
  directInventoryWrites: z.boolean(),
});

// ============================================================
// Utility Functions
// ============================================================

/**
 * Get the tier definition for a given tier.
 */
export function getTierDefinition(tier: ShopTier): TierDefinition {
  return TIER_DEFINITIONS[tier];
}

/**
 * Get features for a tier.
 */
export function getTierFeatures(tier: ShopTier): TierFeatures {
  return TIER_DEFINITIONS[tier].features;
}

/**
 * Get limits for a tier.
 */
export function getTierLimits(tier: ShopTier): TierLimits {
  return TIER_DEFINITIONS[tier].limits;
}

/**
 * Check if a feature is available for a tier.
 */
export function hasFeature<K extends keyof TierFeatures>(
  tier: ShopTier,
  feature: K
): boolean {
  const features = getTierFeatures(tier);
  const value = features[feature];

  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value > 0;
  }
  return value !== undefined;
}

/**
 * Check if an operation would exceed tier limits.
 */
export function checkTierLimit<K extends keyof TierLimits>(
  tier: ShopTier,
  limit: K,
  currentValue: number,
  increment: number = 1
): { allowed: boolean; limit: number; remaining: number } {
  const limits = getTierLimits(tier);
  const maxValue = limits[limit];
  const newValue = currentValue + increment;
  const allowed = newValue <= maxValue;
  const remaining = Math.max(0, maxValue - currentValue);

  return { allowed, limit: maxValue, remaining };
}

/**
 * Determine the minimum tier required for a given product count.
 */
export function getRequiredTierForProducts(productCount: number): ShopTier {
  if (productCount <= BASIC_TIER.features.maxProducts) {
    return "basic";
  }
  if (productCount <= STANDARD_TIER.features.maxProducts) {
    return "standard";
  }
  return "enterprise";
}

/**
 * Determine the minimum tier required for a given page count.
 */
export function getRequiredTierForPages(pageCount: number): ShopTier {
  if (pageCount <= BASIC_TIER.features.maxPages) {
    return "basic";
  }
  if (pageCount <= STANDARD_TIER.features.maxPages) {
    return "standard";
  }
  return "enterprise";
}

/**
 * Compare two tiers.
 * Returns negative if tier1 < tier2, positive if tier1 > tier2, 0 if equal.
 */
export function compareTiers(tier1: ShopTier, tier2: ShopTier): number {
  const order: Record<ShopTier, number> = {
    basic: 0,
    standard: 1,
    enterprise: 2,
  };
  return order[tier1] - order[tier2];
}

/**
 * Check if tier1 is at least at the level of tier2.
 */
export function tierAtLeast(tier1: ShopTier, tier2: ShopTier): boolean {
  return compareTiers(tier1, tier2) >= 0;
}

// ============================================================
// Validation
// ============================================================

/**
 * Result of tier validation.
 */
export interface TierValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestedTier?: ShopTier;
}

/**
 * Shop metrics for tier validation.
 */
export interface ShopMetrics {
  productCount: number;
  pageCount: number;
  categoryCount: number;
  variantsPerProduct?: number[];
  imagesPerProduct?: number[];
  discountCodeCount?: number;
  hasCustomTheme?: boolean;
  hasCustomLegalPages?: boolean;
  hasPerShopProviderAccounts?: boolean;
}

/**
 * Validate shop metrics against a tier's limits.
 */
export function validateShopForTier(
  tier: ShopTier,
  metrics: ShopMetrics
): TierValidationResult {
  const result: TierValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  const definition = getTierDefinition(tier);
  const features = definition.features;
  const limits = definition.limits;

  // Check product count
  if (metrics.productCount > features.maxProducts) {
    result.valid = false;
    result.errors.push(
      `Product count (${metrics.productCount}) exceeds ${tier} tier limit (${features.maxProducts})`
    );
  }

  // Check page count
  if (metrics.pageCount > features.maxPages) {
    result.valid = false;
    result.errors.push(
      `Page count (${metrics.pageCount}) exceeds ${tier} tier limit (${features.maxPages})`
    );
  }

  // Check category count
  if (metrics.categoryCount > limits.maxCategories) {
    result.valid = false;
    result.errors.push(
      `Category count (${metrics.categoryCount}) exceeds ${tier} tier limit (${limits.maxCategories})`
    );
  }

  // Check discount codes
  if (
    metrics.discountCodeCount !== undefined &&
    metrics.discountCodeCount > limits.maxDiscountCodes
  ) {
    result.valid = false;
    result.errors.push(
      `Discount code count (${metrics.discountCodeCount}) exceeds ${tier} tier limit (${limits.maxDiscountCodes})`
    );
  }

  // Check custom theme
  if (metrics.hasCustomTheme && !features.customThemes) {
    result.valid = false;
    result.errors.push(`Custom themes not available on ${tier} tier`);
  }

  // Check custom legal pages
  if (metrics.hasCustomLegalPages && !features.customLegalPages) {
    result.valid = false;
    result.errors.push(`Custom legal pages not available on ${tier} tier`);
  }

  // Check per-shop provider accounts
  if (metrics.hasPerShopProviderAccounts && !features.perShopProviderAccounts) {
    result.valid = false;
    result.errors.push(
      `Per-shop provider accounts not available on ${tier} tier`
    );
  }

  // Check variants per product
  if (metrics.variantsPerProduct) {
    const maxVariants = Math.max(...metrics.variantsPerProduct);
    if (maxVariants > limits.maxVariantsPerProduct) {
      result.valid = false;
      result.errors.push(
        `Max variants per product (${maxVariants}) exceeds ${tier} tier limit (${limits.maxVariantsPerProduct})`
      );
    }
  }

  // Check images per product
  if (metrics.imagesPerProduct) {
    const maxImages = Math.max(...metrics.imagesPerProduct);
    if (maxImages > limits.maxImagesPerProduct) {
      result.valid = false;
      result.errors.push(
        `Max images per product (${maxImages}) exceeds ${tier} tier limit (${limits.maxImagesPerProduct})`
      );
    }
  }

  // If invalid, suggest the required tier
  if (!result.valid) {
    const productTier = getRequiredTierForProducts(metrics.productCount);
    const pageTier = getRequiredTierForPages(metrics.pageCount);
    result.suggestedTier =
      compareTiers(productTier, pageTier) >= 0 ? productTier : pageTier;
  }

  // Add warnings for approaching limits
  const productUsage = metrics.productCount / features.maxProducts;
  if (productUsage >= 0.8 && productUsage < 1) {
    result.warnings.push(
      `Product count (${metrics.productCount}) at ${Math.round(productUsage * 100)}% of ${tier} tier limit`
    );
  }

  const pageUsage = metrics.pageCount / features.maxPages;
  if (pageUsage >= 0.8 && pageUsage < 1) {
    result.warnings.push(
      `Page count (${metrics.pageCount}) at ${Math.round(pageUsage * 100)}% of ${tier} tier limit`
    );
  }

  return result;
}

// ============================================================
// Guards
// ============================================================

/**
 * Guard function to block direct inventory writes for Basic tier.
 * Throws if the operation is not allowed.
 */
export function guardDirectInventoryWrite(
  tier: ShopTier,
  operation: string
): void {
  if (!hasFeature(tier, "directInventoryWrites")) {
    throw new Error(
      `Direct inventory writes not allowed for ${tier} tier. ` +
        `Operation: ${operation}. Use centralized inventory instead.`
    );
  }
}

/**
 * Guard function to block custom themes for Basic tier.
 */
export function guardCustomTheme(tier: ShopTier): void {
  if (!hasFeature(tier, "customThemes")) {
    throw new Error(
      `Custom themes not available for ${tier} tier. ` +
        `Use template-based theme selection instead.`
    );
  }
}

/**
 * Guard function to block custom legal pages for Basic tier.
 */
export function guardCustomLegalPage(tier: ShopTier): void {
  if (!hasFeature(tier, "customLegalPages")) {
    throw new Error(
      `Custom legal pages not available for ${tier} tier. ` +
        `Use pre-approved legal templates instead.`
    );
  }
}

/**
 * Guard function to check tier limits before operations.
 */
export function guardTierLimit<K extends keyof TierLimits>(
  tier: ShopTier,
  limit: K,
  currentValue: number,
  increment: number = 1,
  operationName: string = "Operation"
): void {
  const check = checkTierLimit(tier, limit, currentValue, increment);
  if (!check.allowed) {
    throw new Error(
      `${operationName} would exceed ${tier} tier ${limit} limit ` +
        `(${currentValue + increment}/${check.limit})`
    );
  }
}
