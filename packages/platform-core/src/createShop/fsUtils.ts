import { LOCALES } from "@i18n/locales";
import type { Locale } from "@acme/types";
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { ulid } from "ulid";
import { genSecret } from "@shared-utils";
import { nowIso } from "@acme/date-utils";
import { defaultFilterMappings } from "../defaultFilterMappings";
import type { PreparedCreateShopOptions } from "./schema";
import { loadTokens } from "./themeUtils";

/**
 * Copy a template application into a new shop directory.
 *
 * `node_modules` folders are skipped during the copy.
 */
export function copyTemplate(source: string, destination: string): void {
  cpSync(source, destination, {
    recursive: true,
    filter: (src) => !/node_modules/.test(src),
  });
}

/** Ensure selected theme and template are available. */
export function ensureTemplateExists(theme: string, template: string): string {
  if (!existsSync(join("packages", "themes", theme))) {
    throw new Error(`Theme '${theme}' not found in packages/themes`);
  }
  const templateApp = join("packages", template);
  if (!existsSync(templateApp)) {
    throw new Error(`Template '${template}' not found in packages`);
  }
  return templateApp;
}

/** Write all files for the new shop and seed data. */
export function writeFiles(
  id: string,
  options: PreparedCreateShopOptions,
  themeOverrides: Record<string, string>,
  templateApp: string,
  newApp: string,
  newData: string
): void {
  if (existsSync(newApp)) {
    throw new Error(`App directory already exists: ${newApp}`);
  }
  if (existsSync(newData)) {
    throw new Error(`Data directory already exists: ${newData}`);
  }
  copyTemplate(templateApp, newApp);
  cpSync(
    join(templateApp, "src", "app", "sitemap.ts"),
    join(newApp, "src", "app", "sitemap.ts")
  );
  cpSync(
    join(templateApp, "src", "app", "robots.ts"),
    join(newApp, "src", "app", "robots.ts")
  );
  // ensure PostCSS setup is available in the generated shop
  cpSync("postcss.config.cjs", join(newApp, "postcss.config.cjs"));
  const pkgPath = join(newApp, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
    name: string;
    dependencies?: Record<string, string>;
    [key: string]: unknown;
  };
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
  const envVars = [...options.payment, ...options.shipping, options.tax];
  if (envVars.length === 0) envVars.push("stripe");
  for (const provider of envVars) {
    if (provider === "stripe") {
      envContent += `STRIPE_SECRET_KEY=\n`;
      envContent += `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=\n`;
    } else {
      envContent += `${provider.toUpperCase()}_KEY=\n`;
    }
  }
  envContent += `CART_COOKIE_SECRET=${genSecret()}\n`;
  envContent += `CART_TTL=\n`;
  envContent += `NEXTAUTH_SECRET=${genSecret()}\n`;
  envContent += `PREVIEW_TOKEN_SECRET=${genSecret()}\n`;
  envContent += `CMS_SPACE_URL=\n`;
  envContent += `CMS_ACCESS_TOKEN=\n`;
  envContent += `SANITY_PROJECT_ID=\n`;
  envContent += `SANITY_DATASET=\n`;
  envContent += `SANITY_TOKEN=\n`;
  envContent += `GMAIL_USER=\n`;
  envContent += `GMAIL_PASS=\n`;
  envContent += `CLOUDFLARE_ACCOUNT_ID=\n`;
  envContent += `CLOUDFLARE_API_TOKEN=\n`;
  envContent += `DEPOSIT_RELEASE_ENABLED=\n`;
  envContent += `DEPOSIT_RELEASE_INTERVAL_MS=\n`;
  writeFileSync(join(newApp, ".env"), envContent);

  mkdirSync(newData, { recursive: true });
  writeFileSync(
    join(newData, "settings.json"),
    JSON.stringify(
      {
        languages: [...LOCALES],
        analytics: options.analytics,
        depositService: { enabled: false, interval: 60 },
      },
      null,
      2
    )
  );

  const themeDefaults = loadTokens(options.theme);
  const themeTokens = { ...themeDefaults, ...themeOverrides };

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
        themeDefaults,
        themeOverrides,
        themeTokens,
        filterMappings: { ...defaultFilterMappings },
        type: options.type,
        paymentProviders: options.payment,
        shippingProviders: options.shipping,
        taxProviders: [options.tax],
        priceOverrides: {},
        localeOverrides: {},
        analyticsEnabled: options.analytics.enabled,
        homeTitle: options.pageTitle,
        homeDescription: options.pageDescription,
        homeImage: options.socialImage,
        navigation: options.navItems,
      },
      null,
      2
    )
  );

  const now = nowIso();
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
}
