// packages/platform-core/createShop.ts
import { LOCALES } from "@i18n/locales";
import type { Locale, PageComponent } from "@types";
import { localeSchema } from "@types";
import { spawnSync } from "child_process";
import { randomBytes } from "crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import { join } from "path";
import { ulid } from "ulid";
import { z } from "zod";
import { validateShopName } from "./shops";

function slugify(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

import {
  copyTemplate,
  loadBaseTokens,
  loadThemeTokens,
} from "./createShop/utils";
import { defaultFilterMappings } from "./defaultFilterMappings";

export const createShopOptionsSchema = z.object({
  name: z.string().optional(),
  logo: z.string().url().optional(),
  contactInfo: z.string().optional(),
  type: z.enum(["sale", "rental"]).optional(),
  theme: z.string().optional(),
  template: z.string().optional(),
  payment: z.array(z.string()).optional(),
  shipping: z.array(z.string()).optional(),
  pageTitle: z.record(localeSchema, z.string()).optional(),
  pageDescription: z.record(localeSchema, z.string()).optional(),
  socialImage: z.string().url().optional(),
  analytics: z
    .object({
      provider: z.string(),
      id: z.string().optional(),
    })
    .optional(),
  navItems: z
    .array(z.object({ label: z.string().min(1), url: z.string().min(1) }))
    .default([]),
  pages: z
    .array(
      z.object({
        slug: z.string(),
        title: z.record(localeSchema, z.string()),
        description: z.record(localeSchema, z.string()).optional(),
        image: z.record(localeSchema, z.string()).optional(),
        components: z.array(z.any()),
      })
    )
    .default([]),
  checkoutPage: z.array(z.any()).default([]),
});

export interface CreateShopOptions {
  name?: string;
  logo?: string;
  contactInfo?: string;
  type?: "sale" | "rental";
  theme?: string;
  template?: string;
  payment?: string[];
  shipping?: string[];
  pageTitle?: Partial<Record<Locale, string>>;
  pageDescription?: Partial<Record<Locale, string>>;
  socialImage?: string;
  analytics?: {
    provider: string;
    id?: string;
  };
  navItems?: { label: string; url: string }[];
  pages?: {
    slug: string;
    title: Partial<Record<Locale, string>>;
    description?: Partial<Record<Locale, string>>;
    image?: Partial<Record<Locale, string>>;
    components: PageComponent[];
  }[];
  checkoutPage?: PageComponent[];
}

interface PackageJSON {
  name: string;
  dependencies?: Record<string, string>;
  [key: string]: unknown;
}

function genSecret(bytes = 16): string {
  return randomBytes(bytes).toString("hex");
}

function fillLocales(
  values: Partial<Record<Locale, string>> | undefined,
  fallback: string
): Record<Locale, string> {
  return LOCALES.reduce<Record<Locale, string>>(
    (acc: Record<Locale, string>, locale: Locale) => {
      acc[locale] = values?.[locale] ?? fallback;
      return acc;
    },
    {} as Record<Locale, string>
  );
}

/**
 * Create a new shop app and seed data.
 * Paths are resolved relative to the repository root.
 */
export function createShop(id: string, opts: CreateShopOptions = {}): void {
  id = validateShopName(id);
  const newApp = join("apps", id);
  const newData = join("data", "shops", id);

  if (existsSync(newApp)) {
    throw new Error(
      `App directory 'apps/${id}' already exists. Pick a different ID or remove the existing folder.`
    );
  }

  if (existsSync(newData)) {
    throw new Error(`Data for shop ${id} already exists`);
  }

  const parsed = createShopOptionsSchema.parse(opts);
  const options: Required<
    Omit<CreateShopOptions, "analytics" | "checkoutPage">
  > & {
    analytics?: CreateShopOptions["analytics"];
    checkoutPage: PageComponent[];
  } = {
    name: parsed.name ?? id,
    logo: parsed.logo ?? "",
    contactInfo: parsed.contactInfo ?? "",
    type: parsed.type ?? "sale",
    theme: parsed.theme ?? "base",
    template: parsed.template ?? "template-app",
    payment: parsed.payment ?? [],
    shipping: parsed.shipping ?? [],
    pageTitle: fillLocales(parsed.pageTitle, "Home"),
    pageDescription: fillLocales(parsed.pageDescription, ""),
    socialImage: parsed.socialImage ?? "",

    /* ---------- FIXED analytics block ---------- */
    analytics: parsed.analytics
      ? {
          provider: parsed.analytics.provider ?? "none",
          id: parsed.analytics.id,
        }
      : { provider: "none" },

    navItems:
      parsed.navItems?.map((n) => ({
        label: n.label ?? "—",
        url: n.url ?? "#",
      })) ?? [],
    pages: parsed.pages.map((p) => ({
      slug: p.slug ?? slugify(p.title.en ?? Object.values(p.title)[0]),
      title: p.title,
      description: p.description,
      image: p.image,
      components: p.components ?? [],
    })),
    checkoutPage: parsed.checkoutPage,
  };

  const templateApp = join("packages", options.template);

  if (!existsSync(join("packages", "themes", options.theme))) {
    throw new Error(`Theme '${options.theme}' not found in packages/themes`);
  }
  if (!existsSync(templateApp)) {
    throw new Error(`Template '${options.template}' not found in packages`);
  }

  copyTemplate(templateApp, newApp);
  // ensure PostCSS setup is available in the generated shop
  cpSync("postcss.config.cjs", join(newApp, "postcss.config.cjs"));
  const pkgPath = join(newApp, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as PackageJSON;
  pkg.dependencies ??= {};
  Object.keys(pkg.dependencies).forEach((k) => {
    if (k.startsWith("@themes/")) delete pkg.dependencies![k];
  });
  pkg.dependencies[`@themes/${options.theme}`] = "workspace:*";
  pkg.name = `@apps/shop-${id}`;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

  const cssPath = join(newApp, "src", "app", "globals.css");
  const css = readFileSync(cssPath, "utf8").replace(
    /@themes\/[^/]+\/tokens.css/,
    `@themes/${options.theme}/tokens.css`
  );
  writeFileSync(cssPath, css);

  let envContent = `NEXT_PUBLIC_SHOP_ID=${id}\n`;
  envContent += `PREVIEW_TOKEN_SECRET=${genSecret()}\n`;
  const envVars = [...options.payment, ...options.shipping];
  if (envVars.length === 0) envVars.push("stripe");
  for (const provider of envVars) {
    if (provider === "stripe") {
      envContent += `STRIPE_SECRET_KEY=${genSecret()}\n`;
      envContent += `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${genSecret()}\n`;
    } else {
      envContent += `${provider.toUpperCase()}_KEY=${genSecret()}\n`;
    }
  }
  envContent += `NEXTAUTH_SECRET=${genSecret()}\n`;
  writeFileSync(join(newApp, ".env"), envContent);

  mkdirSync(newData, { recursive: true });

  writeFileSync(
    join(newData, "settings.json"),
    JSON.stringify(
      { languages: [...LOCALES], analytics: options.analytics },
      null,
      2
    )
  );

  const themeTokens = {
    ...loadBaseTokens(),
    ...loadThemeTokens(options.theme),
  };

  writeFileSync(
    join(newData, "shop.json"),
    JSON.stringify(
      {
        id,
        name: options.name,
        logo: options.logo,
        contactInfo: options.contactInfo,
        catalogFilters: [],
        themeId: options.theme,
        themeTokens,
        filterMappings: { ...defaultFilterMappings },
        type: options.type,
        paymentProviders: options.payment,
        shippingProviders: options.shipping,
        priceOverrides: {},
        localeOverrides: {},
        homeTitle: options.pageTitle,
        homeDescription: options.pageDescription,
        homeImage: options.socialImage,
        navigation: options.navItems,
      },
      null,
      2
    )
  );

  const now = new Date().toISOString();
  const sampleProduct = {
    id: ulid(),
    sku: "SAMPLE-1",
    title: { en: "Sample", de: "Sample", it: "Sample" },
    description: {
      en: "Sample product",
      de: "Sample product",
      it: "Sample product",
    },
    price: 1000,
    currency: "EUR",
    images: [],
    status: "draft",
    shop: id,
    row_version: 1,
    created_at: now,
    updated_at: now,
  } as Record<string, unknown>;

  if (options.type === "rental") {
    (sampleProduct as Record<string, unknown>)["deposit"] = 1000;
    (sampleProduct as Record<string, unknown>)["rentalTerms"] =
      "Return within 30 days";
  }

  writeFileSync(
    join(newData, "products.json"),
    JSON.stringify([sampleProduct], null, 2)
  );

  const homePage = {
    id: ulid(),
    slug: "home",
    status: "draft" as const,
    components: [],
    seo: {
      title: options.pageTitle,
      description: options.pageDescription,
      image: Object.fromEntries(
        LOCALES.map((locale: Locale) => [locale, options.socialImage])
      ) as Record<Locale, string>,
    },
    createdAt: now,
    updatedAt: now,
    createdBy: "system",
  } as const;

  const emptySeo = Object.fromEntries(
    LOCALES.map((locale: Locale) => [locale, ""])
  ) as Record<Locale, string>;

  const checkoutPage = {
    id: ulid(),
    slug: "checkout",
    status: "draft" as const,
    components: options.checkoutPage,
    seo: { title: emptySeo, description: emptySeo, image: emptySeo },
    createdAt: now,
    updatedAt: now,
    createdBy: "system",
  } as const;

  const extraPages = options.pages.map((p) => ({
    id: ulid(),
    slug: p.slug,
    status: "draft" as const,
    components: p.components,
    seo: { title: p.title, description: p.description, image: p.image },
    createdAt: now,
    updatedAt: now,
    createdBy: "system",
  }));

  writeFileSync(
    join(newData, "pages.json"),
    JSON.stringify([homePage, checkoutPage, ...extraPages], null, 2)
  );

  deployShop(id);
}

export interface DeployStatusBase {
  status: "pending" | "success" | "error";
  previewUrl?: string;
  instructions?: string;
  error?: string;
}

export interface DeployShopResult extends DeployStatusBase {
  status: "success" | "error";
  previewUrl: string;
}

export function deployShop(id: string, domain?: string): DeployShopResult {
  const newApp = join("apps", id);
  const previewUrl = `https://${id}.pages.dev`;
  let status: DeployShopResult["status"] = "success";
  let error: string | undefined;

  try {
    const result = spawnSync("npx", ["--yes", "create-cloudflare", newApp], {
      stdio: "inherit",
    });
    if (result.status !== 0) {
      status = "error";
      error = "C3 process failed or not available. Skipping.";
    }
  } catch (err) {
    status = "error";
    error = (err as Error).message;
  }

  const instructions = domain
    ? `Add a CNAME record for ${domain} pointing to ${id}.pages.dev`
    : undefined;

  const resultObj: DeployShopResult = {
    status,
    previewUrl,
    instructions,
    error,
  };

  try {
    const file = join("data", "shops", id, "deploy.json");
    writeFileSync(file, JSON.stringify(resultObj, null, 2));
  } catch {
    // ignore write errors
  }
  return resultObj;
}

export function listThemes(): string[] {
  const themesDir = join("packages", "themes");
  return readdirSync(themesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}
