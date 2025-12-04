import {
  prepareOptions,
  createShopOptionsSchema as baseCreateShopOptionsSchema,
  type CreateShopOptions,
  type PreparedCreateShopOptions,
  type NavItem,
} from "./schema";
import { createShop } from "./createShop";
import type { DeployShopResult } from "./deployTypes";
import { ensureDir, writeJSON, fileExists, readFile } from "./fsUtils";
import { join } from "path";
import { createHash } from "crypto";
import { prisma } from "../db";
import { shopConfigSchema, type ShopConfig, type Environment } from "@acme/types";
import { defaultPaymentProviders } from "./defaultPaymentProviders";

export { createShop } from "./createShop";
export { deployShop, deployShopImpl } from "./deploy";
export {
  repoRoot,
  ensureTemplateExists,
  copyTemplate,
  ensureDir,
  readFile,
  writeFile,
  writeJSON,
  listThemes,
  syncTheme,
} from "./fsUtils";
export { loadTokens, loadBaseTokens } from "./themeUtils";
export {
  type ShopDeploymentAdapter,
  CloudflareDeploymentAdapter,
  defaultDeploymentAdapter,
} from "./deploymentAdapter";
export { prepareOptions };
export type { CreateShopOptions, PreparedCreateShopOptions, NavItem };
export type { DeployStatusBase, DeployShopResult } from "./deployTypes";
export const createShopOptionsSchema = baseCreateShopOptionsSchema.strict();

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
  const options: Partial<CreateShopOptions> = {
    ...(cfg.name && { name: cfg.name }),
    ...(cfg.logo && { logo: cfg.logo }),
    ...(cfg.contactInfo && { contactInfo: cfg.contactInfo }),
    ...(cfg.type && { type: cfg.type }),
    ...(cfg.theme && { theme: cfg.theme }),
    ...(cfg.themeOverrides && { themeOverrides: cfg.themeOverrides }),
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
    ...(cfg.navItems && { navItems: cfg.navItems }),
    ...(cfg.pages && { pages: cfg.pages as CreateShopOptions["pages"] }),
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
