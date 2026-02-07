import { createHash } from "crypto";
import { join } from "path";

import { type Environment,type ShopConfig, shopConfigSchema } from "@acme/types";

import { prisma } from "../db";

import { createShop } from "./createShop";
import { defaultPaymentProviders } from "./defaultPaymentProviders";
import type { DeployShopResult } from "./deployTypes";
import { ensureDir, fileExists, readFile,writeJSON } from "./fsUtils";
import {
  type ComplianceSignOff,
  type CreateShopOptions,
  createShopOptionsSchema as baseCreateShopOptionsSchema,
  type LaunchConfig,
  launchConfigSchema as baseLaunchConfigSchema,
  type NavItem,
  OPTIONAL_LEGAL_PAGES,
  type OptionalLegalPageSlug,
  type PageConfig,
  type PreparedCreateShopOptions,
  prepareOptions,
  REQUIRED_LEGAL_PAGES,
  REQUIRED_PAGES_BASIC,
  type RequiredLegalPageSlug,
  type RequiredPageSlug,
  type SeoConfig,
} from "./schema";

export { createShop } from "./createShop";
export { deployShop, deployShopImpl } from "./deploy";
export {
  CloudflareDeploymentAdapter,
  defaultDeploymentAdapter,
  type ShopDeploymentAdapter,
} from "./deploymentAdapter";
export {
  copyTemplate,
  ensureDir,
  ensureTemplateExists,
  listThemes,
  readFile,
  repoRoot,
  syncTheme,
  writeFile,
  writeJSON,
} from "./fsUtils";
export { loadBaseTokens,loadTokens } from "./themeUtils";
export { prepareOptions };
export { REQUIRED_PAGES_BASIC };
// LAUNCH-27: Legal page exports
export { OPTIONAL_LEGAL_PAGES,REQUIRED_LEGAL_PAGES };
export type { CreateShopOptions, NavItem, PageConfig, PreparedCreateShopOptions, RequiredPageSlug, SeoConfig };
export type { ComplianceSignOff, LaunchConfig, OptionalLegalPageSlug,RequiredLegalPageSlug };
// LAUNCH-28: Account registry exports
export type {
  AccountAllocation,
  AccountPool,
  AccountStatus,
  RegisteredAccount,
  ShopAccountConfig,
} from "./accountRegistry";
export {
  accountAllocationSchema,
  accountPoolSchema,
  accountStatusSchema,
  canAllocate,
  getRequiredEnvVarsForConfig,
  registeredAccountSchema,
  shopAccountConfigSchema,
  validateShopAccountConfig,
} from "./accountRegistry";
// LAUNCH-26: Brand kit exports
export type {
  BrandKit,
  BrandKitValidationError,
  BrandKitValidationResult,
  BrandKitValidationWarning,
  ColorPalette,
  FaviconConfig,
  LogoVariants,
  SocialBranding,
  StandardLogoVariant,
  TypographyConfig,
} from "./brandKit";
export {
  brandKitSchema,
  brandKitToCssVars,
  colorPaletteSchema,
  faviconConfigSchema,
  getFaviconForSize,
  getLogoForContext,
  logoVariantsSchema,
  mergeBrandKitWithTheme,
  socialBrandingSchema,
  STANDARD_LOGO_VARIANTS,
  typographyConfigSchema,
  validateBrandKit,
} from "./brandKit";
// LAUNCH-26: Asset ingest exports
export type {
  AssetIngestOptions,
  AssetIngestResult,
  AssetSlot,
  BatchIngestResult,
  PopulateBrandKitAssetsOptions,
  PopulateBrandKitAssetsResult,
} from "./assetIngest";
export {
  generateFaviconSizes,
  ingestAsset,
  ingestAssetBatch,
  populateBrandKitAssets,
} from "./assetIngest";
export type { DeployShopResult,DeployStatusBase } from "./deployTypes";
export const createShopOptionsSchema = baseCreateShopOptionsSchema.strict();
export const launchConfigSchema = baseLaunchConfigSchema;

export interface ShopCreationState {
  shopId: string;
  status: "pending" | "created" | "partial" | "failed";
  env?: Environment;
  lastConfigHash?: string;
  lastError?: string;
  createdAt?: string;
  updatedAt?: string;
}

function hashConfig(config: ShopConfig): string {
  return createHash("sha256")
    .update(JSON.stringify(config))
    .digest("hex");
}

export function mapConfigToCreateShopOptions(
  config: ShopConfig
): Partial<CreateShopOptions> {
  const parsed = shopConfigSchema.safeParse(config);
  if (!parsed.success) {
    throw parsed.error;
  }
  const cfg = parsed.data;
  const billingProvider = cfg.billingProvider;
  const validatedBillingProvider = billingProvider &&
    defaultPaymentProviders.includes(
      billingProvider as (typeof defaultPaymentProviders)[number],
    )
      ? (billingProvider as CreateShopOptions["billingProvider"])
      : undefined;
  // Cast to access LAUNCH-23 fields that may not be in ShopConfig yet
  const cfgAny = cfg as ShopConfig & {
    themeDefaults?: Record<string, string>;
    themeTokens?: Record<string, string>;
    favicon?: string;
    seo?: SeoConfig;
    requiredPages?: Partial<Record<RequiredPageSlug, string>>;
  };
  const options: Partial<CreateShopOptions> = {
    ...(cfg.name && { name: cfg.name }),
    ...(cfg.logo && { logo: cfg.logo }),
    ...(cfg.contactInfo && { contactInfo: cfg.contactInfo }),
    ...(cfg.type && { type: cfg.type }),
    ...(cfg.theme && { theme: cfg.theme }),
    ...(cfg.themeOverrides && { themeOverrides: cfg.themeOverrides }),
    // LAUNCH-23: Theme defaults and tokens
    ...(cfgAny.themeDefaults && { themeDefaults: cfgAny.themeDefaults }),
    ...(cfgAny.themeTokens && { themeTokens: cfgAny.themeTokens }),
    ...(cfg.template && { template: cfg.template }),
    ...(cfg.payment && {
      payment: cfg.payment as CreateShopOptions["payment"],
    }),
    ...(validatedBillingProvider && { billingProvider: validatedBillingProvider }),
    ...(cfg.shipping && {
      shipping: cfg.shipping as CreateShopOptions["shipping"],
    }),
    ...(cfg.analytics && { analytics: cfg.analytics }),
    ...(cfg.pageTitle && { pageTitle: cfg.pageTitle }),
    ...(cfg.pageDescription && { pageDescription: cfg.pageDescription }),
    ...(cfg.socialImage && { socialImage: cfg.socialImage }),
    // LAUNCH-23: Brand kit fields
    ...(cfgAny.favicon && { favicon: cfgAny.favicon }),
    ...(cfgAny.seo && { seo: cfgAny.seo }),
    ...(cfg.navItems && { navItems: cfg.navItems }),
    ...(cfg.pages && { pages: cfg.pages as CreateShopOptions["pages"] }),
    // LAUNCH-23: Required pages mapping
    ...(cfgAny.requiredPages && { requiredPages: cfgAny.requiredPages }),
    ...(cfg.checkoutPage && {
      checkoutPage: cfg.checkoutPage as CreateShopOptions["checkoutPage"],
    }),
  };
  return options;
}

export async function createShopFromConfig(
  id: string,
  config: ShopConfig,
  options?: { deploy?: boolean; env?: Environment }
): Promise<DeployShopResult> {
  const shopId = id;
  const dir = join("data", "shops", shopId);
  const creationPath = join(dir, "creation.json");
  const now = new Date().toISOString();
  const env: Environment =
    options?.env ??
    (process.env.NODE_ENV === "production" ? "prod" : "dev");

  const baseState: ShopCreationState = {
    shopId,
    status: "pending",
    env,
    lastConfigHash: hashConfig(config),
    createdAt: now,
    updatedAt: now,
  };

  try {
    ensureDir(dir);
    writeJSON(creationPath, baseState);
  } catch {
    // best-effort; creation should not fail due to logging
  }

  // Idempotence: if a shop already exists, treat creation as a no-op in
  // non-prod environments and fail fast in prod.
  try {
    const existing = await prisma.shop.findUnique({ where: { id: shopId } });
    if (existing) {
      const existingState: ShopCreationState = {
        ...baseState,
        status: "created",
        updatedAt: new Date().toISOString(),
        lastError: undefined,
      };
      try {
        ensureDir(dir);
        writeJSON(creationPath, existingState);
      } catch {
        // ignore creation state write errors
      }
      if (env === "prod") {
        throw new Error(
          `Shop ${shopId} already exists; creation is not allowed in prod.`,
        );
      }
      // In dev/stage, treat as idempotent success without re-running createShop.
      return { status: "pending" };
    }
  } catch {
    // If the existence check fails, fall through and let createShop surface errors.
  }

  const opts = mapConfigToCreateShopOptions(config);

  try {
    const result = await createShop(shopId, opts, options);
    const successState: ShopCreationState = {
      ...baseState,
      status: "created",
      updatedAt: new Date().toISOString(),
      lastError: undefined,
    };
    try {
      writeJSON(creationPath, successState);
    } catch {
      // ignore creation state write errors
    }
    return result;
  } catch (err) {
    const failedState: ShopCreationState = {
      ...baseState,
      status: "failed",
      updatedAt: new Date().toISOString(),
      lastError: (err as Error).message,
    };
    try {
      writeJSON(creationPath, failedState);
    } catch {
      // ignore creation state write errors
    }
    throw err;
  }
}

export function readShopCreationState(shopId: string): ShopCreationState | null {
  const dir = join("data", "shops", shopId);
  const creationPath = join(dir, "creation.json");
  try {
    if (!fileExists(creationPath)) {
      return null;
    }
    const raw = readFile(creationPath);
    const parsed = JSON.parse(raw) as ShopCreationState;
    const { shopId: _ignored, ...rest } = parsed;
    return {
      ...rest,
      shopId,
    };
  } catch {
    return null;
  }
}
