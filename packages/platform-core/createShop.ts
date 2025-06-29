// packages/platform-core/createShop.ts
import { LOCALES } from "@types/shared";
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

export interface CreateShopOptions {
  type?: "sale" | "rental";
  theme?: string;
  template?: string;
  payment?: string[];
  shipping?: string[];
}

interface PackageJSON {
  name: string;
  dependencies?: Record<string, string>;
  [key: string]: unknown;
}

function genSecret(bytes = 16): string {
  return randomBytes(bytes).toString("hex");
}

/**
 * Create a new shop app and seed data.
 * Paths are resolved relative to the repository root.
 */
export function createShop(id: string, opts: CreateShopOptions = {}): void {
  const options: Required<CreateShopOptions> = {
    type: opts.type ?? "sale",
    theme: opts.theme ?? "base",
    template: opts.template ?? "template-app",
    payment: opts.payment ?? [],
    shipping: opts.shipping ?? [],
  };

  const templateApp = join("packages", options.template);
  const newApp = join("apps", id);

  if (!existsSync(join("packages", "themes", options.theme))) {
    throw new Error(`Theme '${options.theme}' not found in packages/themes`);
  }
  if (!existsSync(templateApp)) {
    throw new Error(`Template '${options.template}' not found in packages`);
  }

  cpSync(templateApp, newApp, {
    recursive: true,
    filter: (src) => !/node_modules/.test(src),
  });

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
  for (const p of envVars) {
    if (p === "stripe") {
      envContent += `STRIPE_SECRET_KEY=${genSecret()}\n`;
      envContent += `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${genSecret()}\n`;
    } else {
      envContent += `${p.toUpperCase()}_KEY=${genSecret()}\n`;
    }
  }
  envContent += `NEXTAUTH_SECRET=${genSecret()}\n`;
  writeFileSync(join(newApp, ".env"), envContent);

  const newData = join("data", "shops", id);
  if (existsSync(newData)) {
    throw new Error(`Data for shop ${id} already exists`);
  }
  mkdirSync(newData, { recursive: true });

  writeFileSync(
    join(newData, "settings.json"),
    JSON.stringify({ languages: [...LOCALES] }, null, 2)
  );

  writeFileSync(
    join(newData, "shop.json"),
    JSON.stringify(
      {
        id,
        name: id,
        catalogFilters: [],
        themeId: options.theme,
        type: options.type,
        paymentProviders: options.payment,
        shippingProviders: options.shipping,
        priceOverrides: {},
        localeOverrides: {},
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
    (sampleProduct as any).deposit = 1000;
    (sampleProduct as any).rentalTerms = "Return within 30 days";
  }

  writeFileSync(
    join(newData, "products.json"),
    JSON.stringify([sampleProduct], null, 2)
  );

  try {
    const result = spawnSync("npx", ["--yes", "create-cloudflare", newApp], {
      stdio: "inherit",
    });
    if (result.status !== 0) {
      console.warn("C3 process failed or not available. Skipping.");
    }
  } catch {
    console.warn("C3 not available, skipping.");
  }
}

export function listThemes(): string[] {
  const themesDir = join("packages", "themes");
  return readdirSync(themesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}
