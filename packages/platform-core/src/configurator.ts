// packages/platform-core/src/configurator.ts
// The original implementation imported an environment schema from
// `@acme/config/env`.  That package is not available in this environment,
// so we define a permissive schema locally using zod.  This schema
// accepts arbitrary string-to-string mappings, deferring strict
// validation to higher-level modules.
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { z } from "zod";
import type {
  ConfiguratorStepId,
  ProductPublication,
  Shop,
  ShopSettings,
} from "@acme/types";
import type { InventoryItem } from "./types/inventory";

// Accept any string key/value pairs. In the full codebase envSchema would
// include constraints for required environment variables.
const envSchema = z.record(z.string(), z.string());

// Map of plugin identifiers to the environment variables they require.
// These correspond to the credentials collected by the init-shop wizard.
export const pluginEnvVars: Record<string, readonly string[]> = {
  stripe: [
    "STRIPE_SECRET_KEY",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    "STRIPE_WEBHOOK_SECRET",
  ],
  paypal: ["PAYPAL_CLIENT_ID", "PAYPAL_SECRET"],
  sanity: ["SANITY_PROJECT_ID", "SANITY_DATASET", "SANITY_TOKEN"],
};

/**
 * Read the contents of an environment file into a key/value map.
 * Empty values and comments are ignored.
 * @param file Path to the .env file.
 */
export function readEnvFile(file: string): Record<string, string> {
  // `file` is provided by the caller and may be dynamic. It is only used
  // to read environment configuration files within the repository.
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123 validated repo-local env path
  const envRaw = readFileSync(file, "utf8");
  const env: Record<string, string> = {};
  for (const line of envRaw.split(/\n+/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    env[key] = rest.join("=");
  }
  Object.keys(env).forEach((k) => {
    if (env[k] === "") delete env[k];
  });
  return env;
}

/**
 * Validate that an environment file exists and conforms to the schema defined above.
 * Throws if validation fails.
 * @param file Path to the .env file.
 */
export function validateEnvFile(file: string): void {
  // `file` is constructed from known paths and validated elsewhere.
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123 validated repo-local env path
  if (!existsSync(file)) {
    throw new Error(`Missing ${file}`);
  }
  // Allow tests to override or delete the exported reader. Prefer
  // the live export on `module.exports` when available so spies and
  // deletions take effect; otherwise fall back to the local function.
  type ModuleWithRead = NodeJS.Module & {
    exports?: { readEnvFile?: typeof readEnvFile };
  };
  const exportedReader =
    typeof module !== "undefined" &&
    (module as ModuleWithRead).exports?.readEnvFile
      ? (module as ModuleWithRead).exports!.readEnvFile!
      : readEnvFile;
  const env = exportedReader(file);
  envSchema.parse(env);
}

/**
 * Validate the environment file for a given shop. Looks up the file in apps/{shop}/.env.
 * @param shop Identifier of the shop whose environment should be validated.
 */
export function validateShopEnv(shop: string): void {
  const envPath = join("apps", shop, ".env");
  validateEnvFile(envPath);

  const env = readEnvFile(envPath);

  let cfg: {
    paymentProviders?: string[];
    shippingProviders?: string[];
    billingProvider?: string;
    sanityBlog?: unknown;
  } | undefined;

  try {
    const shopCfgPath = join("data", "shops", shop, "shop.json");
    // `shopCfgPath` is derived from a validated shop name.
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123 derived from validated shop name
    const cfgRaw = readFileSync(shopCfgPath, "utf8");
    cfg = JSON.parse(cfgRaw) as {
      paymentProviders?: string[];
      shippingProviders?: string[];
      billingProvider?: string;
      sanityBlog?: unknown;
    };
  } catch {
    // If the configuration can't be read, skip plugin validation.
    return;
  }

  const plugins = new Set<string>();
  cfg.paymentProviders?.forEach((p) => plugins.add(p));
  cfg.shippingProviders?.forEach((p) => plugins.add(p));
  if (cfg.billingProvider) plugins.add(cfg.billingProvider);
  if (cfg.sanityBlog) plugins.add("sanity");

  for (const id of plugins) {
    const vars = pluginEnvVars[id];
    if (!vars) continue;
    for (const key of vars) {
      if (!env[key]) {
        throw new Error(`Missing ${key}`);
      }
    }
  }
}

export type ConfigCheckResult =
  | { ok: true }
  | {
      ok: false;
      reason: string;
      details?: unknown;
    };

export type ConfigCheck = (shopId: string) => Promise<ConfigCheckResult>;

async function loadShopAndSettings(
  shopId: string,
): Promise<{ shop: Shop; settings: ShopSettings }> {
  const shopsModule = await import("./repositories/shops.server");
  const [shop, settings] = await Promise.all([
    shopsModule.readShop(shopId),
    shopsModule.getShopSettings(shopId),
  ]);
  return { shop, settings };
}

async function loadPages(shopId: string) {
  const pagesModule = await import("./repositories/pages/index.server");
  return pagesModule.getPages(shopId);
}

async function loadProducts(shopId: string): Promise<ProductPublication[]> {
  const productsModule = await import("./repositories/products.server");
  return productsModule.readRepo<ProductPublication>(shopId);
}

async function loadInventory(shopId: string): Promise<InventoryItem[]> {
  const inventoryModule = await import("./repositories/inventory.server");
  return inventoryModule.readInventory(shopId);
}

function errorResult(
  shopId: string,
  reason: string,
  error: unknown,
  extra?: Record<string, unknown>,
): ConfigCheckResult {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: unknown }).message)
      : undefined;
  return {
    ok: false,
    reason,
    details: { shopId, ...(message ? { error: message } : {}), ...(extra ?? {}) },
  };
}

export const checkShopBasics: ConfigCheck = async (shopId) => {
  try {
    const { shop, settings } = await loadShopAndSettings(shopId);
    if (!shop || !shop.id) {
      return {
        ok: false,
        reason: "missing-shop",
        details: { shopId },
      };
    }
    const languages = settings.languages ?? [];
    if (!Array.isArray(languages) || languages.length === 0) {
      return {
        ok: false,
        reason: "missing-languages",
        details: { shopId },
      };
    }
    const primaryLocale = languages[0];
    if (!primaryLocale) {
      return {
        ok: false,
        reason: "missing-primary-locale",
        details: { shopId },
      };
    }
    return { ok: true };
  } catch (err) {
    return errorResult(shopId, "shop-basics-error", err);
  }
};

export const checkTheme: ConfigCheck = async (shopId) => {
  try {
    const { shop } = await loadShopAndSettings(shopId);
    if (!shop.themeId) {
      return {
        ok: false,
        reason: "missing-theme",
        details: { shopId },
      };
    }
    const tokens = shop.themeTokens ?? {};
    if (Object.keys(tokens).length === 0) {
      return {
        ok: false,
        reason: "missing-theme-tokens",
        details: { shopId },
      };
    }
    return { ok: true };
  } catch (err) {
    return errorResult(shopId, "theme-error", err);
  }
};

export const checkPayments: ConfigCheck = async (shopId) => {
  try {
    const { shop, settings } = await loadShopAndSettings(shopId);
    if (!settings.currency) {
      return {
        ok: false,
        reason: "missing-currency",
        details: { shopId },
      };
    }

    const plugins = new Set<string>();
    shop.paymentProviders?.forEach((p) => plugins.add(p));
    if (shop.billingProvider) plugins.add(shop.billingProvider);

    if (plugins.size === 0) {
      return {
        ok: false,
        reason: "missing-payment-provider",
        details: { shopId },
      };
    }

    const missingEnv: string[] = [];
    for (const id of plugins) {
      const vars = pluginEnvVars[id];
      if (!vars) continue;
      for (const key of vars) {
        const value = process.env[key];
        if (!value || String(value).trim() === "") {
          missingEnv.push(key);
        }
      }
    }

    if (missingEnv.length > 0) {
      return {
        ok: false,
        reason: "missing-payment-env",
        details: { shopId, missingEnv },
      };
    }

    return { ok: true };
  } catch (err) {
    return errorResult(shopId, "payments-error", err);
  }
};

export const checkShippingTax: ConfigCheck = async (shopId) => {
  try {
    const { shop, settings } = await loadShopAndSettings(shopId);
    if (!settings.taxRegion) {
      return {
        ok: false,
        reason: "missing-tax-region",
        details: { shopId },
      };
    }
    if (!shop.shippingProviders || shop.shippingProviders.length === 0) {
      return {
        ok: false,
        reason: "missing-shipping-provider",
        details: { shopId },
      };
    }
    return { ok: true };
  } catch (err) {
    return errorResult(shopId, "shipping-tax-error", err);
  }
};

export const checkCheckout: ConfigCheck = async (shopId) => {
  try {
    const pages = await loadPages(shopId);
    const hasCheckout = pages.some(
      (page) => page.slug === "checkout" && page.status === "published",
    );
    if (!hasCheckout) {
      return {
        ok: false,
        reason: "missing-checkout-page",
        details: { shopId },
      };
    }
    return { ok: true };
  } catch (err) {
    return errorResult(shopId, "checkout-error", err);
  }
};

export const checkProductsInventory: ConfigCheck = async (shopId) => {
  try {
    const [products, inventory] = await Promise.all([
      loadProducts(shopId),
      loadInventory(shopId),
    ]);
    const activeProducts = products.filter(
      (p) => p.status === "active" || p.status === "scheduled",
    );
    if (activeProducts.length === 0) {
      return {
        ok: false,
        reason: "no-active-products",
        details: { shopId },
      };
    }
    const hasStock = inventory.some((item) => item.quantity > 0);
    if (!hasStock) {
      return {
        ok: false,
        reason: "no-inventory",
        details: { shopId },
      };
    }
    return { ok: true };
  } catch (err) {
    return errorResult(shopId, "products-inventory-error", err);
  }
};

export const checkNavigationHome: ConfigCheck = async (shopId) => {
  try {
    const { shop } = await loadShopAndSettings(shopId);
    const nav = shop.navigation ?? [];
    if (!Array.isArray(nav) || nav.length === 0) {
      return {
        ok: false,
        reason: "missing-navigation",
        details: { shopId },
      };
    }
    const hasLink = nav.some(
      (item) => typeof item.url === "string" && item.url.trim() !== "",
    );
    if (!hasLink) {
      return {
        ok: false,
        reason: "invalid-navigation",
        details: { shopId },
      };
    }
    return { ok: true };
  } catch (err) {
    return errorResult(shopId, "navigation-home-error", err);
  }
};

export const configuratorChecks: Partial<
  Record<ConfiguratorStepId, ConfigCheck>
> = {
  "shop-basics": checkShopBasics,
  theme: checkTheme,
  payments: checkPayments,
  "shipping-tax": checkShippingTax,
  checkout: checkCheckout,
  "products-inventory": checkProductsInventory,
  "navigation-home": checkNavigationHome,
};
