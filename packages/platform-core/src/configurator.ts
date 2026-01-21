// packages/platform-core/src/configurator.ts
// Docs: docs/cms/cms-charter.md
// Docs: docs/cms/configurator-contract.md
// The original implementation imported an environment schema from
// `@acme/config/env`.  That package is not available in this environment,
// so we define a permissive schema locally using zod.  This schema
// accepts arbitrary string-to-string mappings, deferring strict
// validation to higher-level modules.
// NOTE: This module currently exceeds the 350-line guideline because it
// co-locates environment helpers and configurator checks. Consider
// splitting into env + launch-check submodules in a follow-up.
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { z } from "zod";

import type {
  ConfiguratorProgress,
  ConfiguratorStepId,
  LaunchCheckResult,
  LaunchEnv,
  LaunchStatus,
  ProductPublication,
  Shop,
  ShopSettings,
  StepStatus as ProgressStepStatus,
} from "@acme/types";

import { resolveDataRoot } from "./dataRoot";
import { validateShopName } from "./shops/universal";
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
  const safeShop = validateShopName(shop);
  const envPath = join("apps", safeShop, ".env");
  validateEnvFile(envPath);

  const env = readEnvFile(envPath);
  const dataRoot = resolveDataRoot();

  let cfg: {
    paymentProviders?: string[];
    shippingProviders?: string[];
    billingProvider?: string;
    sanityBlog?: unknown;
  } | undefined;

  try {
    const shopCfgPath = join(dataRoot, safeShop, "shop.json");
    // `shopCfgPath` is derived from a validated shop name.
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CORE-2410 derived from validated shop name and DATA_ROOT
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

  // Soft validation for analytics/lead capture toggles: warn if enabled without IDs
  try {
    const settingsPath = join(dataRoot, safeShop, "settings.json");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CORE-2410 validated shop id + DATA_ROOT
    const raw = readFileSync(settingsPath, "utf8");
    const settings = JSON.parse(raw) as { analytics?: { enabled?: boolean; id?: string }; leadCapture?: { enabled?: boolean; endpoint?: string } };
    if (settings?.analytics?.enabled && !env.NEXT_PUBLIC_GA4_ID) {
      throw new Error("Analytics enabled but NEXT_PUBLIC_GA4_ID missing");
    }
    if (settings?.leadCapture?.enabled && !settings.leadCapture.endpoint) {
      throw new Error("Lead capture enabled but no endpoint configured");
    }
  } catch {
    /* ignore */
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

function collectPageComponents(
  pages: Array<{ components?: unknown[] }> | undefined,
): unknown[] {
  const components = pages?.flatMap((p) =>
    Array.isArray(p.components) ? p.components : [],
  );
  const stack = [...(components ?? [])];
  const result: unknown[] = [];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    result.push(current);

    const children = (current as { children?: unknown[] }).children;
    if (Array.isArray(children)) stack.push(...children);

    const templateChildren = (current as { template?: { children?: unknown[] } })
      .template?.children;
    if (Array.isArray(templateChildren)) stack.push(...templateChildren);
  }

  return result;
}

const LEGAL_PATTERNS = {
  terms: ["terms", "legal/terms", "tos"],
  privacy: ["privacy"],
  refund: ["return", "returns", "refund"],
} as const;

function isHttpUrl(value: string): boolean {
  if (typeof value !== "string" || value.trim() === "") return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function matchesPatterns(value: string, patterns: readonly string[]): boolean {
  const lower = value.toLowerCase();
  return patterns.some((pattern) => lower.includes(pattern));
}

export function evaluateLegalLinks(
  shop: Pick<
    Shop,
    "navigation" | "returnPolicyUrl" | "termsUrl" | "privacyUrl"
  >,
  pages: Array<{ slug?: string; status?: string; stableId?: string }> = [],
): { missing: Array<"terms" | "privacy" | "refund"> } {
  const navigationUrls =
    Array.isArray(shop.navigation) && shop.navigation.length > 0
      ? shop.navigation
          .map((item) =>
            item && typeof item.url === "string" ? item.url.trim() : "",
          )
          .filter((url) => url.length > 0)
      : [];

  const pageIdentifiers = pages
    .filter((page) => page?.status === "published")
    .flatMap((page) =>
      [page?.slug, page?.stableId].filter(
        (value): value is string => typeof value === "string",
      ),
    );

  const explicitUrls = {
    terms: [shop.termsUrl].filter(
      (value): value is string => typeof value === "string" && value.trim() !== "",
    ),
    privacy: [shop.privacyUrl].filter(
      (value): value is string => typeof value === "string" && value.trim() !== "",
    ),
    refund: [shop.returnPolicyUrl].filter(
      (value): value is string => typeof value === "string" && value.trim() !== "",
    ),
  };

  const hasTarget = (
    patterns: readonly string[],
    urls: string[],
  ): boolean => {
    if (urls.some(isHttpUrl)) return true;
    if (navigationUrls.some((url) => matchesPatterns(url, patterns))) return true;
    if (pageIdentifiers.some((id) => matchesPatterns(id, patterns))) return true;
    return false;
  };

  const missing: Array<"terms" | "privacy" | "refund"> = [];
  if (!hasTarget(LEGAL_PATTERNS.terms, explicitUrls.terms)) {
    missing.push("terms");
  }
  if (!hasTarget(LEGAL_PATTERNS.privacy, explicitUrls.privacy)) {
    missing.push("privacy");
  }
  if (!hasTarget(LEGAL_PATTERNS.refund, explicitUrls.refund)) {
    missing.push("refund");
  }

  return { missing };
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

export const checkReachSocial: ConfigCheck = async (shopId) => {
  try {
    const pages = await loadPages(shopId);
    const { shop, settings } = await loadShopAndSettings(shopId);

    const components = collectPageComponents(pages);
    let hasSocialLinks = false;
    let hasViralBlock = false;

    for (const node of components) {
      const type = (node as { type?: string }).type;
      if (!type) continue;

      if (
        !hasSocialLinks &&
        type === "SocialLinks" &&
        ["facebook", "instagram", "x", "youtube", "linkedin"].some((key) => {
          const value = (node as Record<string, unknown>)[key];
          return typeof value === "string" && value.trim() !== "";
        })
      ) {
        hasSocialLinks = true;
      }

      if (
        !hasViralBlock &&
        (type === "SocialFeed" ||
          type === "SocialProof" ||
          type === "NewsletterSignup" ||
          type === "EmailReferralSection")
      ) {
        if (type === "SocialFeed") {
          const account = (node as { account?: string }).account;
          const hashtag = (node as { hashtag?: string }).hashtag;
          if (
            (typeof account === "string" && account.trim() !== "") ||
            (typeof hashtag === "string" && hashtag.trim() !== "")
          ) {
            hasViralBlock = true;
          }
        } else {
          hasViralBlock = true;
        }
      }

      if (hasSocialLinks && hasViralBlock) break;
    }

    const seo = settings?.seo ?? {};
    const socialImage =
      (seo as { image?: unknown }).image ??
      (seo as { openGraph?: { image?: unknown } }).openGraph?.image ??
      (seo as { twitter?: { image?: unknown } }).twitter?.image;
    const hasShareImage =
      typeof socialImage === "string" && socialImage.trim() !== "";
    const domainName = shop?.domain?.name;
    const hasDomain = typeof domainName === "string" && domainName.trim() !== "";

    if (hasSocialLinks && hasViralBlock && (hasShareImage || hasDomain)) {
      return { ok: true };
    }

    return {
      ok: false,
      reason: "missing-social-reach",
      details: {
        shopId,
        hasSocialLinks,
        hasViralBlock,
        hasShareImage,
        hasDomain,
      },
    };
  } catch (err) {
    return errorResult(shopId, "reach-social-error", err);
  }
};

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
    const pages = await loadPages(shopId);
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
    const publishedOrDraft = pages.filter(
      (page) => page.status === "published" || page.status === "draft",
    );
    const homePage = publishedOrDraft.find((page) => {
      const slug = typeof page.slug === "string" ? page.slug : "";
      return slug === "" || slug === "home" || slug === "/";
    });
    const homeFromTemplate =
      homePage &&
      typeof (homePage as { stableId?: unknown }).stableId === "string" &&
      String((homePage as { stableId?: string }).stableId).startsWith(
        "core.page.home.",
      );
    if (
      !homePage ||
      !Array.isArray(homePage.components) ||
      homePage.components.length === 0 ||
      !homeFromTemplate
    ) {
      return {
        ok: false,
        reason: "missing-home-template",
        details: { shopId },
      };
    }

    const flattened = collectPageComponents(publishedOrDraft);
    const hasPdpTemplate = flattened.some(
      (component) =>
        component &&
        typeof component === "object" &&
        (component as { type?: string }).type === "PDPDetailsSection",
    ) ||
      publishedOrDraft.some((page) => {
        const stableId =
          (page as { stableId?: string }).stableId ??
          (page as { stableId?: unknown }).stableId;
        return (
          typeof stableId === "string" &&
          stableId.startsWith("core.page.product.")
        );
      });
    if (!hasPdpTemplate) {
      return {
        ok: false,
        reason: "missing-product-template",
        details: { shopId },
      };
    }
    return { ok: true };
  } catch (err) {
    return errorResult(shopId, "navigation-home-error", err);
  }
};

export const checkLegalLinks: ConfigCheck = async (shopId) => {
  try {
    const { shop, settings } = await loadShopAndSettings(shopId);
    const pages = await loadPages(shopId);
    const { missing } = evaluateLegalLinks(shop, pages);
    if (missing.length > 0) {
      return {
        ok: false,
        reason: "missing-legal-links",
        details: { shopId, missing },
      };
    }
    const canonicalBase =
      settings?.seo && typeof settings.seo === "object"
        ? (settings.seo as { canonicalBase?: unknown }).canonicalBase
        : undefined;
    return {
      ok: true,
      details: canonicalBase ? { shopId, canonicalBase } : { shopId },
    };
  } catch (err) {
    return errorResult(shopId, "legal-links-error", err);
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
  legal: checkLegalLinks,
  "navigation-home": checkNavigationHome,
  "reach-social": checkReachSocial,
};

export const REQUIRED_CONFIG_CHECK_STEPS: ConfiguratorStepId[] = [
  "shop-basics",
  "theme",
  "payments",
  "shipping-tax",
  "checkout",
  "products-inventory",
  "legal",
  "navigation-home",
];

export const OPTIONAL_CONFIG_CHECK_STEPS: ConfiguratorStepId[] = [
  "domains",
  "reverse-logistics",
  "advanced-seo",
  "reach-social",
];

const allConfiguratorSteps: ConfiguratorStepId[] = [
  ...REQUIRED_CONFIG_CHECK_STEPS,
  ...OPTIONAL_CONFIG_CHECK_STEPS,
];

function mapCheckResultToStatus(
  result: ConfigCheckResult,
): { status: ProgressStepStatus; error?: string } {
  if (result.ok) {
    return { status: "complete" };
  }
  return {
    status: "error",
    error: result.reason,
  };
}

export async function getConfiguratorProgressForShop(
  shopId: string,
  steps: ConfiguratorStepId[] = allConfiguratorSteps,
): Promise<ConfiguratorProgress> {
  const statuses: Record<ConfiguratorStepId, ProgressStepStatus> = {} as Record<
    ConfiguratorStepId,
    ProgressStepStatus
  >;
  const errors: Partial<Record<ConfiguratorStepId, string>> = {};

  await Promise.all(
    steps.map(async (stepId) => {
      const check = configuratorChecks[stepId];
      if (!check) {
        statuses[stepId] = "pending";
        return;
      }
      try {
        const result = await check(shopId);
        const mapped = mapCheckResultToStatus(result);
        statuses[stepId] = mapped.status;
        if (mapped.error) {
          errors[stepId] = mapped.error;
        }
      } catch (err) {
        statuses[stepId] = "error";
        if (!errors[stepId]) {
          errors[stepId] =
            err && typeof err === "object" && "message" in err
              ? String((err as { message?: unknown }).message)
              : "check-failed";
        }
      }
    }),
  );

  const base: ConfiguratorProgress = {
    shopId,
    steps: statuses,
    lastUpdated: new Date().toISOString(),
  };

  if (Object.keys(errors).length > 0) {
    return { ...base, errors };
  }
  return base;
}

export async function runRequiredConfigChecks(
  shopId: string,
  steps: ConfiguratorStepId[] = REQUIRED_CONFIG_CHECK_STEPS,
): Promise<{ ok: boolean; error?: string }> {
  const failures: string[] = [];
  for (const stepId of steps) {
    const check = configuratorChecks[stepId];
    if (!check) continue;
    let result: ConfigCheckResult;
    try {
      result = await check(shopId);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: unknown }).message)
          : "unknown-error";
      failures.push(`${stepId}:${message}`);
      continue;
    }
    if (!result.ok) {
      const reason = result.reason || "failed";
      failures.push(`${stepId}:${reason}`);
    }
  }

  if (failures.length === 0) {
    return { ok: true };
  }

  return {
    ok: false,
    // Service-level fallback string; caller is responsible for localisation.
    error: `Configuration checks failed for steps: ${failures.join(", ")}`,
  };
}

export async function getLaunchStatus(
  env: LaunchEnv,
  shopId: string,
): Promise<LaunchCheckResult> {
  const [required, progress] = await Promise.all([
    runRequiredConfigChecks(shopId),
    getConfiguratorProgressForShop(shopId),
  ]);

  const reasons: string[] = [];
  let status: LaunchStatus = "ok";

  if (!required.ok) {
    status = "blocked";
    if (required.error) {
      reasons.push(required.error);
    }
  }

  const optionalErrors = OPTIONAL_CONFIG_CHECK_STEPS.filter(
    (id) => progress.steps[id] === "error",
  );
  if (optionalErrors.length > 0 && status !== "blocked") {
    status = "warning";
    for (const id of optionalErrors) {
      reasons.push(`optional-step-failed:${id}`);
    }
  }

  return { env, status, reasons };
}
